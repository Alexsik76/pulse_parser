function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const parameter = (e && e.parameter) ? e.parameter : {};
  const action = parameter.action || 'getHistory';
  
  if (action === 'getSchedules') {
    return getSchedules(ss);
  }
  
  return getHistory(ss);
}

/**
 * Diagnostic function to test data retrieval in Google Apps Script editor.
 * Run this function manually and check "Executions" log.
 */
function test_diagnostics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schedules = getSchedules(ss);
  console.log("Raw JSON Output:", schedules.getContent());
}

function getHistory(ss) {
  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  
  const rows = data.slice(1).map(row => ({
    date: row[0],
    sys: row[1],
    dia: row[2],
    pulse: row[3] 
  }));
  
  return createJsonResponse(rows);
}

function getSchedules(ss) {
  const sheet = ss.getSheetByName('Schedules');
  if (!sheet) {
    console.error("Sheet 'Schedules' not found!");
    return createJsonResponse([]);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return createJsonResponse([]);

  // Trim headers to avoid issues with hidden spaces
  const headers = data[0].map(h => String(h).trim());
  console.log("Detected Headers:", headers);

  const rows = data.slice(1).map((row, rowIndex) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  console.log(`Successfully parsed ${rows.length} rows`);
  return createJsonResponse(rows);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      new Date(), 
      data.sys, 
      data.dia, 
      data.pulse
    ]);
    
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
