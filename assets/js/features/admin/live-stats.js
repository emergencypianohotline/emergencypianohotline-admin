/**
 * @fileoverview Admin Dashboard - Activity Section (Tabler)
 *
 * Rolling 7-day activity feed with real-time updates for today.
 */

import { debug } from '../../config.js';

let liveChannel = null;
let globalChannel = null;
let daysData = [];
let userCache = new Map();
let tutorialCache = new Map();
let excludedUserIds = new Set();

export function initLiveStats() {
  debug.log('Activity stats initialized');
}

export async function startLiveStats(getAdminApiUrl, getAuthHeaders) {
  const supabase = window.HOTLINE?.supabase;
  await loadActivityData(getAdminApiUrl, getAuthHeaders);
  renderAllDays();
  if (supabase) {
    subscribeToChanges(supabase);
  }
}

export function stopLiveStats() {
  if (liveChannel) {
    liveChannel.unsubscribe();
    liveChannel = null;
  }
}

export function startGlobalRealtime(onMembershipChange) {
  const supabase = window.HOTLINE?.supabase;
  if (!supabase || globalChannel) return;

  let ready = false;

  globalChannel = supabase
    .channel('admin-global')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' },
      () => { if (ready) onMembershipChange(); })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Brief delay to ensure initial connection noise is ignored
        setTimeout(() => { ready = true; }, 2000);
      }
    });
}

async function loadActivityData(getAdminApiUrl, getAuthHeaders) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await fetch(getAdminApiUrl('live') + '?tz=' + encodeURIComponent(tz), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.users) {
      data.users.forEach(u => {
        userCache.set(u.id, { firstName: u.firstName, lastName: u.lastName, email: u.email });
      });
    }
    if (data.tutorials) {
      data.tutorials.forEach(t => {
        tutorialCache.set(t.id, { title: t.title, songTitle: t.songTitle, lessonNumber: t.lessonNumber });
      });
    }

    daysData = data.days || [];
    if (data.excludedUserIds) {
      excludedUserIds = new Set(data.excludedUserIds);
    }
  } catch (err) {
    debug.error('Failed to load activity data:', err);
  }
}

function subscribeToChanges(supabase) {
  if (liveChannel) liveChannel.unsubscribe();

  liveChannel = supabase
    .channel('admin-live-stats')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'watch_sessions' },
      (payload) => handleNewWatchSession(payload.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'watch_sessions' },
      (payload) => handleWatchSessionUpdate(payload.new, payload.old))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'progress' },
      (payload) => handleNewProgress(payload.new))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' },
      (payload) => handleNoteChange(payload.new, payload.eventType))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' },
      (payload) => handleNewUser(payload.new))
    .subscribe();
}

function getToday() {
  return daysData.length > 0 ? daysData[0] : null;
}

function handleNewWatchSession(session) {
  if (excludedUserIds.has(session.user_id)) return;
  const today = getToday();
  if (!today) return;
  today.watchingNow = (today.watchingNow || 0) + 1;

  const user = userCache.get(session.user_id);
  const tutorial = tutorialCache.get(session.tutorial_id);

  today.activity.unshift({
    type: 'watching',
    userId: session.user_id,
    userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
    tutorialTitle: tutorial?.title || 'Unknown Tutorial',
    songTitle: tutorial?.songTitle,
    lessonNumber: tutorial?.lessonNumber,
    timestamp: session.started_at,
  });

  renderDay(0);
}

function handleWatchSessionUpdate(newSession, oldSession) {
  if (excludedUserIds.has(newSession.user_id)) return;
  if (newSession.ended_at && !oldSession?.ended_at) {
    const today = getToday();
    if (!today) return;
    today.watchingNow = Math.max(0, (today.watchingNow || 0) - 1);
    today.watchSeconds = (today.watchSeconds || 0) + (newSession.total_seconds_watched || 0);
    renderDay(0);
  }
}

function handleNewProgress(progress) {
  if (excludedUserIds.has(progress.user_id)) return;
  if (progress.status === 'completed') {
    const today = getToday();
    if (!today) return;
    today.completions = (today.completions || 0) + 1;

    const user = userCache.get(progress.user_id);
    const tutorial = tutorialCache.get(progress.tutorial_id);
    today.activity.unshift({
      type: 'completed',
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
      tutorialTitle: tutorial?.title || 'Unknown Tutorial',
      songTitle: tutorial?.songTitle,
      lessonNumber: tutorial?.lessonNumber,
      timestamp: progress.updated_at || new Date().toISOString(),
    });

    renderDay(0);
  }
}

function handleNoteChange(note, eventType) {
  if (excludedUserIds.has(note.user_id)) return;
  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    const today = getToday();
    if (!today) return;

    const user = userCache.get(note.user_id);
    const tutorial = tutorialCache.get(note.tutorial_id);
    today.activity.unshift({
      type: 'note',
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
      tutorialTitle: tutorial?.title || 'Unknown Tutorial',
      songTitle: tutorial?.songTitle,
      lessonNumber: tutorial?.lessonNumber,
      timestamp: note.updated_at || new Date().toISOString(),
    });

    renderDay(0);
  }
}

function handleNewUser(user) {
  userCache.set(user.id, { firstName: user.first_name, lastName: user.last_name, email: user.email });
  if (excludedUserIds.has(user.id)) return;
  const today = getToday();
  if (!today) return;
  today.signups = (today.signups || 0) + 1;

  today.activity.unshift({
    type: 'signup',
    userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    timestamp: user.created_at,
  });

  renderDay(0);
}


function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTime(timestamp) {
  const t = new Date(timestamp);
  const h = t.getHours();
  const m = t.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDayTitle(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getActivityIcon(type, isResume) {
  switch (type) {
    case 'watching': return isResume
      ? '<span class="badge bg-cyan-lt badge-sm me-1" style="vertical-align:middle">RESUME</span>'
      : '<span class="badge bg-blue-lt badge-sm me-1" style="vertical-align:middle">PLAY</span>';
    case 'completed': return '<span class="badge bg-green-lt badge-sm me-1" style="vertical-align:middle">DONE</span>';
    case 'note': return '<span class="badge bg-purple-lt badge-sm me-1" style="vertical-align:middle">NOTE</span>';
    case 'signup': return '<span class="badge bg-orange-lt badge-sm me-1" style="vertical-align:middle">NEW</span>';
    default: return '';
  }
}

function getActivityLabel(type) {
  switch (type) {
    case 'watching': return 'started watching';
    case 'completed': return 'completed';
    case 'note': return 'added notes to';
    case 'signup': return 'joined';
    default: return '';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderAllDays() {
  const container = document.getElementById('activity-days-container');
  if (!container) return;

  if (daysData.length === 0) {
    container.innerHTML = '<div class="text-secondary">No activity data available</div>';
    return;
  }

  container.innerHTML = daysData.map((day, i) => `
    <div class="card mb-3" id="activity-day-${i}">
      <div class="card-header">
        <h3 class="card-title">${day.isToday ? 'Today' : formatDayTitle(day.date)}</h3>
        <div class="card-actions d-flex gap-2 align-items-center">
          ${day.isToday ? '<span id="live-connection-status" class="badge bg-success text-white" style="font-weight:700;text-transform:uppercase">LIVE</span>' : ''}
        </div>
      </div>
      <div class="card-body">
        ${renderDayCounters(day)}
        ${renderDayFeed(day)}
      </div>
    </div>
  `).join('');
}

function renderDay(index) {
  const day = daysData[index];
  if (!day) return;

  const card = document.getElementById(`activity-day-${index}`);
  if (!card) return;

  const body = card.querySelector('.card-body');
  if (body) {
    body.innerHTML = `${renderDayCounters(day)}${renderDayFeed(day)}`;
  }
}

function renderDayCounters(day) {
  const counters = [];

  if (day.isToday) {
    counters.push({ value: day.watchingNow || 0, label: 'Watching' });
  } else {
    counters.push({ value: day.uniqueLogins || 0, label: 'Logins' });
  }
  counters.push({ value: day.sessions || 0, label: 'Plays' });
  counters.push({ value: day.completions || 0, label: 'Completions' });
  counters.push({ value: formatDuration(day.watchSeconds || 0), label: 'Watch Time' });
  counters.push({ value: day.signups || 0, label: 'Signups' });

  return `
    <div class="row mb-3 text-center">
      ${counters.map(c => `
        <div class="col">
          <div class="live-counter-value">${c.value}</div>
          <div class="text-secondary small">${c.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDayFeed(day) {
  const activity = day.activity || [];

  if (activity.length === 0) {
    return '<div class="text-secondary small py-2">No activity</div>';
  }

  // Mark resumed watches (same user + same tutorial appearing earlier in the feed)
  // Feed is newest-first, so scan from the end (oldest) to mark later occurrences as resumes
  const seenWatching = new Set();
  const resumeFlags = new Array(activity.length).fill(false);
  for (let i = activity.length - 1; i >= 0; i--) {
    const item = activity[i];
    if (item.type === 'watching' && item.userId && item.tutorialId) {
      const key = `${item.userId}:${item.tutorialId}`;
      if (seenWatching.has(key)) {
        resumeFlags[i] = true;
      } else {
        seenWatching.add(key);
      }
    }
  }

  return `
    <div class="list-group list-group-flush">
      ${activity.map((item, i) => {
        const isResume = resumeFlags[i];
        const label = item.type === 'watching' && isResume ? 'resumed' : getActivityLabel(item.type);
        return `
        <div class="list-group-item border-0 px-0 py-2">
          <div class="d-flex align-items-center gap-2">
            <small class="text-secondary text-nowrap" style="width:2.5rem;flex-shrink:0;text-align:center">${formatTime(item.timestamp)}</small>
            <div style="width:62px;flex-shrink:0;display:flex;align-items:center;justify-content:center">${getActivityIcon(item.type, isResume)}</div>
            <div class="flex-fill">
              <span class="fw-bold">${escapeHtml(item.userName)}</span>
              <span class="text-secondary">${label}</span>
              ${item.type === 'signup' && item.location ? `<span class="text-secondary">from</span> <span class="fw-bold">${escapeHtml(item.location)}</span>${item.flag ? ' ' + item.flag : ''}` : ''}
              ${item.type !== 'signup' && (item.songTitle || item.lessonNumber || item.tutorialTitle) ? `<span class="fw-bold">${item.songTitle ? escapeHtml(item.songTitle) : ''}${item.lessonNumber ? '<span class="text-secondary fw-normal"> · </span>Lesson ' + item.lessonNumber : ''}${item.tutorialTitle && item.tutorialTitle.match(/^Part\s+\d+/) ? '<span class="text-secondary fw-normal"> · </span>' + item.tutorialTitle.match(/^Part\s+\d+/)[0] : ''}</span>` : ''}
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
}
