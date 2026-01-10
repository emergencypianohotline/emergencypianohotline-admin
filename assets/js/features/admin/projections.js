/**
 * @fileoverview Admin Dashboard - Projections vs Actuals Section
 *
 * Displays comparison between projected and actual business metrics:
 * - Monthly signups
 * - Total members
 * - Revenue (EUR and AUD)
 */

import { debug } from '../../config.js';

let projectionsData = null;
let currentCurrency = 'eur';

/**
 * Initialize projections section
 */
export function initProjections() {
  // Setup refresh button
  const refreshBtn = document.querySelector('[data-refresh="projections"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const getAdminApiUrl = window._adminApiUrl;
      const getAuthHeaders = window._adminAuthHeaders;
      if (getAdminApiUrl && getAuthHeaders) {
        await loadProjectionsData(getAdminApiUrl, getAuthHeaders);
      }
    });
  }

  // Setup currency toggle
  const currencyBtns = document.querySelectorAll('.currency-btn');
  currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currencyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCurrency = btn.dataset.currency;
      if (projectionsData) {
        renderRevenueChart(projectionsData.monthlyData);
      }
    });
  });
}

/**
 * Load projections data from API
 */
export async function loadProjectionsData(getAdminApiUrl, getAuthHeaders) {
  window._adminApiUrl = getAdminApiUrl;
  window._adminAuthHeaders = getAuthHeaders;

  debug.log('📈 Loading projections data...');

  try {
    const response = await fetch(getAdminApiUrl('projections'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    projectionsData = await response.json();
    debug.log('📈 Projections data received:', projectionsData);

    renderProjections(projectionsData);

  } catch (err) {
    debug.error('❌ Failed to load projections:', err);
    document.getElementById('projections-table-body').innerHTML =
      '<tr><td colspan="7" class="admin-error">Failed to load data</td></tr>';
  }
}

/**
 * Render all projections components
 */
function renderProjections(data) {
  renderCurrentStats(data.currentTotals);
  renderSignupsChart(data.monthlyData);
  renderMembersChart(data.monthlyData);
  renderRevenueChart(data.monthlyData);
  renderProjectionsTable(data.monthlyData);
}

/**
 * Render current snapshot stats
 */
function renderCurrentStats(totals) {
  const el = id => document.getElementById(id);

  if (el('proj-current-members')) {
    el('proj-current-members').textContent = totals.totalMembers || 0;
  }
  if (el('proj-current-mrr-eur')) {
    el('proj-current-mrr-eur').textContent = `€${totals.mrrEur || 0}`;
  }
  if (el('proj-current-mrr-aud')) {
    el('proj-current-mrr-aud').textContent = `A$${totals.mrrAud || 0}`;
  }
  if (el('proj-total-signups')) {
    el('proj-total-signups').textContent = totals.totalUsers || 0;
  }
}

/**
 * Render signups bar chart (projected vs actual)
 */
function renderSignupsChart(monthlyData) {
  const container = document.getElementById('projections-signups-chart');
  if (!container) return;

  const maxValue = Math.max(
    ...monthlyData.map(m => Math.max(m.projected.signups, m.actual.signups || 0))
  );

  container.innerHTML = `
    <div class="chart-container bar-chart">
      <div class="chart-bars">
        ${monthlyData.map(m => `
          <div class="chart-bar-group">
            <div class="bar-pair">
              <div class="bar projected" style="height: ${(m.projected.signups / maxValue) * 100}%" title="Projected: ${m.projected.signups}">
                <span class="bar-value">${m.projected.signups}</span>
              </div>
              <div class="bar actual ${m.actual.signups !== null ? '' : 'no-data'}" style="height: ${((m.actual.signups || 0) / maxValue) * 100}%" title="Actual: ${m.actual.signups ?? '-'}">
                <span class="bar-value">${m.actual.signups ?? '-'}</span>
              </div>
            </div>
            <div class="bar-label">${m.monthLabel}</div>
          </div>
        `).join('')}
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-box projected"></span> Projected</span>
        <span class="legend-item"><span class="legend-box actual"></span> Actual</span>
      </div>
    </div>
  `;
}

/**
 * Render members line chart (cumulative)
 */
function renderMembersChart(monthlyData) {
  const container = document.getElementById('projections-members-chart');
  if (!container) return;

  const maxValue = Math.max(
    ...monthlyData.map(m => Math.max(m.projected.members, m.actual.members || 0))
  );

  // Create SVG line chart
  const width = 100;
  const height = 60;
  const padding = 5;

  // Generate path points for projected
  const projectedPoints = monthlyData.map((m, i) => {
    const x = padding + (i / (monthlyData.length - 1)) * (width - 2 * padding);
    const y = height - padding - (m.projected.members / maxValue) * (height - 2 * padding);
    return `${x},${y}`;
  });

  // Generate path points for actual (only where data exists)
  const actualData = monthlyData.filter(m => m.actual.members !== null);
  const actualPoints = actualData.map((m, i) => {
    const originalIndex = monthlyData.indexOf(m);
    const x = padding + (originalIndex / (monthlyData.length - 1)) * (width - 2 * padding);
    const y = height - padding - (m.actual.members / maxValue) * (height - 2 * padding);
    return `${x},${y}`;
  });

  container.innerHTML = `
    <div class="chart-container line-chart">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <!-- Projected line -->
        <polyline
          points="${projectedPoints.join(' ')}"
          fill="none"
          stroke="#FFE974"
          stroke-width="0.5"
          stroke-dasharray="1,1"
        />
        <!-- Actual line -->
        ${actualPoints.length > 1 ? `
          <polyline
            points="${actualPoints.join(' ')}"
            fill="none"
            stroke="#FFE974"
            stroke-width="1"
          />
        ` : ''}
        <!-- Data points for projected -->
        ${projectedPoints.map((p, i) => `
          <circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="1" fill="#E55937" />
        `).join('')}
        <!-- Data points for actual -->
        ${actualData.map((m, i) => {
          const originalIndex = monthlyData.indexOf(m);
          const x = padding + (originalIndex / (monthlyData.length - 1)) * (width - 2 * padding);
          const y = height - padding - (m.actual.members / maxValue) * (height - 2 * padding);
          return `<circle cx="${x}" cy="${y}" r="1.5" fill="#FFE974" />`;
        }).join('')}
      </svg>
      <div class="chart-x-labels">
        ${monthlyData.map(m => `<span>${m.monthLabel.split(' ')[0]}</span>`).join('')}
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-line dashed"></span> Projected</span>
        <span class="legend-item"><span class="legend-line solid"></span> Actual</span>
      </div>
    </div>
  `;
}

/**
 * Render revenue chart
 */
function renderRevenueChart(monthlyData) {
  const container = document.getElementById('projections-revenue-chart');
  if (!container) return;

  const isEur = currentCurrency === 'eur';
  const revenueKey = isEur ? 'revenueEur' : 'revenueAud';
  const symbol = isEur ? '€' : 'A$';

  const maxValue = Math.max(
    ...monthlyData.map(m => Math.max(
      m.projected[revenueKey],
      m.actual[revenueKey] || 0
    ))
  );

  container.innerHTML = `
    <div class="chart-container bar-chart revenue-chart">
      <div class="chart-bars">
        ${monthlyData.map(m => `
          <div class="chart-bar-group">
            <div class="bar-pair">
              <div class="bar projected" style="height: ${(m.projected[revenueKey] / maxValue) * 100}%" title="Projected: ${symbol}${m.projected[revenueKey]}">
                <span class="bar-value">${symbol}${m.projected[revenueKey]}</span>
              </div>
              <div class="bar actual ${m.actual[revenueKey] !== null ? '' : 'no-data'}" style="height: ${((m.actual[revenueKey] || 0) / maxValue) * 100}%" title="Actual: ${m.actual[revenueKey] !== null ? symbol + m.actual[revenueKey] : '-'}">
                <span class="bar-value">${m.actual[revenueKey] !== null ? symbol + m.actual[revenueKey] : '-'}</span>
              </div>
            </div>
            <div class="bar-label">${m.monthLabel}</div>
          </div>
        `).join('')}
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-box projected"></span> Projected</span>
        <span class="legend-item"><span class="legend-box actual"></span> Actual</span>
      </div>
    </div>
  `;
}

/**
 * Render data table
 */
function renderProjectionsTable(monthlyData) {
  const tbody = document.getElementById('projections-table-body');
  if (!tbody) return;

  tbody.innerHTML = monthlyData.map(m => {
    const signupsDiff = m.actual.signups !== null
      ? m.actual.signups - m.projected.signups
      : null;
    const membersDiff = m.actual.members !== null
      ? m.actual.members - m.projected.members
      : null;
    const revenueDiff = m.actual.revenueEur !== null
      ? m.actual.revenueEur - m.projected.revenueEur
      : null;

    const diffClass = (diff) => {
      if (diff === null) return '';
      return diff >= 0 ? 'positive' : 'negative';
    };

    const formatDiff = (diff, prefix = '') => {
      if (diff === null) return '';
      const sign = diff >= 0 ? '+' : '';
      return `<span class="diff ${diffClass(diff)}">${sign}${prefix}${diff}</span>`;
    };

    return `
      <tr class="${m.isCurrentMonth ? 'current-month' : ''} ${m.isPastMonth ? 'past-month' : ''}">
        <td class="month-cell">${m.monthLabel}</td>
        <td>${m.projected.signups}</td>
        <td>
          ${m.actual.signups !== null ? m.actual.signups : '-'}
          ${formatDiff(signupsDiff)}
        </td>
        <td>${m.projected.members}</td>
        <td>
          ${m.actual.members !== null ? m.actual.members : '-'}
          ${formatDiff(membersDiff)}
        </td>
        <td>€${m.projected.revenueEur}</td>
        <td>
          ${m.actual.revenueEur !== null ? '€' + m.actual.revenueEur : '-'}
          ${formatDiff(revenueDiff, '€')}
        </td>
      </tr>
    `;
  }).join('');
}
