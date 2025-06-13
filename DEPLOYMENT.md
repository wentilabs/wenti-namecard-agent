# Deployment Guide

This guide will help you set up and deploy the Wenti Namecard Agent to AWS Lambda and configure all necessary services.

## Prerequisites

- AWS account
- Telegram account
- OpenAI account
- Google Cloud Platform account (for Google Sheets integration)
- Node.js installed on your local machine

## Setup Steps

### 1. Telegram Bot Setup

1. Open Telegram and search for "BotFather"
2. Start a chat with BotFather and create a new bot using the `/newbot` command
3. Follow the prompts to give your bot a name and username
4. BotFather will provide you with a token - save this as your `TELEGRAM_BOT_TOKEN`
5. Set up your bot's commands with `/setcommands` and add any custom commands

### 2. OpenAI API Setup

1. Create an account at [OpenAI](https://openai.com/)
2. Go to the API section and generate an API key
3. Save this key as `OPENAI_API_KEY`
4. Ensure you have sufficient credits or a paid plan for using GPT-4 Vision

### 3. Google Service Account Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API:

   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create a service account:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details and click "Create"
   - Grant the role "Editor" for the service account
   - Complete the creation process

5. Generate a key for your service account:

   - Click on the service account you just created
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select JSON format and click "Create"
   - The key file will be downloaded to your computer

6. From the downloaded JSON file, extract:

   - `client_email` as your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` as your `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

7. Create a Google Sheet:
   - Go to [Google Sheets](https://sheets.google.com/) and create a new sheet
   - Rename the first sheet tab to "crm"
   - Add headers for: Timestamp, First Name, Email, Company Name, Mobile Number, Full Name
   - Share the sheet with your service account email (with Editor permissions)
   - Copy the Sheet ID from the URL (the long alphanumeric string between `/d/` and `/edit`) as your `GOOGLE_SHEETS_ID`

### 4. AWS Lambda Deployment

1. Prepare your code for Lambda:

   ```bash
   # Clone the repository
   git clone https://github.com/your-username/wenti-namecard-agent.git
   cd wenti-namecard-agent

   # Install dependencies
   npm install

   # Create a ZIP file for Lambda
   zip -r function.zip .
   ```

2. Create a Lambda function:

   - Go to the [AWS Lambda Console](https://console.aws.amazon.com/lambda)
   - Click "Create function"
   - Select "Author from scratch"
   - Set a function name
   - Select Node.js runtime (version 18.x or later)
   - For architecture, choose x86_64
   - Click "Create function"

3. Upload your code:

   - In the function overview, scroll to the "Code source" section
   - Click "Upload from" > ".zip file"
   - Upload your function.zip file

4. Configure environment variables:

   - Scroll down to the "Configuration" tab
   - Click "Environment variables"
   - Add all the required environment variables:
     - `TELEGRAM_BOT_TOKEN`
     - `OPENAI_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_SECRET_KEY`
     - `GOOGLE_SHEETS_ID`
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (make sure to include all newlines, may require escaping)

5. Configure Lambda settings:

   - Increase the timeout to at least 30 seconds (recommended: 1 minute)
   - Increase memory allocation to at least 512MB
   - Under "General configuration", click "Edit" and make these changes

6. Create an API Gateway trigger:

   - Click "Add trigger"
   - Select "API Gateway"
   - Create a new API: HTTP API
   - Security: Open
   - Click "Add"

7. Configure the webhook:

   - After API Gateway is created, copy the API endpoint URL
   - Set the `WEBHOOKURL` to this URL
   - Set the `WEBHOOKPATH` to `/telegram-webhook`

8. Manually set the webhook for your Telegram bot:
   ```
   https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=<YOUR_API_GATEWAY_URL>/telegram-webhook
   ```

### 5. Test the Deployment

1. Open Telegram and start a chat with your bot
2. Send a business card image
3. The bot should respond with the extracted information
4. Check the CloudWatch logs in AWS if you encounter any issues

## Troubleshooting

### Webhook Issues

- Ensure the webhook URL is correct and publicly accessible
- Check if API Gateway is properly configured
- Verify that the Telegram Bot Token is valid

### Lambda Execution Issues

- Check CloudWatch logs for error messages
- Ensure all environment variables are set correctly
- Verify that the Lambda has sufficient timeout and memory settings

### Image Processing Issues

- Ensure that the OpenAI API key has access to GPT-4 Vision
- Check if the image format is supported

### Google Sheets Integration Issues

- Ensure the service account has Editor access to the sheet
- Verify that the correct Sheet ID is being used
- Check that the sheet has a tab named "crm"

## Additional Configuration Options

### Custom Domain

To use a custom domain with your API Gateway:

1. Register a domain and set up an SSL certificate using AWS Certificate Manager
2. Create a custom domain name in API Gateway
3. Configure DNS settings to point to the API Gateway endpoint

### CloudFormation/Terraform Deployment

For production use, consider using Infrastructure as Code (IaC) tools like CloudFormation or Terraform to manage your AWS resources.

### Monitoring

Set up CloudWatch Alarms to monitor Lambda execution errors and response times.

### Cost Management

Configure AWS Budgets to track and manage costs for your Lambda function, API Gateway, and other AWS services.
