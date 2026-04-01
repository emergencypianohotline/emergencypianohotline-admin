/**
 * @fileoverview Admin Dashboard - Overview Section (Tabler)
 */

import { debug } from '../../config.js';
import { renderChart, getColors } from './charts.js';

let overviewData = null;
let billingDataCache = null;
let currentSignupRange = '28d';

export function initOverview() {
  const viewAllLink = document.querySelector('.admin-link[data-view="members"]');
  if (viewAllLink) {
    viewAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.HOTLINE?.admin?.navigateToView?.('members');
    });
  }

  document.querySelectorAll('[data-signup-range]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-signup-range]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSignupRange = btn.dataset.signupRange;
      if (overviewData?.signupHistogram) {
        renderSignupsHistogram(overviewData.signupHistogram);
      }
    });
  });
}

/**
 * Load overview data from API
 */
export async function loadOverviewData(getAdminApiUrl, getAuthHeaders, forceRefresh = false) {
  if (overviewData && !forceRefresh) {
    renderOverview(overviewData);
    if (billingDataCache) renderBillingStats(billingDataCache);
    renderDashboardCharts(overviewData, billingDataCache);
    if (overviewData?.signupHistogram) {
      renderSignupsHistogram(overviewData.signupHistogram);
    }
    return;
  }

  const headers = getAuthHeaders();

  try {
    const overviewResponse = await fetch(getAdminApiUrl('overview'), { method: 'GET', headers });

    if (!overviewResponse.ok) {
      const errorText = await overviewResponse.text();
      throw new Error(`HTTP ${overviewResponse.status}: ${errorText}`);
    }

    overviewData = await overviewResponse.json();
    renderOverview(overviewData);

    if (overviewData.signupHistogram) {
      renderSignupsHistogram(overviewData.signupHistogram);
    }

    renderDashboardCharts(overviewData, billingDataCache);

    // Billing loads in background — it can be very slow (Stripe API) and must not block the page
    fetch(getAdminApiUrl('billing'), { method: 'GET', headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { billingDataCache = data; renderBillingStats(data); } })
      .catch(err => debug.warn('Billing load failed (non-fatal):', err));

  } catch (err) {
    debug.error('Failed to load overview:', err);
    const el = document.getElementById('stat-mrr');
    if (el) el.textContent = 'Error';
  }
}

function renderOverview(data) {
  const el = (id) => document.getElementById(id);
  if (el('stat-new-signups')) el('stat-new-signups').textContent = data.newSignupsThisWeek || 0;
}

function renderBillingStats(data) {
  const el = (id) => document.getElementById(id);
  if (el('stat-mrr')) el('stat-mrr').textContent = data.mrrFormatted || '€0';
  if (el('stat-arr')) el('stat-arr').textContent = data.arrFormatted || '€0';
  const netBadge = (count, net) => {
    if (net === undefined || net === 0) return `${count}`;
    const sign = net > 0 ? '+' : '';
    const color = net > 0 ? '#2fb344' : '#d63939';
    return `${count} <span style="font-size:0.55em;color:${color};font-weight:600;position:relative;top:-0.35em">${sign}${net}</span>`;
  };
  if (el('stat-monthly-subs')) el('stat-monthly-subs').innerHTML = netBadge(data.monthlySubscribers || 0, data.netMonthlyChangeThisMonth);
  if (el('stat-yearly-subs')) el('stat-yearly-subs').innerHTML = netBadge(data.yearlySubscribers || 0, data.netYearlyChangeThisMonth);
  if (el('stat-total-subs')) el('stat-total-subs').innerHTML = netBadge(data.totalSubscriptions || 0, data.netChangeThisMonth);
  if (el('stat-churn-rate')) {
    el('stat-churn-rate').textContent = data.cancellingCount !== undefined ? data.cancellingCount : '-';
  }
  if (el('stat-past-due')) {
    el('stat-past-due').textContent = data.pastdueCount !== undefined ? data.pastdueCount : '-';
  }

  // Latest signups list
  const listEl = document.getElementById('recent-signups-list');
  if (listEl && data.recentSignups?.length) {
    const timeAgo = (date) => {
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return '1 day ago';
      if (days < 30) return `${days} days ago`;
      const months = Math.floor(days / 30);
      if (months === 1) return '1 month ago';
      return `${months} months ago`;
    };
    const items = data.recentSignups.slice(0, 5);
    listEl.innerHTML = items.map((s, i) => {
      const loc = s.location ? ` from <b><a href="https://www.google.com/maps/search/${encodeURIComponent(s.location)}" target="_blank" style="color:inherit;text-decoration:none;" onmouseover="this.style.textDecoration='underline';this.style.textUnderlineOffset='3px'" onmouseout="this.style.textDecoration='none'">${s.location}</a></b>` : '';
      const ago = timeAgo(new Date(s.date));
      const border = i < items.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06);' : '';
      return `<div class="d-flex align-items-center" style="flex:1;margin:0 1.25rem;${border}font-size:0.79rem">
        <span style="font-size:1.2em;margin-right:0.5em;flex-shrink:0">${s.flag}</span>
        <span class="flex-grow-1"><b>${s.name}</b>${loc} signed up for <b>€${s.amount}/${s.period}</b></span>
        <span class="text-secondary ms-2" style="white-space:nowrap;font-size:0.85em">${ago}</span>
      </div>`;
    }).join('');
  }
}

// ─── Charts ──────────────────────────────────────────────

function renderDashboardCharts(overview, billing) {
}

let projectionsCache = null;

export async function loadProjectionsData(getAdminApiUrl, getAuthHeaders, forceRefresh = false) {
  if (projectionsCache && !forceRefresh) {
    renderMonthlySignups(projectionsCache);
    return;
  }
  await loadAndRenderProjectionsChart(getAdminApiUrl, getAuthHeaders);
}

async function loadAndRenderProjectionsChart(getAdminApiUrl, getAuthHeaders) {
  try {
    const response = await fetch(getAdminApiUrl('projections'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return;

    const data = await response.json();
    const monthlyData = data.monthlyData || [];
    if (monthlyData.length === 0) return;

    projectionsCache = monthlyData;
    renderMonthlySignups(monthlyData);
  } catch (err) {
    debug.error('Failed to load projections for chart:', err);
  }
}

function renderMonthlySignups(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) return;
  const colors = getColors();
  const now = new Date();

  // Start date: 1st of the first month (zero point)
  const startDate = new Date(monthlyData[0].month);

  // Chart range ends at the last day of the last month so the label reads e.g. "Jan '28" not "Feb '28"
  const lastMonth = new Date(monthlyData[monthlyData.length - 1].month);
  const lastEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0); // last day of last month

  // Build projected series: 0 at start, then each value at end of its month (= 1st of next month)
  const projectedSeries = [{ x: startDate.getTime(), y: 0 }];
  // Build actual series: same, but current month positioned at today's date
  const actualSeries = [{ x: startDate.getTime(), y: 0 }];

  for (const m of monthlyData) {
    const monthDate = new Date(m.month);
    const isLastMonth = monthDate.getFullYear() === lastMonth.getFullYear() &&
                        monthDate.getMonth() === lastMonth.getMonth();
    // Last month plots at its own last day (so the chart ends labelled e.g. "Jan '28" not "Feb '28")
    const endOfMonth = isLastMonth
      ? lastEnd
      : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

    // Projected: always at end of month
    projectedSeries.push({ x: endOfMonth.getTime(), y: m.projected.members });

    // Actual: only where we have data
    if (m.actual.members !== null) {
      const isCurrentMonth = monthDate.getFullYear() === now.getFullYear() &&
                             monthDate.getMonth() === now.getMonth();
      // Current month: position at today's date; past months: at end of month
      const x = isCurrentMonth ? now.getTime() : endOfMonth.getTime();
      actualSeries.push({ x, y: m.actual.members });
    }
  }

  renderChart('chart-monthly-signups', {
    chart: { type: 'line', height: 430 },
    series: [
      { name: 'Target', data: projectedSeries },
      { name: 'Actual', data: actualSeries },
    ],
    xaxis: {
      type: 'datetime',
      min: startDate.getTime(),
      max: lastEnd.getTime(),
      tickAmount: monthlyData.length,
      labels: {
        formatter: (val) => {
          const d = new Date(val);
          const month = d.toLocaleDateString('en-US', { month: 'short' });
          const year = `'${String(d.getFullYear()).slice(2)}`;
          return `${month} ${year}`;
        },
        hideOverlappingLabels: false,
        rotate: -45,
        rotateAlways: true,
        offsetY: 5,
        style: { fontSize: '11px' },
      },
    },
    grid: {
      padding: { bottom: 25 },
      borderColor: 'rgba(255,255,255,0.06)',
    },
    colors: [colors.warning, colors.primary],
    stroke: {
      width: [2, 3],
      curve: ['straight', 'smooth'],
    },
    markers: { size: 0 },
    dataLabels: { enabled: false },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: { formatter: (val) => Math.round(val).toString() },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (val) => val !== null ? `${val} members` : '' },
    },
    legend: { position: 'top', fontSize: '12px' },
  });

  renderProjectionsTable(monthlyData);
}

function renderProjectionsTable(monthlyData) {
  const container = document.getElementById('projections-table');
  if (!container || !monthlyData?.length) return;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Group by year → month index
  const byYear = {};
  for (const m of monthlyData) {
    const d = new Date(m.month);
    const y = d.getFullYear();
    const mo = d.getMonth();
    if (!byYear[y]) byYear[y] = {};
    byYear[y][mo] = m;
  }

  const years = Object.keys(byYear).map(Number).sort().filter(y => y <= 2027);
  const monthIndices = [...new Set(monthlyData.map(m => new Date(m.month).getMonth()))].sort((a, b) => a - b);

  const outer      = 'border:1px solid rgba(255,255,255,0.08);border-radius:4px;overflow:hidden';
  const vline      = 'border-left:1px solid rgba(255,255,255,0.06)';
  const cell       = 'vertical-align:middle;text-align:center';
  const cellPad    = `padding:0.65rem 1rem;${cell}`;
  const labelStyle = 'font-size:0.7rem;text-transform:uppercase;letter-spacing:0.07em;color:rgba(255,255,255,0.32)';
  const rowBorder  = 'border-top:1px solid rgba(255,255,255,0.06)';

  const hdrPad = `padding:0.5rem 1rem;${cell}`;

  const thead = `
    <thead>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
        <th style="width:25%;${hdrPad};${labelStyle}">Month</th>
        <th style="width:25%;${vline};${hdrPad};${labelStyle}">Target</th>
        <th style="width:25%;${vline};${hdrPad};${labelStyle}">Actual</th>
        <th style="width:25%;${vline};${hdrPad};${labelStyle}">+/−</th>
      </tr>
    </thead>`;

  function buildTbody(year) {
    return monthIndices.map(mo => {
      const entry = byYear[year]?.[mo];
      const monthCell = `<td style="${cellPad};color:rgba(255,255,255,0.55);white-space:nowrap">${MONTHS[mo]}</td>`;
      if (!entry) {
        return `<tr style="${rowBorder}">${monthCell}<td style="${vline};${cellPad}"></td><td style="${vline};${cellPad}"></td><td style="${vline};${cellPad}"></td></tr>`;
      }
      const target = entry.projected.members;
      const actual = entry.actual.members;
      const isFuture = !entry.isPastMonth && !entry.isCurrentMonth;
      if (isFuture || actual === null || actual === undefined) {
        return `<tr style="${rowBorder}">${monthCell}` +
          `<td style="${vline};${cellPad};color:rgba(255,255,255,0.35)">${target ?? '—'}</td>` +
          `<td style="${vline};${cellPad}"></td><td style="${vline};${cellPad}"></td></tr>`;
      }
      const diff = actual - target;
      const deltaHtml = diff > 0
        ? `<span style="color:#2fb344;font-weight:600">+${diff}</span>`
        : diff < 0
          ? `<span style="color:#d63939;font-weight:600">${diff}</span>`
          : `<span style="color:rgba(255,255,255,0.3)">±0</span>`;
      return `<tr style="${rowBorder}">${monthCell}` +
        `<td style="${vline};${cellPad};color:rgba(255,255,255,0.38)">${target ?? '—'}</td>` +
        `<td style="${vline};${cellPad};font-weight:500">${actual}</td>` +
        `<td style="${vline};${cellPad}">${deltaHtml}</td></tr>`;
    }).join('');
  }

  const yearLabel = 'font-size:0.9rem;font-weight:600;color:#ffffff;margin-bottom:1rem;text-align:center';

  const tables = years.map(y => `
    <div style="flex:1;min-width:0">
      <div style="${yearLabel}">${y}</div>
      <div style="${outer}">
        <table style="font-size:0.875rem;border-collapse:collapse;width:100%;table-layout:fixed">
          ${thead}
          <tbody>${buildTbody(y)}</tbody>
        </table>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="padding:1.25rem">
      <div style="display:flex;gap:1.25rem">
        ${tables}
      </div>
    </div>
  `;
}

// ─── Signups Histogram ────────────────────────────────────

function alignHistogramLabels(shortRange) {
  requestAnimationFrame(() => {
    const el = document.querySelector('#chart-signups-histogram');
    if (!el) return;
    const divisor = shortRange ? 3.1 : 8;
    const labels = el.querySelectorAll('.apexcharts-xaxis-texts-g text');
    const visible = [...labels].filter(t => t.textContent.trim() !== '');
    if (visible.length >= 1) {
      visible[0].setAttribute('text-anchor', 'start');
      const w0 = visible[0].getBBox().width;
      visible[0].setAttribute('dx', -(w0 / divisor));
    }
    if (visible.length >= 2) {
      const last = visible[visible.length - 1];
      last.setAttribute('text-anchor', 'end');
      const w1 = last.getBBox().width;
      last.setAttribute('dx', w1 / divisor);
    }
    // Allow overflow up through all parents to the card
    let node = el;
    while (node && !node.classList?.contains('card')) {
      node.style.overflow = 'visible';
      node = node.parentElement;
    }
    if (node) node.style.overflow = 'visible';
  });
}

function renderSignupsHistogram(histogram) {
  const colors = getColors();
  const allDaily = histogram.daily || [];

  // Slice data based on selected range
  let data;
  if (currentSignupRange === '28d') {
    data = allDaily.slice(-28);
  } else if (currentSignupRange === '12m') {
    data = allDaily.slice(-365);
  } else {
    data = allDaily;
  }

  if (data.length === 0) return;

  const isShortRange = currentSignupRange === '28d';

  // Use unique date strings as categories so annotations can reference them
  const categories = data.map(d => d.date);

  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;

  const fmtDate = (d) => {
    const opts = isShortRange ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', opts);
  };
  const totalBars = data.length;

  renderChart('chart-signups-histogram', {
    chart: {
      type: 'bar',
      height: 250,
      events: {
        mounted: () => { alignHistogramLabels(isShortRange); },
        updated: () => { alignHistogramLabels(isShortRange); },
      },
    },
    series: [{ name: 'Signups', data: data.map(d => d.count) }],
    xaxis: {
      categories,
      labels: {
        rotate: 0,
        rotateAlways: false,
        hideOverlappingLabels: false,
        style: { fontSize: '11px' },
        formatter: (val, timestamp, opts) => {
          if (!val || typeof val !== 'string') return '';
          if (val === firstDate) return fmtDate(val);
          if (val === lastDate) return fmtDate(val);
          return '';
        },
      },
      axisTicks: { show: false },
    },
    colors: [colors.primary],
    plotOptions: {
      bar: { borderRadius: isShortRange ? 3 : 1, columnWidth: isShortRange ? '70%' : '90%' },
    },
    dataLabels: { enabled: false },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: { formatter: (val) => Math.round(val).toString() },
    },
    grid: { borderColor: 'rgba(255,255,255,0.06)' },
    tooltip: {
      x: {
        formatter: (val, { dataPointIndex }) => {
          const d = data[dataPointIndex];
          if (!d) return '';
          const dt = new Date(d.date + 'T00:00:00');
          return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        },
      },
      y: { formatter: (val) => `${val} signup${val !== 1 ? 's' : ''}` },
    },
  });
}
