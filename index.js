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
