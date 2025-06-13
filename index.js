require('dotenv').config();
const { telegramHandler } = require('./connectors/telegram');
const { startTelegramWebhook } = require('./connectors/telegram/utils');

// For AWS Lambda deployment
// exports.handler = async event => {
//   const requestPath = event.requestContext.http.path;

//   if (requestPath === '/telegram-webhook') {
//     console.log('Webhook Called: telegram handler...');
//     return telegramHandler(event);
//   }

//   console.log('no handler...');
//   return {
//     statusCode: 200,
//   };
// };

// Cloudflare Workers entry point
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Parse URL to get the path
  const url = new URL(request.url);
  const path = url.pathname;

  // Special route to set up webhook
  if (path === '/setup-webhook') {
    try {
      // Get the worker's own URL dynamically
      const workerUrl = new URL(request.url);
      const webhookUrl = `${workerUrl.protocol}//${workerUrl.host}/telegram-webhook`;
      
      // Set up the webhook
      await startTelegramWebhook(webhookUrl);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Webhook set successfully to: ${webhookUrl}` 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Error setting webhook: ${error.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Handle telegram webhook
  if (path === '/telegram-webhook') {
    console.log('Webhook Called: telegram handler...');

    try {
      // Parse body only if content type is application/json
      let body;
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json();
      } else {
        body = {};
      }

      const event = {
        body,
        requestContext: {
          http: {
            path: path
          }
        }
      };

      const result = await telegramHandler(event);

      // Return result formatted as a proper Response object
      return new Response(result.body, {
        status: result.statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in webhook handler:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Default response for other routes - show simple instructions
  return new Response(JSON.stringify({ 
    status: 'ok',
    message: 'Wenti Namecard Agent is running',
    setup: 'Visit /setup-webhook to configure the Telegram webhook automatically'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}