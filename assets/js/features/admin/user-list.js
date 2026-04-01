/**
 * @fileoverview Admin Dashboard - User List (Tabler)
 */

import { debug } from '../../config.js';
import { exportToCSV } from './export.js';
let usersData = [];
let onlineNowData = 0;
let sortColumn = 'lastActivity';
let sortDirection = 'desc';
let activeFilter = 'active';

export function initUserList() {
  const searchInput = document.getElementById('user-search');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => filterAndRenderUsers(), 300);
    });
  }

  const exportBtn = document.getElementById('export-users-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportUsersCSV());
  }

  document.querySelectorAll('[data-member-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.memberFilter;
      document.querySelectorAll('[data-member-filter]').forEach(b => b.classList.toggle('active', b === btn));
      filterAndRenderUsers();
    });
  });

  const tableHeaders = document.querySelectorAll('#users-table th[data-sort]');
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = column === 'name' || column === 'location' ? 'asc' : 'desc';
      }
      filterAndRenderUsers();
      updateSortIndicators();
    });
  });
}

export async function loadUserListData(getAdminApiUrl, getAuthHeaders, forceRefresh = false) {
  if (usersData.length > 0 && !forceRefresh) {
    filterAndRenderUsers();
    renderMembersKPIs(usersData);
    return;
  }

  const tbody = document.getElementById('users-table-body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-secondary">Loading...</td></tr>';
  }

  try {
    const response = await fetch(getAdminApiUrl('users'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    usersData = data.users || [];
    onlineNowData = data.onlineNow || 0;
    filterAndRenderUsers();
    renderMembersKPIs(usersData);
  } catch (err) {
    debug.error('Failed to load users:', err);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Failed to load members</td></tr>';
    }
  }
}

function filterAndRenderUsers() {
  const searchTerm = (document.getElementById('user-search')?.value || '').toLowerCase();

  let filtered = usersData.filter(user => {
    const nameMatch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm);
    const emailMatch = (user.email || '').toLowerCase().includes(searchTerm);
    const locationMatch = `${user.city || ''} ${user.country || ''}`.toLowerCase().includes(searchTerm);
    if (!(nameMatch || emailMatch || locationMatch)) return false;
    if (activeFilter === 'active') return user.subscriptionStatus === 'active';
    if (activeFilter === 'cancelling') return user.subscriptionStatus === 'cancelling';
    if (activeFilter === 'past_due') return user.subscriptionStatus === 'past_due';
    if (activeFilter === 'expired') return user.subscriptionStatus === 'expired';
    return user.subscriptionStatus !== 'expired'; // All excludes expired
  });

  filtered.sort((a, b) => {
    let aVal, bVal;

    if (sortColumn === 'name') {
      aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
      bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (sortColumn === 'location') {
      aVal = (a.city || a.country || '').toLowerCase();
      bVal = (b.city || b.country || '').toLowerCase();
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (sortColumn === 'subscriptionStatus') {
      aVal = getSubscriptionSortKey(a);
      bVal = getSubscriptionSortKey(b);
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (sortColumn === 'joinedAt' || sortColumn === 'lastActivity') {
      if (sortColumn === 'lastActivity') {
        if (a.isOnline && !b.isOnline) return sortDirection === 'desc' ? -1 : 1;
        if (!a.isOnline && b.isOnline) return sortDirection === 'desc' ? 1 : -1;
      }
      aVal = new Date(a[sortColumn] || 0).getTime();
      bVal = new Date(b[sortColumn] || 0).getTime();
    } else if (sortColumn === 'totalWatchSeconds') {
      aVal = a.totalWatchSeconds || 0;
      bVal = b.totalWatchSeconds || 0;
    } else {
      aVal = a[sortColumn];
      bVal = b[sortColumn];
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    aVal = String(aVal || '');
    bVal = String(bVal || '');
    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  renderUsers(filtered);
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-secondary">No members found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map((user, i) => `
    <tr class="cursor-pointer" data-user-id="${user.id}">
      <td class="text-secondary text-center">${i + 1}</td>
      <td class="text-secondary">${user.isOnline ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2fb344;margin-right:6px;vertical-align:middle;flex-shrink:0"></span>' : ''}${user.firstName || ''} ${user.lastName || ''}</td>
      <td class="text-secondary">${user.countryFlag ? `${user.countryFlag} ${[user.city, user.country].filter(Boolean).join(', ')}` : '—'}</td>
      <td class="text-center">${formatSubscriptionBadge(user)}</td>
      <td class="text-center text-secondary">${formatDate(user.joinedAt)}</td>
      <td class="text-center text-secondary">${user.isOnline ? 'Now' : user.lastActivity ? formatTimeAgo(user.lastActivity) : 'Never'}</td>
      <td class="text-center">
        <div class="d-flex align-items-center justify-content-center gap-1">
          <div class="progress progress-sm" style="width:80px;">
            <div class="progress-bar bg-primary" style="width:${user.progressPercent}%"></div>
          </div>
          <small class="text-secondary" style="min-width:2.5em;text-align:center;display:inline-block">${user.progressPercent}%</small>
        </div>
      </td>
      <td class="text-center text-secondary">${user.totalWatchTime || '—'}</td>
      <td class="text-center">${formatStatusBadge(user.status, user.lastActivity, user.isOnline, user.totalWatchSeconds)}</td>
    </tr>
  `).join('');

  // Click handlers
  tbody.querySelectorAll('[data-user-id]').forEach(row => {
    row.addEventListener('click', () => {
      const userId = row.dataset.userId;
      const user = usersData.find(u => u.id === userId);
      window.HOTLINE?.admin?.navigateToView?.('members', { userId, preloadUser: user });
    });
  });
}

function getInitials(firstName, lastName) {
  const f = (firstName || '')[0] || '';
  const l = (lastName || '')[0] || '';
  return (f + l).toUpperCase() || '?';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const activityDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((today - activityDay) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getSubscriptionSortKey(user) {
  if (user.subscriptionStatus === 'past_due') return 'past_due';
  if (user.subscriptionStatus === 'cancelling') return 'cancelling';
  if (user.billingInterval === 'yearly') return 'annual';
  return 'monthly';
}

function formatSubscriptionBadge(user) {
  if (user.subscriptionStatus === 'past_due') {
    return '<span class="badge bg-danger-lt">Past Due</span>';
  }
  if (user.subscriptionStatus === 'cancelling') {
    return '<span class="badge bg-warning-lt">Cancelling</span>';
  }
  if (user.subscriptionStatus === 'expired') {
    return '<span class="badge bg-secondary-lt">Expired</span>';
  }
  if (user.billingInterval === 'yearly') {
    return '<span class="badge bg-purple-lt">Annual</span>';
  }
  return '<span class="badge bg-blue-lt">Monthly</span>';
}

function formatStatusBadge(status, lastActivity, isOnline, totalWatchSeconds) {
  if (!lastActivity && !isOnline && !totalWatchSeconds) {
    return '<span class="badge bg-secondary-lt">Pending</span>';
  }
  const config = {
    active: { label: 'Active', cls: 'bg-success-lt' },
    at_risk: { label: 'At Risk', cls: 'bg-orange-lt' },
    dormant: { label: 'Dormant', cls: 'bg-danger-lt' },
  };
  const c = config[status] || { label: 'Pending', cls: 'bg-secondary-lt' };
  return `<span class="badge ${c.cls}">${c.label}</span>`;
}

function updateSortIndicators() {
  document.querySelectorAll('#users-table th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortColumn) {
      th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

function exportUsersCSV() {
  const headers = ['Name', 'Email', 'Location', 'Subscription', 'Joined', 'Last Active', 'Progress %', 'Watch Time', 'Status'];
  const rows = usersData.map(user => [
    `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    user.email,
    [user.city, user.country].filter(Boolean).join(', ') || '',
    user.subscriptionStatus === 'active' ? (user.billingInterval === 'yearly' ? 'Annual' : 'Monthly') : (user.subscriptionStatus || 'Free'),
    formatDate(user.joinedAt),
    user.lastActivity ? formatDate(user.lastActivity) : 'Never',
    user.progressPercent,
    user.totalWatchTime || '0m',
    user.status,
  ]);
  exportToCSV('members', headers, rows);
}

// ─── Members KPI Cards ──────────────────────────────────

function renderMembersKPIs(users) {
  const activeThisWeek = users.filter(u => u.status === 'active').length;
  const atRisk = users.filter(u => u.status === 'at_risk').length;
  const dormant = users.filter(u => u.status === 'dormant').length;
  const neverLoggedIn = users.filter(u => !u.lastActivity).length;

  const cancelling = users.filter(u => u.subscriptionStatus === 'cancelling').length;
  const pastDue = users.filter(u => u.subscriptionStatus === 'past_due').length;
  const expired = users.filter(u => u.subscriptionStatus === 'expired').length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('members-kpi-total', users.filter(u => u.subscriptionStatus === 'active').length);
  set('members-kpi-cancelling', cancelling);
  set('members-kpi-pastdue', pastDue);
  set('members-kpi-expired', expired);
  set('members-kpi-active', activeThisWeek);
  set('members-kpi-atrisk', atRisk);
  set('members-kpi-dormant', dormant);
  set('members-kpi-never', neverLoggedIn);
}
