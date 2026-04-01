/**
 * @fileoverview Admin Dashboard - Content Stats (Tabler)
 *
 * Tutorials grouped by song in collapsible accordion cards with thumbnails.
 */

import { debug } from '../../config.js';


let tutorialsData = [];
let totalWatchSecondsData = 0;
let totalCompletionsData = 0;
let totalMembersData = 0;
export function initContentStats() {
  // No-op — accordion event listeners are set up in renderAccordion
}

export async function loadContentStatsData(getAdminApiUrl, getAuthHeaders, forceRefresh = false) {
  if (tutorialsData.length > 0 && !forceRefresh) {
    renderContentPage();
    return;
  }

  const accordion = document.getElementById('content-accordion');
  if (accordion) accordion.innerHTML = '<div class="text-secondary p-3">Loading...</div>';

  try {
    const response = await fetch(getAdminApiUrl('tutorials'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    tutorialsData = data.tutorials || [];
    totalWatchSecondsData = data.totalWatchSeconds || 0;
    totalCompletionsData = data.totalCompletions || 0;
    totalMembersData = data.totalMembers || 0;

    tutorialsData.forEach(t => { if (t.thumbnailUrl) new Image().src = t.thumbnailUrl; });

    renderContentPage();
  } catch (err) {
    debug.error('Failed to load tutorials:', err);
    const accordion = document.getElementById('content-accordion');
    if (accordion) accordion.innerHTML = '<div class="text-danger p-3">Failed to load</div>';
  }
}

function renderContentPage() {
  renderKPIRow();
  const accordion = document.getElementById('content-accordion');
  if (!accordion || accordion.querySelector('.card')) return; // already rendered
  renderAccordion();
}

function renderKPIRow() {
  const el = (id) => document.getElementById(id);
  const now = new Date();
  const released = tutorialsData.filter(t => t.releaseDate && new Date(t.releaseDate) <= now);
  const unreleased = tutorialsData.filter(t => !t.releaseDate || new Date(t.releaseDate) > now);

  const releasedDuration = released.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);

  const totalDuration    = tutorialsData.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
  const unreleasedDuration = unreleased.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);

  // Weeks left until final release batch
  let weeksLeft = '—';
  let finalRelease = '—';
  const byDate = new Map();
  for (const t of unreleased) {
    if (!t.releaseDate) continue;
    const d = t.releaseDate.slice(0, 10);
    byDate.set(d, (byDate.get(d) || 0) + 1);
  }
  const batchDates = [...byDate.entries()].filter(([, c]) => c >= 3).map(([d]) => d).sort();
  const finalDateStr = batchDates.length > 0 ? batchDates[batchDates.length - 1] : null;
  if (finalDateStr) {
    finalRelease = formatDate(finalDateStr);
    const daysLeft = Math.ceil((new Date(finalDateStr) - now) / (1000 * 60 * 60 * 24));
    weeksLeft = daysLeft > 0 ? Math.floor(daysLeft / 7) : 0;
  }

  // Avg completion rate across released tutorials that have viewers
  const withViewers = released.filter(t => t.uniqueViewers > 0);
  const avgRate = withViewers.length > 0
    ? Math.round(withViewers.reduce((sum, t) => sum + (t.completionRate || 0), 0) / withViewers.length)
    : 0;

  const totalViews = tutorialsData.reduce((sum, t) => sum + (t.uniqueViewers || 0), 0);

  if (el('stat-total-tutorials'))      el('stat-total-tutorials').textContent      = tutorialsData.length;
  if (el('stat-total-duration'))       el('stat-total-duration').textContent       = formatDurationLong(totalDuration);
  if (el('stat-released-tutorials'))   el('stat-released-tutorials').textContent   = released.length;
  if (el('stat-released-duration'))    el('stat-released-duration').textContent    = formatDurationLong(releasedDuration);
  if (el('stat-unreleased-tutorials')) el('stat-unreleased-tutorials').textContent = unreleased.length;
  if (el('stat-unreleased-duration'))  el('stat-unreleased-duration').textContent  = formatDurationLong(unreleasedDuration);
  if (el('stat-weeks-left'))           el('stat-weeks-left').textContent           = weeksLeft;
  if (el('stat-final-release'))        el('stat-final-release').textContent        = finalRelease;
  if (el('stat-total-views'))          el('stat-total-views').textContent          = totalViews;
  if (el('stat-completed-tutorials'))  el('stat-completed-tutorials').textContent  = totalCompletionsData;
  if (el('stat-total-watch-time'))     el('stat-total-watch-time').textContent     = formatDurationLong(totalWatchSecondsData);
  if (el('stat-avg-completion-rate'))  el('stat-avg-completion-rate').textContent  = `${avgRate}%`;
}

function renderAccordion() {
  const container = document.getElementById('content-accordion');
  if (!container) return;

  // Group tutorials by song, ordered by songNumber
  const songGroups = new Map();
  for (const t of tutorialsData) {
    const song = t.songTitle || 'Unknown';
    if (!songGroups.has(song)) {
      songGroups.set(song, { songNumber: t.songNumber || 0, tutorials: [] });
    }
    songGroups.get(song).tutorials.push(t);
  }

  const sorted = [...songGroups.entries()].sort((a, b) => a[1].songNumber - b[1].songNumber);

  if (sorted.length === 0) {
    container.innerHTML = '<div class="text-secondary p-3">No tutorials found</div>';
    return;
  }

  container.innerHTML = sorted.map(([songTitle, group], i) => {
    const songCollapseId = `song-collapse-${i}`;

    const tutorials = group.tutorials.sort((a, b) => {
      const lessonDiff = (a.lessonNumber || 0) - (b.lessonNumber || 0);
      return lessonDiff !== 0 ? lessonDiff : getPartNumber(a.title) - getPartNumber(b.title);
    });

    const lessonGroups = new Map();
    for (const t of tutorials) {
      const lesson = t.lessonNumber || 0;
      if (!lessonGroups.has(lesson)) lessonGroups.set(lesson, []);
      lessonGroups.get(lesson).push(t);
    }

    const lessonCount = lessonGroups.size;
    const lessonLabel = lessonCount === 1 ? '1 Lesson' : `${lessonCount} Lessons`;
    const tutLabel = tutorials.length === 1 ? '1 Tutorial' : `${tutorials.length} Tutorials`;
    const totalSongSecs = tutorials.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);

    let songNum = 0;
    let tbodyRows = '';
    for (const [lessonNum, lessonTutorials] of lessonGroups) {
      const lessonTitle = lessonTutorials[0]?.lessonTitle || '';
      const lessonDividerLabel = lessonTitle ? `LESSON ${lessonNum} \u2014 ${escapeHtml(lessonTitle.toUpperCase())}` : `LESSON ${lessonNum}`;
      tbodyRows += `
        <tr style="pointer-events:none">
          <td colspan="9" style="padding-top:0.75rem;padding-bottom:0.75rem;padding-right:0.75rem;background:rgba(255,255,255,0.04);border-top:none;border-bottom:none">
            <span class="fw-bold" style="font-size:0.78rem;letter-spacing:0.06em">${lessonDividerLabel}</span>
          </td>
        </tr>
        <tr style="pointer-events:none;border-top:none">
          <th class="text-center" style="width:50px">#</th>
          <th>Tutorial</th>
          <th class="text-center" style="width:110px">Status</th>
          <th class="text-center" style="width:110px;white-space:nowrap">Release Date</th>
          <th class="text-center" style="width:100px">Duration</th>
          <th class="text-center" style="width:80px">Views</th>
          <th class="text-center" style="width:120px">Completions</th>
          <th class="text-center" style="width:150px;white-space:nowrap">Rate</th>
          <th class="text-center" style="width:150px;white-space:nowrap">Coverage</th>
        </tr>
      `;
      for (const t of lessonTutorials) {
        songNum++;
        tbodyRows += renderTutorialRow(t, songNum);
      }
    }

    return `
      <div class="card mb-3">
        <div class="card-header cursor-pointer" data-bs-toggle="collapse" data-bs-target="#${songCollapseId}" aria-expanded="true" style="display:flex;align-items:center;gap:1rem">
          <h3 class="card-title mb-0" style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(songTitle)}</h3>
          <span style="white-space:nowrap;font-size:0.875rem;font-weight:700;color:#fff">${lessonLabel}<span style="margin:0 0.5rem;opacity:0.4">•</span>${tutLabel}<span style="margin:0 0.5rem;opacity:0.4">•</span>${formatDurationLong(totalSongSecs)}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon content-chevron" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.3s ease;transform:rotate(0deg);flex-shrink:0"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6"/></svg>
        </div>
        <div id="${songCollapseId}" class="collapse show">
          <div class="table-responsive">
            <table class="table table-vcenter card-table mb-0">
              <tbody>${tbodyRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Suppress transition on initial render
  container.querySelectorAll('.collapse.show').forEach(collapseEl => {
    collapseEl.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => { collapseEl.style.transition = ''; }));
  });

  // Animate chevrons
  container.querySelectorAll('.collapse').forEach(collapseEl => {
    collapseEl.addEventListener('show.bs.collapse', () => {
      const trigger = container.querySelector(`[data-bs-target="#${collapseEl.id}"]`);
      trigger?.querySelector('.content-chevron')?.style.setProperty('transform', 'rotate(0deg)');
    });
    collapseEl.addEventListener('hide.bs.collapse', () => {
      const trigger = container.querySelector(`[data-bs-target="#${collapseEl.id}"]`);
      trigger?.querySelector('.content-chevron')?.style.setProperty('transform', 'rotate(-90deg)');
    });
  });
}

function renderTutorialRow(t, songNum) {
  const now = new Date();
  const isReleased = t.releaseDate && new Date(t.releaseDate) <= now;
  const memberPct = totalMembersData > 0 ? Math.min(100, (t.completions / totalMembersData) * 100) : 0;
  const memberPctRounded = Math.round(memberPct);

  const thumbContent = t.thumbnailUrl
    ? `<img src="${t.thumbnailUrl}" alt="" style="width:130px;aspect-ratio:16/9;object-fit:cover;border-radius:8px">`
    : `<div style="width:130px;aspect-ratio:16/9;background:#272727;border-radius:8px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:1rem">\u25B6</div>`;

  const statusBadge = isReleased
    ? '<span class="badge bg-success-lt">Released</span>'
    : '<span class="badge bg-orange-lt">Unreleased</span>';
  const releaseDateCell = t.releaseDate
    ? `<span class="text-secondary">${formatDate(t.releaseDate)}</span>`
    : '<span class="text-secondary">—</span>';

  return `
    <tr>
      <td class="text-center text-secondary">${songNum}</td>
      <td style="padding-top:0.75rem;padding-bottom:0.75rem">
        <div class="d-flex align-items-center gap-3">
          ${thumbContent}
          <span>${escapeHtml(t.title)}</span>
        </div>
      </td>
      <td class="text-center" style="white-space:nowrap">${statusBadge}</td>
      <td class="text-center text-secondary" style="white-space:nowrap">${releaseDateCell}</td>
      <td class="text-center text-secondary">${formatExactDuration(t.durationSeconds)}</td>
      <td class="text-center text-secondary">${t.uniqueViewers || '—'}</td>
      <td class="text-center text-secondary">${t.completions || '—'}</td>
      <td style="padding-left:1rem;padding-right:1rem">
        ${(() => { const r = t.uniqueViewers > 0 ? Math.round((t.completions / t.uniqueViewers) * 100) : 0; return `
        <div class="d-flex align-items-center gap-2">
          <div class="progress progress-sm flex-grow-1" style="height:6px">
            <div class="progress-bar bg-primary" style="width:${r}%"></div>
          </div>
          <span class="text-secondary" style="font-size:0.75rem;width:2.5rem;text-align:right">${r}%</span>
        </div>`; })()}
      </td>
      <td style="padding-left:1rem;padding-right:1rem">
        <div class="d-flex align-items-center gap-2">
          <div class="progress progress-sm flex-grow-1" style="height:6px">
            <div class="progress-bar bg-primary" style="width:${memberPct}%"></div>
          </div>
          <span class="text-secondary" style="font-size:0.75rem;width:2.5rem;text-align:right">${memberPctRounded}%</span>
        </div>
      </td>
    </tr>
  `;
}

function getPartNumber(title) {
  const match = title?.match(/^Part\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}


/** Exact duration like 4:54 or 1:02:30 */
function formatExactDuration(seconds) {
  if (!seconds) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Long duration like "2 hr 39 min" for KPIs and lesson totals */
function formatDurationLong(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(' ') || '0m';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

