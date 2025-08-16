# Telegram Bot Setup for Token Alerts

This guide will help you set up a Telegram bot that sends buy/sell alerts for your mainnet tokens using Hiro's webhook system.

## 🚀 Quick Setup

1. **Run the setup script:**
   ```bash
   node setup-telegram-bot.js
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📱 Manual Setup Steps

### Step 1: Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Configure Environment Variables

Update your `.env.local` file with:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram-webhook

# Hiro Webhook Configuration
HIRO_WEBHOOK_SECRET=your_webhook_secret_here

# Base URL for your application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Step 3: Configure Hiro Webhook

1. Go to [Hiro Explorer](https://www.hiro.so/)
2. Navigate to your `mas-sats-treasury` contract
3. Click on "Alerts" or "Notifications"
4. Create a new alert with these settings:
   - **Webhook URL:** `https://your-domain.com/api/hiro-webhook`
   - **Authorization Header:** `your_webhook_secret_here`
   - **Condition:** Function is called (select the functions you want to monitor)
5. Save the alert

## 🔧 How It Works

### Architecture Overview

```
Hiro Contract → Hiro Webhook → Your API → Telegram Bot → User
```

1. **Hiro monitors** your contract for specific function calls
2. **Hiro sends webhook** to your API when conditions are met
3. **Your API processes** the webhook and checks user alerts
4. **Telegram bot sends** notifications to users with matching alerts

### API Endpoints

- **`/api/telegram-webhook`** - Handles Telegram bot interactions
- **`/api/hiro-webhook`** - Receives webhooks from Hiro
- **`/api/current-price`** - Gets current token prices

### Supported Tokens

Currently supported:
- **MAS** (`mas-sats-treasury` contract)

To add more tokens, edit `src/app/api/current-price/route.js`

## 📋 Bot Commands

### Available Commands

- `/start` - Initialize the bot and show welcome message
- `/setalert <symbol> <price> <type>` - Set a price alert
- `/myalerts` - View your current alerts
- `/deletealert <id>` - Delete a specific alert
- `/help` - Show help information

### Examples

```bash
/setalert MAS 0.50 buy    # Alert when MAS drops to $0.50
/setalert MAS 1.00 sell   # Alert when MAS reaches $1.00
/myalerts                 # View all your alerts
/deletealert 123456       # Delete alert with ID 123456
```

## 🔔 Alert Types

- **Buy Alert** - Notifies when price drops to target (buying opportunity)
- **Sell Alert** - Notifies when price rises to target (selling opportunity)

## 🛠️ Customization

### Adding New Tokens

1. Edit `src/app/api/current-price/route.js`
2. Add your token to the `SUPPORTED_TOKENS` object:

```javascript
const SUPPORTED_TOKENS = {
  'MAS': {
    contractAddress: 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4',
    contractName: 'mas-sats-treasury',
    symbol: 'MAS',
    decimals: 8
  },
  'YOUR_TOKEN': {
    contractAddress: 'YOUR_CONTRACT_ADDRESS',
    contractName: 'YOUR_CONTRACT_NAME',
    symbol: 'YOUR_TOKEN',
    decimals: 8
  }
};
```

### Modifying Alert Conditions

Edit `src/app/api/hiro-webhook/route.js` to customize:
- Alert trigger conditions
- Notification message format
- Price calculation logic

### Database Integration

For production, replace the in-memory storage with a database:

1. Create a `user_alerts` table in your database
2. Update the alert storage functions in the webhook handlers
3. Add user authentication and management

## 🧪 Testing

### Test the Bot

1. Start your application: `npm run dev`
2. Open Telegram and find your bot
3. Send `/start` to initialize
4. Try setting an alert: `/setalert MAS 0.50 buy`
5. Check your alerts: `/myalerts`

### Test the Webhook

1. Configure Hiro webhook with your domain
2. Trigger a function call on your contract
3. Check your server logs for webhook processing
4. Verify Telegram notifications are sent

## 🔒 Security Considerations

- **Webhook Secret:** Always use a strong, random secret for webhook authentication
- **Rate Limiting:** Implement rate limiting on your API endpoints
- **Input Validation:** Validate all user inputs and webhook data
- **Error Handling:** Implement proper error handling and logging

## 🚨 Troubleshooting

### Common Issues

1. **Bot not responding:**
   - Check if `TELEGRAM_BOT_TOKEN` is correct
   - Verify the bot is not blocked by users

2. **Webhook not receiving data:**
   - Check if `HIRO_WEBHOOK_SECRET` matches
   - Verify the webhook URL is accessible
   - Check server logs for errors

3. **Price not updating:**
   - Verify your contract has the required price functions
   - Check Hiro API key configuration
   - Review the price calculation logic

### Debug Mode

Enable debug logging by checking the console output. The system logs:
- Telegram message processing
- Webhook data received
- Alert trigger conditions
- Price fetching attempts

## 📞 Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Test the individual API endpoints
4. Ensure your Hiro contract has the required functions

## 🔄 Updates

To update the bot:
1. Pull the latest code changes
2. Restart your development server
3. Test the bot functionality
4. Update Hiro webhook if needed
