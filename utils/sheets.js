require('dotenv').config();

const { google } = require('googleapis');

// Initialize auth and sheets client
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Fetches the column headers from a Google Sheet
 * @param {string} sheetName - The name of the sheet tab
 * @returns {Promise<string[]>} - Array of column headers
 */
async function getSheetHeaders(sheetName = 'crm') {
  try {
    // Get just the first row which contains headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
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
 * Maps data to column headers and appends to Google Sheet
 * @param {Object} data - The data object to append
 * @param {string} sheetName - The name of the sheet tab
 * @param {boolean} includeTimestamp - Whether to include a timestamp column
 * @returns {Promise<Object>} - Result of the operation
 */
async function appendToSheet(data, sheetName = 'crm', includeTimestamp = true) {
  try {
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
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
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
