import { agentExtraction } from '../../agent.js';
import { sendTelegramAction, sendTelegramMessage } from './utils.js';

/**
 * Handle Telegram webhook events
 * @param {object} event - The webhook event
 * @returns {object} - The response
 */
async function telegramHandler(event, env) {
  let chatId;

  // console.log(event)
  if (!event?.body) {
    return { body: 'nothing', statusCode: 200 };
  }

  try {
    let eventBody;

    // For Cloudflare Workers, the body is already parsed as an object
    if (typeof event.body === 'string') {
      // If body is a string (like in AWS Lambda), parse it
      eventBody = JSON.parse(event.body);
    } else {
      // If body is already an object (like in Cloudflare Workers), use it directly
      eventBody = event.body;
    }
    const { message } = eventBody;

    if (!message) {
      return { body: 'nothing', statusCode: 200 };
    }

    chatId = message.chat?.id || message.from?.id;
    console.log('telegramUserId: ', message.from.id);
    // console.log('chatId: ', chatId);
    // console.log('message: ', message);

    // Acknowledge receipt for photo messages
    if (message.photo) {
      await sendTelegramAction(chatId, 'typing', env);
      await sendTelegramMessage(
        chatId,
        'Extracting information from the image... This may take a few seconds.',
        env
      );

      // Run agent extraction
      const response = await agentExtraction(message, env);

      // Process the response from the agent
      if (response) {
        // Send the formatted message back to the user
        await sendTelegramMessage(chatId, response.message, env);

        // You can do additional processing here if needed
        // For example, save to database, update Google Sheets, etc.
        console.log('Extraction data:', response.rawData);
      } else {
        // Handle case where agent extraction failed
        await sendTelegramMessage(
          chatId,
          "Sorry, I couldn't process that image. Please try again with a clearer image of a business card.",
          env
        );
      }
    } else {
      await sendTelegramAction(chatId, 'typing', env);
      await sendTelegramMessage(
        chatId,
        'Please send me a photo of a business card to extract information.',
        env
      );
    }

    return {
      statusCode: 200,
      body: 'SUCCESS',
    };
  } catch (err) {
    console.log('an error occurred in telegram handler: ', err);

    // Try to send an error message to the user if possible
    try {
      if (chatId) {
        await sendTelegramMessage(
          chatId,
          'Sorry, an error occurred while processing your request. Please try again later.',
          env
        );
      }
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }

    return {
      statusCode: 500,
      body: 'ERROR: ' + err.message,
    };
  }
}

export { telegramHandler };
