/**
 * @fileoverview Admin Dashboard - Live Stats Section
 *
 * Real-time activity feed and live counts using Supabase Realtime.
 * Subscribes to watch_sessions, progress, notes, and users tables.
 */

import { debug } from '../../config.js';

/** Live stats state */
let liveChannel = null;
let activityFeed = [];
const MAX_FEED_ITEMS = 50;

/** Live counts */
let liveCounts = {
  watchingNow: 0,
  todayCompletions: 0,
  todayWatchSeconds: 0,
  todaySignups: 0,
};

/** User lookup cache (populated from API) */
let userCache = new Map();
let tutorialCache = new Map();

/**
 * Initialize live stats section
 */
export function initLiveStats() {
  debug.log('📡 Live stats initialized');
}

/**
 * Start real-time subscriptions
 */
export async function startLiveStats(getAdminApiUrl, getAuthHeaders) {
  debug.log('📡 Starting live stats...');

  // Get Supabase client from global
  const supabase = window.HOTLINE?.supabase;
  if (!supabase) {
    debug.error('❌ Supabase client not available for live stats');
    renderError('Supabase client not available');
    return;
  }

  // Load initial data
  await loadInitialData(getAdminApiUrl, getAuthHeaders);

  // Render initial state
  renderLiveCounts();
  renderActivityFeed();

  // Subscribe to real-time changes
  subscribeToChanges(supabase);
}

/**
 * Stop real-time subscriptions
 */
export function stopLiveStats() {
  if (liveChannel) {
    debug.log('📡 Stopping live stats subscriptions');
    liveChannel.unsubscribe();
    liveChannel = null;
  }
}

/**
 * Load initial data from API
 */
async function loadInitialData(getAdminApiUrl, getAuthHeaders) {
  try {
    const response = await fetch(getAdminApiUrl('live'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Populate caches
    if (data.users) {
      data.users.forEach(u => {
        userCache.set(u.id, { firstName: u.firstName, lastName: u.lastName, email: u.email });
      });
    }
    if (data.tutorials) {
      data.tutorials.forEach(t => {
        tutorialCache.set(t.id, { title: t.title, songTitle: t.songTitle });
      });
    }

    // Set initial counts
    liveCounts = {
      watchingNow: data.watchingNow || 0,
      todayCompletions: data.todayCompletions || 0,
      todayWatchSeconds: data.todayWatchSeconds || 0,
      todaySignups: data.todaySignups || 0,
    };

    // Set initial activity feed
    activityFeed = data.recentActivity || [];

    debug.log('📡 Initial live data loaded', liveCounts);

  } catch (err) {
    debug.error('❌ Failed to load initial live data:', err);
  }
}

/**
 * Subscribe to real-time changes
 */
function subscribeToChanges(supabase) {
  // Clean up existing subscription
  if (liveChannel) {
    liveChannel.unsubscribe();
  }

  debug.log('📡 Subscribing to real-time changes...');

  liveChannel = supabase
    .channel('admin-live-stats')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'watch_sessions' },
      (payload) => handleNewWatchSession(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'watch_sessions' },
      (payload) => handleWatchSessionUpdate(payload.new, payload.old)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'progress' },
      (payload) => handleNewProgress(payload.new)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes' },
      (payload) => handleNoteChange(payload.new, payload.eventType)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'users' },
      (payload) => handleNewUser(payload.new)
    )
    .subscribe((status) => {
      debug.log('📡 Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        updateConnectionStatus(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        updateConnectionStatus(false);
      }
    });
}

/**
 * Handle new watch session (user started watching)
 */
function handleNewWatchSession(session) {
  debug.log('📡 New watch session:', session);

  // Increment watching count
  liveCounts.watchingNow++;
  renderLiveCounts();

  // Add to activity feed
  const user = userCache.get(session.user_id);
  const tutorial = tutorialCache.get(session.tutorial_id);

  addActivityItem({
    type: 'watching',
    userId: session.user_id,
    userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User',
    tutorialId: session.tutorial_id,
    tutorialTitle: tutorial?.title || 'Unknown Tutorial',
    songTitle: tutorial?.songTitle,
    timestamp: session.started_at,
  });
}

/**
 * Handle watch session update (ended or completed)
 */
function handleWatchSessionUpdate(newSession, oldSession) {
  debug.log('📡 Watch session updated:', newSession);

  // If session ended (has ended_at now but didn't before)
  if (newSession.ended_at && !oldSession?.ended_at) {
    // Decrement watching count
    liveCounts.watchingNow = Math.max(0, liveCounts.watchingNow - 1);

    // Add watch time to today's total
    const watchSeconds = newSession.total_seconds_watched || 0;
    liveCounts.todayWatchSeconds += watchSeconds;

    renderLiveCounts();
  }

  // If auto-completed during session
  if (newSession.completed_during_session && !oldSession?.completed_during_session) {
    liveCounts.todayCompletions++;
    renderLiveCounts();

    const user = userCache.get(newSession.user_id);
    const tutorial = tutorialCache.get(newSession.tutorial_id);

    addActivityItem({
      type: 'completed',
      userId: newSession.user_id,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User',
      tutorialId: newSession.tutorial_id,
      tutorialTitle: tutorial?.title || 'Unknown Tutorial',
      songTitle: tutorial?.songTitle,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle new progress entry (manual completion)
 */
function handleNewProgress(progress) {
  debug.log('📡 New progress:', progress);

  if (progress.status === 'completed') {
    liveCounts.todayCompletions++;
    renderLiveCounts();

    const user = userCache.get(progress.user_id);
    const tutorial = tutorialCache.get(progress.tutorial_id);

    addActivityItem({
      type: 'completed',
      userId: progress.user_id,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User',
      tutorialId: progress.tutorial_id,
      tutorialTitle: tutorial?.title || 'Unknown Tutorial',
      songTitle: tutorial?.songTitle,
      timestamp: progress.updated_at || new Date().toISOString(),
    });
  }
}

/**
 * Handle note changes
 */
function handleNoteChange(note, eventType) {
  debug.log('📡 Note change:', eventType, note);

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    const user = userCache.get(note.user_id);
    const tutorial = tutorialCache.get(note.tutorial_id);

    addActivityItem({
      type: 'note',
      userId: note.user_id,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User',
      tutorialId: note.tutorial_id,
      tutorialTitle: tutorial?.title || 'Unknown Tutorial',
      songTitle: tutorial?.songTitle,
      timestamp: note.updated_at || new Date().toISOString(),
    });
  }
}

/**
 * Handle new user signup
 */
function handleNewUser(user) {
  debug.log('📡 New user:', user);

  // Add to cache
  userCache.set(user.id, {
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  });

  liveCounts.todaySignups++;
  renderLiveCounts();

  addActivityItem({
    type: 'signup',
    userId: user.id,
    userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    timestamp: user.created_at,
  });
}

/**
 * Add item to activity feed (at top)
 */
function addActivityItem(item) {
  activityFeed.unshift(item);

  // Limit feed size
  if (activityFeed.length > MAX_FEED_ITEMS) {
    activityFeed = activityFeed.slice(0, MAX_FEED_ITEMS);
  }

  renderActivityFeed();
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(connected) {
  const indicator = document.getElementById('live-connection-status');
  if (indicator) {
    indicator.className = `live-connection-indicator ${connected ? 'connected' : 'disconnected'}`;
    indicator.title = connected ? 'Connected' : 'Disconnected';
  }
}

/**
 * Format duration as Xh Xm or Xm
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format relative time (e.g., "2 min ago")
 */
function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins} min ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}

/**
 * Get icon for activity type
 */
function getActivityIcon(type) {
  switch (type) {
    case 'watching': return '▶️';
    case 'completed': return '✅';
    case 'note': return '📝';
    case 'signup': return '👋';
    default: return '•';
  }
}

/**
 * Get label for activity type
 */
function getActivityLabel(type) {
  switch (type) {
    case 'watching': return 'started watching';
    case 'completed': return 'completed';
    case 'note': return 'added notes to';
    case 'signup': return 'joined';
    default: return '';
  }
}

/**
 * Render live counts
 */
function renderLiveCounts() {
  const watchingEl = document.getElementById('live-watching-now');
  const completionsEl = document.getElementById('live-today-completions');
  const watchTimeEl = document.getElementById('live-today-watchtime');
  const signupsEl = document.getElementById('live-today-signups');

  if (watchingEl) watchingEl.textContent = liveCounts.watchingNow;
  if (completionsEl) completionsEl.textContent = liveCounts.todayCompletions;
  if (watchTimeEl) watchTimeEl.textContent = formatDuration(liveCounts.todayWatchSeconds);
  if (signupsEl) signupsEl.textContent = liveCounts.todaySignups;
}

/**
 * Render activity feed
 */
function renderActivityFeed() {
  const container = document.getElementById('live-activity-feed');
  if (!container) return;

  if (activityFeed.length === 0) {
    container.innerHTML = '<div class="admin-empty">No activity yet today</div>';
    return;
  }

  container.innerHTML = activityFeed.map(item => `
    <div class="live-activity-item ${item.type}">
      <span class="live-activity-icon">${getActivityIcon(item.type)}</span>
      <div class="live-activity-content">
        <span class="live-activity-user">${escapeHtml(item.userName)}</span>
        <span class="live-activity-action">${getActivityLabel(item.type)}</span>
        ${item.tutorialTitle ? `<span class="live-activity-tutorial">${escapeHtml(item.tutorialTitle)}</span>` : ''}
        ${item.songTitle ? `<span class="live-activity-song">${escapeHtml(item.songTitle)}</span>` : ''}
      </div>
      <span class="live-activity-time">${formatRelativeTime(item.timestamp)}</span>
    </div>
  `).join('');
}

/**
 * Render error state
 */
function renderError(message) {
  const container = document.getElementById('live-activity-feed');
  if (container) {
    container.innerHTML = `<div class="admin-error">${escapeHtml(message)}</div>`;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
