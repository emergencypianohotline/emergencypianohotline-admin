/**
 * @fileoverview Admin Dashboard HTML Template (Tabler)
 *
 * Sidebar layout with 5 pages: Dashboard, Members, Live, Content, Projections.
 * Returned as a string — loaded dynamically only for verified admins.
 */

export function getAdminTemplate() {
  return `
    <div class="page">
      <!-- Top navbar -->
      <header class="navbar navbar-expand-md" data-bs-theme="dark" style="background:#0f0f0f;border-bottom:1px solid rgba(255,255,255,0.06);padding-top:0.75rem;padding-bottom:0.75rem">
        <div class="container-xxl">
          <a class="navbar-brand navbar-brand-autodark me-auto" href="/" style="font-weight:700;padding-left:0.25rem">
            Emergency Piano Hotline
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                  data-bs-target="#sidebar-menu" aria-expanded="false">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="sidebar-menu">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item">
                <a class="nav-link admin-nav-link active" href="#" data-view="dashboard">Dashboard</a>
              </li>
              <li class="nav-item">
                <a class="nav-link admin-nav-link" href="#" data-view="members">Members</a>
              </li>
              <li class="nav-item">
                <a class="nav-link admin-nav-link" href="#" data-view="tutorials">Tutorials</a>
              </li>
              <li class="nav-item">
                <a class="nav-link admin-nav-link" href="#" data-view="activity">Activity</a>
              </li>
              <li class="nav-item">
                <a class="nav-link admin-nav-link" href="#" data-view="analytics">Analytics</a>
              </li>
              <li class="nav-item">
                <a class="nav-link admin-nav-link" href="#" data-view="audience">Audience</a>
              </li>
              <li class="nav-item">
                <a class="nav-link admin-nav-link" href="#" data-view="projections">Projections</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" id="admin-refresh-btn" title="Refresh"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4"/></svg></a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" id="admin-signout-btn">Sign Out</a>
              </li>
            </ul>
          </div>
          <a href="#" class="btn btn-ghost-secondary btn-sm d-none" id="admin-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span id="admin-back-label">Back</span>
          </a>
          <h2 class="page-title mb-0 d-none" id="admin-page-title">Dashboard</h2>
        </div>
      </header>

      <!-- Page wrapper -->
      <div class="page-wrapper">

        <!-- Page body -->
        <div class="page-body">
          <div class="container-xxl">

            <!-- ============ DASHBOARD ============ -->
            <section id="admin-dashboard" class="admin-section active">

              <!-- KPI cards - Row 1 -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Monthly Revenue</div>
                      <div class="h1 mb-0" id="stat-mrr">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Annual Revenue</div>
                      <div class="h1 mb-0" id="stat-arr">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Total Members</div>
                      <div class="h1 mb-0" id="stat-total-subs">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">New This Week</div>
                      <div class="h1 mb-0" id="stat-new-signups">-</div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- KPI cards - Row 2 -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Monthly Members</div>
                      <div class="h1 mb-0" id="stat-monthly-subs">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Annual Members</div>
                      <div class="h1 mb-0" id="stat-yearly-subs">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Cancelling</div>
                      <div class="h1 mb-0" id="stat-churn-rate">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Past Due</div>
                      <div class="h1 mb-0" id="stat-past-due">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- New Signups Chart + Latest Members side by side -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-lg-6">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">New Signups</h3>
                      <div class="card-actions">
                        <div class="d-flex gap-2" role="group">
                          <button class="btn btn-sm btn-outline-secondary active" data-signup-range="28d" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.45rem;padding-right:0.45rem">28 Days</button>
                          <button class="btn btn-sm btn-outline-secondary" data-signup-range="12m" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.45rem;padding-right:0.45rem">12 Months</button>
                          <button class="btn btn-sm btn-outline-secondary" data-signup-range="all" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.45rem;padding-right:0.45rem">All Time</button>
                        </div>
                      </div>
                    </div>
                    <div class="card-body">
                      <div id="chart-signups-histogram" style="height:250px;"></div>
                    </div>
                  </div>
                </div>
                <div class="col-lg-6">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">Latest Members</h3>
                    </div>
                    <div class="card-body p-0 d-flex flex-column" style="padding-bottom:0.75rem!important">
                      <div id="recent-signups-list" style="flex:1;display:flex;flex-direction:column"></div>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            <!-- ============ ACTIVITY ============ -->
            <section id="admin-activity" class="admin-section">
              <div id="activity-days-container">
                <div class="text-secondary">Loading activity...</div>
              </div>
            </section>

            <!-- ============ MEMBERS ============ -->
            <section id="admin-members" class="admin-section">
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Subscribed</div>
                      <div class="h1 mb-0" id="members-kpi-total">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Cancelling</div>
                      <div class="h1 mb-0" id="members-kpi-cancelling">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Past Due</div>
                      <div class="h1 mb-0" id="members-kpi-pastdue">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Expired</div>
                      <div class="h1 mb-0" id="members-kpi-expired">-</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Active</div>
                      <div class="h1 mb-0" id="members-kpi-active">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">At Risk</div>
                      <div class="h1 mb-0" id="members-kpi-atrisk">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Dormant</div>
                      <div class="h1 mb-0" id="members-kpi-dormant">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Pending</div>
                      <div class="h1 mb-0" id="members-kpi-never">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header" style="padding:1rem 1.25rem">
                  <h3 class="card-title" style="font-weight:700">Members</h3>
                  <div class="card-actions d-flex gap-2 flex-wrap align-items-center" style="margin-right:0">
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-secondary" data-member-filter="all" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">All</button>
                      <button class="btn btn-sm btn-outline-secondary active" data-member-filter="active" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">Subscribed</button>
                      <button class="btn btn-sm btn-outline-secondary" data-member-filter="cancelling" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">Cancelling</button>
                      <button class="btn btn-sm btn-outline-secondary" data-member-filter="past_due" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">Past Due</button>
                      <button class="btn btn-sm btn-outline-secondary" data-member-filter="expired" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">Expired</button>
                    </div>
                    <input type="text" id="user-search" class="form-control form-control-sm" placeholder="Search..." style="width:180px;border-radius:1rem;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.45rem;padding-right:0.45rem">
                    <button class="btn btn-sm btn-outline-secondary" id="export-users-btn" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.45rem;padding-right:0.45rem">Export CSV</button>
                  </div>
                </div>
                <div class="table-responsive">
                  <table class="table table-vcenter card-table table-hover" id="users-table">
                    <thead>
                      <tr style="text-transform:none">
                        <th class="text-center" style="text-transform:none;width:3rem">#</th>
                        <th data-sort="name" style="text-transform:none">Name</th>
                        <th data-sort="location" style="text-transform:none">Location</th>
                        <th data-sort="subscriptionStatus" class="text-center" style="text-transform:none">Subscription</th>
                        <th data-sort="joinedAt" class="text-center" style="text-transform:none">Joined</th>
                        <th data-sort="lastActivity" class="text-center" style="text-transform:none">Last Active</th>
                        <th data-sort="progressPercent" class="text-center" style="text-transform:none">Progress</th>
                        <th data-sort="totalWatchSeconds" class="text-center" style="text-transform:none">Watch Time</th>
                        <th data-sort="status" class="text-center" style="text-transform:none">Status</th>
                      </tr>
                    </thead>
                    <tbody id="users-table-body">
                      <tr><td colspan="9" class="text-center text-secondary">Loading...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <!-- ============ USER DETAIL ============ -->
            <section id="admin-user-detail" class="admin-section">
              <div id="user-detail-header">
                <div class="text-secondary">Loading...</div>
              </div>

              <div id="user-risk-panel" style="display:none;"></div>

              <div id="health-indicators-panel" style="display:none;"></div>

              <div class="row row-deck row-cards mb-3" id="user-detail-stats"></div>

              <div class="card mb-3">
                <div class="card-header">
                  <h3 class="card-title">Activity Timeline</h3>
                  <div class="card-actions">
                    <select id="timeline-filter" class="form-select form-select-sm" style="width:140px;">
                      <option value="all">All Events</option>
                      <option value="watched">Watched</option>
                      <option value="completed">Completed</option>
                      <option value="note">Notes</option>
                    </select>
                  </div>
                </div>
                <div class="card-body">
                  <div id="user-timeline" class="list-group list-group-flush">
                    <div class="text-secondary">Loading...</div>
                  </div>
                  <button id="timeline-load-more" class="btn btn-secondary btn-sm mt-3" style="display:none;">Load More</button>
                </div>
              </div>

              <div id="stuck-tutorials-panel" class="card" style="display:none;">
                <div class="card-header"><h3 class="card-title">Struggling With</h3></div>
                <div class="card-body">
                  <div id="stuck-tutorials-list" class="list-group list-group-flush"></div>
                </div>
              </div>
            </section>

            <!-- ============ CONTENT ============ -->
            <section id="admin-content" class="admin-section">

              <!-- KPI Row 1 -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Total Tutorials</div>
                      <div class="h1 mb-0" id="stat-total-tutorials">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Total Duration</div>
                      <div class="h1 mb-0" id="stat-total-duration">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Weeks Left</div>
                      <div class="h1 mb-0" id="stat-weeks-left">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Final Release</div>
                      <div class="h1 mb-0" id="stat-final-release">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KPI Row 2 -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Released Tutorials</div>
                      <div class="h1 mb-0" id="stat-released-tutorials">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Released Duration</div>
                      <div class="h1 mb-0" id="stat-released-duration">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Unreleased Tutorials</div>
                      <div class="h1 mb-0" id="stat-unreleased-tutorials">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Unreleased Duration</div>
                      <div class="h1 mb-0" id="stat-unreleased-duration">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KPI Row 3 -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Total Views</div>
                      <div class="h1 mb-0" id="stat-total-views">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Completed Tutorials</div>
                      <div class="h1 mb-0" id="stat-completed-tutorials">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Total Watch Time</div>
                      <div class="h1 mb-0" id="stat-total-watch-time">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Avg Completion Rate</div>
                      <div class="h1 mb-0" id="stat-avg-completion-rate">-</div>
                    </div>
                  </div>
                </div>
              </div>


              <!-- Song accordion -->
              <div id="content-accordion"></div>

            </section>

            <!-- ============ TUTORIAL DETAIL ============ -->
            <section id="admin-tutorial-detail" class="admin-section">
              <div id="tutorial-detail-container">
                <div class="text-secondary">Loading...</div>
              </div>
            </section>

            <!-- ============ ANALYTICS ============ -->
            <section id="admin-analytics" class="admin-section">

              <!-- KPI Row 1: Audience health -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Daily Active</div>
                      <div class="h1 mb-0" id="analytics-kpi-dau">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Weekly Active</div>
                      <div class="h1 mb-0" id="analytics-kpi-wau">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Monthly Active</div>
                      <div class="h1 mb-0" id="analytics-kpi-mau">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Stickiness (DAU÷MAU)</div>
                      <div class="h1 mb-0" id="analytics-kpi-stickiness">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KPI Row 2: Session quality -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Weekly Returning Rate</div>
                      <div class="h1 mb-0" id="analytics-kpi-returning">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Avg Session Duration</div>
                      <div class="h1 mb-0" id="analytics-kpi-session-duration">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Avg Weekly Watch / User</div>
                      <div class="h1 mb-0" id="analytics-kpi-avg-watch">-</div>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3">
                  <div class="card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                      <div class="subheader">Avg Weekly Completions</div>
                      <div class="h1 mb-0" id="analytics-kpi-avg-completions">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Growth & Churn + Engagement Distribution -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-lg-7">
                  <div class="card">
                    <div class="card-header" style="padding-left:1rem">
                      <h3 class="card-title">Growth & Churn</h3>
                      <div class="card-options d-flex gap-2" id="analytics-growth-pills"></div>
                    </div>
                    <div class="card-body p-0" style="display:flex;flex-direction:column">
                      <div id="analytics-growth" style="flex:1;display:flex;flex-direction:column">
                        <div class="text-secondary p-3">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-lg-5">
                  <div class="card">
                    <div class="card-header" style="padding-left:1rem">
                      <h3 class="card-title">Engagement Distribution</h3>
                    </div>
                    <div class="card-body p-0">
                      <div id="analytics-distribution">
                        <div class="text-secondary p-3">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Watch Time -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header" style="padding-left:1rem">
                      <h3 class="card-title">Watch Time</h3>
                      <div class="card-options d-flex gap-2" id="analytics-trend-pills"></div>
                    </div>
                    <div class="card-body">
                      <div id="analytics-trend" style="height:200px"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Activity Heatmap -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">Activity Heatmap</h3>
                    </div>
                    <div class="card-body p-0">
                      <div id="analytics-heatmap">
                        <div class="text-secondary p-3">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Completion Funnel by Song -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header" style="padding-left:1rem">
                      <h3 class="card-title">Completion Funnel by Song</h3>
                      <div class="card-options d-flex align-items-center gap-3" style="font-size:0.75rem;color:rgba(255,255,255,0.5)">
                        <span class="d-flex align-items-center gap-1"><span style="width:8px;height:8px;border-radius:50%;background:var(--tblr-success);flex-shrink:0"></span>Completed</span>
                        <span class="d-flex align-items-center gap-1"><span style="width:8px;height:8px;border-radius:50%;background:var(--tblr-primary);flex-shrink:0"></span>In Progress</span>
                      </div>
                    </div>
                    <div class="card-body p-0">
                      <div id="analytics-funnel">
                        <div class="text-secondary p-3">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Progress Map -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">Progress Map</h3>
                    </div>
                    <div class="card-body p-0">
                      <div id="analytics-matrix">
                        <div class="text-secondary p-3">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            <!-- ============ AUDIENCE ============ -->
            <section id="admin-audience" class="admin-section">

              <!-- Member Map -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">Member Locations</h3>
                    </div>
                    <div class="card-body p-0">
                      <div id="analytics-map" style="height:500px;border-radius:0 0 4px 4px;background:var(--tblr-card-bg)"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Device + Browsers | Countries | Cities -->
              <div class="row row-deck row-cards mb-3">
                <div class="col-lg-4">
                  <div class="row row-deck row-cards g-3">
                    <div class="col-12">
                      <div class="card">
                        <div class="card-header">
                          <h3 class="card-title">Device Distribution</h3>
                          <div class="card-options d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary active analytics-period-pill" data-panel="analytics-device" data-period="30d" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">30 days</button>
                            <button class="btn btn-sm btn-outline-secondary analytics-period-pill" data-panel="analytics-device" data-period="all" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">All time</button>
                          </div>
                        </div>
                        <div class="card-body p-0">
                          <div id="analytics-device">
                            <div class="text-secondary p-3">Loading...</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="card">
                        <div class="card-header">
                          <h3 class="card-title">Top Browsers</h3>
                          <div class="card-options d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary active analytics-period-pill" data-panel="analytics-browsers" data-period="30d" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">30 days</button>
                            <button class="btn btn-sm btn-outline-secondary analytics-period-pill" data-panel="analytics-browsers" data-period="all" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">All time</button>
                          </div>
                        </div>
                        <div class="card-body p-0">
                          <div id="analytics-browsers">
                            <div class="text-secondary p-3">Loading...</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">Top Countries</h3>
                      <div class="card-options d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary analytics-period-pill" data-panel="analytics-geo-countries" data-period="30d" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">30 days</button>
                        <button class="btn btn-sm btn-outline-secondary active analytics-period-pill" data-panel="analytics-geo-countries" data-period="all" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">All time</button>
                      </div>
                    </div>
                    <div class="card-body p-0">
                      <div id="analytics-geo-countries">
                        <div class="text-secondary p-3">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="card">
                    <div class="card-header">
                      <h3 class="card-title">Top Cities</h3>
                      <div class="card-options d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary analytics-period-pill" data-panel="analytics-geo-cities" data-period="30d" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">30 days</button>
                        <button class="btn btn-sm btn-outline-secondary active analytics-period-pill" data-panel="analytics-geo-cities" data-period="all" style="border-radius:1rem;text-transform:uppercase;font-size:0.65rem;letter-spacing:0.04em;padding-left:0.6rem;padding-right:0.6rem">All time</button>
                      </div>
                    </div>
                    <div class="card-body p-0">
                      <div id="analytics-geo-cities">
                        <div class="text-secondary p-3">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            <!-- ============ PROJECTIONS ============ -->
            <section id="admin-projections" class="admin-section">
              <div class="row row-deck row-cards">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header"><h3 class="card-title">Target vs Actual</h3></div>
                    <div class="card-body">
                      <div id="chart-monthly-signups" style="height:430px;"></div>
                    </div>
                  </div>
                </div>
                <div class="col-12">
                  <div class="card">
                    <div class="card-header"><h3 class="card-title">Monthly Breakdown</h3></div>
                    <div id="projections-table"></div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  `;
}
