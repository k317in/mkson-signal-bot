const { createSignalClient } = require('./services/signalClient');
const { createGoogleSheetsClient } = require('./services/googleSheetsClient');
const { createEventService } = require('./services/eventService');
const { createSignupService } = require('./services/signupService');
const { createCommandRegistry } = require('./commands');

function createApp(config) {
  const signalClient = createSignalClient(config.signal);
  const sheetsClient = createGoogleSheetsClient(config.googleSheets);
  const eventService = createEventService({ sheetsClient });
  const signupService = createSignupService({ sheetsClient });
  const commandRegistry = createCommandRegistry({
    eventService,
    signupService,
    signalClient,
    adminNumbers: config.adminNumbers,
  });

  return {
    start() {
      console.log('MKSON Signal Bot project scaffold ready.');
      console.log('Command implementation and integrations are pending.');
    },
    dependencies: {
      signalClient,
      sheetsClient,
      eventService,
      signupService,
      commandRegistry,
    },
  };
}

module.exports = { createApp };
