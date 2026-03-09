/**
 * seaROCKS / Personal Ops - Daily To-Do & Productivity Web App
 * Backend: Google Apps Script
 */

const CONFIG = {
  SHEET_NAME_TASKS: 'Tasks',
  SHEET_NAME_SETTINGS: 'Settings',
  DEFAULT_TIMEZONE: 'GMT+3'
};

/**
 * Handle POST requests (API Endpoints)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload;
    
    let result;
    
    switch (action) {
      case 'getTasks':
        result = getTasks(payload.date);
        break;
      case 'addTask':
        result = addTask(payload);
        break;
      case 'updateTask':
        result = updateTask(payload);
        break;
      case 'deleteTask':
        result = deleteTask(payload.task_id);
        break;
      case 'getDashboard':
        result = getDashboard(payload.days || 7);
        break;
      case 'getSettings':
        result = getSettings();
        break;
      case 'setSettings':
        result = setSettings(payload);
        break;
      default:
        throw new Error('Invalid action: ' + action);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (Alternative for simple fetches or Health check)
 */
function doGet(e) {
  return ContentService.createTextOutput("API is active. Please use POST for data operations.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Self-healing Database Check
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tasks Sheet
  let taskSheet = ss.getSheetByName(CONFIG.SHEET_NAME_TASKS);
  if (!taskSheet) {
    taskSheet = ss.insertSheet(CONFIG.SHEET_NAME_TASKS);
    taskSheet.appendRow([
      'task_id', 'date', 'title', 'objective', 'notes', 'category', 'priority', 'status', 'order_index',
      'created_at', 'updated_at', 'completed_at', 'postponed_to_date'
    ]);
    taskSheet.setFrozenRows(1);
  } else {
    // Migration: Check if 'objective' column exists, if not, add it
    const headers = taskSheet.getRange(1, 1, 1, taskSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf('objective') === -1) {
      // Insert 'objective' after 'title' (which is index 2, so column 4)
      const titleIndex = headers.indexOf('title');
      if (titleIndex > -1) {
        taskSheet.insertColumnAfter(titleIndex + 1);
        taskSheet.getRange(1, titleIndex + 2).setValue('objective');
      } else {
        // Fallback: append to end if title not found for some reason
        taskSheet.getRange(1, taskSheet.getLastColumn() + 1).setValue('objective');
      }
    }
  }

  // Settings Sheet
  let settingsSheet = ss.getSheetByName(CONFIG.SHEET_NAME_SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(CONFIG.SHEET_NAME_SETTINGS);
    settingsSheet.appendRow(['key', 'value']);
    const defaultSettings = [
      ['name', 'User'],
      ['email', ''],
      ['closing_time', '18:00'],
      ['timezone', CONFIG.DEFAULT_TIMEZONE],
      ['categories', 'Farm,Office,Finance,Personal']
    ];
    defaultSettings.forEach(row => settingsSheet.appendRow(row));
  }
  
  return { status: 'Database Initialized' };
}

/**
 * TASK OPERATIONS
 */

function getTasks(dateStr) {
  initDatabase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_TASKS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows
    .map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        // Ensure date fields are returned as YYYY-MM-DD strings
        if ((h === 'date' || h === 'postponed_to_date') && val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else if (val instanceof Date) {
          val = val.toISOString();
        }
        obj[h] = val;
      });
      return obj;
    })
    .filter(task => {
      // If dateStr is provided, filter by that date
      if (!dateStr) return true;
      // Both should be in YYYY-MM-DD format now
      return task.date === dateStr;
    })
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

function addTask(payload) {
  initDatabase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_TASKS);
  
  // Use provided ID or generate one
  const taskId = payload.task_id || ('T-' + new Date().getTime());
  const now = new Date().toISOString();
  
  // Format date to string to prevent Sheet auto-formatting issues
  const taskDate = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  const newRow = [
    taskId,
    taskDate,
    payload.title,
    payload.objective || '',
    payload.notes || '',
    payload.category || 'Personal',
    payload.priority || 3,
    payload.status || 'NOT_STARTED',
    payload.order_index || 0,
    now,
    now,
    '',
    ''
  ];
  
  sheet.appendRow(newRow);
  return { status: 'success', task_id: taskId };
}

function updateTask(payload) {
  initDatabase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_TASKS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const taskIdIndex = headers.indexOf('task_id');
  
  if (taskIdIndex === -1) throw new Error('task_id column not found');

  for (let i = 1; i < data.length; i++) {
    if (data[i][taskIdIndex].toString() === payload.task_id.toString()) {
      const now = new Date().toISOString();
      const rowNumber = i + 1;
      
      // Update fields provided in payload
      Object.keys(payload).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex > -1 && key !== 'task_id') {
          let val = payload[key];
          // Special handling for dates if needed, but strings are usually fine
          sheet.getRange(rowNumber, colIndex + 1).setValue(val);
        }
      });
      
      // Automatic fields
      const updatedAtIndex = headers.indexOf('updated_at');
      if (updatedAtIndex > -1) {
        sheet.getRange(rowNumber, updatedAtIndex + 1).setValue(now);
      }
      
      if (payload.status === 'DONE') {
        const completedAtIndex = headers.indexOf('completed_at');
        if (completedAtIndex > -1) {
          sheet.getRange(rowNumber, completedAtIndex + 1).setValue(now);
        }
      }
      
      return { status: 'success' };
    }
  }
  throw new Error('Task not found with ID: ' + payload.task_id);
}

function deleteTask(taskId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_TASKS);
  const data = sheet.getDataRange().getValues();
  const taskIdIndex = data[0].indexOf('task_id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][taskIdIndex] === taskId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

/**
 * SETTINGS OPERATIONS
 */

function getSettings() {
  initDatabase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_SETTINGS);
  const data = sheet.getDataRange().getValues().slice(1);
  const settings = {};
  data.forEach(row => settings[row[0]] = row[1]);
  return settings;
}

function setSettings(payload) {
  initDatabase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME_SETTINGS);
  const data = sheet.getDataRange().getValues();
  
  Object.keys(payload).forEach(key => {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(payload[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, payload[key]]);
    }
  });
  
  // Re-sync triggers if closing time or email changed
  setupDailyTrigger();
  
  return { success: true };
}

/**
 * DASHBOARD & METRICS
 */

function getDashboard(days) {
  initDatabase();
  const tasks = getTasks(); // get all
  const today = new Date().toISOString().split('T')[0];
  
  // Metrics for "today"
  const todayTasks = tasks.filter(t => t.date.split('T')[0] === today);
  const metrics = calculateMetrics(todayTasks);
  
  // Trend data
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.date.split('T')[0] === dStr);
    trend.push({
      date: dStr,
      score: calculateMetrics(dayTasks).score,
      completed: dayTasks.filter(t => t.status === 'DONE').length
    });
  }
  
  return { today: metrics, trend: trend };
}

function calculateMetrics(taskList) {
  if (taskList.length === 0) return { total: 0, done: 0, in_progress: 0, postponed: 0, score: 0 };
  
  const done = taskList.filter(t => t.status === 'DONE').length;
  const inProgress = taskList.filter(t => t.status === 'IN_PROGRESS').length;
  const postponed = taskList.filter(t => t.status === 'POSTPONED').length;
  
  const score = (done * 1 + inProgress * 0.5) / taskList.length;
  
  return {
    total: taskList.length,
    done: done,
    in_progress: inProgress,
    postponed: postponed,
    score: Math.round(score * 100)
  };
}

/**
 * EMAIL NOTIFICATIONS & TRIGGERS
 */

function setupDailyTrigger() {
  const settings = getSettings();
  const closingTime = settings.closing_time || '18:00';
  const [hours, minutes] = closingTime.split(':').map(Number);
  
  // Clear existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sendDailySummary') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Create new daily trigger
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .atHour(hours)
    .nearMinute(minutes)
    .everyDays(1)
    .create();
}

function sendDailySummary() {
  const settings = getSettings();
  const email = settings.email;
  if (!email) return;
  
  const today = new Date().toISOString().split('T')[0];
  const tasks = getTasks(today);
  const metrics = calculateMetrics(tasks);
  
  const unfinished = tasks.filter(t => t.status !== 'DONE' && t.status !== 'POSTPONED');
  
  let body = `
    <h2>Daily Productivity Summary - ${today}</h2>
    <p><strong>Name:</strong> ${settings.name}</p>
    <p><strong>Productivity Score:</strong> ${metrics.score}%</p>
    <ul>
      <li>Total Planned: ${metrics.total}</li>
      <li>Completed: ${metrics.done}</li>
      <li>In Progress: ${metrics.in_progress}</li>
      <li>Postponed: ${metrics.postponed}</li>
    </ul>
  `;
  
  if (unfinished.length > 0) {
    body += `<h3>Unfinished Tasks:</h3><ul>`;
    unfinished.forEach(t => {
      body += `<li>[${t.status}] ${t.title} (Priority: ${t.priority})</li>`;
    });
    body += `</ul>`;
  } else {
    body += `<p>🎉 Everything completed! Well done.</p>`;
  }
  
  body += `<br><p>Sent by seaROCKS Productivity App</p>`;
  
  MailApp.sendEmail({
    to: email,
    subject: `Close of Day Summary: ${today} (${metrics.score}%)`,
    htmlBody: body
  });
}
