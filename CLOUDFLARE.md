# Cloudflare Workers Deployment Guide

This guide provides detailed instructions for deploying the Wenti Namecard Agent to Cloudflare Workers, offering a scalable, low-latency solution with a generous free tier.

## Why Cloudflare Workers?

- **Free Tier**: 100,000 requests per day at no cost
- **Global Edge Network**: Deploy your bot to 275+ cities worldwide for minimal latency
- **Fast Cold Starts**: Near-instant startup times (unlike AWS Lambda)
- **Simple Configuration**: Easy environment variable management
- **Built-in KV Storage**: Optional key-value storage for data persistence

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (installable via `npm install -g wrangler`)
3. Telegram Bot Token from [BotFather](https://t.me/botfather)
4. OpenAI API Key with GPT-4 Vision access
5. Google Sheets configured for data storage (optional)

## One-Click Deployment

For the simplest deployment experience:

1. Click the "Deploy to Cloudflare Workers" button in the README.md
2. Authorize Cloudflare to create a fork of the project
3. Configure environment variables in the Cloudflare Dashboard:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_SHEETS_ID`: ID of your Google Sheet (optional)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email (optional)
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: Service account private key (optional)
4. Set your Telegram webhook URL to your new Worker URL + `/telegram-webhook` path

## Manual Deployment

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/wentilabs/wenti-namecard-agent.git
cd wenti-namecard-agent

# Install dependencies
npm install
```

### 2. Login to Cloudflare

```bash
# Install Wrangler CLI if you haven't already
npm install -g wrangler

# Login to your Cloudflare account
wrangler login
```

### 3. Configure Secrets

Secrets are secure environment variables that are encrypted and stored by Cloudflare:

```bash
# Add your secrets in one of two ways:

# Option 1: Using KV Store (recommended especially for Google credentials)
# First, populate your KV namespace with the secrets
wrangler kv:key put --binding=WENTI_SECRET_STORE "GOOGLE_SHEETS_ID" "your-sheet-id"
wrangler kv:key put --binding=WENTI_SECRET_STORE "GOOGLE_SERVICE_ACCOUNT_EMAIL" "your-service-account@project.iam.gserviceaccount.com"
wrangler kv:key put --binding=WENTI_SECRET_STORE "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY" "-----BEGIN PRIVATE KEY-----\nYour long private key here...\n-----END PRIVATE KEY-----\n"

# Option 2: Using Environment Secrets (simpler but less flexible)
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put OPENAI_API_KEY
```

### 4. Deploy to Workers

```bash
# Deploy your worker
npm run deploy

# Or if you prefer to use Wrangler directly
wrangler publish
```

### 5. Update Telegram Webhook

The worker provides an automatic webhook setup endpoint. Simply visit:

```
https://<YOUR_WORKER_URL>/setup-webhook
```

This will automatically configure your webhook for Telegram. You'll see a confirmation JSON response when successful.

Alternatively, you can set it manually using the Telegram Bot API:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_WORKER_URL>/telegram-webhook"
```

## Advanced Configuration

### Custom Domain

You can configure a custom domain for your worker:

1. Add a custom domain in the Cloudflare Dashboard
2. Update your `wrangler.toml` file:

```toml
[env.production]
routes = [
  { pattern = "your-custom-domain.com/telegram-webhook", zone_id = "your-zone-id" }
]
```

### KV Storage (Alternative to Google Sheets)

You can use Cloudflare's KV storage instead of or alongside Google Sheets:

1. Create a KV namespace in the Cloudflare Dashboard
2. Update your `wrangler.toml` file:

```toml
[[kv_namespaces]]
binding = "BUSINESS_CARDS"
id = "your-kv-namespace-id"
```

3. Add KV storage code to your project

### Environment Variables

Non-sensitive configuration can be added directly to `wrangler.toml`:

```toml
[vars]
NODE_ENV = "production"
FEATURE_FLAG_ENABLE_X = "true"
```

## Local Development

Test your worker locally before deployment:

```bash
# Start local development server
npm run dev

# Or with Wrangler directly
wrangler dev
```

This will start a local server that emulates Cloudflare Workers environment, allowing you to test webhook handling.

For Telegram webhook testing during development, you'll need to expose your local server to the internet. Options include:
- Using ngrok (`node dev-index.js`)
- Cloudflare Tunnel
- Wrangler's built-in tunnel capabilities

## Troubleshooting

### Common Issues

1. **Worker Execution Timeout**:
   - Workers have a 50ms CPU time limit on free plans (extendable to 30s with paid plans)
   - Optimize your code for fast execution or upgrade to paid plan

2. **Environment Variables Not Working**:
   - Verify they are correctly set in the Cloudflare Dashboard
   - Check spelling and case sensitivity

3. **Webhook Not Receiving Messages**:
   - Confirm your webhook URL is correctly set in Telegram
   - Check Cloudflare Workers logs for any errors

### Debugging

Access your worker logs in the Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click on "Logs"

To enable detailed logging, add the following to your code:
```javascript
console.log('Debug information:', someData);
```

## Scaling Considerations

The free tier allows 100,000 requests per day, which is sufficient for most small to medium-sized Telegram bots. If you need more:

1. **Workers Bundled Plan**: $5/month for 10 million requests
2. **Workers Paid Plan**: Pay-as-you-go beyond the free tier

## Migrating from AWS Lambda

If you're migrating from AWS Lambda, note these differences:

1. **Event Format**: Workers uses `fetch` events instead of Lambda's handler format
2. **Runtime**: Workers runs on V8 isolates (not Node.js containers)
3. **Execution Time**: Lambda allows up to 15 minutes, Workers limits to 30 seconds (paid)

For a comprehensive Cloudflare Workers reference, visit the [official documentation](https://developers.cloudflare.com/workers/).