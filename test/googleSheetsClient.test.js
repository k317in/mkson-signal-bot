const test = require('node:test');
const assert = require('node:assert/strict');
const { createGoogleSheetsClient } = require('../src/services/googleSheetsClient');

function createFakeSheetsApi(initialSheets) {
  const sheets = new Map(Object.entries(initialSheets));
  const appends = [];
  const updates = [];

  return {
    appends,
    updates,
    spreadsheets: {
      values: {
        async get({ range }) {
          return {
            data: {
              values: sheets.get(range) || [],
            },
          };
        },
        async append({ range, requestBody }) {
          appends.push({ range, values: requestBody.values });
          const rows = sheets.get(range) || [];
          sheets.set(range, rows.concat(requestBody.values));
          return { data: {} };
        },
        async update({ range, requestBody }) {
          updates.push({ range, values: requestBody.values });
          const [sheetName, cell] = range.split('!');
          const rowNumber = Number(cell.replace(/[^\d]/g, ''));
          const rows = sheets.get(sheetName) || [];
          rows[rowNumber - 1] = requestBody.values[0];
          sheets.set(sheetName, rows);
          return { data: {} };
        },
      },
    },
  };
}

function createClient(initialSheets) {
  const sheetsApi = createFakeSheetsApi(initialSheets);
  const sheetsClient = createGoogleSheetsClient(
    {
      spreadsheetId: 'test-spreadsheet',
      sheets: {
        event: 'event',
        signup: 'signup',
        template: 'template',
      },
    },
    { sheetsApi }
  );

  return { sheetsClient, sheetsApi };
}

test('getOpenEvent returns the first open event', async () => {
  const { sheetsClient } = createClient({
    event: [
      ['Event_ID', 'Event_Name', 'Event_Date', 'Event_Time', 'Event_Location', 'Event_Status'],
      ['event-001', 'Closed Run', '2026-06-16', '20:00', 'MKSON Court', 'closed'],
      ['event-002', 'Open Run', '2026-06-17', '20:00', 'MKSON Court', 'open'],
    ],
  });

  assert.deepEqual(await sheetsClient.getOpenEvent(), {
    Event_ID: 'event-002',
    Event_Name: 'Open Run',
    Event_Date: '2026-06-17',
    Event_Time: '20:00',
    Event_Location: 'MKSON Court',
    Event_Status: 'open',
  });
});

test('createSignup appends a signup row using documented columns', async () => {
  const { sheetsClient, sheetsApi } = createClient({
    signup: [
      [
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
    ],
  });

  const signup = await sheetsClient.createSignup({
    eventId: 'event-001',
    name: 'Alex Example',
    number: '+441111111111',
    addedByNumber: '+441111111111',
    joinTime: '2026-06-17T10:00:00.000Z',
  });

  assert.equal(signup.Event_ID, 'event-001');
  assert.equal(signup.Signup_Status, 'JOINED');
  assert.equal(signup.Paid_Status, 'UNPAID');
  assert.deepEqual(sheetsApi.appends[0].values[0], [
    'event-001',
    'Alex Example',
    '+441111111111',
    '+441111111111',
    '2026-06-17T10:00:00.000Z',
    'JOINED',
    'UNPAID',
    '',
    '',
  ]);
});

test('markPaid updates Paid_Status and payment metadata', async () => {
  const { sheetsClient, sheetsApi } = createClient({
    signup: [
      [
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
      ['event-001', 'Alex Example', '+441111111111', '+441111111111', '', 'JOINED', 'UNPAID', '', ''],
    ],
  });

  const paidSignup = await sheetsClient.markPaid(
    { eventId: 'event-001', signupName: 'Alex Example' },
    { paidByNumber: '+441111111111', paidTime: '2026-06-17T11:00:00.000Z' }
  );

  assert.equal(paidSignup.Paid_Status, 'PAID');
  assert.equal(paidSignup.Paid_By_Number, '+441111111111');
  assert.equal(paidSignup.Paid_Time, '2026-06-17T11:00:00.000Z');
  assert.equal(sheetsApi.updates[0].range, 'signup!A2');
});

test('getSignupList returns signups for an event', async () => {
  const { sheetsClient } = createClient({
    signup: [
      ['Event_ID', 'Signup_Name', 'Signup_Number'],
      ['event-001', 'Alex Example', '+441111111111'],
      ['event-002', 'Sam Sample', '+442222222222'],
    ],
  });

  assert.deepEqual(await sheetsClient.getSignupList('event-001'), [
    {
      Event_ID: 'event-001',
      Signup_Name: 'Alex Example',
      Signup_Number: '+441111111111',
    },
  ]);
});

test('getTemplate reads the template sheet', async () => {
  const { sheetsClient } = createClient({
    template: [
      ['Template_Key', 'Template_Content'],
      ['signup_confirmation', 'Thanks {{name}}, you are on the list.'],
    ],
  });

  assert.deepEqual(await sheetsClient.getTemplate('signup_confirmation'), {
    Template_Key: 'signup_confirmation',
    Template_Content: 'Thanks {{name}}, you are on the list.',
  });
});
