# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Telegram bot that processes business card images using OpenAI's Vision API. The bot extracts structured data from business card photos and returns the formatted information to the user.

## Environment Setup

This project requires the following environment variables in a `.env` file:

```
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
LOCAL_TELEGRAM_BOT_TOKEN=your_local_telegram_bot_token
WEBHOOKURL=your_webhook_base_url
WEBHOOKPATH=/telegram-webhook

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Google Sheets Configuration (optional, for data storage)
GOOGLE_SHEETS_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=your_private_key
```

## Development Commands

To install all dependencies:
```bash
npm install
```

To run the bot in development mode:
```bash
node dev-index.js
```

This starts a local server with an ngrok tunnel for webhook testing.

For production deployment:
```bash
# The project uses index.js as the entry point for deployment
# AWS Lambda or similar serverless platform recommended
```

## Architecture Overview

The project follows a modular architecture:

1. **Webhook Receiver**: `index.js` (production) or `dev-index.js` (development)
   - Receives webhook events from Telegram
   - Routes to appropriate handlers

2. **Telegram Connector**: `connectors/telegram/`
   - `index.js`: Contains the main `telegramHandler` function
   - `utils.js`: Telegram API utilities for webhook setup, sending messages, and file handling

3. **Agent Logic**: `agent.js`
   - Core business logic for image processing
   - Orchestrates the extraction flow:
     1. Download and store images from Telegram to Supabase
     2. Process images with OpenAI using function calling for structured data
     3. Format and return extracted data

4. **Utilities**: `utils/`
   - `sheets.js`: Google Sheets integration for storing extracted data
   - References to `supabase.js` exist but the file may not be present yet

## Data Flow

1. User sends business card photo to the Telegram bot
2. Telegram sends webhook to the application
3. The largest photo version is downloaded from Telegram
4. Image URL is passed to OpenAI for analysis via responses API with function calling
5. Extracted structured data is formatted and returned to the user
6. Optionally, data is stored in Google Sheets

## Key Implementation Details

### Telegram Handler

The `telegramHandler` function in `connectors/telegram/index.js` is the entry point for processing webhook events:

```javascript
async function telegramHandler(event) {
  // Parse the event body
  let eventBody = process.env.NODE_ENV === 'dev' ? event.body : JSON.parse(event.body);
  const { message } = eventBody;

  // Process photo messages with the agentExtraction function
  if (message.photo) {
    await sendTelegramAction(chatId, 'typing');
    await sendTelegramMessage(chatId, 'Extracting information from the image...');
    const response = await agentExtraction(message);
    await sendTelegramMessage(chatId, response.message);
  }
  // Send instructions for non-photo messages
  else {
    await sendTelegramMessage(chatId, "Please send me a photo of a business card to extract information.");
  }
}
```

### OpenAI Vision API Integration

The `agentExtraction` function in `agent.js` handles image processing:

```javascript
async function agentExtraction(message) {
  // Get the largest photo version from Telegram
  const photoId = message.photo[message.photo.length - 1].file_id;
  const photoUrl = await getPhotoUrl(photoId);
  
  // Call OpenAI with function calling for structured extraction
  const response = await openai.responses.create({
    model: 'gpt-4.1',
    input: [...], // System and user prompts with the image
    tools: [...], // Function definitions for structured extraction
    store: false
  });
  
  // Process the response and format extracted data
  if (response.output && response.output.length > 0 && 
      response.output[0].name === 'extract_namecard_data') {
    const extractedData = JSON.parse(response.output[0].arguments || '{}');
    // Format and return the data
  }
}
```

### Google Sheets Integration

The application can store extracted business card data in Google Sheets using the `appendToSheet` function in `utils/sheets.js`:

```javascript
async function appendToSheet(data, sheetName = 'crm', includeTimestamp = true) {
  // Get the sheet headers
  const headers = await getSheetHeaders(sheetName);
  
  // Map the data to the sheet columns
  const rowData = headers.map((header, index) => {
    // Logic to map data to headers
  });
  
  // Append the row to the sheet
  await sheets.spreadsheets.values.append({...});
}
```

## Deployment Guide

For detailed deployment instructions, refer to the [DEPLOYMENT.md](DEPLOYMENT.md) file, which includes:

- AWS Lambda setup instructions
- Telegram Bot configuration
- OpenAI API key setup
- Google Service Account creation
- Google Sheets integration
- Troubleshooting tips

## Working with this Codebase

### Image Processing

The image processing flow in `agent.js` uses OpenAI responses API with the following components:

- `tools` array defining the function to extract business card data
- Input messages containing both text instructions and the image URL
- Response handling for tool calls to extract structured data
- Formatting of results for user display

Important note: The code expects responses with the extract_namecard_data tool name. Pay attention to the conditional check in line 98 of agent.js.

### Telegram Integration

To modify the Telegram interaction:

1. Update message handling in `connectors/telegram/index.js`
2. Add new Telegram API methods in `connectors/telegram/utils.js` as needed

Available utilities:
- `sendTelegramAction`: Send typing indicators or other actions
- `sendTelegramMessage`: Send text messages to users
- `sendTelegramPhoto`: Send image responses
- `getPhotoUrl`: Convert Telegram file_id to a URL
- `startTelegramWebhook`: Configure the webhook endpoint

### Data Storage

The primary storage mechanism is Google Sheets:
- Configure in `utils/sheets.js`
- Customize the sheet structure by updating the column mapping
- Default tab name is 'crm' with headers: Timestamp, Full Name, First Name, Email, Company, Mobile

### Testing and Debugging

To test changes:

1. Create a Telegram bot and get a token from BotFather
2. Set up your environment variables in `.env`
3. Run the development server with `node dev-index.js`
4. Send test images to your bot
5. Check console logs for debugging information

Effective debugging involves:
- Monitoring the console for log messages from `agentExtraction` 
- Inspecting OpenAI responses when troubleshooting extraction issues
- Checking Telegram webhook configurations when testing bot interaction