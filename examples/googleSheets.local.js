const { createGoogleSheetsClient } = require('../src/services/googleSheetsClient');

function createLocalSheetsApi(initialSheets) {
  const sheets = new Map(Object.entries(initialSheets));

  return {
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
          const rows = sheets.get(range) || [];
          sheets.set(range, rows.concat(requestBody.values));
          return { data: {} };
        },
        async update({ range, requestBody }) {
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

async function main() {
  const sheetsApi = createLocalSheetsApi({
    event: [
      ['Event_ID', 'Event_Name', 'Event_Date', 'Event_Time', 'Event_Location', 'Event_Status'],
      ['event-001', 'Wednesday Run', '2026-06-17', '20:00', 'MKSON Court', 'open'],
    ],
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
    template: [
      ['Template_Key', 'Template_Content'],
      ['signup_confirmation', 'Thanks {{name}}, you are on the list.'],
    ],
  });

  const sheetsClient = createGoogleSheetsClient(
    {
      spreadsheetId: 'local-example',
      sheets: {
        event: 'event',
        signup: 'signup',
        template: 'template',
      },
    },
    { sheetsApi }
  );

  console.log('Open event:', await sheetsClient.getOpenEvent());

  await sheetsClient.createSignup({
    eventId: 'event-001',
    name: 'Alex Example',
    number: '+441111111111',
    addedByNumber: '+441111111111',
  });

  console.log('Signup list:', await sheetsClient.getSignupList('event-001'));

  console.log(
    'Marked paid:',
    await sheetsClient.markPaid(
      { eventId: 'event-001', signupName: 'Alex Example' },
      { paidByNumber: '+441111111111' }
    )
  );

  console.log('Template:', await sheetsClient.getTemplate('signup_confirmation'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
