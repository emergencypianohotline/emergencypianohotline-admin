/**
 * @fileoverview Admin Dashboard - Platform Analytics Section
 * Phase 4: Engagement metrics, completion funnel, cohort analysis
 */

import { debug } from '../../config.js';

let analyticsData = null;
let matrixData = null;

/**
 * Initialize analytics section
 */
export function initAnalytics() {
  // Setup refresh button
  const refreshBtn = document.querySelector('[data-refresh="analytics"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (window._adminApiUrl && window._adminAuthHeaders) {
        loadAnalyticsData(window._adminApiUrl, window._adminAuthHeaders, true);
      }
    });
  }
}

/**
 * Load analytics data from API
 */
export async function loadAnalyticsData(getAdminApiUrl, getAuthHeaders, forceRefresh = false) {
  // Store for refresh
  window._adminApiUrl = getAdminApiUrl;
  window._adminAuthHeaders = getAuthHeaders;

  // Use cached data if available and not forcing refresh
  if (analyticsData && !forceRefresh) {
    debug.log('📊 Using cached analytics data');
    renderAnalytics(analyticsData);
    return;
  }

  // Show loading states
  const engagementEl = document.getElementById('analytics-engagement');
  const funnelEl = document.getElementById('analytics-funnel');
  const cohortsEl = document.getElementById('analytics-cohorts');
  const distributionEl = document.getElementById('analytics-distribution');
  const sessionsEl = document.getElementById('analytics-sessions');
  const matrixEl = document.getElementById('analytics-matrix');

  if (engagementEl) engagementEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  if (funnelEl) funnelEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  if (cohortsEl) cohortsEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  if (distributionEl) distributionEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  if (sessionsEl) sessionsEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  if (matrixEl) matrixEl.innerHTML = '<div class="admin-loading">Loading...</div>';

  try {
    // Fetch analytics, sessions, and matrix data in parallel
    const [analyticsResponse, sessionsResponse, matrixResponse] = await Promise.all([
      fetch(getAdminApiUrl('analytics'), {
        method: 'GET',
        headers: getAuthHeaders(),
      }),
      fetch(getAdminApiUrl('sessions'), {
        method: 'GET',
        headers: getAuthHeaders(),
      }).catch(() => null), // Sessions endpoint may not exist yet
      fetch(getAdminApiUrl('matrix'), {
        method: 'GET',
        headers: getAuthHeaders(),
      }).catch(() => null), // Matrix endpoint may not exist yet
    ]);

    if (!analyticsResponse.ok) {
      throw new Error(`HTTP ${analyticsResponse.status}`);
    }

    analyticsData = await analyticsResponse.json();
    debug.log('📊 Analytics data received:', analyticsData);

    // Parse sessions data if available
    let sessionsData = null;
    if (sessionsResponse?.ok) {
      sessionsData = await sessionsResponse.json();
      debug.log('📊 Sessions data received:', sessionsData);
    }

    // Parse matrix data if available
    if (matrixResponse?.ok) {
      matrixData = await matrixResponse.json();
      debug.log('📊 Matrix data received:', matrixData);
    }

    renderAnalytics(analyticsData);
    renderSessionStats(sessionsData);
    renderCompletionMatrix(matrixData);

  } catch (err) {
    debug.error('❌ Failed to load analytics:', err);
    if (engagementEl) engagementEl.innerHTML = '<div class="admin-error">Failed to load analytics</div>';
  }
}

/**
 * Render all analytics sections
 */
function renderAnalytics(data) {
  renderEngagementMetrics(data.engagement);
  renderCompletionFunnel(data.funnel);
  renderCohortAnalysis(data.cohorts);
  renderEngagementDistribution(data.distribution);
}

/**
 * Render engagement metrics (DAU, WAU, MAU, stickiness)
 */
function renderEngagementMetrics(engagement) {
  const container = document.getElementById('analytics-engagement');
  if (!container || !engagement) return;

  container.innerHTML = `
    <div class="analytics-metrics-grid">
      <div class="analytics-metric">
        <div class="analytics-metric-value">${engagement.dau}</div>
        <div class="analytics-metric-label">Daily Active</div>
        <div class="analytics-metric-sublabel">Today</div>
      </div>
      <div class="analytics-metric">
        <div class="analytics-metric-value">${engagement.wau}</div>
        <div class="analytics-metric-label">Weekly Active</div>
        <div class="analytics-metric-sublabel">Last 7 days</div>
      </div>
      <div class="analytics-metric">
        <div class="analytics-metric-value">${engagement.mau}</div>
        <div class="analytics-metric-label">Monthly Active</div>
        <div class="analytics-metric-sublabel">Last 30 days</div>
      </div>
      <div class="analytics-metric highlight">
        <div class="analytics-metric-value">${engagement.stickiness}%</div>
        <div class="analytics-metric-label">Stickiness</div>
        <div class="analytics-metric-sublabel">DAU/MAU ratio</div>
      </div>
    </div>
    <div class="analytics-metrics-grid secondary">
      <div class="analytics-metric">
        <div class="analytics-metric-value">${engagement.avgWatchTimePerActiveUser}</div>
        <div class="analytics-metric-label">Avg Watch/User</div>
        <div class="analytics-metric-sublabel">Per active user (weekly)</div>
      </div>
      <div class="analytics-metric">
        <div class="analytics-metric-value">${engagement.avgCompletionsPerActiveUser}</div>
        <div class="analytics-metric-label">Avg Completions</div>
        <div class="analytics-metric-sublabel">Per active user (weekly)</div>
      </div>
      <div class="analytics-metric">
        <div class="analytics-metric-value">${engagement.avgSessionsPerActiveUser}</div>
        <div class="analytics-metric-label">Avg Sessions</div>
        <div class="analytics-metric-sublabel">Per active user (weekly)</div>
      </div>
      <div class="analytics-metric">
        <div class="analytics-metric-value">${engagement.returningUsersRate}%</div>
        <div class="analytics-metric-label">Returning Rate</div>
        <div class="analytics-metric-sublabel">2+ days active (weekly)</div>
      </div>
    </div>
    <div class="analytics-metrics-grid tertiary">
      <div class="analytics-metric focus-mode">
        <div class="analytics-metric-value">${engagement.focusModeAdoptionRate || 0}%</div>
        <div class="analytics-metric-label">Focus Mode Adoption</div>
        <div class="analytics-metric-sublabel">Users using Focus Mode (weekly)</div>
      </div>
      <div class="analytics-metric focus-mode">
        <div class="analytics-metric-value">${engagement.focusModeWatchPercent || 0}%</div>
        <div class="analytics-metric-label">Focus Mode Watch Time</div>
        <div class="analytics-metric-sublabel">% of total watch time (weekly)</div>
      </div>
    </div>
  `;
}

/**
 * Render completion funnel (by song)
 */
function renderCompletionFunnel(funnel) {
  const container = document.getElementById('analytics-funnel');
  if (!container || !funnel || funnel.length === 0) {
    if (container) container.innerHTML = '<div class="admin-empty">No funnel data available</div>';
    return;
  }

  // Find max users for scaling
  const maxUsers = Math.max(...funnel.map(s => s.usersStarted));

  container.innerHTML = `
    <div class="funnel-container">
      ${funnel.map((song, index) => {
        const widthPercent = maxUsers > 0 ? (song.usersStarted / maxUsers) * 100 : 0;
        const completionWidthPercent = maxUsers > 0 ? (song.usersCompleted / maxUsers) * 100 : 0;
        const dropoffRate = index > 0 && funnel[index - 1].usersStarted > 0
          ? Math.round((1 - song.usersStarted / funnel[index - 1].usersStarted) * 100)
          : 0;
        const isHighDropoff = dropoffRate > 30;

        return `
          <div class="funnel-stage ${isHighDropoff ? 'high-dropoff' : ''}">
            <div class="funnel-stage-header">
              <span class="funnel-stage-name">${song.songTitle}</span>
              ${isHighDropoff ? `<span class="funnel-dropoff-badge">-${dropoffRate}% dropoff</span>` : ''}
            </div>
            <div class="funnel-bars">
              <div class="funnel-bar started" style="width: ${widthPercent}%">
                <span class="funnel-bar-label">${song.usersStarted} started</span>
              </div>
              <div class="funnel-bar completed" style="width: ${completionWidthPercent}%">
                <span class="funnel-bar-label">${song.usersCompleted} completed (${song.completionRate}%)</span>
              </div>
            </div>
            <div class="funnel-stage-meta">
              <span>Avg ${song.avgDaysToComplete} days to complete</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render cohort analysis
 */
function renderCohortAnalysis(cohorts) {
  const container = document.getElementById('analytics-cohorts');
  if (!container || !cohorts || cohorts.length === 0) {
    if (container) container.innerHTML = '<div class="admin-empty">No cohort data available</div>';
    return;
  }

  container.innerHTML = `
    <div class="cohorts-table-container">
      <table class="admin-table cohorts-table">
        <thead>
          <tr>
            <th>Cohort</th>
            <th>Signups</th>
            <th>Still Active</th>
            <th>Retention</th>
            <th>Avg Progress</th>
            <th>Avg Watch Time</th>
          </tr>
        </thead>
        <tbody>
          ${cohorts.map(cohort => {
            const retentionClass = cohort.retentionRate >= 50 ? 'rate-high' :
              cohort.retentionRate >= 25 ? 'rate-medium' : 'rate-low';
            return `
              <tr>
                <td class="cohort-name">${cohort.cohortName}</td>
                <td>${cohort.totalSignups}</td>
                <td>${cohort.stillActive}</td>
                <td class="${retentionClass}">${cohort.retentionRate}%</td>
                <td>${cohort.avgProgress}%</td>
                <td>${cohort.avgWatchTime}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render engagement distribution
 */
function renderEngagementDistribution(distribution) {
  const container = document.getElementById('analytics-distribution');
  if (!container || !distribution) return;

  const total = distribution.highlyActive + distribution.moderate + distribution.light + distribution.inactive;

  container.innerHTML = `
    <div class="distribution-bars">
      <div class="distribution-bar-row">
        <div class="distribution-label">
          <span class="distribution-tier highly-active">Highly Active</span>
          <span class="distribution-desc">&gt;2 hrs/week</span>
        </div>
        <div class="distribution-bar-container">
          <div class="distribution-bar highly-active" style="width: ${total > 0 ? (distribution.highlyActive / total) * 100 : 0}%"></div>
        </div>
        <div class="distribution-count">${distribution.highlyActive} (${total > 0 ? Math.round(distribution.highlyActive / total * 100) : 0}%)</div>
      </div>
      <div class="distribution-bar-row">
        <div class="distribution-label">
          <span class="distribution-tier moderate">Moderate</span>
          <span class="distribution-desc">30m-2 hrs/week</span>
        </div>
        <div class="distribution-bar-container">
          <div class="distribution-bar moderate" style="width: ${total > 0 ? (distribution.moderate / total) * 100 : 0}%"></div>
        </div>
        <div class="distribution-count">${distribution.moderate} (${total > 0 ? Math.round(distribution.moderate / total * 100) : 0}%)</div>
      </div>
      <div class="distribution-bar-row">
        <div class="distribution-label">
          <span class="distribution-tier light">Light</span>
          <span class="distribution-desc">&lt;30m/week</span>
        </div>
        <div class="distribution-bar-container">
          <div class="distribution-bar light" style="width: ${total > 0 ? (distribution.light / total) * 100 : 0}%"></div>
        </div>
        <div class="distribution-count">${distribution.light} (${total > 0 ? Math.round(distribution.light / total * 100) : 0}%)</div>
      </div>
      <div class="distribution-bar-row">
        <div class="distribution-label">
          <span class="distribution-tier inactive">Inactive</span>
          <span class="distribution-desc">No activity 14+ days</span>
        </div>
        <div class="distribution-bar-container">
          <div class="distribution-bar inactive" style="width: ${total > 0 ? (distribution.inactive / total) * 100 : 0}%"></div>
        </div>
        <div class="distribution-count">${distribution.inactive} (${total > 0 ? Math.round(distribution.inactive / total * 100) : 0}%)</div>
      </div>
    </div>
  `;
}

/**
 * Render session stats (Phase 6)
 */
function renderSessionStats(sessions) {
  const container = document.getElementById('analytics-sessions');
  if (!container) return;

  if (!sessions) {
    container.innerHTML = '<div class="admin-empty">Session tracking not yet available</div>';
    return;
  }

  container.innerHTML = `
    <div class="sessions-stats-container">
      <!-- Session Metrics -->
      <div class="analytics-metrics-grid">
        <div class="analytics-metric">
          <div class="analytics-metric-value">${sessions.weekSessions || 0}</div>
          <div class="analytics-metric-label">Sessions (7 Days)</div>
        </div>
        <div class="analytics-metric">
          <div class="analytics-metric-value">${sessions.monthSessions || 0}</div>
          <div class="analytics-metric-label">Sessions (30 Days)</div>
        </div>
        <div class="analytics-metric">
          <div class="analytics-metric-value">${sessions.avgLoginsPerUserWeek || '0'}</div>
          <div class="analytics-metric-label">Avg Logins/User (Weekly)</div>
        </div>
        <div class="analytics-metric">
          <div class="analytics-metric-value">${sessions.avgSessionDurationFormatted || '—'}</div>
          <div class="analytics-metric-label">Avg Session Duration</div>
        </div>
      </div>

      <!-- Device & Browser Breakdown -->
      <div class="sessions-breakdown-grid">
        <!-- Device Distribution -->
        <div class="sessions-breakdown-section">
          <h4>Device Distribution</h4>
          <div class="device-breakdown">
            ${renderDeviceBar('Desktop', sessions.deviceDistribution?.desktop || 0, sessions.deviceCounts?.desktop || 0)}
            ${renderDeviceBar('Tablet', sessions.deviceDistribution?.tablet || 0, sessions.deviceCounts?.tablet || 0)}
            ${renderDeviceBar('Mobile', sessions.deviceDistribution?.mobile || 0, sessions.deviceCounts?.mobile || 0)}
          </div>
        </div>

        <!-- Top Browsers -->
        <div class="sessions-breakdown-section">
          <h4>Top Browsers</h4>
          <div class="browser-list">
            ${(sessions.topBrowsers || []).map(b => `
              <div class="browser-item">
                <span class="browser-name">${b.browser}</span>
                <span class="browser-stats">${b.count} (${b.percent}%)</span>
              </div>
            `).join('') || '<div class="admin-empty">No data</div>'}
          </div>
        </div>
      </div>

      <!-- Geographical Analytics -->
      ${sessions.geographicalStats ? renderGeographicalStats(sessions.geographicalStats) : ''}
    </div>
  `;
}

/**
 * Render geographical analytics section
 */
function renderGeographicalStats(geoStats) {
  if (!geoStats || geoStats.totalUniqueCountries === 0) {
    return '';
  }

  return `
    <div class="geographical-analytics-section">
      <h3>📍 Geographical Distribution</h3>
      <div class="geo-summary">
        <span>${geoStats.totalUniqueCountries} countries</span>
        <span>•</span>
        <span>${geoStats.totalUniqueRegions} regions</span>
        <span>•</span>
        <span>${geoStats.totalUniqueCities} cities</span>
      </div>

      <div class="geo-breakdown-grid">
        <!-- Top Countries -->
        <div class="geo-section">
          <h4>Top Countries</h4>
          <div class="geo-list">
            ${(geoStats.topCountries || []).map(c => `
              <div class="geo-item">
                <span class="geo-flag">${getCountryFlag(c.code)}</span>
                <span class="geo-name">${c.country}</span>
                <span class="geo-stats">${c.sessions} (${c.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Top Regions -->
        <div class="geo-section">
          <h4>Top Regions</h4>
          <div class="geo-list">
            ${(geoStats.topRegions || []).slice(0, 8).map(r => `
              <div class="geo-item">
                <span class="geo-name">${r.region}, ${r.country}</span>
                <span class="geo-stats">${r.sessions} (${r.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Top Cities -->
        <div class="geo-section">
          <h4>Top Cities</h4>
          <div class="geo-list">
            ${(geoStats.topCities || []).slice(0, 8).map(c => `
              <div class="geo-item">
                <span class="geo-name">${c.city}, ${c.region}</span>
                <span class="geo-stats">${c.sessions} (${c.percentage}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get country flag emoji from country code
 */
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

/**
 * Render a device distribution bar
 */
function renderDeviceBar(label, percent, count) {
  return `
    <div class="device-bar-row">
      <span class="device-label">${label}</span>
      <div class="device-bar-container">
        <div class="device-bar" style="width: ${percent}%"></div>
      </div>
      <span class="device-percent">${percent}% (${count})</span>
    </div>
  `;
}

/**
 * Render the completion matrix (Student × Tutorial grid)
 */
function renderCompletionMatrix(data) {
  const container = document.getElementById('analytics-matrix');
  if (!container) return;

  if (!data || !data.users || !data.tutorials || data.users.length === 0) {
    container.innerHTML = '<div class="admin-empty">No matrix data available</div>';
    return;
  }

  const { users, tutorials, songGroups, lessonGroups, totalTutorials } = data;

  // Build the matrix HTML
  container.innerHTML = `
    <div class="matrix-wrapper">
      <div class="matrix-scroll-container">
        <table class="completion-matrix">
          <thead>
            <!-- Song header row -->
            <tr class="matrix-song-row">
              <th class="matrix-corner" rowspan="3"></th>
              ${songGroups.map(sg => `
                <th colspan="${sg.tutorialCount}" class="matrix-song-header">
                  ${sg.songTitle}
                </th>
              `).join('')}
            </tr>
            <!-- Lesson header row -->
            <tr class="matrix-lesson-row">
              ${(lessonGroups || []).map(lg => `
                <th colspan="${lg.tutorialCount}" class="matrix-lesson-header">
                  Lesson ${lg.lessonNumber}
                </th>
              `).join('')}
            </tr>
            <!-- Tutorial number row -->
            <tr class="matrix-tutorial-row">
              ${tutorials.map((t, idx) => `
                <th class="matrix-tutorial-header" title="${t.title}${t.lessonTitle ? ' - ' + t.lessonTitle : ''}">
                  ${idx + 1}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr class="matrix-user-row" data-user-id="${user.id}">
                <td class="matrix-user-cell">
                  <span class="matrix-user-name">${user.name}</span>
                  <span class="matrix-user-count">${user.completedCount}/${totalTutorials}</span>
                </td>
                ${user.cells.map((cell, idx) => {
                  const tutorial = tutorials[idx];
                  const cellClass = cell.status === 'completed' ? 'completed' :
                    cell.status === 'in_progress' ? 'in-progress' : 'not-started';
                  const tooltip = tutorial
                    ? `${tutorial.title}${tutorial.lessonTitle ? ' - ' + tutorial.lessonTitle : ''}: ${cell.status === 'completed' ? 'Completed' : cell.status === 'in_progress' ? cell.percent + '% watched' : 'Not started'}`
                    : '';

                  // For in-progress, show a horizontal partial fill from left to right (only two colors)
                  const fillStyle = cell.status === 'in_progress' && cell.percent > 0
                    ? `background: linear-gradient(to right, #FFE974 ${cell.percent}%, #E55937 ${cell.percent}%);`
                    : '';

                  return `
                    <td class="matrix-cell ${cellClass}" title="${tooltip}" style="${fillStyle}">
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="matrix-summary">
        <span>${users.length} students</span>
        <span>×</span>
        <span>${totalTutorials} tutorials</span>
      </div>
    </div>
  `;

  // Add click handlers for user rows to navigate to user detail
  container.querySelectorAll('.matrix-user-row').forEach(row => {
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
