/**
 * @fileoverview Admin Dashboard - Main entry point
 *
 * Dynamically loads admin UI after verifying admin access.
 * Admin HTML is never in the page source - only loaded for verified admins.
 */

import { debug } from '../../config.js';
import { getAdminTemplate } from './admin-template.js';
import { initOverview, loadOverviewData } from './overview.js';
import { initUserList, loadUserListData } from './user-list.js';
import { initUserDetail, loadUserDetailData } from './user-detail.js';
import { initContentStats, loadContentStatsData } from './content-stats.js';
import { initLiveStats, startLiveStats, stopLiveStats } from './live-stats.js';
import { initAnalytics, loadAnalyticsData } from './analytics.js';
import { initProjections, loadProjectionsData } from './projections.js';

// Lazy load tutorial detail to avoid initial bundle issues
let loadTutorialDetail = null;

/** Admin state */
let isAdminVerified = false;
let isAdminLoaded = false;
let currentView = 'overview';
let currentUserName = ''; // Store current user name for breadcrumb

/**
 * Get the Supabase function URL
 */
function getAdminApiUrl(endpoint) {
  const supabaseUrl = window.HOTLINE?.supabase?.supabaseUrl;
  if (!supabaseUrl) {
    // Fallback to config
    return `https://iqvntlifrvkdqrrcxwsf.supabase.co/functions/v1/admin-stats/${endpoint}`;
  }
  return `${supabaseUrl}/functions/v1/admin-stats/${endpoint}`;
}

/**
 * Cached auth token
 */
let cachedAuthToken = null;

/**
 * Get auth headers for admin API requests
 */
function getAuthHeaders() {
  // Use cached token if available
  if (cachedAuthToken) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cachedAuthToken}`,
    };
  }

  // Try to get from localStorage (Supabase stores session here)
  const storageKey = 'sb-iqvntlifrvkdqrrcxwsf-auth-token';
  const storedSession = localStorage.getItem(storageKey);

  let token = null;
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      token = parsed.access_token;
    } catch (e) {
      // Not JSON, use as-is
      token = storedSession;
    }
  }

  if (token) {
    cachedAuthToken = token;
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Refresh auth token from Supabase client
 */
async function refreshAuthToken() {
  const supabase = window.HOTLINE?.supabase;
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        cachedAuthToken = data.session.access_token;
        debug.log('🔑 Auth token refreshed');
      }
    } catch (e) {
      debug.warn('⚠️ Failed to refresh auth token:', e);
    }
  }
}

/**
 * Verify if current user is an admin
 */
export async function verifyAdminAccess() {
  try {
    // Refresh auth token from Supabase client first
    await refreshAuthToken();

    const response = await fetch(getAdminApiUrl('verify'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    isAdminVerified = data.isAdmin === true;

    debug.log(`🔐 Admin verification: ${isAdminVerified ? 'GRANTED' : 'DENIED'}`);
    return isAdminVerified;
  } catch (err) {
    debug.error('❌ Admin verification failed:', err);
    return false;
  }
}

/**
 * Load admin dashboard
 * Called when navigating to /admin routes
 */
export async function loadAdminDashboard(view = 'overview', params = {}) {
  // Verify admin access first
  if (!isAdminVerified) {
    const hasAccess = await verifyAdminAccess();
    if (!hasAccess) {
      debug.log('🚫 Not an admin, redirecting to home');
      window.location.href = '/';
      return;
    }
  }

  // Inject admin HTML if not already loaded
  if (!isAdminLoaded) {
    injectAdminUI();
    isAdminLoaded = true;
  }

  // Show admin overlay
  const adminOverlay = document.getElementById('admin-overlay');
  if (adminOverlay) {
    adminOverlay.style.display = 'block';
    adminOverlay.classList.add('visible');
  }

  // Hide other overlays
  document.querySelectorAll('.hotline-overlay:not(#admin-overlay)').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('visible');
  });
  document.getElementById('hotline-dashboard-view')?.style.setProperty('display', 'none');
  document.getElementById('trn-dashboard-view')?.style.setProperty('display', 'none');

  // Navigate to specific view
  await navigateToView(view, params);
}

/**
 * Load admin CSS dynamically
 */
function loadAdminCSS() {
  if (document.getElementById('admin-css')) {
    return; // Already loaded
  }

  const link = document.createElement('link');
  link.id = 'admin-css';
  link.rel = 'stylesheet';
  link.href = '/assets/css/admin.css';
  document.head.appendChild(link);

  debug.log('📦 Admin CSS loaded');
}

/**
 * Inject admin UI into the DOM
 */
function injectAdminUI() {
  // Check if already exists
  if (document.getElementById('admin-overlay')) {
    return;
  }

  // Load admin CSS first
  loadAdminCSS();

  // Create admin overlay
  const container = document.createElement('div');
  container.id = 'admin-overlay';
  container.className = 'hotline-overlay admin-overlay';
  container.innerHTML = getAdminTemplate();
  document.body.appendChild(container);

  // Initialize all sections
  initOverview();
  initLiveStats();
  initUserList();
  initUserDetail();
  initContentStats();
  initAnalytics();
  initProjections();

  // Setup navigation
  setupNavigation();

  // Setup back button (handles breadcrumb navigation)
  const backBtn = container.querySelector('#admin-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      handleBackNavigation();
    });
  }

  // Setup sign-out button
  const signOutBtn = container.querySelector('#admin-signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        const supabase = window.HOTLINE?.supabase;
        if (supabase) {
          await supabase.auth.signOut();
        }
        window.location.href = '/';
      } catch (error) {
        debug.error('Sign out error:', error);
      }
    });
  }

  debug.log('✅ Admin UI injected');
}

// Track if popstate listener is already added
let popstateListenerAdded = false;

/**
 * Setup admin navigation
 */
function setupNavigation() {
  const navLinks = document.querySelectorAll('.admin-nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) {
        navigateToView(view);
        updateUrl(view);
      }
    });
  });

  // Handle browser back/forward navigation (only add once)
  if (!popstateListenerAdded) {
    window.addEventListener('popstate', async (event) => {
      // Check if we're on an admin URL
      const parsed = parseAdminUrl();

      if (parsed) {
        // We're navigating within admin - restore that view
        event.preventDefault();
        await navigateToView(parsed.view, parsed.params);
      } else if (isAdminLoaded && document.getElementById('admin-overlay')?.classList.contains('visible')) {
        // We navigated away from admin - close it
        closeAdminDashboard();
      }
    });
    popstateListenerAdded = true;
  }
}

/**
 * Handle back button navigation (breadcrumb style)
 */
function handleBackNavigation() {
  switch (currentView) {
    case 'overview':
      // At root - open members site in new window
      window.open('https://members.emergencypianohotline.com', '_blank');
      break;
    case 'live':
    case 'members':
    case 'content':
    case 'analytics':
    case 'projections':
      // Go back to overview
      navigateToView('overview');
      updateUrl('overview');
      break;
    case 'user-detail':
      // Go back to members list
      navigateToView('members');
      updateUrl('members');
      break;
    default:
      closeAdminDashboard();
  }
}

/**
 * Update header based on current view (breadcrumb style)
 */
function updateHeader(view, userName = '') {
  const titleEl = document.getElementById('admin-page-title');
  const backBtn = document.getElementById('admin-back-btn');
  const nav = document.querySelector('.admin-nav');
  const livePill = nav?.querySelector('[data-view="live"]');
  const membersPill = nav?.querySelector('[data-view="members"]');
  const tutorialsPill = nav?.querySelector('[data-view="content"]');
  const analyticsPill = nav?.querySelector('[data-view="analytics"]');
  const projectionsPill = nav?.querySelector('[data-view="projections"]');

  if (!titleEl || !backBtn) return;

  // Reset all pills visibility
  if (livePill) livePill.style.display = '';
  if (membersPill) membersPill.style.display = '';
  if (tutorialsPill) tutorialsPill.style.display = '';
  if (analyticsPill) analyticsPill.style.display = '';
  if (projectionsPill) projectionsPill.style.display = '';

  switch (view) {
    case 'overview':
      titleEl.textContent = 'Admin';
      backBtn.textContent = 'EMERGENCY PIANO HOTLINE';
      if (nav) nav.style.display = 'flex';
      break;
    case 'live':
      titleEl.textContent = 'Live';
      backBtn.textContent = 'ADMIN';
      if (nav) nav.style.display = 'flex';
      if (livePill) livePill.style.display = 'none'; // Hide Live pill on Live page
      break;
    case 'members':
      titleEl.textContent = 'Members';
      backBtn.textContent = 'ADMIN';
      if (nav) nav.style.display = 'flex';
      if (membersPill) membersPill.style.display = 'none'; // Hide Members pill on Members page
      break;
    case 'content':
      titleEl.textContent = 'Tutorials';
      backBtn.textContent = 'ADMIN';
      if (nav) nav.style.display = 'flex';
      if (tutorialsPill) tutorialsPill.style.display = 'none'; // Hide Tutorials pill on Tutorials page
      break;
    case 'analytics':
      titleEl.textContent = 'Analytics';
      backBtn.textContent = 'ADMIN';
      if (nav) nav.style.display = 'flex';
      if (analyticsPill) analyticsPill.style.display = 'none'; // Hide Analytics pill on Analytics page
      break;
    case 'projections':
      titleEl.textContent = 'Projections';
      backBtn.textContent = 'ADMIN';
      if (nav) nav.style.display = 'flex';
      if (projectionsPill) projectionsPill.style.display = 'none'; // Hide Projections pill on Projections page
      break;
    case 'user-detail':
      titleEl.textContent = userName || 'Member Details';
      backBtn.textContent = 'MEMBERS';
      if (nav) nav.style.display = 'none'; // Hide nav pills on user detail
      break;
  }
}

/**
 * Navigate to a specific view
 */
async function navigateToView(view, params = {}) {
  debug.log(`📊 Admin navigateToView: ${view}`, params);
  currentView = view;

  // Update active nav
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });

  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target section
  const targetSection = document.getElementById(`admin-${view}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Stop live stats if navigating away from live view
  if (view !== 'live') {
    stopLiveStats();
  }

  // Load data for the view
  switch (view) {
    case 'overview':
      updateHeader('overview');
      debug.log('📊 Loading overview data...');
      await loadOverviewData(getAdminApiUrl, getAuthHeaders);
      debug.log('📊 Overview data loaded');
      break;
    case 'live':
      updateHeader('live');
      debug.log('📡 Starting live stats...');
      await startLiveStats(getAdminApiUrl, getAuthHeaders);
      break;
    case 'members':
      if (params.userId) {
        // Load user detail - get user name for header
        const userData = await loadUserDetailData(params.userId, getAdminApiUrl, getAuthHeaders);
        currentUserName = userData?.name || 'Member Details';
        currentView = 'user-detail';
        updateHeader('user-detail', currentUserName);
        updateUrl('members', { userId: params.userId });
        document.getElementById('admin-members')?.classList.remove('active');
        document.getElementById('admin-user-detail')?.classList.add('active');
      } else {
        updateHeader('members');
        await loadUserListData(getAdminApiUrl, getAuthHeaders);
      }
      break;
    case 'user-detail':
      if (params.userId) {
        const userData = await loadUserDetailData(params.userId, getAdminApiUrl, getAuthHeaders);
        currentUserName = userData?.name || 'Member Details';
        updateHeader('user-detail', currentUserName);
        updateUrl('users', { userId: params.userId });
      }
      break;
    case 'content':
      updateHeader('content');
      await loadContentStatsData(getAdminApiUrl, getAuthHeaders);
      break;
    case 'content-stats':
      // Alias for content
      currentView = 'content';
      updateHeader('content');
      await loadContentStatsData(getAdminApiUrl, getAuthHeaders);
      document.getElementById('admin-content')?.classList.add('active');
      break;
    case 'tutorial-detail':
      if (params.tutorialId) {
        updateHeader('tutorial-detail', 'Tutorial Details');
        // Lazy load tutorial detail module
        if (!loadTutorialDetail) {
          const module = await import('./tutorial-detail.js');
          loadTutorialDetail = module.loadTutorialDetail;
        }
        await loadTutorialDetail(params.tutorialId, getAdminApiUrl, getAuthHeaders, navigateToView);
        updateUrl('tutorial-detail', { tutorialId: params.tutorialId });
      }
      break;
    case 'analytics':
      updateHeader('analytics');
      await loadAnalyticsData(getAdminApiUrl, getAuthHeaders);
      break;
    case 'projections':
      updateHeader('projections');
      await loadProjectionsData(getAdminApiUrl, getAuthHeaders);
      break;
  }
}

/**
 * Update URL without reload
 */
function updateUrl(view, params = {}) {
  let path = `/`;
  if (view && view !== 'overview') {
    path = `/${view}`;
  }
  if (params.userId) {
    path = `/members/${params.userId}`;
  }

  if (window.location.pathname !== path) {
    // Store the view and params in state for restoration
    window.history.pushState({ view, params }, '', path);
  }
}

/**
 * Parse current URL to determine which admin view to show
 */
function parseAdminUrl() {
  const path = window.location.pathname;

  // Match /members/:userId
  const userDetailMatch = path.match(/^\/members\/([^\/]+)$/);
  if (userDetailMatch) {
    return { view: 'user-detail', params: { userId: userDetailMatch[1] } };
  }

  // Match /:view
  const viewMatch = path.match(/^\/([^\/]+)$/);
  if (viewMatch) {
    const view = viewMatch[1];
    // Map URL segments to view names
    return { view, params: {} };
  }

  // Default to overview
  if (path === '/' || path === '') {
    return { view: 'overview', params: {} };
  }

  return null;
}

/**
 * Restore admin state from URL on page load or navigation
 */
export async function restoreAdminFromUrl() {
  const parsed = parseAdminUrl();
  if (!parsed) return false;

  // Verify admin access first
  const hasAccess = await verifyAdminAccess();
  if (!hasAccess) {
    window.location.href = '/';
    return false;
  }

  // Open admin dashboard with the parsed view
  await openAdminDashboard(parsed.view, parsed.params);
  return true;
}

/**
 * Close admin dashboard
 */
export function closeAdminDashboard() {
  const adminOverlay = document.getElementById('admin-overlay');
  if (adminOverlay) {
    adminOverlay.style.display = 'none';
    adminOverlay.classList.remove('visible');
  }

  // Show dashboard view without reload
  const dashboardView = document.getElementById('hotline-dashboard-view');
  if (dashboardView) {
    dashboardView.style.display = 'block';
  }

  // Update URL without reload
  window.history.pushState({}, '', '/');
  document.title = 'Dashboard • Emergency Piano Hotline';
}

/**
 * Check if admin is loaded
 */
export function isAdminDashboardLoaded() {
  return isAdminLoaded;
}

/**
 * Export for router to check admin status
 */
export function isUserAdmin() {
  return isAdminVerified;
}

/**
 * Check admin status and inject admin pill button if user is admin
 * Called after auth is ready
 */
export async function checkAndInjectAdminButton() {
  debug.log('🔍 Checking admin status for button injection...');

  // Don't check if already verified or button already exists
  if (document.getElementById('admin-pill-button')) {
    debug.log('⏭️ Admin button already exists, skipping');
    return;
  }

  try {
    const isAdmin = await verifyAdminAccess();
    debug.log(`👤 Admin verification result: ${isAdmin}`);

    if (isAdmin) {
      injectAdminPillButton();
    } else {
      debug.log('❌ User is not admin, button not injected');
    }
  } catch (err) {
    debug.error('❌ Admin button check failed:', err);
  }
}

/**
 * Inject admin pill button into dashboard footer
 */
function injectAdminPillButton() {
  if (document.getElementById('admin-pill-button')) {
    return; // Already exists
  }

  // Find the dashboard footer links container
  const footerLinks = document.querySelector('.dashboard-footer-links');
  if (!footerLinks) {
    debug.warn('⚠️ Could not find .dashboard-footer-links for admin button');
    return;
  }

  // Create admin pill button
  const adminPill = document.createElement('a');
  adminPill.id = 'admin-pill-button';
  adminPill.href = 'https://admin.emergencypianohotline.com';
  adminPill.className = 'dashboard-link-pill';
  adminPill.target = '_blank'; // Open in new tab
  adminPill.textContent = 'ADMIN';

  // Insert before the first link (Resources)
  footerLinks.insertBefore(adminPill, footerLinks.firstChild);

  debug.log('✅ Admin pill button injected');
}

// Export API helpers and navigation for child modules
export { getAdminApiUrl, getAuthHeaders, navigateToView };

// Also expose navigateToView globally for click handlers
if (!window.HOTLINE) window.HOTLINE = {};
if (!window.HOTLINE.admin) window.HOTLINE.admin = {};
window.HOTLINE.admin.navigateToView = navigateToView;
