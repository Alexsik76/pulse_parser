# BP Tracker & Treatment Planner

A minimalist, privacy-focused Progressive Web App (PWA) for logging blood pressure and managing treatment schedules.

## 🚀 Features

- **Blood Pressure Logging**: Rapid entry of SYS, DIA, and Pulse using a native-like wheel picker.
- **Visual Analytics**: Interactive history chart powered by Chart.js.
- **Treatment Schedules**: Dynamic treatment plans fetched from Google Sheets with nested grouping (Time of Day → Medicine → Conditions).
- **Serverless Backend**: Uses Google Apps Script as a lightweight API to store and retrieve data from Google Sheets.
- **Offline Capable**: PWA functionality with Service Worker for access without an internet connection.
- **Easy Deployment**: Optimized for GitHub Pages.

## 🛠 Tech Stack

- **Frontend**: Vanilla JS (ES6+), HTML5, CSS3.
- **Libraries**: 
  - [MobileSelect](https://github.com/onlywish/mobile-select) (UI pickers)
  - [Chart.js](https://www.chartjs.org/) (Data visualization)
- **Backend**: Google Apps Script (GAS).
- **Storage**: Google Sheets.

## 📋 Setup & Deployment

### 1. Google Sheets Setup
Create a Google Sheet with two sheets:
- **History** (Default/First sheet): Columns: `Date`, `SYS`, `DIA`, `PULSE`.
- **Schedules**: Columns: `SchemaID`, `TimeOfDay`, `Medicine`, `Amount`, `Conditions`, `Other`.

### 2. Google Apps Script Deployment
1. Open your Google Sheet.
2. Go to `Extensions` > `Apps Script`.
3. Paste the code from `parser.gs`.
4. Click `Deploy` > `New Deployment`.
5. Select `Web App`.
6. Set `Execute as` to `Me` and `Who has access` to `Anyone`.
7. Copy the **Web App URL**.

### 3. Frontend Configuration
In `app.js`, update the `APP_CONFIG.SCRIPT_URL` with your copied Web App URL:
```javascript
const APP_CONFIG = {
    SCRIPT_URL: "YOUR_APPS_SCRIPT_URL_HERE",
    // ...
};
```

### 4. GitHub Pages Deployment
1. Push the code to a GitHub repository.
2. Enable GitHub Pages in `Settings` > `Pages`.
3. Your app will be live at `https://<username>.github.io/<repo-name>/`.

## 🔒 Privacy
All data is stored directly in your personal Google Drive. No third-party servers are involved in data processing.
