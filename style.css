<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>seaROCKS | Daily Productivity</title>
    <meta name="description"
        content="Plan daily tasks, track productivity metrics, and manage your personal/farm ops with seaROCKS.">
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body>
    <div class="app-container">
        <header>
            <div class="logo">seaROCKS</div>
            <button class="btn-icon" id="printBtn" title="Print today's list">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9V2h12v7"></path>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
            </button>
        </header>

        <nav id="mainNav" class="glass">
            <button class="active" data-view="today">Tasks</button>
            <button data-view="dashboard">Dashboard</button>
            <button data-view="settings">Settings</button>
        </nav>

        <!-- Tasks View -->
        <main id="view-today">
            <div class="date-selector no-print">
                <input type="date" id="dateInput" class="glass">
                <h2 id="displayDateText">Today</h2>
            </div>

            <div class="input-group glass no-print">
                <input type="text" id="quickTaskInput" placeholder="Add a quick task...">
                <button class="btn-icon" id="quickAddBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>

            <div id="taskList" class="task-list">
                <!-- Tasks will be injected here -->
            </div>

            <!-- Print Table (Hidden by default, shown via CSS in print) -->
            <table id="printTable">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Task Title</th>
                        <th>Objective</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody id="printTableBody"></tbody>
            </table>

            <!-- Print specific footer -->
            <div class="print-only print-footer hidden">
                <p>Notes / Desk Review Comments:</p>
                <div style="height: 100px; border-bottom: 1px dashed #ccc;"></div>
                <div style="margin-top: 2rem; display: flex; justify-content: space-between;">
                    <span>Signature: _______________________</span>
                    <span>Date: _______________________</span>
                </div>
            </div>
        </main>

        <!-- Dashboard View -->
        <main id="view-dashboard" class="hidden">
            <div class="metrics-grid">
                <div class="metric-card glass">
                    <span class="metric-value" id="metric-done">0</span>
                    <span class="text-muted">Completed Today</span>
                </div>
                <div class="metric-card glass">
                    <span class="metric-value" id="metric-score">0%</span>
                    <span class="text-muted">Productivity Score</span>
                </div>
            </div>

            <div class="chart-container glass" style="padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Activity Performance</h3>
                <canvas id="productivityChart"></canvas>
            </div>
        </main>

        <!-- Settings View -->
        <main id="view-settings" class="hidden">
            <div class="modal-content glass" style="margin: 0 auto; backdrop-filter: none; background: var(--bg-card);">
                <div class="form-group">
                    <label>Your Name</label>
                    <input type="text" id="setting-name" placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label>Email for Daily Summary</label>
                    <input type="email" id="setting-email" placeholder="email@example.com">
                </div>
                <div class="form-group">
                    <label>Closing Time (Summary notification)</label>
                    <input type="time" id="setting-time">
                </div>
                <div class="form-group">
                    <label>Timezone</label>
                    <select id="setting-timezone">
                        <option value="GMT+3">East Africa (GMT+3)</option>
                        <option value="GMT">UTC (GMT)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Default Categories (Comma separated)</label>
                    <input type="text" id="setting-categories">
                </div>
                <button class="btn-primary" id="saveSettingsBtn">Save Settings</button>
            </div>
        </main>

        <!-- Task Edit/Add Modal -->
        <div class="modal" id="taskModal">
            <div class="modal-content">
                <h3 id="modalTitle">Edit Task</h3>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="taskTitle">
                </div>
                <div class="form-group">
                    <label>Objective / Purpose</label>
                    <input type="text" id="taskObjective" placeholder="What do you want to achieve?">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="taskCategory"></select>
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <select id="taskPriority">
                        <option value="1">1 - Urgent / High</option>
                        <option value="2">2 - Important</option>
                        <option value="3" selected>3 - Normal</option>
                        <option value="4">4 - Low</option>
                        <option value="5">5 - Backlog</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="taskNotes" rows="3"></textarea>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn-primary" id="saveTaskBtn">Save</button>
                    <button class="btn-primary" style="background: var(--text-muted);"
                        onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Postpone Modal -->
        <div class="modal" id="postponeModal">
            <div class="modal-content">
                <h3>Postpone Task</h3>
                <p id="postponeTaskTitle" style="margin-bottom: 1rem; color: var(--text-muted);"></p>
                <div class="form-group">
                    <label>Move to Date</label>
                    <input type="date" id="postponeDate">
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-primary" id="confirmPostpone">Postpone</button>
                    <button class="btn-primary" style="background: var(--text-muted);"
                        onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>

</html>
