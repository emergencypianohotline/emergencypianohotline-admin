/**
 * @fileoverview Admin Dashboard - Platform Analytics Section (v2, Tabler)
 *
 * Engagement KPIs, engagement distribution bars, completion funnel
 * with dropoff indicators, cohort retention table, device/country/browser
 * breakdowns, and completion matrix — all rendered as native HTML (no chart library).
 *
 * API endpoints used: analytics, sessions, matrix.
 */

import { debug } from '../../config.js';
import { renderChart, destroyChart } from './charts.js';

let analyticsCache = null;
let sessionsCache  = null;
let matrixCache    = null;
let matrixSort     = { col: 'completion', dir: 'desc' };
let _funnelSongIndex = 0;

// ─── Public API ────────────────────────────────────────────

export function initAnalytics() {
  const refreshBtn = document.querySelector('[data-refresh="analytics"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (window._analyticsApiUrl && window._analyticsAuthHeaders) {
        loadAnalyticsData(window._analyticsApiUrl, window._analyticsAuthHeaders, true);
      }
    });
  }
}

export async function loadAnalyticsData(getAdminApiUrl, getAuthHeaders, forceRefresh = false) {
  window._analyticsApiUrl      = getAdminApiUrl;
  window._analyticsAuthHeaders = getAuthHeaders;

  if (analyticsCache && !forceRefresh) {
    debug.log('Analytics: using cached data');
    renderAll(analyticsCache, sessionsCache, matrixCache);
    return;
  }

  setLoadingState();

  try {
    const [analyticsResp, sessionsResp, matrixResp] = await Promise.all([
      fetch(getAdminApiUrl('analytics'), { method: 'GET', headers: getAuthHeaders() }),
      fetch(getAdminApiUrl('sessions'),  { method: 'GET', headers: getAuthHeaders() }).catch(() => null),
      fetch(getAdminApiUrl('matrix'),    { method: 'GET', headers: getAuthHeaders() }).catch(() => null),
    ]);

    if (!analyticsResp.ok) throw new Error(`HTTP ${analyticsResp.status}`);

    analyticsCache = await analyticsResp.json();
    debug.log('Analytics data:', analyticsCache);

    if (sessionsResp?.ok) {
      sessionsCache = await sessionsResp.json();
      debug.log('Sessions data:', sessionsCache);
    }

    if (matrixResp?.ok) {
      matrixCache = await matrixResp.json();
      debug.log('Matrix data:', matrixCache);
    }

    renderAll(analyticsCache, sessionsCache, matrixCache);

  } catch (err) {
    debug.error('Failed to load analytics:', err);
    setErrorState();
  }
}

// ─── Loading / Error ───────────────────────────────────────

function setLoadingState() {
  [
    'analytics-kpi-dau', 'analytics-kpi-wau', 'analytics-kpi-mau',
    'analytics-kpi-stickiness', 'analytics-kpi-returning',
    'analytics-kpi-session-duration', 'analytics-kpi-avg-watch',
    'analytics-kpi-avg-completions',
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '…';
  });

  [
    'analytics-trend', 'analytics-distribution', 'analytics-growth', 'analytics-funnel',
    'analytics-device', 'analytics-geo-countries', 'analytics-browsers', 'analytics-geo-cities',
    'analytics-matrix',
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="text-secondary p-3">Loading...</div>';
  });
}

function setErrorState() {
  const el = document.getElementById('analytics-kpi-dau');
  if (el) el.textContent = 'Error';
}

// ─── Dispatcher ────────────────────────────────────────────

function renderAll(analyticsData, sessionsData, matrixData) {
  renderKPIs(analyticsData?.engagement, sessionsData);
  renderEngagementTrend(analyticsData?.watchTrend);
  renderDistribution(analyticsData?.distribution);
  renderGrowth(analyticsData?.growth);
  renderFunnel(analyticsData?.funnel);
  renderMemberMap(sessionsData?.geographicalStatsCurrent?.topCities, sessionsData?.geographicalStatsCurrent?.topCountries, sessionsData?.geographicalStatsCurrent?.memberDots);
  renderDeviceDistribution(sessionsData);
  renderCountriesList(sessionsData?.geographicalStats?.topCountries);
  renderBrowsersList(sessionsData?.topBrowsers);
  renderCitiesList(sessionsData?.geographicalStats?.topCities);
  renderMatrix(matrixData);
  renderActivityHeatmap(analyticsData?.activityHeatmap);
  initPeriodPills(sessionsData);
}

function initPeriodPills(sessionsData) {
  document.querySelectorAll('.analytics-period-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const panel = pill.dataset.panel;
      const period = pill.dataset.period;

      // Update pill active states for this panel
      document.querySelectorAll(`.analytics-period-pill[data-panel="${panel}"]`).forEach(p => {
        p.classList.toggle('active', p.dataset.period === period);
      });

      // Re-render the relevant panel
      if (panel === 'analytics-device') {
        const data = period === '30d'
          ? { deviceDistribution: sessionsData?.deviceDistribution, deviceCounts: sessionsData?.deviceCounts }
          : { deviceDistribution: sessionsData?.deviceDistributionAllTime, deviceCounts: sessionsData?.deviceCountsAllTime };
        renderDeviceDistribution(data);
      } else if (panel === 'analytics-browsers') {
        renderBrowsersList(period === '30d' ? sessionsData?.topBrowsers : sessionsData?.topBrowsersAllTime);
      } else if (panel === 'analytics-geo-countries') {
        renderCountriesList(period === '30d' ? sessionsData?.geographicalStats30d?.topCountries : sessionsData?.geographicalStats?.topCountries);
      } else if (panel === 'analytics-geo-cities') {
        renderCitiesList(period === '30d' ? sessionsData?.geographicalStats30d?.topCities : sessionsData?.geographicalStats?.topCities);
      } else if (panel === 'analytics-map') {
        const geoData   = period === 'current' ? sessionsData?.geographicalStatsCurrent : sessionsData?.geographicalStats;
        renderMemberMap(geoData?.topCities, geoData?.topCountries, geoData?.memberDots);
      }
    });
  });
}

// ─── KPI Cards ─────────────────────────────────────────────

function renderKPIs(engagement, sessions) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '-';
  };
  if (engagement) {
    set('analytics-kpi-dau',             engagement.dau);
    set('analytics-kpi-wau',             engagement.wau);
    set('analytics-kpi-mau',             engagement.mau);
    set('analytics-kpi-stickiness',      engagement.stickiness !== undefined ? `${engagement.stickiness}%` : '-');
    set('analytics-kpi-returning',       engagement.returningUsersRate !== undefined ? `${engagement.returningUsersRate}%` : '-');
    set('analytics-kpi-avg-watch',       engagement.avgWatchTimePerActiveUser);
    set('analytics-kpi-avg-completions', engagement.avgCompletionsPerActiveUser);
  }
  set('analytics-kpi-session-duration', sessions?.avgSessionDurationFormatted ?? '-');
}

// ─── Weekly Watch Time Trend ─────────────────────────────────

let _watchTrend = null;
let _watchPeriod = '30d';

function renderEngagementTrend(watchTrend) {
  _watchTrend = watchTrend;
  _drawWatchTrend();
}

function _drawWatchTrend() {
  const el = document.getElementById('analytics-trend');
  const pillsEl = document.getElementById('analytics-trend-pills');
  if (!el || !_watchTrend) return;

  const pillStyle = 'border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem;white-space:nowrap';
  if (pillsEl) {
    pillsEl.innerHTML = [['30d','30 Days'],['12m','12 Months'],['allTime','All Time']].map(([k, l]) =>
      `<button class="btn btn-sm btn-outline-secondary watch-pill${_watchPeriod === k ? ' active' : ''}" data-p="${k}" style="${pillStyle}">${l}</button>`
    ).join('');
    pillsEl.querySelectorAll('.watch-pill').forEach(b => b.addEventListener('click', () => { _watchPeriod = b.dataset.p; _drawWatchTrend(); }));
  }

  const data = _watchTrend[_watchPeriod === '30d' ? 'd30' : _watchPeriod === '12m' ? 'm12' : 'allTime'] || [];
  if (!data.length) { el.innerHTML = '<div class="text-secondary p-3">No data available</div>'; return; }

  const hoursData = data.map(w => Math.round(w.minutes / 60 * 10) / 10);
  // Y-axis: pick a step size (1,2,5,10...) so ticks are whole hours and evenly spaced
  const maxHours = Math.max(...hoursData, 0.1);
  const steps = [1, 2, 5, 10, 20, 50];
  const step = steps.find(s => Math.ceil(maxHours / s) <= 6) || 50;
  const yTickAmount = Math.ceil(maxHours / step);
  const yMax = yTickAmount * step;

  renderChart('analytics-trend', {
    chart: { type: 'area', height: 312 },
    series: [{ name: 'Watch hours', data: hoursData }],
    xaxis: { categories: data.map(w => w.label), tickAmount: 6, labels: { offsetY: _watchPeriod === '30d' ? 4 : 8 } },
    yaxis: { tickAmount: yTickAmount, min: 0, max: yMax, labels: { formatter: v => `${Math.round(v)}h`, offsetX: -10 } },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#4299e1'],
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: v => { const h = Math.floor(v); const m = Math.round((v - h) * 60); return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`; } } },
  });
}

// ─── Growth & Churn ─────────────────────────────────────────

let _growthData = null;
let _growthPeriod = '30d';

function renderGrowth(growth) {
  _growthData = growth;
  _renderGrowthPanel();
}

function _renderGrowthPanel() {
  const container = document.getElementById('analytics-growth');
  const pillsContainer = document.getElementById('analytics-growth-pills');
  if (!container) return;
  const growth = _growthData;

  if (!growth) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  const pillStyle = 'border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem;white-space:nowrap';
  if (pillsContainer) {
    pillsContainer.innerHTML = `
      <button class="btn btn-sm btn-outline-secondary growth-period-pill${_growthPeriod === '30d' ? ' active' : ''}" data-period="30d" style="${pillStyle}">Last 30 Days</button>
      <button class="btn btn-sm btn-outline-secondary growth-period-pill${_growthPeriod === 'all' ? ' active' : ''}" data-period="all" style="${pillStyle}">All Time</button>
    `;
    pillsContainer.querySelectorAll('.growth-period-pill').forEach(btn => {
      btn.addEventListener('click', () => { _growthPeriod = btn.dataset.period; _renderGrowthPanel(); });
    });
  }

  const lbl = 'font-size:0.7rem;text-transform:uppercase;letter-spacing:0.07em;color:rgba(255,255,255,0.4);margin-bottom:0.3rem';
  const bdr = 'border-right:1px solid rgba(255,255,255,0.06)';
  const cell = (last) => `flex:1;text-align:center;display:flex;flex-direction:column;justify-content:center;padding:0.75rem 1.25rem${last ? '' : `;${bdr}`}`;

  const signedVal = (n) => {
    const color = n > 0 ? 'var(--tblr-success)' : n < 0 ? 'var(--tblr-danger)' : 'inherit';
    return { val: `${n > 0 ? '+' : ''}${n}`, color };
  };

  let cols;
  if (_growthPeriod === '30d') {
    const { activeSubscribers, newLast30, churnedLast30, netLast30, newPrev30, monthlyChurnRate, allTimeRetentionRate, growthRateLast30 } = growth;
    const retColor = allTimeRetentionRate >= 60 ? 'var(--tblr-success)' : allTimeRetentionRate >= 40 ? 'var(--tblr-warning)' : 'var(--tblr-danger)';
    const p30 = signedVal(newPrev30);
    const growthRateVal = growthRateLast30 !== null && growthRateLast30 !== undefined ? `${growthRateLast30 >= 0 ? '+' : ''}${growthRateLast30}%` : '-';
    const growthRateColor = growthRateLast30 > 0 ? 'var(--tblr-success)' : growthRateLast30 < 0 ? 'var(--tblr-danger)' : 'inherit';
    cols = [
      { topLbl: 'Active Members', topVal: activeSubscribers,         topColor: 'inherit',
        botLbl: 'Retention Rate', botVal: `${allTimeRetentionRate}%`, botColor: retColor },
      { topLbl: 'New',   topVal: `+${newLast30}`, topColor: 'var(--tblr-success)',
        botLbl: 'Prev New', botVal: p30.val,    botColor: p30.color },
      { topLbl: 'Churned', topVal: churnedLast30 > 0 ? `-${churnedLast30}` : '0', topColor: churnedLast30 > 0 ? 'var(--tblr-danger)' : 'inherit',
        botLbl: 'Churn Rate', botVal: `${monthlyChurnRate}%`, botColor: churnedLast30 > 0 ? 'var(--tblr-danger)' : 'inherit' },
      { topLbl: 'Net Growth', topVal: `${netLast30 >= 0 ? '+' : ''}${netLast30}`, topColor: netLast30 > 0 ? 'var(--tblr-success)' : netLast30 < 0 ? 'var(--tblr-danger)' : 'inherit',
        botLbl: 'Growth Rate', botVal: growthRateVal, botColor: growthRateColor },
    ];
  } else {
    const { activeSubscribers, totalEverSubscribed, totalChurnedAllTime, allTimeRetentionRate, allTimeChurnRate, avgNewPerMonth } = growth;
    const retColor = allTimeRetentionRate >= 60 ? 'var(--tblr-success)' : allTimeRetentionRate >= 40 ? 'var(--tblr-warning)' : 'var(--tblr-danger)';
    cols = [
      { topLbl: 'Active Members',  topVal: activeSubscribers,   topColor: 'inherit',
        botLbl: 'Retention Rate',  botVal: `${allTimeRetentionRate}%`, botColor: retColor },
      { topLbl: 'Total Signups',   topVal: totalEverSubscribed, topColor: 'inherit',
        botLbl: 'Avg Tenure',      botVal: `${growth.avgTenureDays}d`, botColor: 'inherit' },
      { topLbl: 'Total Churned',   topVal: totalChurnedAllTime, topColor: totalChurnedAllTime > 0 ? 'var(--tblr-danger)' : 'inherit',
        botLbl: 'Churn Rate',      botVal: `${allTimeChurnRate}%`, botColor: totalChurnedAllTime > 0 ? 'var(--tblr-danger)' : 'inherit' },
      { topLbl: 'Avg / Month',     topVal: `~${avgNewPerMonth}`, topColor: 'inherit',
        botLbl: 'Churn:Growth',    botVal: totalChurnedAllTime > 0 ? `1:${Math.round(totalEverSubscribed / totalChurnedAllTime)}` : '1:∞', botColor: 'inherit' },
    ];
  }

  const makeRow = (key, border) => cols.map((c, i) => `
    <div style="${cell(i === cols.length - 1)}${border ? `;border-bottom:1px solid rgba(255,255,255,0.06)` : ''}">
      <div style="${lbl}">${c[`${key}Lbl`]}</div>
      <div style="font-size:1.75rem;font-weight:600;line-height:1;color:${c[`${key}Color`]}">${c[`${key}Val`]}</div>
    </div>`).join('');

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%">
      <div style="display:flex;flex:1;border-bottom:1px solid rgba(255,255,255,0.06)">${makeRow('top', false)}</div>
      <div style="display:flex;flex:1">${makeRow('bot', false)}</div>
    </div>
  `;
}

// ─── Engagement Distribution ───────────────────────────────

function renderDistribution(distribution) {
  const container = document.getElementById('analytics-distribution');
  if (!container) return;

  if (!distribution) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  const total = (distribution.highlyActive || 0) + (distribution.moderate || 0) +
                (distribution.light || 0) + (distribution.inactive || 0);

  const tiers = [
    { label: 'Highly Active', desc: '>2 hrs / week',       value: distribution.highlyActive || 0, color: 'bg-success' },
    { label: 'Moderate',      desc: '30 min – 2 hrs / wk', value: distribution.moderate     || 0, color: 'bg-primary' },
    { label: 'Light',         desc: '<30 min / week',       value: distribution.light        || 0, color: 'bg-warning' },
    { label: 'Inactive',      desc: 'No activity 14+ days', value: distribution.inactive    || 0, color: 'bg-danger'  },
  ];

  container.innerHTML = tiers.map(t => {
    const pct = total > 0 ? Math.round((t.value / total) * 100) : 0;
    return `
      <div style="padding:0.75rem 1rem;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.35rem">
          <div>
            <span style="font-size:0.875rem;font-weight:500">${t.label}</span>
            <span class="text-secondary" style="font-size:0.75rem;margin-left:0.4rem">${t.desc}</span>
          </div>
          <span class="text-secondary" style="font-size:0.8rem;white-space:nowrap;margin-left:0.5rem">${t.value} (${pct}%)</span>
        </div>
        <div class="progress progress-sm">
          <div class="progress-bar ${t.color}" style="width:${pct}%" role="progressbar"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Completion Funnel ─────────────────────────────────────

function renderFunnel(funnel) {
  const container = document.getElementById('analytics-funnel');
  if (!container) return;

  if (!funnel || funnel.length === 0) {
    container.innerHTML = '<div class="text-secondary p-3">No funnel data available</div>';
    return;
  }

  if (_funnelSongIndex >= funnel.length) _funnelSongIndex = 0;
  const song = funnel[_funnelSongIndex];

  // Guard: old API format (no lessons array) — show placeholder until backend is redeployed
  if (!song.lessons) {
    container.innerHTML = '<div class="text-secondary p-3">Funnel data updating — please refresh in a moment.</div>';
    return;
  }

  const pillStyle = 'border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem;white-space:nowrap';
  const pills = funnel.map((s, i) => `
    <button class="btn btn-sm btn-outline-secondary funnel-song-pill${i === _funnelSongIndex ? ' active' : ''}"
      data-song-index="${i}" style="${pillStyle}">
      ${escapeHtml(s.songTitle)}
    </button>
  `).join('');

  // Denominator = lesson 1 started count (true funnel — shows dropoff from first engagement)
  const denominator = Math.max(song.lessons[0]?.membersStarted ?? 0, 1);

  const rows = song.lessons.map((lesson) => {
    const completedPct = Math.round((lesson.membersCompleted / denominator) * 100);
    const startedPct   = Math.round(((lesson.membersStarted - lesson.membersCompleted) / denominator) * 100);
    return `
      <div style="padding:0.6rem 1rem;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:0.75rem">
        <span style="font-size:0.875rem;width:16rem;flex-shrink:0"><span style="color:rgba(255,255,255,0.35);margin-right:0.4rem">${lesson.lessonNumber}.</span>${escapeHtml(lesson.lessonTitle)}</span>
        <div class="progress progress-sm flex-grow-1" style="min-width:4rem">
          <div class="progress-bar bg-success" style="width:${completedPct}%" role="progressbar"></div>
          <div class="progress-bar bg-primary" style="width:${startedPct}%" role="progressbar"></div>
        </div>
        <span style="font-size:0.8rem;color:rgba(255,255,255,0.5);width:3rem;text-align:right;flex-shrink:0">${lesson.membersCompleted} / ${lesson.membersStarted}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="padding:0.6rem 1rem;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
      ${pills}
    </div>
    ${rows}
  `;

  container.querySelectorAll('.funnel-song-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      _funnelSongIndex = parseInt(btn.dataset.songIndex);
      renderFunnel(funnel);
    });
  });
}

// ─── Cohort Retention Table ────────────────────────────────

// ─── Device Distribution ───────────────────────────────────

function renderDeviceDistribution(sessions) {
  const container = document.getElementById('analytics-device');
  if (!container) return;

  if (!sessions?.deviceDistribution) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  const dist   = sessions.deviceDistribution;
  const counts = sessions.deviceCounts || {};
  const COLORS = ['bg-success', 'bg-primary', 'bg-warning', 'bg-danger'];
  const devices = [
    { label: 'Desktop', pct: dist.desktop || 0, count: counts.desktop || 0 },
    { label: 'Tablet',  pct: dist.tablet  || 0, count: counts.tablet  || 0 },
    { label: 'Mobile',  pct: dist.mobile  || 0, count: counts.mobile  || 0 },
  ].sort((a, b) => b.pct - a.pct).map((d, i) => ({ ...d, color: COLORS[i] }));

  container.innerHTML = devices.map(d => `
    <div style="padding:0.75rem 1rem;border-top:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.35rem">
        <span style="font-size:0.875rem;font-weight:500">${d.label}</span>
        <span class="text-secondary" style="font-size:0.8rem">${d.count} (${Math.round(d.pct)}%)</span>
      </div>
      <div class="progress progress-sm">
        <div class="progress-bar ${d.color}" style="width:${Math.round(d.pct)}%" role="progressbar"></div>
      </div>
    </div>
  `).join('');
}

// ─── Countries List ────────────────────────────────────────

function renderCountriesList(countries) {
  const container = document.getElementById('analytics-geo-countries');
  if (!container) return;

  if (!countries || countries.length === 0) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  container.innerHTML = countries.map(c => `
    <div style="border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;padding:0.55rem 1rem;font-size:0.875rem">
      <span>${getCountryFlag(c.code)} ${escapeHtml(c.country)}</span>
      <span class="text-secondary" style="white-space:nowrap;margin-left:0.5rem">${c.members} (${c.percentage}%)</span>
    </div>
  `).join('');
}

// ─── Browsers List ─────────────────────────────────────────

function renderBrowsersList(browsers) {
  const container = document.getElementById('analytics-browsers');
  if (!container) return;

  if (!browsers || browsers.length === 0) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  const BAR_COLORS = ['bg-success', 'bg-primary', 'bg-warning', 'bg-danger', 'bg-info', 'bg-purple'];
  container.innerHTML = browsers.map((b, i) => `
    <div style="padding:0.75rem 1rem;border-top:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.35rem">
        <span style="font-size:0.875rem;font-weight:500">${escapeHtml(b.browser)}</span>
        <span class="text-secondary" style="font-size:0.8rem">${b.count} (${Math.round(b.percent)}%)</span>
      </div>
      <div class="progress progress-sm">
        <div class="progress-bar ${BAR_COLORS[i % BAR_COLORS.length]}" style="width:${Math.round(b.percent)}%" role="progressbar"></div>
      </div>
    </div>
  `).join('');
}

// ─── Cities List ───────────────────────────────────────────

function renderCitiesList(cities) {
  const container = document.getElementById('analytics-geo-cities');
  if (!container) return;

  if (!cities || cities.length === 0) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  container.innerHTML = cities.map(c => `
    <div style="border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;padding:0.55rem 1rem;font-size:0.875rem">
      <span>${getCountryFlag(c.country)} ${escapeHtml(c.city)}${c.countryName ? `, ${escapeHtml(c.countryName)}` : ''}</span>
      <span class="text-secondary" style="white-space:nowrap;margin-left:0.5rem">${c.members} (${c.percentage}%)</span>
    </div>
  `).join('');
}

// ─── Member Map ────────────────────────────────────────────

const CITY_COORDS = {
  'London': [51.505, -0.09], 'Cardiff': [51.481, -3.179], 'Edinburgh': [55.953, -3.189],
  'Manchester': [53.483, -2.244], 'Birmingham': [52.486, -1.890], 'Glasgow': [55.864, -4.252],
  'Harlow': [51.773, 0.104], 'Bristol': [51.455, -2.587],
  'New York': [40.713, -74.006], 'Los Angeles': [34.052, -118.244], 'Chicago': [41.878, -87.630],
  'Houston': [29.760, -95.370], 'Phoenix': [33.448, -112.074], 'Philadelphia': [39.953, -75.165],
  'San Antonio': [29.425, -98.494], 'San Diego': [32.716, -117.161], 'Dallas': [32.776, -96.797],
  'San Jose': [37.339, -121.895], 'Austin': [30.267, -97.743], 'Jacksonville': [30.332, -81.656],
  'San Francisco': [37.774, -122.419], 'Seattle': [47.606, -122.332], 'Denver': [39.739, -104.984],
  'Nashville': [36.162, -86.781], 'Oklahoma City': [35.468, -97.517], 'Portland': [45.523, -122.676],
  'Las Vegas': [36.175, -115.137], 'Memphis': [35.149, -90.048], 'Louisville': [38.254, -85.759],
  'Baltimore': [39.290, -76.612], 'Milwaukee': [43.038, -87.907], 'Albuquerque': [35.085, -106.651],
  'Tucson': [32.222, -110.925], 'Fresno': [36.738, -119.787], 'Sacramento': [38.582, -121.494],
  'Mesa': [33.415, -111.831], 'Kansas City': [39.100, -94.579], 'Atlanta': [33.749, -84.388],
  'Omaha': [41.257, -95.996], 'Colorado Springs': [38.834, -104.822], 'Raleigh': [35.779, -78.638],
  'Long Beach': [33.770, -118.194], 'Virginia Beach': [36.853, -75.978], 'Minneapolis': [44.980, -93.271],
  'Tampa': [27.948, -82.458], 'New Orleans': [29.951, -90.072], 'Arlington': [32.736, -97.108],
  'Salt Lake City': [40.761, -111.891], 'Riverside': [33.953, -117.396],
  'Piney Flats': [36.543, -82.133],
  'Paris': [48.857, 2.352], 'Marseille': [43.297, 5.381], 'Lyon': [45.764, 4.836],
  'Rouen': [49.443, 1.099], 'Toulouse': [43.605, 1.444], 'Nice': [43.710, 7.262],
  'Berlin': [52.520, 13.405], 'Hamburg': [53.551, 9.994], 'Munich': [48.135, 11.582],
  'Frankfurt': [50.110, 8.682], 'Cologne': [50.938, 6.960],
  'Rome': [41.902, 12.496], 'Milan': [45.465, 9.186], 'Naples': [40.852, 14.268],
  'Turin': [45.070, 7.687], 'Palermo': [38.116, 13.361],
  'Madrid': [40.417, -3.704], 'Barcelona': [41.385, 2.173], 'Valencia': [39.470, -0.376],
  'Amsterdam': [52.373, 4.890], 'Rotterdam': [51.924, 4.477], 'The Hague': [52.078, 4.315],
  'Brussels': [50.850, 4.352], 'Antwerp': [51.221, 4.402], 'Lennik': [50.782, 4.155],
  'Prague': [50.088, 14.421], 'Brno': [49.195, 16.608], 'Mnišek pod Brdy': [49.876, 14.275],
  'Bratislava': [48.149, 17.107], 'Trnava': [48.378, 17.589], 'Bardejov': [49.295, 21.276],
  'Warsaw': [52.230, 21.012], 'Krakow': [50.062, 19.937],
  'Vienna': [48.209, 16.373], 'Graz': [47.071, 15.440],
  'Zurich': [47.377, 8.541], 'Geneva': [46.204, 6.143], 'Bern': [46.948, 7.448],
  'Stockholm': [59.333, 18.065], 'Gothenburg': [57.709, 11.975],
  'Oslo': [59.914, 10.752], 'Bergen': [60.391, 5.324],
  'Copenhagen': [55.676, 12.568],
  'Helsinki': [60.169, 24.939],
  'Athens': [37.984, 23.728], 'Thessaloniki': [40.641, 22.944],
  'Lisbon': [38.717, -9.139], 'Porto': [41.157, -8.629],
  'Budapest': [47.498, 19.040],
  'Bucharest': [44.432, 26.104], 'Bihorel': [47.093, 21.943],
  'Sofia': [42.698, 23.322],
  'Yerevan': [40.181, 44.514],
  'Toronto': [43.651, -79.347], 'Montreal': [45.501, -73.567], 'Vancouver': [49.246, -123.116],
  'Calgary': [51.045, -114.072], 'Edmonton': [53.545, -113.490], 'Ottawa': [45.421, -75.697],
  'Shuniah': [48.626, -88.886],
  'Sydney': [-33.869, 151.209], 'Melbourne': [-37.813, 144.962], 'Brisbane': [-27.468, 153.023],
  'Perth': [-31.951, 115.861], 'Adelaide': [-34.929, 138.601], 'Hobart': [-42.879, 147.324],
  'Werribee': [-37.900, 144.657],
  'Auckland': [-36.865, 174.763], 'Wellington': [-41.286, 174.776],
  'Tokyo': [35.690, 139.692], 'Osaka': [34.694, 135.502], 'Kyoto': [35.012, 135.768],
  'Beijing': [39.906, 116.391], 'Shanghai': [31.228, 121.474], 'Guangzhou': [23.130, 113.264],
  'Seoul': [37.566, 126.978], 'Busan': [35.180, 129.075],
  'Singapore': [1.352, 103.820],
  'Mumbai': [19.076, 72.877], 'Delhi': [28.614, 77.202], 'Bangalore': [12.972, 77.595],
  'São Paulo': [-23.549, -46.633], 'Rio de Janeiro': [-22.907, -43.173],
  'Buenos Aires': [-34.603, -58.382],
  'Mexico City': [19.433, -99.133],
  'Cairo': [30.044, 31.236],
  'Lagos': [6.455, 3.384],
  'Nairobi': [-1.292, 36.822],
  'Johannesburg': [-26.205, 28.047],
  'Dubai': [25.205, 55.271],
  'Istanbul': [41.013, 28.949],
  'Moscow': [55.751, 37.618],
};

const COUNTRY_CENTROIDS = {
  'GB': [54.0, -2.5], 'US': [38.0, -97.0], 'CA': [60.0, -96.0], 'AU': [-27.0, 133.0],
  'FR': [46.2, 2.2], 'DE': [51.2, 10.5], 'IT': [42.8, 12.8], 'ES': [40.5, -3.7],
  'NL': [52.1, 5.3], 'BE': [50.5, 4.5], 'CZ': [49.8, 15.5], 'SK': [48.7, 19.7],
  'PL': [52.1, 19.4], 'AT': [47.5, 14.5], 'CH': [46.8, 8.2], 'SE': [62.0, 15.0],
  'NO': [65.0, 13.0], 'DK': [56.3, 9.5], 'FI': [64.0, 26.0], 'GR': [39.1, 21.8],
  'PT': [39.4, -8.2], 'HU': [47.2, 19.5], 'RO': [45.9, 24.9], 'BG': [42.7, 25.5],
  'AM': [40.1, 45.0], 'JP': [36.2, 138.3], 'KR': [36.5, 127.8], 'CN': [35.9, 104.2],
  'IN': [20.6, 78.9], 'SG': [1.4, 103.8], 'NZ': [-40.9, 174.9], 'BR': [-14.2, -51.9],
  'AR': [-38.4, -63.6], 'MX': [23.6, -102.6], 'ZA': [-30.6, 22.9], 'NG': [9.1, 8.7],
  'KE': [-0.0, 37.9], 'EG': [26.8, 30.8], 'AE': [23.4, 53.8], 'TR': [38.9, 35.2],
  'RU': [61.5, 105.3],
};

let _leafletMap = null;

let _markerCluster = null;

function renderMemberMap(cities, countries, memberDots) {
  const container = document.getElementById('analytics-map');
  if (!container) return;

  // Initialise map once
  if (!_leafletMap) {
    _leafletMap = L.map(container, { scrollWheelZoom: false, zoomControl: true, zoomSnap: 0 }).setView([10, 10], 2.0);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(_leafletMap);
  }

  // Remove previous cluster group
  if (_markerCluster) {
    _leafletMap.removeLayer(_markerCluster);
  }
  _markerCluster = L.markerClusterGroup({
    maxClusterRadius: 40,
    iconCreateFunction(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div style="background:#206bc4;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;border:2px solid #4a90d9">${count}</div>`,
        className: '',
        iconSize: [34, 34],
      });
    },
  });

  const dots = memberDots && memberDots.length > 0 ? memberDots : null;

  if (dots) {
    dots.forEach(m => {
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 8,
        fillColor: '#206bc4',
        color: '#4a90d9',
        weight: 1.5,
        fillOpacity: 0.9,
      });
      marker.bindPopup(`<strong>${m.name}</strong><br><span style="color:#888;font-size:0.85em">${m.city}${m.countryName ? ', ' + m.countryName : ''}</span>`);
      _markerCluster.addLayer(marker);
    });
  } else {
    // Fallback: city-level dots when individual coords aren't available
    const maxMembers = Math.max(...(cities || []).map(c => c.members), 1);
    (cities || []).forEach(c => {
      const coords = (c.lat != null && c.lng != null) ? [c.lat, c.lng] : CITY_COORDS[c.city] || COUNTRY_CENTROIDS[c.country];
      if (!coords) return;
      const radius = 4 + (c.members / maxMembers) * 14;
      const marker = L.circleMarker(coords, {
        radius,
        fillColor: '#206bc4',
        color: '#4a90d9',
        weight: 1.5,
        fillOpacity: 0.75,
      });
      marker.bindPopup(`<strong>${c.city}${c.countryName ? ', ' + c.countryName : ''}</strong><br>${(c.memberNames || []).join('<br>')}`);
      _markerCluster.addLayer(marker);
    });
    const citiedCountries = new Set((cities || []).map(c => c.country));
    (countries || []).forEach(c => {
      if (citiedCountries.has(c.code)) return;
      const coords = COUNTRY_CENTROIDS[c.code];
      if (!coords) return;
      const marker = L.circleMarker(coords, { radius: 7, fillColor: '#206bc4', color: '#4a90d9', weight: 1.5, fillOpacity: 0.5 });
      marker.bindPopup(`<strong>${c.country}</strong>`);
      _markerCluster.addLayer(marker);
    });
  }

  _leafletMap.addLayer(_markerCluster);
  setTimeout(() => _leafletMap.invalidateSize(), 100);
}

// ─── Progress Map ──────────────────────────────────────────

function renderMatrix(data) {
  const container = document.getElementById('analytics-matrix');
  if (!container) return;

  if (!data || !data.users || data.users.length === 0) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  const { users, songGroups, lessonGroups } = data;
  // Sort tutorials by their position within each lesson
  const tutorials = [...data.tutorials].sort((a, b) => {
    if (a.songNumber !== b.songNumber) return a.songNumber - b.songNumber;
    if (a.lessonNumber !== b.lessonNumber) return a.lessonNumber - b.lessonNumber;
    return (a.tutorialOrder ?? 0) - (b.tutorialOrder ?? 0);
  });

  const CELL       = 28;
  const GAP        = 2;
  const LGAP       = 8;    // gap between lesson groups
  const NAME_W     = 170;
  const COMPL_W    = 55;   // completion count column
  const ROW_H      = CELL + GAP; // 30px — matched between left and right panels
  const LESSON_H   = 24;   // lesson title row height
  const LESSON_GAP = 10;   // gap below lesson row
  const TUT_GAP    = 0;    // gap below tut number row (internal centering of rows provides visual spacing)
  const BG         = '#1e1e1e';

  // Sort users for a given set of tutorial indices
  const sortUsers = (indices) => [...users].sort((a, b) => {
    if (matrixSort.col === 'name') {
      const cmp = (a.name || '').localeCompare(b.name || '');
      return matrixSort.dir === 'asc' ? cmp : -cmp;
    }
    const aCount = indices.filter(idx => a.cells[idx]?.status === 'completed').length;
    const bCount = indices.filter(idx => b.cells[idx]?.status === 'completed').length;
    return matrixSort.dir === 'asc' ? aCount - bCount : bCount - aCount;
  });

  const sortLabel = (col, label) => {
    let cls = 'matrix-sort-label';
    if (matrixSort.col === col) cls += matrixSort.dir === 'asc' ? ' sort-asc' : ' sort-desc';
    return `<span data-matrix-sort-col="${col}" class="${cls}">${label}</span>`;
  };

  const cellBg = (status, pct) => {
    if (status === 'completed') return '#206bc4';
    if (status === 'in_progress' && pct > 0)
      return `linear-gradient(to right, #206bc4 ${pct}%, rgba(255,255,255,0.06) ${pct}%)`;
    return 'rgba(255,255,255,0.06)';
  };

  const SONG_H    = 38;   // song name super-header row height (All pane only)
  const GAP_DIV   = `<div style="width:${GAP}px;flex-shrink:0"></div>`;
  const SEP_BLANK = `<div style="width:${LGAP}px;flex-shrink:0"></div>`;
  const SONG_SEP  = `<div style="width:20px;flex-shrink:0"></div>`; // gap between songs in All view

  // (songNumber, lessonNumber) → [tutorial indices into full tutorials array], in order
  const lessonIndexMap = new Map();
  tutorials.forEach((t, i) => {
    const key = `${t.songNumber}:${t.lessonNumber}`;
    if (!lessonIndexMap.has(key)) lessonIndexMap.set(key, []);
    lessonIndexMap.get(key).push(i);
  });

  // songNumber → [tutorial indices] (all lessons combined)
  const songIndexMap = new Map();
  tutorials.forEach((t, i) => {
    if (!songIndexMap.has(t.songNumber)) songIndexMap.set(t.songNumber, []);
    songIndexMap.get(t.songNumber).push(i);
  });

  // songNumber → lesson groups
  const lessonsBySong = new Map();
  (lessonGroups || []).forEach(lg => {
    if (!lessonsBySong.has(lg.songNumber)) lessonsBySong.set(lg.songNumber, []);
    lessonsBySong.get(lg.songNumber).push(lg);
  });

  // Shared renderers
  const lessonDiv = (s) => {
    const w = s.tutIndices.length * (CELL + GAP) - GAP;
    return `<div style="width:${w}px;flex-shrink:0;font-size:0.68rem;font-weight:700;color:#fff;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px">${escapeHtml(s.title)}</div>`;
  };
  const tutDiv = (idx, j) =>
    `<div title="${escapeHtml(tutorials[idx]?.title ?? '')}" style="width:${CELL}px;height:${CELL}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:#fff;cursor:default">${j + 1}</div>`;
  const cellDiv = (user, idx) => {
    const cell = user.cells[idx] || { status: null, percent: 0 };
    return `<div style="width:${CELL}px;height:${CELL}px;border-radius:3px;background:${cellBg(cell.status, cell.percent)};flex-shrink:0;cursor:default"></div>`;
  };

  const buildLeftPanel = (users, indices, totalTuts, extraTopSpacer) => {
    const rows = users.map(user => {
      const done = indices.filter(idx => user.cells[idx]?.status === 'completed').length;
      return `
        <div style="height:${ROW_H}px;display:flex;align-items:center">
          <div style="width:${NAME_W}px;flex-shrink:0;font-size:0.8rem;padding-right:0.4rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</div>
          <div style="width:${COMPL_W}px;flex-shrink:0;text-align:center;font-size:0.75rem;font-weight:500;color:rgba(255,255,255,0.65);white-space:nowrap">${done}/${totalTuts}</div>
        </div>`;
    }).join('');
    return `
      <div style="flex-shrink:0;background:${BG};padding-right:16px">
        ${extraTopSpacer ? `<div style="height:${SONG_H}px;margin-bottom:${LESSON_GAP}px"></div>` : ''}
        <div style="height:${LESSON_H}px;margin-bottom:0"></div>
        <div style="height:${CELL}px;display:flex;align-items:center;margin-bottom:${TUT_GAP}px">
          <div style="width:${NAME_W}px;flex-shrink:0;font-weight:700">${sortLabel('name', 'Member')}</div>
          <div style="width:${COMPL_W}px;flex-shrink:0;text-align:center;font-weight:700">${sortLabel('completion', '#')}</div>
        </div>
        ${rows}
      </div>`;
  };

  // Build per-song pane content
  const songData = songGroups.map((sg) => {
    const indices = songIndexMap.get(sg.songNumber) || [];
    const lessons = lessonsBySong.get(sg.songNumber) || [];

    const slices = lessons.map(lg => ({
      title: `${lg.lessonNumber}. ${lg.lessonTitle}`,
      tutIndices: lessonIndexMap.get(`${sg.songNumber}:${lg.lessonNumber}`) || [],
    }));

    const paneUsers  = sortUsers(indices);
    const lessonRow  = slices.map(lessonDiv).join(SEP_BLANK);
    const tutRow     = slices.map(s => s.tutIndices.map((idx, j) => tutDiv(idx, j)).join(GAP_DIV)).join(SEP_BLANK);
    const rightRows  = paneUsers.map((user) => {
      const cells = slices.map(s => s.tutIndices.map(idx => cellDiv(user, idx)).join(GAP_DIV)).join(SEP_BLANK);
      return `<div style="display:flex;align-items:center;height:${ROW_H}px">${cells}</div>`;
    }).join('');

    return {
      songNumber: sg.songNumber,
      songTitle:  sg.songTitle,
      totalTuts:  indices.length,
      paneHtml: `
        <div class="matrix-song-pane" data-song="${sg.songNumber}" style="display:none;padding:0.75rem 1rem 1rem">
          <div style="display:flex">
            ${buildLeftPanel(paneUsers, indices, indices.length, false)}
            <div style="overflow-x:auto;min-width:0">
              <div style="display:flex;height:${LESSON_H}px;align-items:center;margin-bottom:0">${lessonRow}</div>
              <div style="display:flex;height:${CELL}px;align-items:center;margin-bottom:${TUT_GAP}px">${tutRow}</div>
              ${rightRows}
            </div>
          </div>
        </div>`,
    };
  });

  // Build "All" pane — all songs concatenated with song-name super-header
  const allSongBlocks = songGroups.map(sg => {
    const indices = songIndexMap.get(sg.songNumber) || [];
    const lessons = lessonsBySong.get(sg.songNumber) || [];
    const slices = lessons.map(lg => ({
      title: `${lg.lessonNumber}. ${lg.lessonTitle}`,
      tutIndices: lessonIndexMap.get(`${sg.songNumber}:${lg.lessonNumber}`) || [],
    }));
    // blockW must match actual lesson row width: sum of each lesson div width + separators
    const blockW = slices.reduce((sum, s) => sum + s.tutIndices.length * (CELL + GAP) - GAP, 0) + Math.max(0, slices.length - 1) * LGAP;
    return { songTitle: sg.songTitle, slices, indices, blockW };
  });
  const allIndices   = allSongBlocks.flatMap(b => b.indices);
  const allTotalTuts = allIndices.length;
  const allUsers     = sortUsers(allIndices);

  const songNameRow = allSongBlocks.map(b =>
    `<div style="width:${b.blockW}px;flex-shrink:0;font-size:0.875rem;font-weight:700;color:#fff;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;border-bottom:2px solid #fff">${escapeHtml(b.songTitle)}</div>`
  ).join(SONG_SEP);
  const allLessonRow = allSongBlocks.map(b => b.slices.map(lessonDiv).join(SEP_BLANK)).join(SONG_SEP);
  const allTutRow    = allSongBlocks.map(b =>
    b.slices.map(s => s.tutIndices.map((idx, j) => tutDiv(idx, j)).join(GAP_DIV)).join(SEP_BLANK)
  ).join(SONG_SEP);
  const allRightRows = allUsers.map((user) => {
    const cells = allSongBlocks.map(b =>
      b.slices.map(s => s.tutIndices.map(idx => cellDiv(user, idx)).join(GAP_DIV)).join(SEP_BLANK)
    ).join(SONG_SEP);
    return `<div style="display:flex;align-items:center;height:${ROW_H}px">${cells}</div>`;
  }).join('');

  const allPaneHtml = `
    <div class="matrix-song-pane" data-song="all" style="display:block;padding:0.75rem 1rem 1rem">
      <div style="display:flex">
        ${buildLeftPanel(allUsers, allIndices, allTotalTuts, true)}
        <div style="overflow-x:auto;min-width:0">
          <div style="display:flex;height:${SONG_H}px;align-items:center;margin-bottom:${LESSON_GAP}px">${songNameRow}</div>
          <div style="display:flex;height:${LESSON_H}px;align-items:center;margin-bottom:0">${allLessonRow}</div>
          <div style="display:flex;height:${CELL}px;align-items:center;margin-bottom:${TUT_GAP}px">${allTutRow}</div>
          ${allRightRows}
        </div>
      </div>
    </div>`;

  const pillStyle = 'border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem;white-space:nowrap';

  const pillsHtml = [
    `<button class="btn btn-sm btn-outline-secondary active" data-matrix-song="all" style="${pillStyle}">All</button>`,
    ...songData.map(sd =>
      `<button class="btn btn-sm btn-outline-secondary" data-matrix-song="${sd.songNumber}" style="${pillStyle}">${escapeHtml(sd.songTitle)}</button>`
    ),
  ].join('');

  container.innerHTML = `
    <div style="padding:0.75rem 1rem;border-bottom:1px solid rgba(255,255,255,0.06)">
      <div class="d-flex gap-2 flex-wrap">${pillsHtml}</div>
    </div>
    ${allPaneHtml}
    ${songData.map(sd => sd.paneHtml).join('')}
  `;

  // Pill switching
  container.querySelectorAll('[data-matrix-song]').forEach(btn => {
    btn.addEventListener('click', () => {
      const songNum = btn.dataset.matrixSong;
      container.querySelectorAll('[data-matrix-song]').forEach(b => b.classList.toggle('active', b === btn));
      container.querySelectorAll('.matrix-song-pane').forEach(pane => {
        pane.style.display = pane.dataset.song === songNum ? 'block' : 'none';
      });
    });
  });

  // Sort controls — re-render preserving active song
  container.querySelectorAll('[data-matrix-sort-col]').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.matrixSortCol;
      if (matrixSort.col === col) {
        matrixSort.dir = matrixSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        matrixSort.col = col;
        matrixSort.dir = col === 'name' ? 'asc' : 'desc';
      }
      const activeSong = [...container.querySelectorAll('.matrix-song-pane')].find(p => p.style.display !== 'none')?.dataset.song;
      renderMatrix(data);
      if (activeSong) {
        container.querySelectorAll('[data-matrix-song]').forEach(b => b.classList.toggle('active', b.dataset.matrixSong === activeSong));
        container.querySelectorAll('.matrix-song-pane').forEach(p => { p.style.display = p.dataset.song === activeSong ? 'block' : 'none'; });
      }
    });
  });
}

// ─── Helpers ───────────────────────────────────────────────

function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode.toUpperCase().split('').map(ch => 127397 + ch.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// ─── Activity Heatmap ──────────────────────────────────────

let _heatmapData = null;

function renderActivityHeatmap(heatmapData) {
  _heatmapData = heatmapData;
  _drawHeatmap();
}

function _drawHeatmap() {
  const container = document.getElementById('analytics-heatmap');
  if (!container || !_heatmapData) return;

  const key = 'subD30';
  const heatmapData = _heatmapData[key];
  if (!heatmapData || !heatmapData.length) {
    container.innerHTML = '<div class="text-secondary p-3">No data available</div>';
    return;
  }

  // Destroy any previous ApexChart in this container
  destroyChart('analytics-heatmap');

  const DAYS     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hourLabel = (h) => {
    if (h === 0)  return '0:00';
    if (h === 3)  return '3:00';
    if (h === 6)  return '6:00';
    if (h === 9)  return '9:00';
    if (h === 12) return '12:00';
    if (h === 15) return '15:00';
    if (h === 18) return '18:00';
    if (h === 21) return '21:00';
    return '';
  };

  // Find max value for opacity scaling
  let maxVal = 1;
  for (const row of heatmapData) {
    for (const v of row.hours) if (v > maxVal) maxVal = v;
  }

  const LABEL_W = 52;
  const GAP = 3;
  const PAD = '1.25rem';

  // Day headers
  const dayHeaders = DAY_FULL.map(d =>
    `<div style="flex:1;text-align:center;font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);padding-bottom:8px">${d}</div>`
  ).join('');

  // Rows: one per hour
  const rows = Array.from({ length: 24 }, (_, h) => {
    const lbl = hourLabel(h);
    const cells = DAYS.map((day, di) => {
      const row = heatmapData.find(r => r.day === day);
      const val = row ? (row.hours[h] || 0) : 0;
      const opacity = val === 0 ? 0 : Math.max(0.08, val / maxVal);
      return `<div style="flex:1;height:14px;background:rgba(32,107,196,${opacity.toFixed(2)});border-radius:2px;cursor:default"
        title="${DAY_FULL[di]} ${h}:00 — ${val === 0 ? 'No activity' : val + ' min'}"></div>`;
    }).join(`<div style="width:${GAP}px;flex-shrink:0"></div>`);

    return `<div style="display:flex;align-items:center;margin-bottom:${GAP}px">
      <div style="width:${LABEL_W}px;flex-shrink:0;text-align:left;padding-left:4px;font-size:11px;color:rgba(255,255,255,0.85);line-height:14px;white-space:nowrap">${lbl}</div>
      <div style="flex:1;display:flex;gap:${GAP}px">${cells}</div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div style="padding:${PAD}">
      <div style="display:flex;margin-bottom:8px;padding-left:${LABEL_W}px">${dayHeaders}</div>
      ${rows}
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
