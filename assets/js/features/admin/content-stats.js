/**
 * @fileoverview Admin Dashboard - Content Stats Section
 * Phase 7: Enhanced with song-level stats, problem alerts, and detailed tutorial metrics
 */

import { debug } from '../../config.js';
import { exportToCSV } from './export.js';

let tutorialsData = [];
let songStatsData = [];
let problemAlertsData = {};
let sortColumn = 'completionRate';
let sortDirection = 'asc';

/**
 * Initialize content stats section
 */
export function initContentStats() {
  // Setup song filter
  const songFilter = document.getElementById('content-filter-song');
  if (songFilter) {
    songFilter.addEventListener('change', () => {
      filterAndRenderTutorials();
    });
  }

  // Setup export button
  const exportBtn = document.getElementById('export-content-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportContentCSV();
    });
  }

  // Setup table sorting
  const tableHeaders = document.querySelectorAll('#content-table th[data-sort]');
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = column === 'completionRate' ? 'asc' : 'desc';
      }
      filterAndRenderTutorials();
      updateSortIndicators();
    });
  });
}

/**
 * Load content stats data from API
 */
export async function loadContentStatsData(getAdminApiUrl, getAuthHeaders) {
  const tbody = document.getElementById('content-table-body');
  const songStatsEl = document.getElementById('content-song-stats');

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8" class="admin-loading">Loading...</td></tr>';
  }
  if (songStatsEl) {
    songStatsEl.innerHTML = '<div class="admin-loading">Loading...</div>';
  }

  try {
    const response = await fetch(getAdminApiUrl('tutorials'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    tutorialsData = data.tutorials || [];
    songStatsData = data.songStats || [];
    // Alerts are nested under data.alerts
    const alerts = data.alerts || {};
    problemAlertsData = {
      problemTutorials: alerts.problemTutorials || [],
      highRewatchTutorials: alerts.highRewatchTutorials || [],
      slowSongs: alerts.slowSongs || [],
    };

    debug.log('📊 Content data received:', {
      tutorials: tutorialsData.length,
      songs: songStatsData.length,
      problemAlerts: problemAlertsData
    });

    // Populate song filter
    populateSongFilter();

    // Render problem alerts
    renderProblemAlerts();

    // Render song stats
    renderSongStats();

    // Render tutorials table
    filterAndRenderTutorials();

  } catch (err) {
    debug.error('❌ Failed to load content stats:', err);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-error">Failed to load tutorials</td></tr>';
    }
    if (songStatsEl) {
      songStatsEl.innerHTML = '<div class="admin-error">Failed to load song stats</div>';
    }
  }
}

/**
 * Populate song filter dropdown
 */
function populateSongFilter() {
  const filter = document.getElementById('content-filter-song');
  if (!filter) return;

  const songs = [...new Set(tutorialsData.map(t => t.songTitle).filter(Boolean))];
  songs.sort();

  filter.innerHTML = '<option value="">All Songs</option>' +
    songs.map(song => `<option value="${song}">${song}</option>`).join('');
}

/**
 * Render problem content alerts
 */
function renderProblemAlerts() {
  const container = document.getElementById('problem-content-alerts');
  if (!container) return;

  const { problemTutorials, highRewatchTutorials, slowSongs } = problemAlertsData;

  let hasAlerts = false;

  // Low completion tutorials
  const problemEl = document.getElementById('problem-tutorials-alert');
  const problemCount = document.getElementById('problem-tutorials-count');
  if (problemEl && problemCount) {
    if (problemTutorials.length > 0) {
      problemCount.textContent = problemTutorials.length;
      problemEl.style.display = 'block';
      problemEl.title = problemTutorials.map(t => `${t.title} (${t.completionRate}%)`).join('\n');
      hasAlerts = true;
    } else {
      problemEl.style.display = 'none';
    }
  }

  // High rewatch tutorials
  const rewatchEl = document.getElementById('high-rewatch-alert');
  const rewatchCount = document.getElementById('high-rewatch-count');
  if (rewatchEl && rewatchCount) {
    if (highRewatchTutorials.length > 0) {
      rewatchCount.textContent = highRewatchTutorials.length;
      rewatchEl.style.display = 'block';
      rewatchEl.title = highRewatchTutorials.map(t => `${t.title} (${t.rewatchRate}% rewatch)`).join('\n');
      hasAlerts = true;
    } else {
      rewatchEl.style.display = 'none';
    }
  }

  // Slow songs
  const slowEl = document.getElementById('slow-songs-alert');
  const slowCount = document.getElementById('slow-songs-count');
  if (slowEl && slowCount) {
    if (slowSongs.length > 0) {
      slowCount.textContent = slowSongs.length;
      slowEl.style.display = 'block';
      slowEl.title = slowSongs.map(s => `${s.songTitle} (${s.avgDaysToComplete} days avg)`).join('\n');
      hasAlerts = true;
    } else {
      slowEl.style.display = 'none';
    }
  }

  container.style.display = hasAlerts ? 'block' : 'none';
}

/**
 * Render song-level stats
 */
function renderSongStats() {
  const container = document.getElementById('content-song-stats');
  if (!container) return;

  if (!songStatsData || songStatsData.length === 0) {
    container.innerHTML = '<div class="admin-empty">No song data available</div>';
    return;
  }

  container.innerHTML = `
    <div class="song-stats-grid">
      ${songStatsData.map(song => {
        const completionClass = song.completionRate >= 70 ? 'rate-high' :
          song.completionRate >= 40 ? 'rate-medium' : 'rate-low';

        return `
          <div class="song-stat-card">
            <div class="song-stat-header">
              <span class="song-stat-title">${song.songTitle}</span>
            </div>
            <div class="song-stat-metrics">
              <div class="song-stat-metric">
                <span class="song-stat-value">${song.usersStarted}</span>
                <span class="song-stat-label">Started</span>
              </div>
              <div class="song-stat-metric">
                <span class="song-stat-value">${song.usersCompleted}</span>
                <span class="song-stat-label">Completed</span>
              </div>
              <div class="song-stat-metric ${completionClass}">
                <span class="song-stat-value">${song.completionRate}%</span>
                <span class="song-stat-label">Rate</span>
              </div>
              <div class="song-stat-metric">
                <span class="song-stat-value">${song.avgDaysToComplete}</span>
                <span class="song-stat-label">Avg Days</span>
              </div>
            </div>
            ${song.dropOffTutorial ? `
              <div class="song-stat-dropoff">
                <span class="dropoff-label">Drop-off point:</span>
                <span class="dropoff-value">${song.dropOffTutorial}</span>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Filter and render tutorials based on filters/sort
 */
function filterAndRenderTutorials() {
  const songFilter = document.getElementById('content-filter-song')?.value || '';

  let filtered = tutorialsData.filter(tutorial => {
    return !songFilter || tutorial.songTitle === songFilter;
  });

  // Sort
  filtered.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle strings
    aVal = String(aVal || '');
    bVal = String(bVal || '');
    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  renderTutorials(filtered);
}

/**
 * Render tutorials table with enhanced columns
 */
function renderTutorials(tutorials) {
  const tbody = document.getElementById('content-table-body');
  if (!tbody) return;

  if (tutorials.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No tutorials found</td></tr>';
    return;
  }

  tbody.innerHTML = tutorials.map(tutorial => {
    const rateClass = getRateClass(tutorial.completionRate, tutorial.uniqueViewers);
    const manualClass = getManualClass(tutorial.manualPercent);
    const rewatchClass = getRewatchClass(tutorial.rewatchRate);
    const exitClass = getExitClass(tutorial.medianExitPercent);

    return `
      <tr class="admin-table-row clickable" data-tutorial-id="${tutorial.id}" title="Click for detailed analytics">
        <td class="admin-cell-title">${tutorial.title}</td>
        <td class="admin-cell-song">${tutorial.songTitle || ''}</td>
        <td class="admin-cell-number">${tutorial.uniqueViewers}</td>
        <td class="admin-cell-number">${tutorial.completions}</td>
        <td class="admin-cell-rate ${rateClass}">${tutorial.completionRate}%</td>
        <td class="admin-cell-rate ${manualClass}">${tutorial.manualPercent || 0}%</td>
        <td class="admin-cell-rate ${rewatchClass}">${tutorial.rewatchRate || 0}%</td>
        <td class="admin-cell-rate ${exitClass}">${tutorial.medianExitPercent || '—'}%</td>
      </tr>
    `;
  }).join('');

  // Add click handlers to tutorial rows
  tbody.querySelectorAll('[data-tutorial-id]').forEach(row => {
    row.addEventListener('click', () => {
      const tutorialId = row.dataset.tutorialId;
      // Navigate to tutorial detail view
      // This will be called from the parent module
      window.HOTLINE?.admin?.navigateToView?.('tutorial-detail', { tutorialId });
    });
  });
}

/**
 * Get CSS class for completion rate
 */
function getRateClass(rate, viewers) {
  if (viewers < 5) return '';
  if (rate < 40) return 'rate-low';
  if (rate < 70) return 'rate-medium';
  return 'rate-high';
}

/**
 * Get CSS class for manual completion percentage
 */
function getManualClass(percent) {
  if (percent === undefined || percent === null) return '';
  // Higher manual % might indicate users skipping - worth watching
  if (percent > 50) return 'rate-low';
  if (percent > 30) return 'rate-medium';
  return '';
}

/**
 * Get CSS class for rewatch rate
 */
function getRewatchClass(rate) {
  if (rate === undefined || rate === null) return '';
  // High rewatch could indicate confusing content
  if (rate > 30) return 'rate-low';
  if (rate > 15) return 'rate-medium';
  return '';
}

/**
 * Get CSS class for median exit point
 */
function getExitClass(percent) {
  if (percent === undefined || percent === null || percent === '—') return '';
  const p = parseFloat(percent);
  // Low exit point = users dropping off early
  if (p < 50) return 'rate-low';
  if (p < 75) return 'rate-medium';
  return 'rate-high';
}

/**
 * Update sort indicators on table headers
 */
function updateSortIndicators() {
  document.querySelectorAll('#content-table th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortColumn) {
      th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

/**
 * Export content stats to CSV
 */
function exportContentCSV() {
  const headers = [
    'Tutorial', 'Song', 'Viewers', 'Completions', 'Completion Rate %',
    'Manual %', 'Auto %', 'Rewatch Rate %', 'Median Exit %', 'Notes Count', 'Notes Density'
  ];
  const rows = tutorialsData.map(t => [
    t.title,
    t.songTitle || '',
    t.uniqueViewers,
    t.completions,
    t.completionRate,
    t.manualPercent || 0,
    t.autoPercent || 0,
    t.rewatchRate || 0,
    t.medianExitPercent || '',
    t.notesCount || 0,
    t.notesDensity || 0,
  ]);

  exportToCSV('content-performance', headers, rows);
}
