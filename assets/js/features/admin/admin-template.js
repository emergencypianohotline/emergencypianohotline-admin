/**
 * @fileoverview Admin Dashboard HTML Template
 *
 * Returns the admin UI as a string - loaded dynamically only for verified admins.
 * This keeps the admin structure out of the main page source.
 */

export function getAdminTemplate() {
  return `
    <div class="admin-container">
      <!-- Header - matches song overlay structure -->
      <header class="admin-header">
        <div class="admin-back-links">
          <button class="admin-back-btn" id="admin-back-btn">EMERGENCY PIANO HOTLINE</button>
        </div>
        <h1 class="admin-title" id="admin-page-title">Admin</h1>
        <nav class="admin-nav">
          <a href="#" class="admin-nav-link" data-view="live">Live</a>
          <a href="#" class="admin-nav-link" data-view="users">Students</a>
          <a href="#" class="admin-nav-link" data-view="content">Tutorials</a>
          <a href="#" class="admin-nav-link" data-view="analytics">Analytics</a>
          <a href="#" class="admin-nav-link" data-view="projections">Projections</a>
          <button class="admin-nav-link admin-signout-link" id="admin-signout-btn">Sign Out</button>
        </nav>
      </header>

      <!-- Content -->
      <main class="admin-content">

        <!-- Overview Section -->
        <section id="admin-overview" class="admin-section active">
          <div class="admin-section-header">
            <h2>Overview</h2>
            <button class="admin-refresh-btn" data-refresh="overview">Refresh</button>
          </div>

          <!-- Stats Cards -->
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="stat-total-students">-</div>
              <div class="admin-stat-label">Total Students</div>
            </div>
            <div class="admin-stat-card active">
              <div class="admin-stat-value" id="stat-active">-</div>
              <div class="admin-stat-label">Active (0-3 days)</div>
            </div>
            <div class="admin-stat-card at-risk">
              <div class="admin-stat-value" id="stat-at-risk">-</div>
              <div class="admin-stat-label">At Risk (4-14 days)</div>
            </div>
            <div class="admin-stat-card dormant">
              <div class="admin-stat-value" id="stat-dormant">-</div>
              <div class="admin-stat-label">Dormant (>14 days)</div>
            </div>
          </div>

          <!-- Secondary Stats -->
          <div class="admin-stats-grid secondary">
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="stat-watch-time">-</div>
              <div class="admin-stat-label">Total Watch Time</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="stat-completions">-</div>
              <div class="admin-stat-label">Total Completions</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="stat-new-signups">-</div>
              <div class="admin-stat-label">New This Week</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="stat-week-completions">-</div>
              <div class="admin-stat-label">Completions This Week</div>
            </div>
          </div>

          <!-- Revenue & Business Metrics -->
          <div class="admin-stats-grid billing-stats">
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-mrr">-</div>
              <div class="admin-stat-label">Monthly Recurring Revenue</div>
            </div>
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-active-subs">-</div>
              <div class="admin-stat-label">Active Subscribers</div>
            </div>
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-ltv">-</div>
              <div class="admin-stat-label">Avg Lifetime Value</div>
            </div>
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-churn-rate">-</div>
              <div class="admin-stat-label">Churn Rate</div>
            </div>
          </div>

          <!-- Growth Metrics -->
          <div class="admin-stats-grid billing-stats">
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-new-signups">-</div>
              <div class="admin-stat-label">New Signups This Month</div>
            </div>
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-signup-growth">-</div>
              <div class="admin-stat-label">Growth vs Last Month</div>
            </div>
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-monthly-subs">-</div>
              <div class="admin-stat-label">Monthly Plans</div>
            </div>
            <div class="admin-stat-card billing">
              <div class="admin-stat-value" id="stat-yearly-subs">-</div>
              <div class="admin-stat-label">Annual Plans</div>
            </div>
          </div>

          <!-- At Risk Students Preview -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Needs Attention</h3>
              <a href="#" class="admin-link" data-view="users">View All Students</a>
            </div>
            <div id="at-risk-preview" class="admin-list">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Phase 8d: Actionable At-Risk Lists -->
          <div class="at-risk-lists-container">
            <!-- Trial Ending Soon -->
            <div class="admin-panel at-risk-panel">
              <div class="admin-panel-header">
                <h3>Trial Ending Soon</h3>
                <span class="at-risk-count" id="trial-ending-count">0</span>
              </div>
              <div id="trial-ending-list" class="admin-list">
                <div class="admin-empty">No trials ending soon</div>
              </div>
            </div>

            <!-- Gone Quiet -->
            <div class="admin-panel at-risk-panel">
              <div class="admin-panel-header">
                <h3>Gone Quiet</h3>
                <span class="at-risk-count" id="gone-quiet-count">0</span>
              </div>
              <div id="gone-quiet-list" class="admin-list">
                <div class="admin-empty">No users have gone quiet</div>
              </div>
            </div>

            <!-- Stuck on Tutorial -->
            <div class="admin-panel at-risk-panel">
              <div class="admin-panel-header">
                <h3>Stuck on Tutorial</h3>
                <span class="at-risk-count" id="stuck-tutorial-count">0</span>
              </div>
              <div id="stuck-tutorial-list" class="admin-list">
                <div class="admin-empty">No users are stuck</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Live Section -->
        <section id="admin-live" class="admin-section">
          <div class="admin-section-header">
            <h2>Live Activity</h2>
            <div class="live-header-meta">
              <span id="live-connection-status" class="live-connection-indicator connected" title="Connected"></span>
              <span class="live-header-label">Real-time</span>
            </div>
          </div>

          <!-- Live Stats Cards -->
          <div class="admin-stats-grid live-stats-grid">
            <div class="admin-stat-card live-stat">
              <div class="admin-stat-value" id="live-watching-now">0</div>
              <div class="admin-stat-label">Watching Now</div>
            </div>
            <div class="admin-stat-card live-stat">
              <div class="admin-stat-value" id="live-today-completions">0</div>
              <div class="admin-stat-label">Completions Today</div>
            </div>
            <div class="admin-stat-card live-stat">
              <div class="admin-stat-value" id="live-today-watchtime">0m</div>
              <div class="admin-stat-label">Watch Time Today</div>
            </div>
            <div class="admin-stat-card live-stat">
              <div class="admin-stat-value" id="live-today-signups">0</div>
              <div class="admin-stat-label">Signups Today</div>
            </div>
          </div>

          <!-- Activity Feed -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Activity Feed</h3>
            </div>
            <div id="live-activity-feed" class="live-activity-feed">
              <div class="admin-loading">Connecting...</div>
            </div>
          </div>
        </section>

        <!-- Users Section -->
        <section id="admin-users" class="admin-section">
          <div class="admin-section-header">
            <h2>Students</h2>
            <div class="admin-actions">
              <input type="text" id="user-search" class="admin-search" placeholder="Search by name or email...">
              <select id="user-filter-status" class="admin-select">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="at_risk">At Risk</option>
                <option value="dormant">Dormant</option>
                <option value="new">New</option>
              </select>
              <select id="user-filter-risk" class="admin-select">
                <option value="">All Risk</option>
                <option value="critical">Critical</option>
                <option value="at_risk">At Risk</option>
                <option value="watch">Watch</option>
                <option value="healthy">Healthy</option>
              </select>
              <button class="admin-btn" id="export-users-btn">Export CSV</button>
            </div>
          </div>

          <div class="admin-table-container">
            <table class="admin-table" id="users-table">
              <thead>
                <tr>
                  <th data-sort="name">Name</th>
                  <th data-sort="email">Email</th>
                  <th data-sort="joinedAt">Joined</th>
                  <th data-sort="lastActivity">Last Active</th>
                  <th data-sort="progressPercent">Progress</th>
                  <th data-sort="totalWatchTime">Watch Time</th>
                  <th data-sort="status">Status</th>
                  <th data-sort="riskScore">Risk</th>
                </tr>
              </thead>
              <tbody id="users-table-body">
                <tr><td colspan="8" class="admin-loading">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- User Detail Section -->
        <section id="admin-user-detail" class="admin-section">
          <!-- User Profile Header -->
          <div class="admin-user-header" id="user-detail-header">
            <div class="admin-loading">Loading...</div>
          </div>

          <!-- Risk Assessment (Phase 8) -->
          <div id="user-risk-panel" class="risk-indicator-panel" style="display:none;">
            <div class="risk-indicator-header">
              <span class="risk-indicator-title">Churn Risk Assessment</span>
              <div class="risk-score-display">
                <span class="risk-score-number" id="risk-score-value">0</span>
                <span class="admin-risk-badge" id="risk-tier-badge">Healthy</span>
              </div>
            </div>
            <div class="risk-factors-list" id="risk-factors-list">
            </div>
          </div>

          <!-- Health Indicators -->
          <div class="admin-panel health-panel" id="health-indicators-panel">
            <h3>Health Status</h3>
            <div id="user-health-indicators" class="health-indicators-grid">
            </div>
          </div>

          <!-- User Stats -->
          <div class="admin-stats-grid" id="user-detail-stats">
          </div>

          <!-- Timeline -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Activity Timeline</h3>
              <div class="timeline-controls">
                <select id="timeline-filter" class="admin-select timeline-filter">
                  <option value="all">All Events</option>
                  <option value="watched">Watched</option>
                  <option value="completed">Completed</option>
                  <option value="note">Notes</option>
                </select>
              </div>
            </div>
            <div id="user-timeline" class="admin-timeline">
              <div class="admin-loading">Loading...</div>
            </div>
            <div class="timeline-footer">
              <button id="timeline-load-more" class="admin-btn" style="display:none;">Load More</button>
            </div>
          </div>

          <!-- Stuck Tutorials -->
          <div class="admin-panel" id="stuck-tutorials-panel" style="display:none;">
            <h3>Struggling With</h3>
            <div id="stuck-tutorials-list" class="admin-list">
            </div>
          </div>
        </section>

        <!-- Tutorial Detail Section -->
        <section id="admin-tutorial-detail" class="admin-section">
          <div id="tutorial-detail-container">
            <div class="admin-loading">Loading...</div>
          </div>
        </section>

        <!-- Content Section -->
        <section id="admin-content" class="admin-section">
          <div class="admin-section-header">
            <h2>Content Performance</h2>
            <div class="admin-actions">
              <select id="content-filter-song" class="admin-select">
                <option value="">All Songs</option>
              </select>
              <button class="admin-btn" id="export-content-btn">Export CSV</button>
            </div>
          </div>

          <!-- Problem Content Alerts -->
          <div id="problem-content-alerts" class="problem-alerts-container" style="display:none;">
            <div id="problem-tutorials-alert" class="admin-alert warning" style="display:none;">
              <strong>Low Completion:</strong> <span id="problem-tutorials-count">0</span> tutorials have &lt;40% completion rate
            </div>
            <div id="high-rewatch-alert" class="admin-alert warning" style="display:none;">
              <strong>High Rewatch:</strong> <span id="high-rewatch-count">0</span> tutorials have unusually high re-watch rates
            </div>
            <div id="slow-songs-alert" class="admin-alert warning" style="display:none;">
              <strong>Slow Progress:</strong> <span id="slow-songs-count">0</span> songs take longer than average to complete
            </div>
          </div>

          <!-- Song Stats Panel -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Song Progress Overview</h3>
            </div>
            <div id="content-song-stats">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Tutorial Table -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Tutorial Details</h3>
            </div>
            <div class="admin-table-container">
              <table class="admin-table" id="content-table">
                <thead>
                  <tr>
                    <th data-sort="title">Tutorial</th>
                    <th data-sort="songTitle">Song</th>
                    <th data-sort="uniqueViewers">Viewers</th>
                    <th data-sort="completions">Completions</th>
                    <th data-sort="completionRate">Rate</th>
                    <th data-sort="manualPercent">Manual %</th>
                    <th data-sort="rewatchRate">Rewatch</th>
                    <th data-sort="medianExitPercent">Exit Pt</th>
                  </tr>
                </thead>
                <tbody id="content-table-body">
                  <tr><td colspan="8" class="admin-loading">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Analytics Section -->
        <section id="admin-analytics" class="admin-section">
          <div class="admin-section-header">
            <h2>Platform Analytics</h2>
            <button class="admin-refresh-btn" data-refresh="analytics">Refresh</button>
          </div>

          <!-- Engagement Metrics -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Engagement Metrics</h3>
            </div>
            <div id="analytics-engagement">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Session Stats (Phase 6) -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Login Sessions</h3>
            </div>
            <div id="analytics-sessions">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Completion Funnel -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Song Completion Funnel</h3>
            </div>
            <div id="analytics-funnel">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Engagement Distribution -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Engagement Distribution</h3>
            </div>
            <div id="analytics-distribution">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Cohort Analysis -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Cohort Analysis</h3>
            </div>
            <div id="analytics-cohorts">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Completion Matrix -->
          <div class="admin-panel completion-matrix-panel">
            <div class="admin-panel-header">
              <h3>Student × Tutorial Matrix</h3>
              <div class="matrix-legend">
                <span class="legend-item"><span class="legend-box not-started"></span> Not Started</span>
                <span class="legend-item"><span class="legend-box in-progress"></span> In Progress</span>
                <span class="legend-item"><span class="legend-box completed"></span> Completed</span>
              </div>
            </div>
            <div id="analytics-matrix">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>
        </section>

        <!-- Projections Section -->
        <section id="admin-projections" class="admin-section">
          <div class="admin-section-header">
            <h2>Projections vs Actuals</h2>
            <button class="admin-refresh-btn" data-refresh="projections">Refresh</button>
          </div>

          <!-- Current Snapshot -->
          <div class="admin-stats-grid projections-current">
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="proj-current-members">-</div>
              <div class="admin-stat-label">Current Members</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="proj-current-mrr-eur">-</div>
              <div class="admin-stat-label">MRR (EUR)</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="proj-current-mrr-aud">-</div>
              <div class="admin-stat-label">MRR (AUD)</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-value" id="proj-total-signups">-</div>
              <div class="admin-stat-label">Total Signups</div>
            </div>
          </div>

          <!-- Signups Chart -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Monthly Signups</h3>
            </div>
            <div id="projections-signups-chart" class="projections-chart">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Members Chart -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Total Members</h3>
            </div>
            <div id="projections-members-chart" class="projections-chart">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Revenue Chart -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Monthly Revenue</h3>
              <div class="chart-currency-toggle">
                <button class="currency-btn active" data-currency="eur">EUR</button>
                <button class="currency-btn" data-currency="aud">AUD</button>
              </div>
            </div>
            <div id="projections-revenue-chart" class="projections-chart">
              <div class="admin-loading">Loading...</div>
            </div>
          </div>

          <!-- Data Table -->
          <div class="admin-panel">
            <div class="admin-panel-header">
              <h3>Monthly Breakdown</h3>
            </div>
            <div class="admin-table-container">
              <table class="admin-table projections-table" id="projections-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th colspan="2">Signups</th>
                    <th colspan="2">Members</th>
                    <th colspan="2">Revenue (EUR)</th>
                  </tr>
                  <tr class="sub-header">
                    <th></th>
                    <th>Proj</th>
                    <th>Actual</th>
                    <th>Proj</th>
                    <th>Actual</th>
                    <th>Proj</th>
                    <th>Actual</th>
                  </tr>
                </thead>
                <tbody id="projections-table-body">
                  <tr><td colspan="7" class="admin-loading">Loading...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  `;
}
