/**
 * @fileoverview Admin Dashboard - Main entry point (v2 - Tabler)
 *
 * 5 pages: Dashboard, Members, Live, Content, Projections.
 * Dynamically loads admin UI after verifying admin access.
 */

import { debug } from '../../config.js';
import { getAdminTemplate } from './admin-template.js';
import { initOverview, loadOverviewData, loadProjectionsData } from './overview.js';
import { initUserList, loadUserListData } from './user-list.js';
import { initUserDetail, loadUserDetailData } from './user-detail.js';
import { initContentStats, loadContentStatsData } from './content-stats.js';
import { initAnalytics, loadAnalyticsData } from './analytics.js';
import { initLiveStats, startLiveStats, stopLiveStats, startGlobalRealtime } from './live-stats.js';
import { destroyAllCharts } from './charts.js';

// Lazy load tutorial detail
let loadTutorialDetail = null;

/** Admin state */
let isAdminVerified = false;
let isAdminLoaded = false;
let currentView = 'dashboard';
let currentUserName = '';

/**
 * Get Supabase function URL
 */
function getAdminApiUrl(endpoint) {
  const supabaseUrl = window.HOTLINE?.supabase?.supabaseUrl;
  if (!supabaseUrl) {
    return `https://iqvntlifrvkdqrrcxwsf.supabase.co/functions/v1/admin-stats/${endpoint}`;
  }
  return `${supabaseUrl}/functions/v1/admin-stats/${endpoint}`;
}

/** Cached auth token */
let cachedAuthToken = null;

/**
 * Get auth headers for API requests
 */
function getAuthHeaders() {
  if (cachedAuthToken) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cachedAuthToken}`,
    };
  }

  const storageKey = 'sb-iqvntlifrvkdqrrcxwsf-auth-token';
  const storedSession = localStorage.getItem(storageKey);

  let token = null;
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      token = parsed.access_token;
    } catch (e) {
      token = storedSession;
    }
  }

  if (token) cachedAuthToken = token;

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Refresh auth token from Supabase
 */
async function refreshAuthToken() {
  const supabase = window.HOTLINE?.supabase;
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        cachedAuthToken = data.session.access_token;
      }
    } catch (e) {
      debug.warn('Failed to refresh auth token:', e);
    }
  }
}

/**
 * Verify if current user is admin
 */
export async function verifyAdminAccess() {
  try {
    await refreshAuthToken();
    const response = await fetch(getAdminApiUrl('verify'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    isAdminVerified = data.isAdmin === true;
    return isAdminVerified;
  } catch (err) {
    debug.error('verifyAdminAccess failed:', err);
    return false;
  }
}

/**
 * Refresh all data
 */
async function refreshAllData() {
  try {
    await Promise.all([
      loadOverviewData(getAdminApiUrl, getAuthHeaders, true).catch(err => debug.warn('Refresh overview failed:', err)),
      loadUserListData(getAdminApiUrl, getAuthHeaders, true).catch(err => debug.warn('Refresh users failed:', err)),
      loadContentStatsData(getAdminApiUrl, getAuthHeaders, true).catch(err => debug.warn('Refresh content failed:', err)),
      loadProjectionsData(getAdminApiUrl, getAuthHeaders, true).catch(err => debug.warn('Refresh projections failed:', err)),
    ]);
  } catch (err) {
    debug.error('Error refreshing data:', err);
  }
}

/**
 * Preload all data in parallel
 */
async function preloadAllData() {
  try {
    // Projections excluded — loads on-demand only, and is sometimes very slow
    await Promise.all([
      loadOverviewData(getAdminApiUrl, getAuthHeaders).catch(err => debug.warn('Preload overview failed:', err)),
      loadUserListData(getAdminApiUrl, getAuthHeaders).catch(err => debug.warn('Preload users failed:', err)),
      loadContentStatsData(getAdminApiUrl, getAuthHeaders).catch(err => debug.warn('Preload content failed:', err)),
    ]);
  } catch (err) {
    debug.error('Error preloading data:', err);
  }
}

/**
 * Load admin dashboard
 */
export async function loadAdminDashboard(view, params = {}) {
  if (!isAdminVerified) {
    const hasAccess = await verifyAdminAccess();
    if (!hasAccess) {
      window.location.href = '/';
      return;
    }
  }

  if (!isAdminLoaded) {
    injectAdminUI();
    isAdminLoaded = true;
    preloadAllData();
  }

  // Auto-detect view from URL if not explicitly provided
  if (!view) {
    const parsed = parseAdminUrl();
    view = parsed?.view || 'dashboard';
    params = parsed?.params || {};
  }

  await navigateToView(view, params);
}

/**
 * Inject admin UI into the DOM
 */
function injectAdminUI() {
  const container = document.getElementById('admin-container');
  if (!container) return;

  container.innerHTML = getAdminTemplate();

  // Initialize all section modules
  initOverview();
  initLiveStats();
  initUserList();
  initUserDetail();
  initContentStats();
  initAnalytics();

  // Setup navigation
  setupNavigation();

  // Back button
  const backBtn = container.querySelector('#admin-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleBackNavigation();
    });
  }

  // Sign out
  const signOutBtn = container.querySelector('#admin-signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        const supabase = window.HOTLINE?.supabase;
        if (supabase) await supabase.auth.signOut();
        window.location.href = '/';
      } catch (error) {
        debug.error('Sign out error:', error);
      }
    });
  }


  // Refresh button
  const refreshBtn = container.querySelector('#admin-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => window.location.reload());
  }

  // Re-initialize Bootstrap components (Tabler JS inits on DOMContentLoaded,
  // but we inject after that, so collapse/dropdown won't work without this)
  const sidebarCollapse = document.getElementById('sidebar-menu');
  if (sidebarCollapse && window.bootstrap) {
    new window.bootstrap.Collapse(sidebarCollapse, { toggle: false });
  }

  debug.log('Admin UI injected');
}

let popstateListenerAdded = false;

/**
 * Setup navigation
 */
function setupNavigation() {
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) {
        navigateToView(view);
        updateUrl(view);
      }
    });
  });

  if (!popstateListenerAdded) {
    window.addEventListener('popstate', async () => {
      const parsed = parseAdminUrl();
      if (parsed) {
        await navigateToView(parsed.view, parsed.params);
      }
    });
    popstateListenerAdded = true;
  }
}

/**
 * Handle back navigation
 */
function handleBackNavigation() {
  switch (currentView) {
    case 'user-detail':
      navigateToView('members');
      updateUrl('members');
      break;
    case 'tutorial-detail':
      navigateToView('tutorials');
      updateUrl('tutorials');
      break;
    default:
      navigateToView('dashboard');
      updateUrl('dashboard');
  }
}

/**
 * Update header
 */
function updateHeader(title, showBack = false, backLabel = 'Back') {
  const titleEl = document.getElementById('admin-page-title');
  const backBtn = document.getElementById('admin-back-btn');
  const backLabelEl = document.getElementById('admin-back-label');

  if (titleEl) titleEl.textContent = title;

  if (backBtn) {
    if (showBack) {
      backBtn.classList.remove('d-none');
      if (backLabelEl) backLabelEl.textContent = backLabel;
    } else {
      backBtn.classList.add('d-none');
    }
  }
}

/**
 * Navigate to a view
 */
async function navigateToView(view, params = {}) {
  debug.log('[ADMIN] navigateToView:', view, params);
  destroyAllCharts();
  currentView = view;

  // Update sidebar active state
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    const linkView = link.dataset.view;
    // Highlight Members for user-detail, Content for tutorial-detail
    const isActive = linkView === view ||
      (linkView === 'members' && view === 'user-detail') ||
      (linkView === 'tutorials' && (view === 'tutorial-detail' || view === 'content-stats'));
    link.classList.toggle('active', isActive);
  });

  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));

  // Stop live stats when leaving activity view
  if (view !== 'activity') {
    stopLiveStats();
  }

  switch (view) {
    case 'dashboard': {
      document.getElementById('admin-dashboard')?.classList.add('active');
      updateHeader('Dashboard');
      await loadOverviewData(getAdminApiUrl, getAuthHeaders, false);
      break;
    }

    case 'activity': {
      document.getElementById('admin-activity')?.classList.add('active');
      updateHeader('Activity');
      await startLiveStats(getAdminApiUrl, getAuthHeaders);
      break;
    }

    case 'members': {
      if (params.userId) {
        document.getElementById('admin-user-detail')?.classList.add('active');
        const userData = await loadUserDetailData(params.userId, getAdminApiUrl, getAuthHeaders, params.preloadUser);
        currentUserName = userData?.name || 'Member Details';
        currentView = 'user-detail';
        updateHeader(currentUserName, true, 'Members');
        updateUrl('members', { userId: params.userId });
      } else {
        document.getElementById('admin-members')?.classList.add('active');
        updateHeader('Members');
        await loadUserListData(getAdminApiUrl, getAuthHeaders, false);
      }
      break;
    }

    case 'user-detail': {
      document.getElementById('admin-user-detail')?.classList.add('active');
      if (params.userId) {
        const userData = await loadUserDetailData(params.userId, getAdminApiUrl, getAuthHeaders, params.preloadUser);
        currentUserName = userData?.name || 'Member Details';
        updateHeader(currentUserName, true, 'Members');
        updateUrl('members', { userId: params.userId });
      }
      break;
    }

    case 'tutorials':
    case 'content-stats': {
      currentView = 'tutorials';
      document.getElementById('admin-content')?.classList.add('active');
      updateHeader('Tutorials');
      await loadContentStatsData(getAdminApiUrl, getAuthHeaders, false);
      break;
    }

    case 'tutorial-detail': {
      document.getElementById('admin-tutorial-detail')?.classList.add('active');
      if (params.tutorialId) {
        updateHeader('Tutorial Details', true, 'Tutorials');
        if (!loadTutorialDetail) {
          const module = await import('./tutorial-detail.js');
          loadTutorialDetail = module.loadTutorialDetail;
        }
        await loadTutorialDetail(params.tutorialId, getAdminApiUrl, getAuthHeaders, navigateToView);
        updateUrl('tutorial-detail', { tutorialId: params.tutorialId });
      }
      break;
    }

    case 'analytics': {
      document.getElementById('admin-analytics')?.classList.add('active');
      updateHeader('Analytics');
      await loadAnalyticsData(getAdminApiUrl, getAuthHeaders, false);
      break;
    }

    case 'audience': {
      document.getElementById('admin-audience')?.classList.add('active');
      updateHeader('Audience');
      await loadAnalyticsData(getAdminApiUrl, getAuthHeaders, false);
      break;
    }

    case 'projections': {
      document.getElementById('admin-projections')?.classList.add('active');
      updateHeader('Projections');
      await loadProjectionsData(getAdminApiUrl, getAuthHeaders, false);
      break;
    }
  }
}

/**
 * Update URL
 */
function updateUrl(view, params = {}) {
  let path = '/';
  if (params.userId) {
    path = `/members/${params.userId}`;
  } else if (params.tutorialId) {
    path = `/tutorials/${params.tutorialId}`;
  } else if (view && view !== 'dashboard') {
    path = `/${view}`;
  }
  if (window.location.pathname !== path) {
    window.history.pushState({ view, params }, '', path);
  }
}

/**
 * Parse URL
 */
function parseAdminUrl() {
  const path = window.location.pathname || '/';

  const userDetailMatch = path.match(/^\/members\/([^/]+)$/);
  if (userDetailMatch) {
    return { view: 'user-detail', params: { userId: userDetailMatch[1] } };
  }

  const tutorialDetailMatch = path.match(/^\/tutorials\/([^/]+)$/);
  if (tutorialDetailMatch) {
    return { view: 'tutorial-detail', params: { tutorialId: tutorialDetailMatch[1] } };
  }

  const viewMatch = path.match(/^\/([^/]+)$/);
  if (viewMatch) {
    return { view: viewMatch[1], params: {} };
  }

  if (path === '/') {
    return { view: 'dashboard', params: {} };
  }

  return null;
}

/**
 * Close admin dashboard
 */
export function closeAdminDashboard() {
  const container = document.getElementById('admin-container');
  if (container) container.classList.remove('ready');
  window.history.pushState({}, '', '/');
}

export function isAdminDashboardLoaded() { return isAdminLoaded; }
export function isUserAdmin() { return isAdminVerified; }

/**
 * Admin button injection for members site
 */
export async function checkAndInjectAdminButton() {
  if (document.getElementById('admin-pill-button')) return;
  try {
    const isAdmin = await verifyAdminAccess();
    if (isAdmin) {
      const footerLinks = document.querySelector('.dashboard-footer-links');
      if (!footerLinks) return;
      const adminPill = document.createElement('a');
      adminPill.id = 'admin-pill-button';
      adminPill.href = 'https://admin.emergencypianohotline.com';
      adminPill.className = 'dashboard-link-pill';
      adminPill.target = '_blank';
      adminPill.textContent = 'ADMIN';
      footerLinks.insertBefore(adminPill, footerLinks.firstChild);
    }
  } catch (err) {
    debug.error('Admin button check failed:', err);
  }
}

export { getAdminApiUrl, getAuthHeaders, navigateToView };

if (!window.HOTLINE) window.HOTLINE = {};
if (!window.HOTLINE.admin) window.HOTLINE.admin = {};
window.HOTLINE.admin.navigateToView = navigateToView;
