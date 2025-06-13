require('dotenv').config();
const { telegramHandler } = require('./connectors/telegram');

exports.handler = async event => {
  const requestPath = event.requestContext.http.path;

  if (requestPath === '/telegram-webhook') {
    console.log('Webhook Called: telegram handler...');
    return telegramHandler(event);
  }

  console.log('no handler...');
  return {
    statusCode: 200,
  };
};

// Cloudflare Workers entry point using fetch event handler
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });

  async function handleRequest(request) {
    // Parse URL to get the path
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/telegram-webhook') {
      console.log('Webhook Called: telegram handler...');

      // Pass the request to telegramHandler with appropriate structure
      const event = {
        body: await request.json(),
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
    }

    // Default response for other routes
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }