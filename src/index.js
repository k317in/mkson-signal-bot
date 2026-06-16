const { createApp } = require('./app');
const { loadConfig } = require('./config/env');

const config = loadConfig();
const app = createApp(config);

app.start();
