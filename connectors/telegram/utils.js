require('dotenv').config();
const axios = require('axios').default;

const { exec } = require('child_process');

const telegramBotToken = process.env.NODE_ENV === 'dev'
? process.env.LOCAL_TELEGRAM_BOT_TOKEN
: process.env.TELEGRAM_BOT_TOKEN;

if (!telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

async function startTelegramWebhook(customWebhookUrl) {
  // Build the webhook URL from environment variables.
  const webhookUrl = customWebhookUrl || (process.env.WEBHOOKURL + process.env.WEBHOOKPATH); // Your API Gateway endpoint

  if (!telegramBotToken || !webhookUrl) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_URL environment variable.");
  }

  // Using axios.post to set the webhook
  const url = `https://api.telegram.org/bot${telegramBotToken}/setWebhook`;
  

  try {
    const response = await axios.post(url, { url: webhookUrl });
    const data = response.data;

    if (!data.ok) {
      throw new Error(`Failed to set webhook: ${data.description}`);
    }

    console.log("Webhook set successfully to", webhookUrl);

    // Alternatively using curl as a double-check method
    exec(`curl -F "url=${webhookUrl}" ${url}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error setting webhook via curl: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr from curl: ${stderr}`);
        return;
      }
      console.log(`Webhook set via curl successfully: ${stdout}`);
    });

    return data;
  } catch (error) {
    console.error("Error setting the Telegram webhook:", error);
    throw error;
  }
}

async function sendTelegramAction(chatId, action) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendChatAction`;

//   console.log('url: ', url);

  await axios.post(url, {
    chat_id: chatId,
    action,
  });
}

async function sendTelegramPhoto(chatId, photo, caption) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;

  await axios.post(url, {
    chat_id: chatId,
    photo,
    caption,
  });
}

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

  await axios.post(url, {
    chat_id: chatId,
    text,
  });
}

async function sendBatchTelegramMessage(chatIds, text) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const batchSendMessagePromises = chatIds.map((chatId) =>
    axios.post(url, {
      chat_id: chatId,
      text,
    }),
  );

  await Promise.all(batchSendMessagePromises);
}

async function getPhotoUrl(fileId) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/getFile`;
  const response = await axios.post(url, {
    file_id: fileId
  });
  
  const filePath = response.data.result.file_path;
  return `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`;
}

async function getFilePath(fileId) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${fileId}`;

  const response = await axios.get(url);

  if (response.data) {
    return response.data.result.file_path;
  } else {
    throw new Error('Failed to get file path');
  }
}


module.exports = { 
  sendTelegramAction, 
  sendTelegramPhoto, 
  sendTelegramMessage, 
  sendBatchTelegramMessage,
  getPhotoUrl,
  getFilePath,
  startTelegramWebhook
};