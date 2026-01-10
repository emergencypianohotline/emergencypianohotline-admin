/**
 * @fileoverview Admin Dashboard - User List Section
 * Phase 8: Added churn risk scoring display
 */

import { debug } from '../../config.js';
import { exportToCSV } from './export.js';

let usersData = [];
let sortColumn = 'name';
let sortDirection = 'asc';

/**
 * Initialize user list section
 */
export function initUserList() {
  // Setup search
  const searchInput = document.getElementById('user-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      filterAndRenderUsers();
    }, 300));
  }

  // Setup status filter
  const statusFilter = document.getElementById('user-filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      filterAndRenderUsers();
    });
  }

  // Setup risk filter
  const riskFilter = document.getElementById('user-filter-risk');
  if (riskFilter) {
    riskFilter.addEventListener('change', () => {
      filterAndRenderUsers();
    });
  }

  // Setup export button
  const exportBtn = document.getElementById('export-users-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportUsersCSV();
    });
  }

  // Setup table sorting
  const tableHeaders = document.querySelectorAll('#users-table th[data-sort]');
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        // Default to descending for risk score
        sortDirection = column === 'riskScore' ? 'desc' : 'desc';
      }
      filterAndRenderUsers();
      updateSortIndicators();
    });
  });
}

/**
 * Load user list data from API
 * @param {Function} getAdminApiUrl - URL builder function
 * @param {Function} getAuthHeaders - Auth headers function
 * @param {boolean} forceRefresh - Force refresh even if data is cached
 */
export async function loadUserListData(getAdminApiUrl, getAuthHeaders, forceRefresh = false) {
  // Store for later use
  window._adminApiUrl = getAdminApiUrl;
  window._adminAuthHeaders = getAuthHeaders;

  // If we already have data and not forcing refresh, just re-render
  if (usersData.length > 0 && !forceRefresh) {
    debug.log('📊 Using cached users data');
    filterAndRenderUsers();
    return;
  }

  const tbody = document.getElementById('users-table-body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-loading">Loading...</td></tr>';
  }

  try {
    const response = await fetch(getAdminApiUrl('users'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    usersData = data.users || [];
    filterAndRenderUsers();
    updateSortIndicators();

  } catch (err) {
    debug.error('❌ Failed to load users:', err);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-error">Failed to load users</td></tr>';
    }
  }
}

/**
 * Filter and render users based on search/filter/sort
 */
function filterAndRenderUsers() {
  const searchTerm = document.getElementById('user-search')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('user-filter-status')?.value || '';
  const riskFilter = document.getElementById('user-filter-risk')?.value || '';

  let filtered = usersData.filter(user => {
    // Search filter
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const matchesSearch = !searchTerm || name.includes(searchTerm) || email.includes(searchTerm);

    // Status filter
    const matchesStatus = !statusFilter || user.status === statusFilter;

    // Risk filter
    const matchesRisk = !riskFilter || user.riskTier === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Sort
  filtered.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle name sorting
    if (sortColumn === 'name') {
      aVal = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
      bVal = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
    }

    // Handle dates
    if (sortColumn === 'joinedAt' || sortColumn === 'lastActivity') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }

    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle strings
    aVal = String(aVal || '');
    bVal = String(bVal || '');
    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  renderUsers(filtered);
}

/**
 * Render users table
 */
function renderUsers(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No students found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr class="admin-table-row" data-user-id="${user.id}">
      <td class="admin-cell-name">
        ${user.firstName || ''} ${user.lastName || ''}
        ${formatSubscriptionBadge(user)}
      </td>
      <td class="admin-cell-email">${user.email}</td>
      <td class="admin-cell-date">${formatDate(user.joinedAt)}</td>
      <td class="admin-cell-date">${user.lastActivity ? formatDate(user.lastActivity) : 'Never'}</td>
      <td class="admin-cell-progress">
        <div>
          <div class="admin-progress-bar">
            <div class="admin-progress-fill" style="width: ${user.progressPercent}%"></div>
          </div>
          <span>${user.progressPercent}%</span>
        </div>
      </td>
      <td class="admin-cell-time">${user.totalWatchTime}</td>
      <td class="admin-cell-status">${formatStatus(user.status)}</td>
      <td class="admin-cell-risk">${formatRiskBadge(user)}</td>
    </tr>
  `).join('');

  // Add click handlers for row navigation
  tbody.querySelectorAll('.admin-table-row').forEach(row => {
    row.addEventListener('click', () => {
      const userId = row.dataset.userId;
      if (userId) {
        import('./index.js').then(mod => {
          mod.loadAdminDashboard('users', { userId });
        });
      }
    });
  });
}

/**
 * Update sort indicators on table headers
 */
function updateSortIndicators() {
  document.querySelectorAll('#users-table th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortColumn) {
      th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

/**
 * Export users to CSV
 */
function exportUsersCSV() {
  const headers = ['Name', 'Email', 'Joined', 'Last Active', 'Completed', 'Watch Time', 'Status', 'Risk Score', 'Risk Tier', 'Risk Factors'];
  const rows = usersData.map(user => [
    `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    user.email,
    formatDate(user.joinedAt),
    user.lastActivity ? formatDate(user.lastActivity) : 'Never',
    user.completedTutorials,
    user.totalWatchTime,
    formatStatus(user.status),
    user.riskScore || 0,
    user.riskTier || 'healthy',
    (user.riskFactors || []).join('; '),
  ]);

  exportToCSV('students', headers, rows);
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
 * Format subscription badge for display
 */
function formatSubscriptionBadge(user) {
  const status = user.subscriptionStatus;
  if (!status || status === 'none') return '';

  const badges = {
    active: {
      label: user.billingInterval === 'yearly' ? 'Yearly' : 'Monthly',
      class: 'sub-active',
    },
    past_due: {
      label: 'Past Due',
      class: 'sub-past-due',
    },
    cancelled: {
      label: 'Cancelled',
      class: 'sub-cancelled',
    },
  };

  const badge = badges[status];
  if (!badge) return '';

  return `<span class="admin-sub-badge ${badge.class}">${badge.label}</span>`;
}

/**
 * Format risk badge for display (Phase 8)
 */
function formatRiskBadge(user) {
  const tier = user.riskTier || 'healthy';
  const score = user.riskScore || 0;
  const factors = user.riskFactors || [];

  const tierConfig = {
    healthy: { label: 'Healthy', class: 'risk-healthy' },
    watch: { label: 'Watch', class: 'risk-watch' },
    at_risk: { label: 'At Risk', class: 'risk-at-risk' },
    critical: { label: 'Critical', class: 'risk-critical' },
  };

  const config = tierConfig[tier] || tierConfig.healthy;
  const tooltip = factors.length > 0 ? factors.join('\n') : 'No risk factors';

  return `<span class="admin-risk-badge ${config.class}" title="${tooltip}">${config.label} (${score})</span>`;
}

/**
 * Simple debounce utility
 */
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
