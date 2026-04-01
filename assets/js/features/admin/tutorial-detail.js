/**
 * @fileoverview Admin Dashboard - Tutorial Detail (Tabler)
 */

import { debug } from '../../config.js';
import { renderChart, getColors } from './charts.js';

/**
 * Load and render tutorial detail
 */
export async function loadTutorialDetail(tutorialId, getAdminApiUrl, getAuthHeaders, navigateToView) {
  const container = document.getElementById('tutorial-detail-container');
  if (!container) return;

  container.innerHTML = '<div class="text-secondary">Loading...</div>';

  try {
    const response = await fetch(getAdminApiUrl(`tutorials/${tutorialId}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    renderTutorialDetail(container, data, navigateToView);
  } catch (err) {
    debug.error('Failed to load tutorial detail:', err);
    container.innerHTML = '<div class="alert alert-danger">Failed to load tutorial details</div>';
  }
}

function renderTutorialDetail(container, data, navigateToView) {
  const { tutorial, stats, watchDistribution, viewers, studentsStuck, recentActivity } = data;
  const membersStuck = studentsStuck || data.membersStuck || [];

  container.innerHTML = `
    <!-- Header -->
    <div class="card mb-3">
      <div class="card-body">
        <h2 class="mb-1">${tutorial.title}</h2>
        <div class="text-secondary">
          ${tutorial.songTitle || ''}
          ${tutorial.lessonTitle ? ` · ${tutorial.lessonTitle}` : ''}
          ${tutorial.durationFormatted ? ` · ${tutorial.durationFormatted}` : ''}
        </div>
      </div>
    </div>

    <!-- Key stats -->
    <div class="row row-deck row-cards mb-3">
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div class="h1 mb-0">${stats.uniqueViewers}</div>
            <div class="text-secondary small">Viewers</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div class="h1 mb-0">${stats.totalSessions}</div>
            <div class="text-secondary small">Sessions</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div class="h1 mb-0">${stats.totalCompletions}</div>
            <div class="text-secondary small">Completions</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div id="chart-tutorial-completion-gauge" style="height:90px;"></div>
            <div class="text-secondary small">Completion Rate</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Secondary stats -->
    <div class="row row-deck row-cards mb-3">
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div class="h3 mb-0">${stats.avgWatchTimeFormatted || '—'}</div>
            <div class="text-secondary small">Avg Watch Time</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div class="h3 mb-0">${stats.rewatchRate || 0}%</div>
            <div class="text-secondary small">Rewatch Rate</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div class="h3 mb-0">${stats.medianExitPercent || '—'}%</div>
            <div class="text-secondary small">Median Exit Point</div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card">
          <div class="card-body p-3 text-center">
            <div class="h3 mb-0">${stats.avgTimeToCompletion || '—'}</div>
            <div class="text-secondary small">Avg Days to Complete</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Watch distribution -->
    ${watchDistribution ? `
      <div class="card mb-3">
        <div class="card-header"><h3 class="card-title">Watch Distribution</h3></div>
        <div class="card-body">
          <div id="chart-watch-distribution"></div>
        </div>
      </div>
    ` : ''}

    <!-- Members stuck -->
    ${membersStuck.length > 0 ? `
      <div class="card mb-3">
        <div class="card-header">
          <h3 class="card-title">Members Stuck on This Tutorial</h3>
          <div class="card-actions">
            <span class="badge bg-warning">${membersStuck.length}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="list-group list-group-flush" id="stuck-viewers-list">
            ${membersStuck.slice(0, 10).map(m => `
              <a href="#" class="list-group-item list-group-item-action stuck-viewer-link" data-user-id="${m.userId}">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <div class="fw-bold">${escapeHtml(m.name)}</div>
                    <small class="text-secondary">${m.watchPercent}% watched · ${m.sessionCount} sessions</small>
                  </div>
                  <span class="badge ${getStatusBadgeClass(m.activityStatus)}">${m.activityStatus || ''}</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- All viewers -->
    ${viewers && viewers.length > 0 ? `
      <div class="card mb-3">
        <div class="card-header"><h3 class="card-title">All Viewers</h3></div>
        <div class="table-responsive">
          <table class="table table-vcenter card-table table-hover">
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th class="text-end">Sessions</th>
                <th class="text-end">Watch %</th>
                <th class="text-end">Notes</th>
                <th>Completed</th>
                <th>Last Watched</th>
              </tr>
            </thead>
            <tbody id="viewers-tbody">
              ${viewers.map(v => `
                <tr class="cursor-pointer viewer-row" data-user-id="${v.userId}">
                  <td>${escapeHtml(v.name)}</td>
                  <td><span class="badge ${getStatusBadgeClass(v.activityStatus)}">${v.activityStatus || ''}</span></td>
                  <td class="text-end">${v.sessionCount}</td>
                  <td class="text-end">${v.watchPercent}%</td>
                  <td class="text-end">${v.notesCount || 0}</td>
                  <td>${v.completed ? '<span class="badge bg-success-lt">Yes</span>' : '<span class="badge bg-secondary-lt">No</span>'}</td>
                  <td class="text-secondary">${formatDate(v.lastWatchedAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <!-- Recent activity -->
    ${recentActivity && recentActivity.length > 0 ? `
      <div class="card">
        <div class="card-header"><h3 class="card-title">Recent Activity</h3></div>
        <div class="card-body">
          <div class="list-group list-group-flush">
            ${recentActivity.map(a => `
              <div class="list-group-item border-0 px-0 py-2">
                <div class="d-flex align-items-center gap-2">
                  <div>${getActivityIcon(a.type)}</div>
                  <div class="flex-fill">
                    <span class="fw-bold">${escapeHtml(a.userName)}</span>
                    <span class="text-secondary">${getActivityLabel(a)}</span>
                  </div>
                  <small class="text-secondary text-nowrap">${formatDate(a.timestamp)}</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}
  `;

  // Add click handlers for member links
  container.querySelectorAll('[data-user-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = el.dataset.userId;
      if (userId && navigateToView) {
        navigateToView('members', { userId });
      }
    });
  });

  // Render charts after DOM is set
  renderCompletionGauge(stats.completionRate);
  if (watchDistribution) {
    renderWatchDistributionChart(watchDistribution, stats.uniqueViewers);
  }
}

function renderCompletionGauge(completionRate) {
  const colors = getColors();
  const rate = completionRate || 0;
  const gaugeColor = rate >= 70 ? colors.success : rate >= 40 ? colors.warning : colors.danger;

  renderChart('chart-tutorial-completion-gauge', {
    chart: { type: 'radialBar', height: 90, sparkline: { enabled: true } },
    series: [Math.min(rate, 100)],
    plotOptions: {
      radialBar: {
        hollow: { size: '50%' },
        dataLabels: {
          name: { show: false },
          value: {
            show: true, fontSize: '18px', fontWeight: 700,
            formatter: () => `${rate}%`, offsetY: 5,
          },
        },
        track: { background: 'rgba(255,255,255,0.08)' },
      },
    },
    colors: [gaugeColor],
  });
}

function renderWatchDistributionChart(distribution, totalViewers) {
  const colors = getColors();
  const entries = Object.entries(distribution);
  const labels = entries.map(([label]) => label);
  const values = entries.map(([, count]) => count);

  renderChart('chart-watch-distribution', {
    chart: { type: 'bar', height: Math.max(200, entries.length * 40) },
    series: [{ name: 'Viewers', data: values }],
    xaxis: { categories: labels },
    colors: [colors.primary],
    plotOptions: {
      bar: { horizontal: true, borderRadius: 3, barHeight: '60%' },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => {
        const pct = totalViewers > 0 ? Math.round((val / totalViewers) * 100) : 0;
        return `${val} (${pct}%)`;
      },
      style: { fontSize: '12px' },
    },
    tooltip: {
      y: {
        formatter: (val) => {
          const pct = totalViewers > 0 ? Math.round((val / totalViewers) * 100) : 0;
          return `${val} viewers (${pct}%)`;
        },
      },
    },
  });
}

function getCompletionColor(rate) {
  if (rate >= 70) return 'text-success';
  if (rate >= 40) return 'text-warning';
  return 'text-danger';
}

function getStatusBadgeClass(status) {
  const classes = {
    active: 'bg-success-lt',
    at_risk: 'bg-warning-lt',
    new: 'bg-info-lt',
    dormant: 'bg-danger-lt',
  };
  return classes[status] || 'bg-secondary-lt';
}

function getActivityIcon(type) {
  switch (type) {
    case 'watch': return '<span class="badge bg-blue-lt badge-sm">PLAY</span>';
    case 'completion': return '<span class="badge bg-green-lt badge-sm">DONE</span>';
    case 'note': return '<span class="badge bg-purple-lt badge-sm">NOTE</span>';
    default: return '<span class="badge bg-secondary-lt badge-sm">EVENT</span>';
  }
}

function getActivityLabel(activity) {
  switch (activity.type) {
    case 'watch': return activity.details?.completed ? 'completed' : 'watched';
    case 'completion': return 'completed';
    case 'note': return 'added notes';
    default: return '';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
