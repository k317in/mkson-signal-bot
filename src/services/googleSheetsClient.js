function createGoogleSheetsClient(config) {
  return {
    config,
    // Future home for Google Sheets API access.
  };
}

module.exports = { createGoogleSheetsClient };
