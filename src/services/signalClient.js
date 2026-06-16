function createSignalClient(config) {
  return {
    config,
    // Future home for Signal CLI REST API calls.
  };
}

module.exports = { createSignalClient };
