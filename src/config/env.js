function parseList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadConfig(env = process.env) {
  const serviceAccount =
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY
      ? {
          client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      : undefined;

  return {
    nodeEnv: env.NODE_ENV || 'development',
    port: Number(env.PORT || 3000),
    logLevel: env.LOG_LEVEL || 'info',
    signal: {
      restUrl: env.SIGNAL_CLI_REST_URL || 'http://localhost:8080',
      botNumber: env.SIGNAL_BOT_NUMBER || '',
      groupId: env.SIGNAL_GROUP_ID || '',
    },
    googleSheets: {
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
      credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS || './config/google-service-account.json',
      serviceAccount,
      sheets: {
        event: env.GOOGLE_SHEETS_EVENT_SHEET || 'event',
        signup: env.GOOGLE_SHEETS_SIGNUP_SHEET || 'signup',
        template: env.GOOGLE_SHEETS_TEMPLATE_SHEET || 'template',
      },
    },
    adminNumbers: parseList(env.ADMIN_NUMBERS),
  };
}

module.exports = { loadConfig };
