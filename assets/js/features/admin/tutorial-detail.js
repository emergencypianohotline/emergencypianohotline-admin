/**
 * Tutorial Detail View
 * Comprehensive analytics for a single tutorial
 */

import { createDebugger } from '../../utils/debug.js';
const debug = createDebugger('admin:tutorial-detail');

/**
 * Load and display tutorial detail
 */
export async function loadTutorialDetail(tutorialId, getAdminApiUrl, getAuthHeaders, navigateToView) {
  const container = document.getElementById('tutorial-detail-container');
  if (!container) {
    debug.error('Tutorial detail container not found');
    return;
  }

  // Show loading state
  container.innerHTML = '<div class="admin-loading">Loading tutorial details...</div>';

  try {
    const response = await fetch(getAdminApiUrl(`tutorials/${tutorialId}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load tutorial details: ${response.statusText}`);
    }

    const data = await response.json();
    debug.log('📊 Tutorial detail loaded:', data);

    renderTutorialDetail(data, navigateToView);

  } catch (err) {
    debug.error('❌ Failed to load tutorial detail:', err);
    container.innerHTML = `
      <div class="admin-error">
        <p>Failed to load tutorial details</p>
        <button class="admin-button" onclick="window.history.back()">Go Back</button>
      </div>
    `;
  }
}

/**
 * Render tutorial detail view
 */
function renderTutorialDetail(data, navigateToView) {
  const container = document.getElementById('tutorial-detail-container');
  const { tutorial, stats, watchDistribution, viewers, recentActivity, studentsStuck } = data;

  container.innerHTML = `
    <div class="admin-detail-view">
      <!-- Header -->
      <div class="admin-detail-header">
        <div class="admin-detail-back">
          <button class="admin-button-icon" id="back-to-content">
            ← Back to Content Stats
          </button>
        </div>
        <div class="admin-detail-title">
          <h2>${tutorial.title}</h2>
          <div class="admin-detail-subtitle">
            ${tutorial.songTitle} • ${tutorial.lessonTitle}
            ${tutorial.durationFormatted ? ` • ${tutorial.durationFormatted}` : ''}
          </div>
        </div>
      </div>

      <!-- Key Stats Grid -->
      <div class="admin-stats-grid tutorial-detail-stats">
        <div class="admin-stat-card">
          <div class="admin-stat-value">${stats.uniqueViewers}</div>
          <div class="admin-stat-label">Unique Viewers</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-value">${stats.totalSessions}</div>
          <div class="admin-stat-label">Total Sessions</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-value">${stats.totalCompletions}</div>
          <div class="admin-stat-label">Completions</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-value ${getCompletionRateClass(stats.completionRate)}">${stats.completionRate}%</div>
          <div class="admin-stat-label">Completion Rate</div>
        </div>
      </div>

      <!-- Secondary Stats -->
      <div class="admin-stats-grid tutorial-detail-stats">
        <div class="admin-stat-card">
          <div class="admin-stat-value">${stats.avgWatchTimeFormatted || '-'}</div>
          <div class="admin-stat-label">Avg Watch Time</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-value">${stats.rewatchRate}%</div>
          <div class="admin-stat-label">Rewatch Rate</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-value">${stats.totalNotesCount}</div>
          <div class="admin-stat-label">Total Notes</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-value">${stats.notesDensity.toFixed(2)}</div>
          <div class="admin-stat-label">Notes per Viewer</div>
        </div>
      </div>

      ${stats.medianExitPercent !== null ? `
        <div class="admin-panel tutorial-exit-analysis">
          <h3>📊 Engagement Analysis</h3>
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-value">${stats.medianExitPercent}%</div>
              <div class="admin-stat-label">Median Exit Point</div>
            </div>
            ${stats.avgTimeToCompletion !== null ? `
              <div class="admin-stat-card">
                <div class="admin-stat-value">${stats.avgTimeToCompletion} days</div>
                <div class="admin-stat-label">Avg Time to Complete</div>
              </div>
            ` : ''}
            ${stats.medianTimeToCompletion !== null ? `
              <div class="admin-stat-card">
                <div class="admin-stat-value">${stats.medianTimeToCompletion} days</div>
                <div class="admin-stat-label">Median Time to Complete</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Watch Distribution -->
      <div class="admin-panel">
        <h3>📈 Watch Time Distribution</h3>
        <div class="watch-distribution-chart">
          ${renderWatchDistribution(watchDistribution, stats.uniqueViewers)}
        </div>
      </div>

      <!-- Students Stuck (if any) -->
      ${studentsStuck.length > 0 ? `
        <div class="admin-panel alert-panel">
          <div class="admin-panel-header">
            <h3>⚠️ Students Stuck on This Tutorial</h3>
            <span class="admin-badge badge-warning">${studentsStuck.length}</span>
          </div>
          <div class="admin-list">
            ${studentsStuck.slice(0, 10).map(student => `
              <div class="admin-list-item clickable" data-user-id="${student.userId}">
                <div class="admin-list-content">
                  <div class="admin-list-title">${student.name}</div>
                  <div class="admin-list-meta">
                    Watched ${student.watchPercent}% • ${student.sessionCount} sessions •
                    Last watched ${student.daysSinceLastWatch} days ago
                  </div>
                </div>
                <div class="admin-list-actions">
                  <span class="admin-badge ${getStatusBadgeClass(student.activityStatus)}">${student.activityStatus}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- All Viewers Table -->
      <div class="admin-panel">
        <div class="admin-panel-header">
          <h3>👥 All Viewers (${viewers.length})</h3>
        </div>
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th class="admin-cell-center">Sessions</th>
                <th class="admin-cell-center">Watch %</th>
                <th class="admin-cell-center">Notes</th>
                <th class="admin-cell-center">Completed</th>
                <th>Last Watched</th>
              </tr>
            </thead>
            <tbody id="viewers-tbody">
              ${viewers.map(viewer => `
                <tr class="admin-table-row clickable" data-user-id="${viewer.userId}">
                  <td class="admin-cell-title">${viewer.name}</td>
                  <td><span class="admin-badge ${getStatusBadgeClass(viewer.activityStatus)}">${viewer.activityStatus}</span></td>
                  <td class="admin-cell-center">${viewer.sessionCount}</td>
                  <td class="admin-cell-center">${viewer.watchPercent}%</td>
                  <td class="admin-cell-center">${viewer.notesCount}</td>
                  <td class="admin-cell-center">${viewer.completed ? '✅' : '—'}</td>
                  <td>${viewer.lastWatchedAt ? formatDate(viewer.lastWatchedAt) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="admin-panel">
        <div class="admin-panel-header">
          <h3>🕐 Recent Activity (Last 30 Days)</h3>
        </div>
        <div class="admin-timeline">
          ${recentActivity.slice(0, 50).map(activity => `
            <div class="admin-timeline-item">
              <div class="admin-timeline-icon ${activity.type}">${getActivityIcon(activity.type)}</div>
              <div class="admin-timeline-content">
                <div class="admin-timeline-title">
                  <span class="admin-timeline-user clickable" data-user-id="${activity.userId}">${activity.userName}</span>
                  ${getActivityText(activity)}
                </div>
                <div class="admin-timeline-meta">${formatDate(activity.timestamp)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  document.getElementById('back-to-content')?.addEventListener('click', () => {
    navigateToView('content-stats');
  });

  // Make student names clickable
  container.querySelectorAll('[data-user-id]').forEach(el => {
    el.addEventListener('click', () => {
      const userId = el.dataset.userId;
      navigateToView('user-detail', { userId });
    });
  });
}

/**
 * Render watch distribution bar chart
 */
function renderWatchDistribution(distribution, totalViewers) {
  const labels = Object.keys(distribution);
  const values = Object.values(distribution);

  return labels.map((label, i) => {
    const count = values[i];
    const percent = totalViewers > 0 ? Math.round((count / totalViewers) * 100) : 0;
    const barWidth = percent;

    return `
      <div class="watch-dist-row">
        <div class="watch-dist-label">${label}</div>
        <div class="watch-dist-bar">
          <div class="watch-dist-fill" style="width: ${barWidth}%"></div>
        </div>
        <div class="watch-dist-value">${count} (${percent}%)</div>
      </div>
    `;
  }).join('');
}

/**
 * Helper: Get completion rate color class
 */
function getCompletionRateClass(rate) {
  if (rate < 40) return 'rate-low';
  if (rate < 70) return 'rate-medium';
  return 'rate-high';
}

/**
 * Helper: Get status badge class
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'active': return 'badge-success';
    case 'at_risk': return 'badge-warning';
    case 'new': return 'badge-info';
    case 'dormant': return 'badge-danger';
    default: return '';
  }
}

/**
 * Helper: Get activity icon
 */
function getActivityIcon(type) {
  switch (type) {
    case 'watch': return '▶️';
    case 'completion': return '✅';
    case 'note': return '📝';
    default: return '•';
  }
}

/**
 * Helper: Get activity text
 */
function getActivityText(activity) {
  switch (activity.type) {
    case 'watch':
      return activity.details.completed
        ? 'completed the tutorial'
        : `watched for ${formatDuration(activity.details.watchSeconds)}`;
    case 'completion':
      return 'completed the tutorial';
    case 'note':
      return `added a note: "${activity.details.content}"`;
    default:
      return 'had activity';
  }
}

/**
 * Helper: Format date
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  return date.toLocaleDateString();
}

/**
 * Helper: Format duration (seconds to MM:SS)
 */
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
