const { google } = require('googleapis');

/**
 * Creates a Google Sheets client with JWT authentication
 * @param {string} serviceAccountEmail - The Google service account email
 * @param {string} serviceAccountKey - The private key for the service account
 * @returns {object} - The configured sheets client
 */
function createSheetsClient(serviceAccountEmail, serviceAccountKey) {
  // Initialize auth with the provided credentials
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: serviceAccountKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Default initialization from environment variables
let sheets;

// For Cloudflare Workers environment - will be replaced with KV access
if (typeof WENTI_SECRET_STORE !== 'undefined') {
  // We'll initialize in the appendToSheet function to ensure async KV access works
  sheets = null;
} else {
  // Standard Node.js environment
  sheets = createSheetsClient(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

/**
 * Fetches the column headers from a Google Sheet
 * @param {string} sheetName - The name of the sheet tab
 * @returns {Promise<string[]>} - Array of column headers
 */
async function getSheetHeaders(sheetName = 'crm') {
  try {
    // Ensure we have a sheets client
    const sheetsClient = await getSheetsClient();
    
    // Get the spreadsheet ID
    const spreadsheetId = await getSpreadsheetId();
    
    // Get just the first row which contains headers
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`,
    });

    // Return the headers, or empty array if no data found
    const headers = response.data.values && response.data.values[0] ? response.data.values[0] : [];

    return headers;
  } catch (error) {
    console.error('Error fetching sheet headers:', error);
    throw error;
  }
}

/**
 * Gets the spreadsheet ID from environment or KV store
 * @returns {Promise<string>} - The spreadsheet ID
 */
async function getSpreadsheetId() {
  // Check if we're in Cloudflare Workers environment with KV
  if (typeof WENTI_SECRET_STORE !== 'undefined') {
    return await WENTI_SECRET_STORE.get('GOOGLE_SHEETS_ID') || '';
  }
  
  // Default to environment variables
  return process.env.GOOGLE_SHEETS_ID || '';
}

/**
 * Gets or creates a sheets client, handling KV access if needed
 * @returns {Promise<object>} - The configured sheets client
 */
async function getSheetsClient() {
  // If we already have an initialized client, return it
  if (sheets) return sheets;
  
  // For Cloudflare Workers environment with KV
  if (typeof WENTI_SECRET_STORE !== 'undefined') {
    const serviceAccountEmail = await WENTI_SECRET_STORE.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') || '';
    const serviceAccountKey = await WENTI_SECRET_STORE.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '';
    
    // Create and cache the sheets client
    sheets = createSheetsClient(serviceAccountEmail, serviceAccountKey);
    return sheets;
  }
  
  // Fallback to environment variables (but this should have been handled in initial setup)
  return createSheetsClient(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

/**
 * Maps data to column headers and appends to Google Sheet
 * @param {Object} data - The data object to append
 * @param {string} sheetName - The name of the sheet tab
 * @param {boolean} includeTimestamp - Whether to include a timestamp column
 * @returns {Promise<Object>} - Result of the operation
 */
async function appendToSheet(data, sheetName = 'crm', includeTimestamp = true) {
  try {
    // Get the sheets client
    const sheetsClient = await getSheetsClient();
    
    // Get the spreadsheet ID
    const spreadsheetId = await getSpreadsheetId();
    
    // Get the headers first
    const headers = await getSheetHeaders(sheetName);

    if (headers.length === 0) {
      throw new Error('No headers found in the sheet');
    }

    // Create a row array based on the headers
    const rowData = headers.map((header, index) => {
      // If first column and includeTimestamp is true, add timestamp
      if (index === 0 && includeTimestamp) {
        return new Date().toISOString();
      }

      // Convert header to a likely key format (lowercase, replace spaces with underscores)
      const key = header.toLowerCase().replace(/\s+/g, '_');

      // Special handling for phone/mobile numbers (add apostrophe to preserve formatting)
      if (['phone', 'mobile', 'mobile_number', 'phone_number'].includes(key) && data[key]) {
        return "'" + data[key];
      }

      // Return the value if it exists in data, empty string otherwise
      return data[key] || '';
    });

    // Append the row to the sheet
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [rowData],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error appending to sheet:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { appendToSheet, getSheetHeaders };
