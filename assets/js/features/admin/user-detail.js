/**
 * @fileoverview Admin Dashboard - User Detail Section
 * Phase 3: Enhanced User Detail View
 */

import { debug } from '../../config.js';

let currentUserId = null;
let userData = null;
let currentTimelineOffset = 0;
let timelineFilter = 'all';
let isLoadingMore = false;

// Store API functions for pagination
let _getAdminApiUrl = null;
let _getAuthHeaders = null;

/**
 * Initialize user detail section
 */
export function initUserDetail() {
  // Setup timeline filter
  const filterSelect = document.getElementById('timeline-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      timelineFilter = e.target.value;
      renderTimeline(userData?.timeline || []);
    });
  }

  // Setup load more button
  const loadMoreBtn = document.getElementById('timeline-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreTimeline);
  }
}

/**
 * Load user detail data from API
 */
export async function loadUserDetailData(userId, getAdminApiUrl, getAuthHeaders) {
  currentUserId = userId;
  currentTimelineOffset = 0;
  timelineFilter = 'all';

  // Store for pagination
  _getAdminApiUrl = getAdminApiUrl;
  _getAuthHeaders = getAuthHeaders;

  // Show loading state
  const headerEl = document.getElementById('user-detail-header');
  const timelineEl = document.getElementById('user-timeline');

  if (headerEl) headerEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  if (timelineEl) timelineEl.innerHTML = '<div class="admin-loading">Loading...</div>';

  // Reset filter dropdown
  const filterSelect = document.getElementById('timeline-filter');
  if (filterSelect) filterSelect.value = 'all';

  try {
    const response = await fetch(getAdminApiUrl(`users/${userId}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    userData = data;
    currentTimelineOffset = data.timeline?.length || 0;

    renderUserHeader(data.user);
    renderRiskPanel(data.user);
    renderUserStats(data.user);
    renderHealthIndicators(data.user);
    renderTimeline(data.timeline);
    renderStuckTutorials(data.stuckTutorials);
    updateLoadMoreButton(data.hasMoreTimeline);

    // Return user data for breadcrumb header
    const firstName = data.user?.firstName || '';
    const lastName = data.user?.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || 'Member Details';
    return { name, user: data.user };

  } catch (err) {
    debug.error('❌ Failed to load user detail:', err);
    if (headerEl) headerEl.innerHTML = '<div class="admin-error">Failed to load user</div>';
    return { name: 'Member Details' };
  }
}

/**
 * Load more timeline events
 */
async function loadMoreTimeline() {
  if (isLoadingMore || !_getAdminApiUrl || !_getAuthHeaders) return;

  isLoadingMore = true;
  const loadMoreBtn = document.getElementById('timeline-load-more');
  if (loadMoreBtn) loadMoreBtn.textContent = 'Loading...';

  try {
    const response = await fetch(
      _getAdminApiUrl(`users/${currentUserId}?offset=${currentTimelineOffset}&limit=50`),
      { method: 'GET', headers: _getAuthHeaders() }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // Append new timeline events
    userData.timeline = [...(userData.timeline || []), ...(data.timeline || [])];
    currentTimelineOffset += data.timeline?.length || 0;

    renderTimeline(userData.timeline);
    updateLoadMoreButton(data.hasMoreTimeline);

  } catch (err) {
    debug.error('❌ Failed to load more timeline:', err);
  } finally {
    isLoadingMore = false;
    if (loadMoreBtn) loadMoreBtn.textContent = 'Load More';
  }
}

/**
 * Render user header
 */
function renderUserHeader(user) {
  const container = document.getElementById('user-detail-header');
  if (!container) return;

  container.innerHTML = `
    <div class="admin-user-avatar">
      ${getInitials(user.firstName, user.lastName)}
    </div>
    <div class="admin-user-info">
      <h2 class="admin-user-name">${user.firstName || ''} ${user.lastName || ''}</h2>
      <div class="admin-user-email">${user.email}</div>
      <div class="admin-user-meta">
        Joined ${formatDate(user.joinedAt)}
        <span class="admin-badge ${user.status}">${formatStatus(user.status)}</span>
      </div>
    </div>
  `;
}

/**
 * Render user stats cards (Phase 3: Enhanced)
 */
function renderUserStats(user) {
  const container = document.getElementById('user-detail-stats');
  if (!container) return;

  // Build subscription badge HTML if applicable
  let subBadge = '';
  if (user.subscriptionStatus && user.subscriptionStatus !== 'none') {
    const badgeClass = user.subscriptionStatus === 'active' ? 'sub-active' :
      user.subscriptionStatus === 'past_due' ? 'sub-past-due' : 'sub-cancelled';
    const badgeLabel = user.subscriptionStatus === 'active'
      ? (user.billingInterval === 'yearly' ? 'Yearly' : 'Monthly')
      : user.subscriptionStatus === 'past_due' ? 'Past Due' : 'Cancelled';
    subBadge = `<span class="admin-sub-badge ${badgeClass}">${badgeLabel}</span>`;
  }

  container.innerHTML = `
    <!-- Primary Stats Row -->
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.progressPercent}%</div>
      <div class="admin-stat-label">Progress</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.tutorialsCompleted || user.completedTutorials}</div>
      <div class="admin-stat-label">Completed</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.tutorialsStarted || 0}</div>
      <div class="admin-stat-label">Started</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.notesCount || 0}</div>
      <div class="admin-stat-label">Notes</div>
    </div>

    <!-- Watch Time Breakdown Row -->
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.watchTime7Days || '—'}</div>
      <div class="admin-stat-label">Last 7 Days</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.watchTime30Days || '—'}</div>
      <div class="admin-stat-label">Last 30 Days</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.totalWatchTime}</div>
      <div class="admin-stat-label">All Time</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.totalSessions}</div>
      <div class="admin-stat-label">Sessions</div>
    </div>

    <!-- Streaks & Completion Types Row -->
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.currentStreak || 0}</div>
      <div class="admin-stat-label">Current Streak</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.longestStreak || 0}</div>
      <div class="admin-stat-label">Best Streak</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.autoCompletions || 0}</div>
      <div class="admin-stat-label">Auto Complete</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-value">${user.manualCompletions || 0}</div>
      <div class="admin-stat-label">Manual Complete</div>
    </div>

    <!-- Focus Mode Row -->
    <div class="admin-stat-card focus-mode">
      <div class="admin-stat-value">${user.focusModeSessions || 0}</div>
      <div class="admin-stat-label">Focus Sessions</div>
    </div>
    <div class="admin-stat-card focus-mode">
      <div class="admin-stat-value">${user.focusModeSessionsPercent || 0}%</div>
      <div class="admin-stat-label">Focus Session %</div>
    </div>
    <div class="admin-stat-card focus-mode">
      <div class="admin-stat-value">${user.focusModeWatchTime || '—'}</div>
      <div class="admin-stat-label">Focus Watch Time</div>
    </div>
    <div class="admin-stat-card focus-mode">
      <div class="admin-stat-value">${user.focusModeWatchPercent || 0}%</div>
      <div class="admin-stat-label">Focus Time %</div>
    </div>

    <!-- Login Stats Row (Phase 6) -->
    <div class="admin-stat-card login-stat">
      <div class="admin-stat-value">${user.totalLogins || 0}</div>
      <div class="admin-stat-label">Total Logins</div>
    </div>
    <div class="admin-stat-card login-stat">
      <div class="admin-stat-value">${user.logins7Days || 0}</div>
      <div class="admin-stat-label">Logins (7 Days)</div>
    </div>
    <div class="admin-stat-card login-stat">
      <div class="admin-stat-value">${user.avgSessionDurationFormatted || '—'}</div>
      <div class="admin-stat-label">Avg Session</div>
    </div>
    <div class="admin-stat-card login-stat">
      <div class="admin-stat-value">${formatDeviceBrowser(user.primaryDevice, user.primaryBrowser)}</div>
      <div class="admin-stat-label">Primary Device</div>
    </div>
  `;
}

/**
 * Render risk assessment panel (Phase 8)
 */
function renderRiskPanel(user) {
  const panel = document.getElementById('user-risk-panel');
  const scoreEl = document.getElementById('risk-score-value');
  const badgeEl = document.getElementById('risk-tier-badge');
  const factorsEl = document.getElementById('risk-factors-list');

  if (!panel) return;

  const riskScore = user.riskScore || 0;
  const riskTier = user.riskTier || 'healthy';
  const riskFactors = user.riskFactors || [];

  // Show panel if there's any risk
  if (riskScore > 0 || riskFactors.length > 0) {
    panel.style.display = 'block';
    panel.className = `risk-indicator-panel tier-${riskTier}`;
  } else {
    panel.style.display = 'none';
    return;
  }

  // Update score
  if (scoreEl) {
    scoreEl.textContent = riskScore;
  }

  // Update badge
  if (badgeEl) {
    const tierLabels = {
      healthy: 'Healthy',
      watch: 'Watch',
      at_risk: 'At Risk',
      critical: 'Critical',
    };
    const tierClasses = {
      healthy: 'risk-healthy',
      watch: 'risk-watch',
      at_risk: 'risk-at-risk',
      critical: 'risk-critical',
    };
    badgeEl.textContent = tierLabels[riskTier] || 'Unknown';
    badgeEl.className = `admin-risk-badge ${tierClasses[riskTier] || ''}`;
  }

  // Update risk factors
  if (factorsEl) {
    if (riskFactors.length > 0) {
      factorsEl.innerHTML = riskFactors
        .map(factor => `<span class="risk-factor-tag">${factor}</span>`)
        .join('');
    } else {
      factorsEl.innerHTML = '<span class="risk-factor-tag">No risk factors identified</span>';
    }
  }
}

/**
 * Render health indicators panel (Phase 3)
 */
function renderHealthIndicators(user) {
  const container = document.getElementById('user-health-indicators');
  if (!container) return;

  const indicators = [];

  // Days since last activity
  if (user.daysSinceLastActivity !== null) {
    const isWarning = user.daysSinceLastActivity > 7;
    const isCritical = user.daysSinceLastActivity > 14;
    indicators.push({
      label: 'Last Activity',
      value: user.daysSinceLastActivity === 0 ? 'Today' :
        user.daysSinceLastActivity === 1 ? 'Yesterday' :
          `${user.daysSinceLastActivity} days ago`,
      status: isCritical ? 'critical' : isWarning ? 'warning' : 'good',
    });
  }

  // Days since last completion
  if (user.daysSinceLastCompletion !== null) {
    const isWarning = user.daysSinceLastCompletion > 14;
    indicators.push({
      label: 'Last Completion',
      value: user.daysSinceLastCompletion === 0 ? 'Today' :
        user.daysSinceLastCompletion === 1 ? 'Yesterday' :
          `${user.daysSinceLastCompletion} days ago`,
      status: isWarning ? 'warning' : 'good',
    });
  }

  // Engagement trend
  if (user.engagementTrend) {
    const trendIcons = {
      increasing: '↑',
      stable: '→',
      decreasing: '↓',
    };
    indicators.push({
      label: 'Engagement',
      value: `${trendIcons[user.engagementTrend]} ${user.engagementTrend.charAt(0).toUpperCase() + user.engagementTrend.slice(1)}`,
      status: user.engagementTrend === 'increasing' ? 'good' :
        user.engagementTrend === 'decreasing' ? 'warning' : 'neutral',
    });
  }

  // Subscription status
  if (user.subscriptionStatus && user.subscriptionStatus !== 'none') {
    const statusLabels = {
      active: user.billingInterval === 'yearly' ? 'Yearly Subscriber' : 'Monthly Subscriber',
      past_due: 'Payment Past Due',
      cancelled: 'Subscription Cancelled',
    };
    indicators.push({
      label: 'Subscription',
      value: statusLabels[user.subscriptionStatus] || user.subscriptionStatus,
      status: user.subscriptionStatus === 'active' ? 'good' :
        user.subscriptionStatus === 'past_due' ? 'warning' : 'critical',
    });
  }

  // Show/hide panel based on whether we have indicators
  const panel = document.getElementById('health-indicators-panel');
  if (indicators.length === 0) {
    if (panel) panel.style.display = 'none';
    return;
  }
  if (panel) panel.style.display = 'block';

  container.innerHTML = indicators.map(ind => `
    <div class="health-indicator ${ind.status}">
      <span class="health-indicator-label">${ind.label}</span>
      <span class="health-indicator-value">${ind.value}</span>
    </div>
  `).join('');
}

/**
 * Update load more button visibility
 */
function updateLoadMoreButton(hasMore) {
  const loadMoreBtn = document.getElementById('timeline-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = hasMore ? 'inline-block' : 'none';
  }
}

/**
 * Render activity timeline (Phase 3: with filtering)
 */
function renderTimeline(timeline) {
  const container = document.getElementById('user-timeline');
  if (!container) return;

  if (!timeline || timeline.length === 0) {
    container.innerHTML = '<div class="admin-empty">No activity yet</div>';
    return;
  }

  // Apply filter
  let filtered = timeline;
  if (timelineFilter !== 'all') {
    filtered = timeline.filter(event => event.type === timelineFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="admin-empty">No matching events</div>';
    return;
  }

  container.innerHTML = filtered.map(event => {
    const icon = getEventIcon(event.type);
    const title = getEventTitle(event);
    const meta = getEventMeta(event);

    return `
      <div class="admin-timeline-item ${event.type}">
        <div class="admin-timeline-icon">${icon}</div>
        <div class="admin-timeline-content">
          <div class="admin-timeline-title">${title}</div>
          ${meta ? `<div class="admin-timeline-meta">${meta}</div>` : ''}
          <div class="admin-timeline-date">${formatDateTime(event.date)}</div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render stuck tutorials
 */
function renderStuckTutorials(stuckTutorials) {
  const panel = document.getElementById('stuck-tutorials-panel');
  const list = document.getElementById('stuck-tutorials-list');

  if (!panel || !list) return;

  if (!stuckTutorials || stuckTutorials.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  list.innerHTML = stuckTutorials.map(item => `
    <div class="admin-list-item warning">
      <div class="admin-list-item-main">
        <span class="admin-list-item-name">${item.tutorial?.tutorial_title || 'Unknown Tutorial'}</span>
        <span class="admin-list-item-email">${item.tutorial?.song_title || ''}</span>
      </div>
      <div class="admin-list-item-meta">
        <span class="admin-list-item-stat">${item.sessionCount} sessions, not completed</span>
      </div>
    </div>
  `).join('');
}

/**
 * Get icon for timeline event
 */
function getEventIcon(type) {
  const icons = {
    joined: '📅',
    watched: '▶️',
    completed: '✅',
    note: '📝',
  };
  return icons[type] || '•';
}

/**
 * Get title for timeline event
 */
function getEventTitle(event) {
  switch (event.type) {
    case 'joined':
      return event.title;
    case 'watched':
      return `Watched: ${event.tutorialTitle}`;
    case 'completed':
      return `Completed: ${event.tutorialTitle}`;
    case 'note':
      return `Added note on: ${event.tutorialTitle}`;
    default:
      return event.title || 'Activity';
  }
}

/**
 * Get meta info for timeline event
 */
function getEventMeta(event) {
  if (event.type === 'watched' || event.type === 'completed') {
    const parts = [];
    if (event.songTitle) parts.push(event.songTitle);
    if (event.watchTimeFormatted) parts.push(`${event.watchTimeFormatted} watched`);
    return parts.join(' • ');
  }
  if (event.type === 'note' && event.songTitle) {
    return event.songTitle;
  }
  return null;
}

/**
 * Get initials from name
 */
function getInitials(firstName, lastName) {
  const first = (firstName || '')[0] || '';
  const last = (lastName || '')[0] || '';
  return (first + last).toUpperCase() || '?';
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format datetime for display
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format status for display
 */
function formatStatus(status) {
  const labels = {
    active: 'Active',
    at_risk: 'At Risk',
    dormant: 'Dormant',
    new: 'New',
  };
  return labels[status] || status;
}

/**
 * Format device and browser for compact display
 */
function formatDeviceBrowser(device, browser) {
  if (!device && !browser) return '—';

  // Capitalize device
  const deviceLabel = device
    ? device.charAt(0).toUpperCase() + device.slice(1)
    : '';

  // Shorten browser names
  const browserShort = browser || '';

  if (deviceLabel && browserShort) {
    return `${deviceLabel} / ${browserShort}`;
  }
  return deviceLabel || browserShort || '—';
}
