/**
 * seaROCKS Productivity App - Frontend Logic
 */

// --- CONFIGURATION ---
// Replace this with your actual Google Apps Script Web App URL after deployment
const API_URL = 'https://script.google.com/macros/s/AKfycbwY3cxICT0ibtDT5B0nDiC1MkOYEyZ2wjtoN_SbahWr_sly6cRQVuhkEbupOJL8YYQM/exec';

// --- STATE MANAGEMENT ---
let state = {
    currentView: 'today',
    selectedDate: new Date().toISOString().split('T')[0],
    tasks: [
        { task_id: 'S1', date: new Date().toISOString().split('T')[0], title: 'Welcome to seaROCKS', notes: 'This is a sample task', category: 'Personal', priority: 3, status: 'DONE' },
        { task_id: 'S2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], title: 'Yesterday\'s Effort', category: 'Office', priority: 2, status: 'DONE' }
    ],
    settings: {
        name: 'User',
        email: '',
        categories: 'Farm,Office,Finance,Personal',
        timezone: 'GMT+3',
        closing_time: '18:00'
    },
    editingTaskId: null,
    dashboardData: null
};

// --- API LAYER ---
async function apiCall(action, payload = {}) {
    if (!API_URL || API_URL.includes('AKfycbx_v0X8y0X8y0X8y0X8y0X8y0X8y0')) {
        console.warn("API_URL not configured correctly. Changes are local-only.");
        return { status: 'local' };
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload })
        });
        return { status: 'success' };
    } catch (e) {
        console.error("API Error:", e);
        return { status: 'error', message: e.message };
    }
}

// HYBRID SYNC (Updates local UI + Syncs to Sheet)
async function mockApiCall(action, payload) {
    console.log(`[SYNC] ${action}`, payload);

    if (action === 'getTasks') {
        // Implementation for future full-fetch
    }

    if (action === 'addTask') {
        const newTask = {
            task_id: 'T-' + Date.now(),
            ...payload,
            status: 'NOT_STARTED',
            order_index: state.tasks.length,
            created_at: new Date().toISOString()
        };
        state.tasks.push(newTask);
        payload.task_id = newTask.task_id; // Sync the same ID to Sheets
    }

    if (action === 'updateTask') {
        const idx = state.tasks.findIndex(t => t.task_id === payload.task_id);
        if (idx > -1) {
            state.tasks[idx] = { ...state.tasks[idx], ...payload, updated_at: new Date().toISOString() };
        }
    }

    // Trigger background sync
    apiCall(action, payload);

    return { success: true };
}

// --- DOM ELEMENTS ---
const viewToday = document.getElementById('view-today');
const viewDashboard = document.getElementById('view-dashboard');
const viewSettings = document.getElementById('view-settings');
const taskListEl = document.getElementById('taskList');
const quickInput = document.getElementById('quickTaskInput');
const dateInput = document.getElementById('dateInput');
const displayDateText = document.getElementById('displayDateText');

// --- APP LOGIC ---

function init() {
    setupEventListeners();
    dateInput.value = state.selectedDate;
    loadSettings();
    renderTasks();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('nav button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Quick Add
    document.getElementById('quickAddBtn').addEventListener('click', quickAddTask);
    quickInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') quickAddTask();
    });

    // Date Picker
    dateInput.addEventListener('change', (e) => {
        state.selectedDate = e.target.value;
        const d = new Date(state.selectedDate);
        const today = new Date().toISOString().split('T')[0];
        displayDateText.textContent = (state.selectedDate === today) ? 'Today' : d.toDateString();
        renderTasks();
    });

    // Print
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    // Save Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

    // Modal Actions
    document.getElementById('saveTaskBtn').addEventListener('click', saveTaskFromModal);
    document.getElementById('confirmPostpone').addEventListener('click', postponeTask);
}

function switchView(view) {
    state.currentView = view;

    // UI Update
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));

    viewToday.classList.toggle('hidden', view !== 'today');
    viewDashboard.classList.toggle('hidden', view !== 'dashboard');
    viewSettings.classList.toggle('hidden', view !== 'settings');

    if (view === 'dashboard') renderDashboard();
    if (view === 'today') renderTasks();
}

// --- TASK OPERATIONS ---

async function renderTasks() {
    // Filter tasks for selected date
    const dailyTasks = state.tasks
        .filter(t => t.date === state.selectedDate)
        .sort((a, b) => a.priority - b.priority);

    taskListEl.innerHTML = '';
    const printTableBody = document.getElementById('printTableBody');
    if (printTableBody) printTableBody.innerHTML = '';

    if (dailyTasks.length === 0) {
        taskListEl.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <p>No tasks for this day. Ready to plan?</p>
            </div>
        `;
        return;
    }

    dailyTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card glass ${task.status.toLowerCase()} ${task.status === 'DONE' ? 'done' : ''}`;

        const priorityLabel = ['Urgent', 'Important', 'Normal', 'Low', 'Backlog'][task.priority - 1];
        const statusLabel = task.status.replace('_', ' ');

        card.innerHTML = `
            <div class="btn-icon no-print" onclick="toggleStatus('${task.task_id}')" style="color: ${getStatusColor(task.status)}">
                ${getStatusIcon(task.status)}
            </div>
            <div class="task-main" onclick="openEditModal('${task.task_id}')">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="badge" style="background: var(--prio-${task.priority}); color: white;">${priorityLabel}</span>
                    <span class="badge" style="background: var(--bg-main); border: 1px solid var(--border);">${task.category}</span>
                    ${task.notes ? '<span class="text-muted">📝 Notes</span>' : ''}
                </div>
            </div>
            <div style="display: flex; gap: 0.25rem;" class="no-print">
                <button class="btn-icon" onclick="openPostponeModal('${task.task_id}')" title="Postpone">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
            </div>
        `;
        taskListEl.appendChild(card);

        if (printTableBody) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.date}</td>
                <td>${task.title}</td>
                <td>${task.category}</td>
                <td>${priorityLabel}</td>
                <td>${statusLabel}</td>
                <td>${task.notes || ''}</td>
            `;
            printTableBody.appendChild(row);
        }
    });
}

async function quickAddTask() {
    const title = quickInput.value.trim();
    if (!title) return;

    const payload = {
        title,
        date: state.selectedDate,
        category: 'Personal',
        priority: 3,
        notes: ''
    };

    await mockApiCall('addTask', payload);
    quickInput.value = '';
    renderTasks();
}

async function toggleStatus(taskId) {
    const task = state.tasks.find(t => t.task_id === taskId);
    if (!task) return;

    let nextStatus = 'NOT_STARTED';
    if (task.status === 'NOT_STARTED') nextStatus = 'IN_PROGRESS';
    else if (task.status === 'IN_PROGRESS') nextStatus = 'DONE';
    else nextStatus = 'NOT_STARTED';

    await mockApiCall('updateTask', { task_id: taskId, status: nextStatus });
    renderTasks();
}

// --- MODALS ---

function openEditModal(taskId) {
    const task = state.tasks.find(t => t.task_id === taskId);
    state.editingTaskId = taskId;

    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskNotes').value = task.notes;

    // Categories dropdown
    const catSelect = document.getElementById('taskCategory');
    catSelect.innerHTML = state.settings.categories.split(',').map(c =>
        `<option value="${c.trim()}" ${task.category === c.trim() ? 'selected' : ''}>${c.trim()}</option>`
    ).join('');

    document.getElementById('taskModal').classList.add('active');
}

async function saveTaskFromModal() {
    const update = {
        task_id: state.editingTaskId,
        title: document.getElementById('taskTitle').value,
        category: document.getElementById('taskCategory').value,
        priority: parseInt(document.getElementById('taskPriority').value),
        notes: document.getElementById('taskNotes').value
    };

    await mockApiCall('updateTask', update);
    closeModal();
    renderTasks();
}

function openPostponeModal(taskId) {
    const task = state.tasks.find(t => t.task_id === taskId);
    state.editingTaskId = taskId;

    document.getElementById('postponeTaskTitle').textContent = task.title;

    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('postponeDate').value = tomorrow.toISOString().split('T')[0];

    document.getElementById('postponeModal').classList.add('active');
}

async function postponeTask() {
    const newDate = document.getElementById('postponeDate').value;
    await mockApiCall('updateTask', {
        task_id: state.editingTaskId,
        date: newDate,
        status: 'POSTPONED',
        postponed_to_date: newDate
    });
    closeModal();
    renderTasks();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    state.editingTaskId = null;
}

// --- DASHBOARD ---

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = state.tasks.filter(t => t.date === today);
    const done = todayTasks.filter(t => t.status === 'DONE').length;

    const score = todayTasks.length > 0 ?
        Math.round(((done + todayTasks.filter(t => t.status === 'IN_PROGRESS').length * 0.5) / todayTasks.length) * 100) : 0;

    document.getElementById('metric-done').textContent = done;
    document.getElementById('metric-score').textContent = score + '%';

    renderChart();
}

let chartInstance = null;
function renderChart() {
    const ctx = document.getElementById('productivityChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const dayTasks = state.tasks.filter(t => t.date === dateStr);
        let dayScore = 0;

        if (dayTasks.length > 0) {
            const done = dayTasks.filter(t => t.status === 'DONE').length;
            const inProgress = dayTasks.filter(t => t.status === 'IN_PROGRESS').length;
            dayScore = Math.round(((done + inProgress * 0.5) / dayTasks.length) * 100);
        }

        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push(dayScore);
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Productivity %',
                data,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#60a5fa',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 20,
                    top: 10,
                    bottom: 0
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// --- SETTINGS ---

function loadSettings() {
    document.getElementById('setting-name').value = state.settings.name || '';
    document.getElementById('setting-email').value = state.settings.email || '';
    document.getElementById('setting-categories').value = state.settings.categories || '';
    document.getElementById('setting-time').value = state.settings.closing_time || '';
    document.getElementById('setting-timezone').value = state.settings.timezone || 'GMT+3';
}

async function saveSettings() {
    const payload = {
        name: document.getElementById('setting-name').value,
        email: document.getElementById('setting-email').value,
        closing_time: document.getElementById('setting-time').value,
        timezone: document.getElementById('setting-timezone').value,
        categories: document.getElementById('setting-categories').value
    };

    state.settings = { ...state.settings, ...payload };
    await apiCall('setSettings', payload);

    alert('Settings saved and synced to database!');
    switchView('today');
}

// --- HELPERS ---

function getStatusIcon(status) {
    if (status === 'DONE') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    if (status === 'IN_PROGRESS') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.5-7.5-7.5-7.5"/></svg>';
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
}

function getStatusColor(status) {
    if (status === 'DONE') return 'var(--status-done)';
    if (status === 'IN_PROGRESS') return 'var(--status-in-progress)';
    return 'var(--status-not-started)';
}

// Initialize
init();
