const SHEET_COLUMNS = {
  event: [
    'Event_ID',
    'Event_Name',
    'Event_Date',
    'Event_Time',
    'Event_Location',
    'Event_Status',
  ],
  signup: [
    'Event_ID',
    'Signup_Name',
    'Signup_Number',
    'Added_By_Number',
    'Join_Time',
    'Signup_Status',
    'Paid_Status',
    'Paid_By_Number',
    'Paid_Time',
  ],
  template: ['Template_Key', 'Template_Content'],
};

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function createGoogleSheetsClient(config, dependencies = {}) {
  let sheetsApi = dependencies.sheetsApi;
  const spreadsheetId = config.spreadsheetId;
  const sheetNames = {
    event: config.sheets?.event || 'event',
    signup: config.sheets?.signup || 'signup',
    template: config.sheets?.template || 'template',
  };

  async function getOpenEvent() {
    const events = await readSheet(sheetNames.event);
    return events.find((event) => isOpen(event.Event_Status)) || null;
  }

  async function createSignup(signup) {
    const row = buildSignupRow(signup);

    await getSheetsApi().spreadsheets.values.append({
      spreadsheetId,
      range: sheetNames.signup,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    return rowToRecord(SHEET_COLUMNS.signup, row);
  }

  async function markPaid(criteria, payment = {}) {
    const lookup = normalizePaymentCriteria(criteria);
    const rows = await readRawSheet(sheetNames.signup);
    const headers = rows[0] || SHEET_COLUMNS.signup;
    const dataRows = rows.slice(1);
    const rowIndex = dataRows.findIndex((row) => signupMatches(rowToRecord(headers, row), lookup));

    if (rowIndex === -1) {
      return null;
    }

    const row = padRow(dataRows[rowIndex], headers.length);
    const paidStatusIndex = headers.indexOf('Paid_Status');
    const paidByIndex = headers.indexOf('Paid_By_Number');
    const paidTimeIndex = headers.indexOf('Paid_Time');

    if (paidStatusIndex === -1) {
      throw new Error('Signup sheet is missing Paid_Status column.');
    }

    row[paidStatusIndex] = payment.paidStatus || 'PAID';

    if (paidByIndex !== -1) {
      row[paidByIndex] = payment.paidByNumber || lookup.signupNumber || '';
    }

    if (paidTimeIndex !== -1) {
      row[paidTimeIndex] = payment.paidTime || new Date().toISOString();
    }

    await getSheetsApi().spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetNames.signup}!A${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return rowToRecord(headers, row);
  }

  async function getSignupList(eventId) {
    const signups = await readSheet(sheetNames.signup);

    if (!eventId) {
      return signups;
    }

    return signups.filter((signup) => signup.Event_ID === eventId);
  }

  async function getTemplate(templateKey) {
    const templates = await readSheet(sheetNames.template);

    if (!templateKey) {
      return templates;
    }

    return templates.find((template) => template.Template_Key === templateKey) || null;
  }

  async function readSheet(sheetName) {
    const rows = await readRawSheet(sheetName);
    const headers = rows[0] || [];

    return rows.slice(1).map((row) => rowToRecord(headers, row));
  }

  async function readRawSheet(sheetName) {
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is required.');
    }

    const response = await getSheetsApi().spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    return response.data.values || [];
  }

  return {
    config,
    getOpenEvent,
    createSignup,
    markPaid,
    getSignupList,
    getTemplate,
  };

  function getSheetsApi() {
    if (!sheetsApi) {
      sheetsApi = createSheetsApi(config);
    }

    return sheetsApi;
  }
}

function createSheetsApi(config) {
  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    keyFile: config.credentialsPath,
    credentials: config.serviceAccount,
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

function buildSignupRow(signup) {
  if (!signup || typeof signup !== 'object') {
    throw new TypeError('createSignup requires a signup object.');
  }

  return [
    signup.eventId || signup.Event_ID || '',
    signup.signupName || signup.Signup_Name || signup.name || '',
    signup.signupNumber || signup.Signup_Number || signup.number || '',
    signup.addedByNumber || signup.Added_By_Number || '',
    signup.joinTime || signup.Join_Time || new Date().toISOString(),
    signup.signupStatus || signup.Signup_Status || 'JOINED',
    signup.paidStatus || signup.Paid_Status || 'UNPAID',
    signup.paidByNumber || signup.Paid_By_Number || '',
    signup.paidTime || signup.Paid_Time || '',
  ];
}

function rowToRecord(headers, row) {
  return headers.reduce((record, header, index) => {
    record[header] = row[index] || '';
    return record;
  }, {});
}

function isOpen(status) {
  return String(status || '').trim().toLowerCase() === 'open';
}

function normalizePaymentCriteria(criteria) {
  if (typeof criteria === 'string') {
    return { signupName: criteria };
  }

  if (!criteria || typeof criteria !== 'object') {
    throw new TypeError('markPaid requires a signup name or criteria object.');
  }

  return {
    eventId: criteria.eventId || criteria.Event_ID,
    signupName: criteria.signupName || criteria.Signup_Name || criteria.name,
    signupNumber: criteria.signupNumber || criteria.Signup_Number || criteria.number,
  };
}

function signupMatches(signup, lookup) {
  if (lookup.eventId && signup.Event_ID !== lookup.eventId) {
    return false;
  }

  if (lookup.signupNumber) {
    return signup.Signup_Number === lookup.signupNumber;
  }

  if (lookup.signupName) {
    return signup.Signup_Name.toLowerCase() === lookup.signupName.toLowerCase();
  }

  return false;
}

function padRow(row, length) {
  return Array.from({ length }, (_, index) => row[index] || '');
}

module.exports = { createGoogleSheetsClient };
