# seaROCKS Daily To-Do & Productivity App

A premium, mobile-friendly personal operations planner with Google Sheets backend and productivity metrics.

## 🚀 Setup Instructions

### 1. Google Sheets & Apps Script Setup
1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Copy the contents of `Code.gs` from this project into the Apps Script editor.
4. Click **Deploy > New Deployment**.
5. Select Type: **Web App**.
6. Description: `seaROCKS API`.
7. Execute as: **Me**.
8. Who has access: **Anyone**. (This is necessary for the frontend to communicate with the sheet).
9. Copy the **Web App URL** provided after deployment.

### 2. Connect Frontend to Backend
1. Open `script.js` in your local project.
2. Replace the `const API_URL = '...';` at the top with your copied **Web App URL**.
3. Save the file.

### 3. Initialize Database & Triggers
1. In the Apps Script editor, select the function `initDatabase` and click **Run**.
2. Select the function `setupDailyTrigger` and click **Run**. 
   *This sets up your daily email summary at the default time (18:00).*

### 4. Running the App
- Open `index.html` in your browser.
- You can use any local server (like Live Server in VS Code) for the best experience.

## ✨ Features
- **Daily Planning**: Add and organize tasks by priority and category.
- **Productivity Score**: Track DONE vs IN_PROGRESS vs POSTPONED tasks.
- **Print Mode**: Clean, ink-friendly view for desk use.
- **Email Summaries**: Automated "Close of Day" notifications via Gmail.
- **Dark Mode**: Automatically adjusts to your system theme.

## 📊 Productivity Formula
- **DONE**: 1 point
- **IN_PROGRESS**: 0.5 points
- **POSTPONED**: 0 points
- **Score**: `(Total Points / Total Tasks) * 100`
