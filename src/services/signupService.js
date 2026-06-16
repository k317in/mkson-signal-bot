function createSignupService({ sheetsClient }) {
  return {
    sheetsClient,
    createSignup: sheetsClient.createSignup,
    markPaid: sheetsClient.markPaid,
    getSignupList: sheetsClient.getSignupList,
  };
}

module.exports = { createSignupService };
