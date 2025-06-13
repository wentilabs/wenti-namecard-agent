# Wenti Namecard Agent

A Telegram bot that extracts structured data from business cards using OpenAI's GPT4.1 and stores the information in Google Sheets.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

- 📸 **Image Processing**: Extract structured data from business card photos sent via Telegram
- 🤖 **OpenAI Vision API**: Utilizes GPT-4 Vision for accurate data extraction
- 📊 **Google Sheets Integration**: Automatically stores extracted data in Google Sheets
- 🔄 **Dynamic Column Mapping**: Adapts to your custom Google Sheet headers
- 🚀 **Serverless Ready**: Deploy instantly to Cloudflare Workers or AWS Lambda
- 🧪 **Local Development**: Includes development server with ngrok tunneling
- ⚡ **Fast Global Edge Network**: Cloudflare Workers for low-latency responses worldwide

## 📋 Prerequisites

- Node.js (v22+)
- Telegram Bot Token (from BotFather)
- OpenAI API Key with at least GPT-4o access
- Google Service Account with Sheets API access
- Cloudflare account (free tier available) or AWS account for deployment

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/wentilabs/wenti-namecard-agent.git
cd wenti-namecard-agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
LOCAL_TELEGRAM_BOT_TOKEN=your_local_telegram_bot_token
WEBHOOKURL=your_webhook_base_url
WEBHOOKPATH=/telegram-webhook

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=your_private_key
```

### 4. Set up Google Sheet

Create a Google Sheet with the following headers in a tab named "crm":

- Timestamp
- Full Name
- First Name
- Email
- Company
- Mobile

### 5. Run development server

For local development with ngrok tunneling:
```bash
node dev-index.js
```

For Cloudflare Workers local development:
```bash
npm run dev
```

Either method will start a local server to make your development environment accessible to Telegram webhooks.

## 🔧 How It Works

1. User sends a business card photo to the Telegram bot
2. The bot extracts the largest photo version and processes it
3. OpenAI Vision API analyzes the image using function calling
4. Structured data is extracted (name, email, company, phone, etc.)
5. Data is formatted and returned to the user
6. Information is stored in Google Sheets using dynamic column mapping

## 📂 Project Structure

```
├── agent.js                  # Core business logic and OpenAI integration
├── connectors/
│   └── telegram/
│       ├── index.js          # Telegram webhook handler
│       └── utils.js          # Telegram API utilities
├── dev-index.js              # Development server with ngrok
├── index.js                  # Production entry point (Workers/Lambda compatible)
├── utils/
│   └── sheets.js             # Google Sheets integration
├── wrangler.toml             # Cloudflare Workers configuration
├── DEPLOYMENT.md             # Detailed deployment guide
└── .env                      # Environment variables (create this)
```

## 🏗️ Deployment

### One-Click Deployment with Cloudflare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wentilabs/wenti-namecard-agent)

1. Click the button above to fork and deploy to Cloudflare Workers
2. Configure your environment variables in the Cloudflare Dashboard:
   - `TELEGRAM_BOT_TOKEN`
   - `OPENAI_API_KEY`
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
3. Set up your webhook URL with Telegram: `https://your-worker.your-subdomain.workers.dev/telegram-webhook`

### Manual Deployment with Wrangler

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to your Cloudflare account
wrangler login

# Add your secrets
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put GOOGLE_SHEETS_ID
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
wrangler secret put GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

# Deploy to Cloudflare Workers
npm run deploy
```

### AWS Lambda Deployment

For AWS Lambda deployment instructions, refer to the [DEPLOYMENT.md](DEPLOYMENT.md) file, which includes:

- AWS Lambda setup instructions
- Telegram Bot configuration
- OpenAI API key setup
- Google Service Account creation
- Google Sheets integration
- Troubleshooting tips

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Attribution

When using this code, please include the following attribution:

```
Based on Wenti Namecard Agent by Wenti Labs
https://github.com/wentilabs/wenti-namecard-agent
```

## 📚 Additional Preparation Items

Next Steps:

1. **Contributing Guide**: Consider creating a `CONTRIBUTING.md` with more detailed contribution guidelines
2. **Code of Conduct**: Add a `CODE_OF_CONDUCT.md` file
3. **Issue Templates**: Create `.github/ISSUE_TEMPLATE/` directory with issue templates
4. **Pull Request Template**: Add `.github/PULL_REQUEST_TEMPLATE.md`
5. **Security Policy**: Add a `SECURITY.md` file describing how to report security vulnerabilities
6. **Demo Images**: Replace placeholder images with actual screenshots of your bot in action

## 📧 Contact

Your Name - [@ethnoweth](https://twitter.com/ethnoweth) - ethan@wentilabs.com

Project Link: [https://github.com/wentilabs/wenti-namecard-agent](https://github.com/wentilabs/wenti-namecard-agent)
