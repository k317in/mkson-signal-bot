const USER_COMMANDS = ['join', 'leave', 'paid', 'list', 'help'];
const ADMIN_COMMANDS = ['admin set event', 'admin close event', 'admin reminder'];

function createCommandRegistry(dependencies) {
  return {
    dependencies,
    userCommands: USER_COMMANDS,
    adminCommands: ADMIN_COMMANDS,
    // Command handlers will be added in a future implementation phase.
  };
}

module.exports = {
  createCommandRegistry,
  USER_COMMANDS,
  ADMIN_COMMANDS,
};
