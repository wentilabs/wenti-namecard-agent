import { telegramHandler } from './connectors/telegram';
import { startTelegramWebhook } from './connectors/telegram/utils';

// Cloudflare Workers entry point
export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
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
      await startTelegramWebhook(webhookUrl, env);
      
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

      const result = await telegramHandler(event, env);

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