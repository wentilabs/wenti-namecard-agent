require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const ngrok = require('ngrok');
const app = express();

const { telegramHandler } = require('./connectors/telegram');
const { startTelegramWebhook } = require('./connectors/telegram/utils');

app.use(bodyParser.json());

app.post('/telegram-webhook', async (req, res) => {
  console.log('telegram handler...');
  const result = await telegramHandler(req);
  res.status(result.statusCode).send(result.body);
});

const PORT = process.env.PORT || 3000;

/**
 * Start an ngrok tunnel so that your local server is publically accessible.
 */
async function startNgrok() {
  try {
    const url = await ngrok.connect({
      addr: PORT,
      authtoken_from_env: true,
    });
    console.log('Ngrok tunnel established at:', url);
    return url;
  } catch (err) {
    console.error('Ngrok error:', err);
    process.exit(1);
  }
}

/**
 * Starts the local server:
 * 1. Creates an ngrok tunnel.
 * 2. Sets the Telegram webhook to point to the tunnel endpoint.
 * 3. Starts the HTTP server.
 * 4. Optionally notifies the admin.
 */
async function startServer() {
  const ngrokUrl = await startNgrok();
  console.log('Ngrok URL:', ngrokUrl);
  const webhookUrl = `${ngrokUrl}/telegram-webhook`;
  await startTelegramWebhook(webhookUrl);

  app.listen(PORT, () => {
    console.log(`Local test server running on port ${PORT}`);
  });
}

startServer();
