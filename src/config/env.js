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
    },
    adminNumbers: parseList(env.ADMIN_NUMBERS),
  };
}

module.exports = { loadConfig };
