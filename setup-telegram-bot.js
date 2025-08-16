#!/usr/bin/env node

/**
 * Telegram Bot Setup Script for Token Alerts
 * 
 * This script helps you set up the Telegram bot and Hiro webhook integration
 * for your mainnet token alerts.
 */

const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupBot() {
  console.log('🚀 Telegram Bot Setup for Token Alerts\n');
  console.log('This script will help you configure your Telegram bot and Hiro webhook.\n');

  // Step 1: Get Telegram Bot Token
  console.log('📱 Step 1: Telegram Bot Token');
  console.log('1. Open Telegram and search for @BotFather');
  console.log('2. Send /newbot command');
  console.log('3. Follow the instructions to create your bot');
  console.log('4. Copy the bot token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)\n');
  
  const botToken = await question('Enter your Telegram bot token: ');
  
  if (!botToken || botToken === 'your_telegram_bot_token_here') {
    console.log('❌ Please provide a valid bot token');
    rl.close();
    return;
  }

  // Step 2: Get your domain
  console.log('\n🌐 Step 2: Your Domain');
  console.log('Enter your domain where this app will be hosted (e.g., https://yourdomain.com)');
  console.log('For local development, use: http://localhost:3000\n');
  
  const domain = await question('Enter your domain: ');
  
  if (!domain) {
    console.log('❌ Please provide a domain');
    rl.close();
    return;
  }

  // Step 3: Generate webhook secret
  const webhookSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('\n🔐 Step 3: Webhook Secret');
  console.log('Generated webhook secret for Hiro authentication:');
  console.log(webhookSecret);
  console.log('\nThis secret will be used to verify webhook requests from Hiro.');

  // Step 4: Update environment file
  console.log('\n📝 Step 4: Updating Environment Configuration');
  
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yivwcilvhtswlmdcjpqw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdndjaWx2aHRzd2xtZGNqcHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjU5ODMsImV4cCI6MjA2Nzk0MTk4M30.THYtuWzFspiYPBwuJutX91GWE9zNUIMJmtG0OA_1qnc

# Admin Configuration
ADMIN_ADDRESS=ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4
NEXT_PUBLIC_ADMIN_ADDRESSES=ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4,SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B

# CORS Configuration
# Add your website domains here (comma-separated)
CORS_ALLOWED_ORIGINS=https://teikolabs.com,https://www.teikolabs.com

# Hiro API Configuration
# Get your API key from: https://www.hiro.so/wallet/connect/web
HIRO_API_KEY=c61068ab07fa6afe30dd5dc2144e5c75
HIRO_API_URL=https://api.hiro.so
HIRO_API_URL_REST=https://api.hiro.so

# Telegram Bot Configuration
# Get your bot token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=${botToken}
TELEGRAM_WEBHOOK_URL=${domain}/api/telegram-webhook

# Hiro Webhook Configuration
# Secret key for webhook authentication (generate a random string)
HIRO_WEBHOOK_SECRET=${webhookSecret}

# Base URL for your application (used for internal API calls)
NEXT_PUBLIC_BASE_URL=${domain}
`;

  const fs = require('fs');
  fs.writeFileSync('.env.local', envContent);
  
  console.log('✅ Environment file updated successfully!');

  // Step 5: Hiro Webhook Setup Instructions
  console.log('\n🔗 Step 5: Hiro Webhook Setup');
  console.log('Now you need to configure the webhook in Hiro:\n');
  console.log('1. Go to https://www.hiro.so/');
  console.log('2. Navigate to your mas-sats-treasury contract');
  console.log('3. Click on "Alerts" or "Notifications"');
  console.log('4. Create a new alert with these settings:');
  console.log(`   - Webhook URL: ${domain}/api/hiro-webhook`);
  console.log(`   - Authorization Header: ${webhookSecret}`);
  console.log('5. Set your alert conditions (e.g., when specific functions are called)');
  console.log('6. Save the alert\n');

  // Step 6: Test the bot
  console.log('🧪 Step 6: Testing Your Bot');
  console.log('1. Start your application: npm run dev');
  console.log('2. Open Telegram and find your bot');
  console.log('3. Send /start to initialize the bot');
  console.log('4. Try setting an alert: /setalert MAS 0.50 buy');
  console.log('5. Check your alerts: /myalerts\n');

  // Step 7: Supported tokens
  console.log('🪙 Step 7: Supported Tokens');
  console.log('Currently supported tokens:');
  console.log('- MAS (mas-sats-treasury)');
  console.log('\nTo add more tokens, edit src/app/api/current-price/route.js\n');

  console.log('🎉 Setup complete! Your Telegram bot is ready for token alerts.');
  console.log('\nNext steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Test your bot in Telegram');
  console.log('4. Configure Hiro webhook with the provided URL and secret');

  rl.close();
}

setupBot().catch(console.error);
