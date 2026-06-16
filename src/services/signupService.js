function createSignupService({ sheetsClient }) {
  return {
    sheetsClient,
    // Future home for signup and payment records.
  };
}

module.exports = { createSignupService };
