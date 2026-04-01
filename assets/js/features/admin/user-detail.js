/**
 * @fileoverview Admin Dashboard - User Detail (Tabler)
 */

import { debug } from '../../config.js';
import { renderChart, getColors } from './charts.js';

let userData = null;
let timelineFilter = 'all';
let currentTimelineOffset = 0;
let currentUserId = null;

export function initUserDetail() {
  const filterSelect = document.getElementById('timeline-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      timelineFilter = e.target.value;
      if (userData) renderTimeline(userData.timeline || []);
    });
  }

  const loadMoreBtn = document.getElementById('timeline-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => loadMoreTimeline());
  }
}

export async function loadUserDetailData(userId, getAdminApiUrl, getAuthHeaders, preloadUser = null) {
  currentUserId = userId;
  currentTimelineOffset = 0;
  timelineFilter = 'all';

  const filterSelect = document.getElementById('timeline-filter');
  if (filterSelect) filterSelect.value = 'all';

  // Show preloaded data instantly
  if (preloadUser) {
    renderUserHeader(preloadUser);
    renderUserStats(preloadUser);
  }

  try {
    const response = await fetch(getAdminApiUrl(`users/${userId}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    userData = await response.json();
    const user = userData.user;

    renderUserHeader(user);
    renderRiskPanel(user);
    renderHealthIndicators(user);
    renderUserStats(user);
    renderTimeline(userData.timeline || []);
    renderStuckTutorials(userData.stuckTutorials || []);

    currentTimelineOffset = (userData.timeline || []).length;
    updateLoadMoreButton(userData.hasMoreTimeline);

    return {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      user,
    };
  } catch (err) {
    debug.error('Failed to load user detail:', err);
    document.getElementById('user-detail-header').innerHTML =
      '<div class="alert alert-danger">Failed to load member details</div>';
    return { name: 'Error' };
  }
}

function renderUserHeader(user) {
  const container = document.getElementById('user-detail-header');
  if (!container) return;

  container.innerHTML = `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex align-items-center">
          <span class="avatar avatar-lg rounded me-3 bg-primary-lt">
            ${getInitials(user.firstName, user.lastName)}
          </span>
          <div>
            <h2 class="mb-0">${user.firstName || ''} ${user.lastName || ''}</h2>
            <div class="text-secondary">${user.email}</div>
            <div class="mt-1">
              Joined ${formatDate(user.joinedAt)}
              ${formatStatusBadge(user.status)}
              ${formatSubscriptionBadge(user)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRiskPanel(user) {
  const panel = document.getElementById('user-risk-panel');
  if (!panel) return;

  if (!user.riskScore || user.riskTier === 'healthy') {
    panel.style.display = 'none';
    return;
  }

  const alertClass = {
    watch: 'alert-info',
    at_risk: 'alert-warning',
    critical: 'alert-danger',
  }[user.riskTier] || 'alert-info';

  const tierLabel = {
    watch: 'Watch',
    at_risk: 'At Risk',
    critical: 'Critical',
  }[user.riskTier] || user.riskTier;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="alert ${alertClass} mb-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>Churn Risk: ${tierLabel}</strong>
        <span class="badge bg-secondary">Score: ${user.riskScore}</span>
      </div>
      ${(user.riskFactors || []).length > 0 ? `
        <div class="d-flex flex-wrap gap-1">
          ${user.riskFactors.map(f => `<span class="badge bg-secondary-lt">${f}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderHealthIndicators(user) {
  const panel = document.getElementById('health-indicators-panel');
  if (!panel) return;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="card mb-3">
      <div class="card-body">
        <div class="row text-center">
          <div class="col-sm-3">
            <div class="h4 mb-0 ${getActivityColor(user.daysSinceLastActivity)}">${user.daysSinceLastActivity ?? '—'}d</div>
            <div class="text-secondary small">Since Last Activity</div>
          </div>
          <div class="col-sm-3">
            <div class="h4 mb-0">${user.daysSinceLastCompletion ?? '—'}d</div>
            <div class="text-secondary small">Since Last Completion</div>
          </div>
          <div class="col-sm-3">
            <div class="h4 mb-0">${user.engagementTrend || '—'}</div>
            <div class="text-secondary small">Engagement Trend</div>
          </div>
          <div class="col-sm-3">
            <div class="h4 mb-0">${formatSubscriptionStatus(user.subscriptionStatus)}</div>
            <div class="text-secondary small">Subscription</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUserStats(user) {
  const container = document.getElementById('user-detail-stats');
  if (!container) return;

  container.innerHTML = `
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div id="chart-user-progress" style="height:100px;"></div>
          <div class="text-secondary small">Progress</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div class="h1 mb-0">${user.tutorialsCompleted || user.completedTutorials || 0}</div>
          <div class="text-secondary small">Completed</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div class="h1 mb-0">${user.totalWatchTime || '0m'}</div>
          <div class="text-secondary small">Total Watch Time</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div id="chart-user-streak" style="height:100px;"></div>
          <div class="text-secondary small">Day Streak</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div class="h3 mb-0">${user.watchTime7Days || '0m'}</div>
          <div class="text-secondary small">Watch (7d)</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div class="h3 mb-0">${user.longestStreak || 0}</div>
          <div class="text-secondary small">Best Streak</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div class="h3 mb-0">${user.totalSessions || 0}</div>
          <div class="text-secondary small">Sessions</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body p-3 text-center">
          <div class="h3 mb-0">${user.notesCount || 0}</div>
          <div class="text-secondary small">Notes</div>
        </div>
      </div>
    </div>
  `;

  // Render stat charts
  renderUserProgressGauge(user.progressPercent || 0);
  renderStreakGauge(user.currentStreak || 0, user.longestStreak || 0);
}

function renderTimeline(timeline) {
  const container = document.getElementById('user-timeline');
  if (!container) return;

  let filtered = timeline;
  if (timelineFilter !== 'all') {
    filtered = timeline.filter(e => e.type === timelineFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-secondary small py-2">No activity found</div>';
    return;
  }

  container.innerHTML = filtered.map(event => `
    <div class="list-group-item border-0 px-0 py-2">
      <div class="d-flex align-items-start gap-2">
        <div class="mt-1">${getEventIcon(event.type)}</div>
        <div class="flex-fill">
          <div>${getEventTitle(event)}</div>
          ${getEventMeta(event)}
        </div>
        <small class="text-secondary text-nowrap">${formatDateTime(event.date)}</small>
      </div>
    </div>
  `).join('');
}

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
    <div class="list-group-item border-0 px-0 py-2">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-bold">${item.tutorial?.tutorial_title || 'Unknown'}</div>
          <small class="text-secondary">${item.tutorial?.song_title || ''}</small>
        </div>
        <span class="badge bg-warning-lt">${item.sessionCount} sessions</span>
      </div>
    </div>
  `).join('');
}

async function loadMoreTimeline() {
  if (!currentUserId) return;

  const btn = document.getElementById('timeline-load-more');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading...'; }

  try {
    const getAdminApiUrl = window._adminApiUrl;
    const getAuthHeaders = window._adminAuthHeaders;

    const response = await fetch(
      getAdminApiUrl(`users/${currentUserId}?offset=${currentTimelineOffset}&limit=50`),
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const newEvents = data.timeline || [];
    userData.timeline = [...(userData.timeline || []), ...newEvents];
    currentTimelineOffset += newEvents.length;

    renderTimeline(userData.timeline);
    updateLoadMoreButton(data.hasMoreTimeline);
  } catch (err) {
    debug.error('Failed to load more timeline:', err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Load More'; }
  }
}

function updateLoadMoreButton(hasMore) {
  const btn = document.getElementById('timeline-load-more');
  if (btn) btn.style.display = hasMore ? 'inline-block' : 'none';
}

// ─── Charts ──────────────────────────────────────────────

function renderUserProgressGauge(progressPercent) {
  const colors = getColors();
  const color = progressPercent >= 70 ? colors.success : progressPercent >= 30 ? colors.primary : colors.warning;

  renderChart('chart-user-progress', {
    chart: { type: 'radialBar', height: 100, sparkline: { enabled: true } },
    series: [Math.min(progressPercent, 100)],
    plotOptions: {
      radialBar: {
        hollow: { size: '50%' },
        dataLabels: {
          name: { show: false },
          value: {
            show: true, fontSize: '20px', fontWeight: 700,
            formatter: () => `${progressPercent}%`, offsetY: 5,
          },
        },
        track: { background: 'rgba(255,255,255,0.08)' },
      },
    },
    colors: [color],
  });
}

function renderStreakGauge(currentStreak, longestStreak) {
  const colors = getColors();
  const pct = longestStreak > 0 ? Math.round((currentStreak / longestStreak) * 100) : (currentStreak > 0 ? 100 : 0);
  const color = currentStreak >= 7 ? colors.success : currentStreak >= 3 ? colors.info : colors.secondary;

  renderChart('chart-user-streak', {
    chart: { type: 'radialBar', height: 100, sparkline: { enabled: true } },
    series: [Math.min(pct, 100)],
    plotOptions: {
      radialBar: {
        hollow: { size: '50%' },
        dataLabels: {
          name: { show: false },
          value: {
            show: true, fontSize: '20px', fontWeight: 700,
            formatter: () => `${currentStreak}`, offsetY: 5,
          },
        },
        track: { background: 'rgba(255,255,255,0.08)' },
      },
    },
    colors: [color],
  });
}

// Helpers
function getInitials(firstName, lastName) {
  return ((firstName || '')[0] || '') + ((lastName || '')[0] || '') || '?';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatStatusBadge(status) {
  const config = {
    active: { label: 'Active', cls: 'bg-success-lt' },
    at_risk: { label: 'At Risk', cls: 'bg-warning-lt' },
    dormant: { label: 'Dormant', cls: 'bg-danger-lt' },
    new: { label: 'New', cls: 'bg-info-lt' },
  };
  const c = config[status] || { label: status || '', cls: '' };
  return `<span class="badge ${c.cls} ms-1">${c.label}</span>`;
}

function formatSubscriptionBadge(user) {
  if (user.subscriptionStatus === 'active') {
    const type = user.billingInterval === 'yearly' ? 'Annual' : 'Monthly';
    return `<span class="badge bg-green-lt ms-1">${type}</span>`;
  }
  if (user.subscriptionStatus === 'past_due') {
    return '<span class="badge bg-danger-lt ms-1">Past Due</span>';
  }
  return '';
}

function formatSubscriptionStatus(status) {
  const labels = { active: 'Active', past_due: 'Past Due', cancelled: 'Cancelled', none: 'None' };
  return labels[status] || status || '—';
}

function getActivityColor(days) {
  if (days === undefined || days === null) return '';
  if (days <= 3) return 'text-success';
  if (days <= 7) return 'text-warning';
  return 'text-danger';
}

function getEventIcon(type) {
  switch (type) {
    case 'joined': return '<span class="badge bg-cyan-lt badge-sm">JOIN</span>';
    case 'watched': return '<span class="badge bg-blue-lt badge-sm">PLAY</span>';
    case 'completed': return '<span class="badge bg-green-lt badge-sm">DONE</span>';
    case 'note': return '<span class="badge bg-purple-lt badge-sm">NOTE</span>';
    default: return '<span class="badge bg-secondary-lt badge-sm">EVENT</span>';
  }
}

function getEventTitle(event) {
  switch (event.type) {
    case 'joined': return 'Joined Emergency Piano Hotline';
    case 'watched': return `Watched <strong>${event.tutorialTitle || ''}</strong>`;
    case 'completed': return `Completed <strong>${event.tutorialTitle || ''}</strong>`;
    case 'note': return `Added notes to <strong>${event.tutorialTitle || ''}</strong>`;
    default: return event.title || 'Activity';
  }
}

function getEventMeta(event) {
  const parts = [];
  if (event.songTitle) parts.push(event.songTitle);
  if (event.watchTimeFormatted) parts.push(event.watchTimeFormatted);
  if (parts.length === 0) return '';
  return `<small class="text-secondary">${parts.join(' · ')}</small>`;
}
