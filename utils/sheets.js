import { google } from 'googleapis';

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

// Initialize sheets as null, we'll create it on demand
sheets = null;

/**
 * Fetches the column headers from a Google Sheet
 * @param {string} sheetName - The name of the sheet tab
 * @returns {Promise<string[]>} - Array of column headers
 */
async function getSheetHeaders(sheetName = 'crm', env) {
  try {
    // Ensure we have a sheets client
    const sheetsClient = await getSheetsClient(env);
    
    // Get the spreadsheet ID
    const spreadsheetId = await getSpreadsheetId(env);
    
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
async function getSpreadsheetId(env) {
  // Check if we're in Cloudflare Workers environment with KV
  if (env && env.WENTI_SECRET_STORE) {
    return await env.WENTI_SECRET_STORE.get('GOOGLE_SHEETS_ID') || '';
  }
  
  // Default to environment variables
  if (process.env) {
    return process.env.GOOGLE_SHEETS_ID || '';
  }
  
  return '';
}

/**
 * Gets or creates a sheets client, handling KV access if needed
 * @returns {Promise<object>} - The configured sheets client
 */
async function getSheetsClient(env) {
  // If we already have an initialized client, return it
  if (sheets) return sheets;
  
  let serviceAccountEmail;
  let serviceAccountKey;
  
  // For Cloudflare Workers environment with KV
  if (env && env.WENTI_SECRET_STORE) {
    serviceAccountEmail = await env.WENTI_SECRET_STORE.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') || '';
    serviceAccountKey = await env.WENTI_SECRET_STORE.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '';
  }
  // For Node.js environment
  else if (process.env) {
    serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  }
  
  if (!serviceAccountEmail || !serviceAccountKey) {
    throw new Error('Missing Google Service Account credentials');
  }
  
  // Create and cache the sheets client
  sheets = createSheetsClient(serviceAccountEmail, serviceAccountKey);
  return sheets;
}

/**
 * Maps data to column headers and appends to Google Sheet
 * @param {Object} data - The data object to append
 * @param {string} sheetName - The name of the sheet tab
 * @param {boolean} includeTimestamp - Whether to include a timestamp column
 * @returns {Promise<Object>} - Result of the operation
 */
async function appendToSheet(data, sheetName = 'crm', includeTimestamp = true, env) {
  try {
    // Get the sheets client
    const sheetsClient = await getSheetsClient(env);
    
    // Get the spreadsheet ID
    const spreadsheetId = await getSpreadsheetId(env);
    
    // Get the headers first
    const headers = await getSheetHeaders(sheetName, env);

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

export { appendToSheet, getSheetHeaders };
