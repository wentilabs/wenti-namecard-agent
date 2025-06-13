import axios from 'axios';
// import { exec } from 'child_process';

// In Cloudflare Worker environment, telegramBotToken will be set later
// We'll access it from env in the functions that need it
let telegramBotToken;

// Helper function to get the bot token
async function getBotToken(env) {
  // For Cloudflare Worker environment
  if (typeof env !== 'undefined' && env.WENTI_SECRET_STORE) {
    return await env.WENTI_SECRET_STORE.get('TELEGRAM_BOT_TOKEN');
  }
  
  // For local development environment
  if (process.env && process.env.NODE_ENV === 'dev') {
    return process.env.LOCAL_TELEGRAM_BOT_TOKEN;
  }
  
  // For standard Node.js environment
  if (process.env) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }
  
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

async function startTelegramWebhook(customWebhookUrl, env) {
  // Get the token for this request
  telegramBotToken = await getBotToken(env);
  
  // Build the webhook URL from environment variables or parameters
  let webhookUrl = customWebhookUrl;
  
  // If no custom URL was provided, try to use environment variables
  if (!webhookUrl) {
    // For Cloudflare Worker environment
    if (env && env.WEBHOOKPATH) {
      // Use the env.WEBHOOKURL if available (for development)
      webhookUrl = env.WEBHOOKURL ? env.WEBHOOKURL + env.WEBHOOKPATH : null;
    }
    // For Node.js environment
    else if (process.env && process.env.WEBHOOKURL && process.env.WEBHOOKPATH) {
      webhookUrl = process.env.WEBHOOKURL + process.env.WEBHOOKPATH;
    }
  }
  
  if (!telegramBotToken || !webhookUrl) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN or webhook URL.');
  }

  // Using axios.post to set the webhook
  const url = `https://api.telegram.org/bot${telegramBotToken}/setWebhook`;

  try {
    const response = await axios.post(url, { url: webhookUrl });
    const data = response.data;

    if (!data.ok) {
      throw new Error(`Failed to set webhook: ${data.description}`);
    }

    console.log('Webhook set successfully to', webhookUrl);

    // Alternatively using curl as a double-check method
    // exec(`curl -F "url=${webhookUrl}" ${url}`, (error, stdout, stderr) => {
    //   if (error) {
    //     console.error(`Error setting webhook via curl: ${error.message}`);
    //     return;
    //   }
    //   if (stderr) {
    //     console.error(`stderr from curl: ${stderr}`);
    //     return;
    //   }
    //   console.log(`Webhook set via curl successfully: ${stdout}`);
    // });

    return data;
  } catch (error) {
    console.error('Error setting the Telegram webhook:', error);
    throw error;
  }
}

async function sendTelegramAction(chatId, action, env) {
  // Get the token for this request
  telegramBotToken = await getBotToken(env);
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendChatAction`;

  //   console.log('url: ', url);

  await axios.post(url, {
    chat_id: chatId,
    action,
  });
}

async function sendTelegramPhoto(chatId, photo, caption, env) {
  // Get the token for this request
  telegramBotToken = await getBotToken(env);
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;

  await axios.post(url, {
    chat_id: chatId,
    photo,
    caption,
  });
}

async function sendTelegramMessage(chatId, text, env) {
  // Get the token for this request
  telegramBotToken = await getBotToken(env);
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

  await axios.post(url, {
    chat_id: chatId,
    text,
  });
}

async function sendBatchTelegramMessage(chatIds, text, env) {
  // Get the token for this request
  telegramBotToken = await getBotToken(env);
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const batchSendMessagePromises = chatIds.map(chatId =>
    axios.post(url, {
      chat_id: chatId,
      text,
    }),
  );

  await Promise.all(batchSendMessagePromises);
}

async function getPhotoUrl(fileId, env) {
  // Get the token for this request
  telegramBotToken = await getBotToken(env);
  const url = `https://api.telegram.org/bot${telegramBotToken}/getFile`;
  const response = await axios.post(url, {
    file_id: fileId,
  });

  const filePath = response.data.result.file_path;
  return `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`;
}

async function getFilePath(fileId, env) {
  // Get the token for this request
  telegramBotToken = await getBotToken(env);
  const url = `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${fileId}`;

  const response = await axios.get(url);

  if (response.data) {
    return response.data.result.file_path;
  } else {
    throw new Error('Failed to get file path');
  }
}

export {
  sendTelegramAction,
  sendTelegramPhoto,
  sendTelegramMessage,
  sendBatchTelegramMessage,
  getPhotoUrl,
  getFilePath,
  startTelegramWebhook,
};
