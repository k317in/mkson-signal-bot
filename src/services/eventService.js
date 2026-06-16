function createEventService({ sheetsClient }) {
  return {
    sheetsClient,
    getOpenEvent: sheetsClient.getOpenEvent,
    getTemplate: sheetsClient.getTemplate,
  };
}

module.exports = { createEventService };
