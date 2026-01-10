/**
 * @fileoverview Admin Dashboard - Overview Section
 */

import { debug } from '../../config.js';

let overviewData = null;

/**
 * Initialize overview section
 */
export function initOverview() {
  // Setup refresh button
  const refreshBtn = document.querySelector('[data-refresh="overview"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const getAdminApiUrl = window._adminApiUrl;
      const getAuthHeaders = window._adminAuthHeaders;
      if (getAdminApiUrl && getAuthHeaders) {
        await loadOverviewData(getAdminApiUrl, getAuthHeaders);
      }
    });
  }

  // Setup "View All Members" link
  const viewAllLink = document.querySelector('.admin-link[data-view="members"]');
  if (viewAllLink) {
    viewAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('.admin-nav-link[data-view="members"]')?.click();
    });
  }
}

/**
 * Load overview data from API
 */
export async function loadOverviewData(getAdminApiUrl, getAuthHeaders) {
  // Store for refresh button
  window._adminApiUrl = getAdminApiUrl;
  window._adminAuthHeaders = getAuthHeaders;

  debug.log('📊 loadOverviewData called');
  const headers = getAuthHeaders();

  try {
    // Load overview and billing data in parallel
    const [overviewResponse, billingResponse] = await Promise.all([
      fetch(getAdminApiUrl('overview'), { method: 'GET', headers }),
      fetch(getAdminApiUrl('billing'), { method: 'GET', headers }),
    ]);

    if (!overviewResponse.ok) {
      const errorText = await overviewResponse.text();
      debug.error('📊 Overview error:', errorText);
      throw new Error(`HTTP ${overviewResponse.status}: ${errorText}`);
    }

    overviewData = await overviewResponse.json();
    debug.log('📊 Overview data received:', overviewData);
    renderOverview(overviewData);

    // Render billing data if available
    if (billingResponse.ok) {
      const billingData = await billingResponse.json();
      debug.log('💰 Billing data received:', billingData);
      renderBillingStats(billingData);
    }

    // Also load at-risk preview
    await loadAtRiskPreview(getAdminApiUrl, getAuthHeaders);

  } catch (err) {
    debug.error('❌ Failed to load overview:', err);
    document.getElementById('stat-total-members').textContent = 'Error';
  }
}

/**
 * Render overview stats
 */
function renderOverview(data) {
  document.getElementById('stat-total-members').textContent = data.totalUsers || 0;
  document.getElementById('stat-active').textContent = data.activeCount || 0;
  document.getElementById('stat-at-risk').textContent = data.atRiskCount || 0;
  document.getElementById('stat-dormant').textContent = data.dormantCount || 0;
  document.getElementById('stat-watch-time').textContent = data.totalWatchTime || '0m';
  document.getElementById('stat-completions').textContent = data.totalCompletions || 0;
  document.getElementById('stat-new-signups').textContent = data.newSignupsThisWeek || 0;
  document.getElementById('stat-week-completions').textContent = data.completionsThisWeek || 0;

  // Phase 8d: Render at-risk lists
  if (data.atRiskLists) {
    renderAtRiskLists(data.atRiskLists);
  }
}

/**
 * Render billing stats
 */
function renderBillingStats(data) {
  const el = (id) => document.getElementById(id);

  // Core revenue metrics
  if (el('stat-mrr')) el('stat-mrr').textContent = data.mrrFormatted || '€0';
  if (el('stat-active-subs')) el('stat-active-subs').textContent = data.activeSubscribers || 0;
  if (el('stat-ltv')) el('stat-ltv').textContent = data.averageLTVFormatted || '€0';
  if (el('stat-churn-rate')) el('stat-churn-rate').textContent = data.churnRate !== undefined ? `${data.churnRate}%` : '-';

  // Growth metrics
  if (el('stat-new-signups')) el('stat-new-signups').textContent = data.newSignupsThisMonth || 0;
  if (el('stat-signup-growth')) {
    const growth = data.signupGrowth || 0;
    const sign = growth > 0 ? '+' : '';
    el('stat-signup-growth').textContent = `${sign}${growth}%`;
    // Add color coding
    el('stat-signup-growth').style.color = growth > 0 ? '#4ade80' : growth < 0 ? '#f87171' : '#FFE974';
  }

  // Plan breakdown
  if (el('stat-monthly-subs')) el('stat-monthly-subs').textContent = data.monthlySubscribers || 0;
  if (el('stat-yearly-subs')) el('stat-yearly-subs').textContent = data.yearlySubscribers || 0;
}

/**
 * Load at-risk members preview
 */
async function loadAtRiskPreview(getAdminApiUrl, getAuthHeaders) {
  try {
    const response = await fetch(getAdminApiUrl('users'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) return;

    const data = await response.json();
    const atRiskUsers = (data.users || [])
      .filter(u => u.status === 'at_risk')
      .slice(0, 5);

    renderAtRiskPreview(atRiskUsers);

  } catch (err) {
    debug.error('❌ Failed to load at-risk preview:', err);
  }
}

/**
 * Render at-risk preview list
 */
function renderAtRiskPreview(users) {
  const container = document.getElementById('at-risk-preview');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div class="admin-empty">No at-risk members right now</div>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="admin-list-item" data-user-id="${user.id}">
      <div class="admin-list-item-main">
        <span class="admin-list-item-name">${user.firstName || ''} ${user.lastName || ''}</span>
        <span class="admin-list-item-email">${user.email}</span>
      </div>
      <div class="admin-list-item-meta">
        <span class="admin-list-item-stat">${user.progressPercent}% complete</span>
        <span class="admin-badge at-risk">At Risk</span>
      </div>
    </div>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.admin-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const userId = item.dataset.userId;
      if (userId) {
        // Navigate to user detail
        import('./index.js').then(mod => {
          mod.loadAdminDashboard('users', { userId });
        });
      }
    });
  });
}

/**
 * Render at-risk lists (Phase 8d)
 */
function renderAtRiskLists(lists) {
  renderTrialEndingList(lists.trialEndingSoon || []);
  renderGoneQuietList(lists.goneQuiet || []);
  renderStuckTutorialList(lists.stuckOnTutorial || []);
}

/**
 * Render trial ending soon list
 */
function renderTrialEndingList(users) {
  const container = document.getElementById('trial-ending-list');
  const countEl = document.getElementById('trial-ending-count');

  if (countEl) countEl.textContent = users.length;

  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div class="admin-empty">No trials ending soon</div>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="admin-list-item at-risk-item" data-user-id="${user.id}">
      <div class="admin-list-item-main">
        <span class="admin-list-item-name">${user.firstName || ''} ${user.lastName || ''}</span>
        <span class="admin-list-item-email">${user.email}</span>
      </div>
      <div class="admin-list-item-meta">
        <span class="admin-list-item-stat">${user.progressPercent}% complete</span>
        <span class="admin-badge trial-urgent">${user.trialDaysRemaining === 0 ? 'Today' : user.trialDaysRemaining === 1 ? '1 day' : user.trialDaysRemaining + ' days'}</span>
      </div>
    </div>
  `).join('');

  addListClickHandlers(container);
}

/**
 * Render gone quiet list
 */
function renderGoneQuietList(users) {
  const container = document.getElementById('gone-quiet-list');
  const countEl = document.getElementById('gone-quiet-count');

  if (countEl) countEl.textContent = users.length;

  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div class="admin-empty">No users have gone quiet</div>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="admin-list-item at-risk-item" data-user-id="${user.id}">
      <div class="admin-list-item-main">
        <span class="admin-list-item-name">${user.firstName || ''} ${user.lastName || ''}</span>
        <span class="admin-list-item-email">${user.email}</span>
      </div>
      <div class="admin-list-item-meta">
        <span class="admin-list-item-stat">${user.progressPercent}% complete</span>
        <span class="admin-badge gone-quiet">${user.daysSinceActivity} days ago</span>
      </div>
    </div>
  `).join('');

  addListClickHandlers(container);
}

/**
 * Render stuck on tutorial list
 */
function renderStuckTutorialList(users) {
  const container = document.getElementById('stuck-tutorial-list');
  const countEl = document.getElementById('stuck-tutorial-count');

  if (countEl) countEl.textContent = users.length;

  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div class="admin-empty">No users are stuck</div>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="admin-list-item at-risk-item" data-user-id="${user.id}">
      <div class="admin-list-item-main">
        <span class="admin-list-item-name">${user.firstName || ''} ${user.lastName || ''}</span>
        <span class="admin-list-item-email">${user.email}</span>
      </div>
      <div class="admin-list-item-meta">
        <span class="admin-list-item-stat">${user.completedTutorials} tutorials</span>
        <span class="admin-badge stuck">${user.daysSinceCompletion} days stuck</span>
      </div>
    </div>
  `).join('');

  addListClickHandlers(container);
}

/**
 * Add click handlers to list items
 */
function addListClickHandlers(container) {
  container.querySelectorAll('.admin-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const userId = item.dataset.userId;
      if (userId) {
        import('./index.js').then(mod => {
          mod.loadAdminDashboard('users', { userId });
        });
      }
    });
  });
}
