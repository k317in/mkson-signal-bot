function createEventService({ sheetsClient }) {
  return {
    sheetsClient,
    // Future home for event records and templates.
  };
}

module.exports = { createEventService };
