/**
 * @fileoverview ApexCharts utilities - shared config, creation, cleanup
 */

const chartInstances = new Map();

function getBaseOptions() {
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue('--tblr-primary').trim() || '#0054a6';
  const success = style.getPropertyValue('--tblr-success').trim() || '#2fb344';
  const warning = style.getPropertyValue('--tblr-warning').trim() || '#f76707';
  const danger = style.getPropertyValue('--tblr-danger').trim() || '#d63939';
  const info = style.getPropertyValue('--tblr-info').trim() || '#4299e1';
  const secondary = style.getPropertyValue('--tblr-secondary').trim() || '#656d77';
  const bodyColor = style.getPropertyValue('--tblr-body-color').trim() || '#cacbd3';
  const borderColor = style.getPropertyValue('--tblr-border-color').trim() || '#2c3547';

  return {
    colors: { primary, success, warning, danger, info, secondary },
    chart: {
      fontFamily: 'inherit',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: false },
      background: 'transparent',
      foreColor: bodyColor,
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      padding: { top: -2, right: 0, bottom: -2, left: 0 },
    },
    tooltip: { theme: 'dark' },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } },
    },
    xaxis: {
      labels: { style: { colors: secondary, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: secondary, fontSize: '12px' } },
    },
    legend: {
      labels: { colors: bodyColor },
    },
  };
}

export function renderChart(containerId, options) {
  destroyChart(containerId);

  const el = document.getElementById(containerId);
  if (!el || typeof ApexCharts === 'undefined') return null;

  const base = getBaseOptions();

  // Merge base chart options
  options.chart = { ...base.chart, ...(options.chart || {}) };
  if (!options.tooltip) options.tooltip = base.tooltip;
  if (!options.grid && options.chart.type !== 'radialBar' && options.chart.type !== 'donut' && !options.chart.sparkline?.enabled) {
    options.grid = base.grid;
  }
  if (!options.states) options.states = base.states;

  // Apply axis label styles if not overridden
  if (options.xaxis && !options.xaxis.labels?.style) {
    options.xaxis.labels = { ...(options.xaxis.labels || {}), style: base.xaxis.labels.style };
  }
  if (options.yaxis && !Array.isArray(options.yaxis) && options.yaxis && !options.yaxis.labels?.style) {
    options.yaxis.labels = { ...(options.yaxis.labels || {}), style: base.yaxis.labels.style };
  }
  if (options.legend && !options.legend.labels) {
    options.legend.labels = base.legend.labels;
  }

  try {
    const chart = new ApexCharts(el, options);
    chart.render();
    chartInstances.set(containerId, chart);
    return chart;
  } catch (err) {
    console.error(`Chart render failed for #${containerId}:`, err);
    return null;
  }
}

export function destroyChart(containerId) {
  const existing = chartInstances.get(containerId);
  if (existing) {
    try { existing.destroy(); } catch (e) { /* ignore */ }
    chartInstances.delete(containerId);
  }
}

export function destroyAllCharts() {
  for (const [, chart] of chartInstances) {
    try { chart.destroy(); } catch (e) { /* ignore */ }
  }
  chartInstances.clear();
}

export function getColors() {
  return getBaseOptions().colors;
}
