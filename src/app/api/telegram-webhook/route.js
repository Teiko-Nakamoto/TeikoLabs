import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// Initialize bot with token from environment
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// In-memory storage for alerts (in production, use database)
const userAlerts = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Handle Telegram webhook
    if (body.message) {
      await handleMessage(body.message);
    } else if (body.callback_query) {
      await handleCallbackQuery(body.callback_query);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userId = message.from.id;

  console.log(`📱 Telegram message from ${userId}: ${text}`);

  if (text.startsWith('/start')) {
    await sendWelcomeMessage(chatId);
  } else if (text.startsWith('/setalert')) {
    await handleSetAlert(chatId, text, userId);
  } else if (text.startsWith('/myalerts')) {
    await handleMyAlerts(chatId, userId);
  } else if (text.startsWith('/deletealert')) {
    await handleDeleteAlert(chatId, text, userId);
  } else if (text.startsWith('/help')) {
    await sendHelpMessage(chatId);
  } else {
    await sendUnknownCommand(chatId);
  }
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  console.log(`🔘 Callback query from ${userId}: ${data}`);

  if (data.startsWith('delete_')) {
    const alertId = data.replace('delete_', '');
    await deleteAlert(chatId, alertId, userId);
  }
}

async function sendWelcomeMessage(chatId) {
  const message = `🚀 Welcome to the Token Alert Bot!

I'll help you set up buy and sell alerts for your mainnet tokens.

Available commands:
/setalert - Set a new price alert
/myalerts - View your current alerts
/deletealert - Delete an alert
/help - Show help information

To set an alert, use:
/setalert <token_symbol> <price> <type>

Examples:
/setalert MAS 0.50 buy
/setalert MAS 1.00 sell

Let's get started! 🎯`;

  await bot.sendMessage(chatId, message);
}

async function sendHelpMessage(chatId) {
  const message = `📚 Help - Token Alert Bot

Commands:
• /setalert <symbol> <price> <type> - Set price alert
• /myalerts - View your alerts
• /deletealert <id> - Delete specific alert
• /help - Show this help

Examples:
• /setalert MAS 0.50 buy - Alert when MAS drops to $0.50
• /setalert MAS 1.00 sell - Alert when MAS reaches $1.00

Alert Types:
• buy - Notify when price drops to target (buy opportunity)
• sell - Notify when price rises to target (sell opportunity)

Current supported tokens: MAS, and other mainnet tokens`;

  await bot.sendMessage(chatId, message);
}

async function handleSetAlert(chatId, text, userId) {
  try {
    const parts = text.split(' ');
    if (parts.length !== 4) {
      await bot.sendMessage(chatId, 
        '❌ Invalid format. Use: /setalert <symbol> <price> <type>\n' +
        'Example: /setalert MAS 0.50 buy'
      );
      return;
    }

    const symbol = parts[1].toUpperCase();
    const price = parseFloat(parts[2]);
    const type = parts[3].toLowerCase();

    if (isNaN(price) || price <= 0) {
      await bot.sendMessage(chatId, '❌ Invalid price. Please enter a valid number.');
      return;
    }

    if (!['buy', 'sell'].includes(type)) {
      await bot.sendMessage(chatId, '❌ Invalid type. Use "buy" or "sell".');
      return;
    }

    // Generate unique alert ID
    const alertId = `${userId}_${Date.now()}`;
    
    // Store alert
    if (!userAlerts.has(userId)) {
      userAlerts.set(userId, []);
    }
    
    const alert = {
      id: alertId,
      symbol,
      price,
      type,
      createdAt: new Date().toISOString(),
      active: true
    };
    
    userAlerts.get(userId).push(alert);

    const message = `✅ Alert set successfully!

📊 Token: ${symbol}
💰 Target Price: $${price}
🎯 Type: ${type === 'buy' ? 'Buy Alert' : 'Sell Alert'}
🆔 Alert ID: ${alertId}

You'll be notified when the price reaches your target! 🔔`;

    await bot.sendMessage(chatId, message);
    
    console.log(`🔔 Alert set for user ${userId}: ${symbol} ${type} at $${price}`);

  } catch (error) {
    console.error('Error setting alert:', error);
    await bot.sendMessage(chatId, '❌ Error setting alert. Please try again.');
  }
}

async function handleMyAlerts(chatId, userId) {
  try {
    const alerts = userAlerts.get(userId) || [];
    
    if (alerts.length === 0) {
      await bot.sendMessage(chatId, '📭 You have no active alerts.\nUse /setalert to create one!');
      return;
    }

    let message = `📋 Your Active Alerts (${alerts.length}):\n\n`;
    
    alerts.forEach((alert, index) => {
      message += `${index + 1}. ${alert.symbol} - $${alert.price} (${alert.type})\n`;
      message += `   ID: ${alert.id}\n`;
      message += `   Created: ${new Date(alert.createdAt).toLocaleDateString()}\n\n`;
    });

    message += 'To delete an alert, use: /deletealert <alert_id>';

    await bot.sendMessage(chatId, message);

  } catch (error) {
    console.error('Error fetching alerts:', error);
    await bot.sendMessage(chatId, '❌ Error fetching alerts. Please try again.');
  }
}

async function handleDeleteAlert(chatId, text, userId) {
  try {
    const parts = text.split(' ');
    if (parts.length !== 2) {
      await bot.sendMessage(chatId, '❌ Invalid format. Use: /deletealert <alert_id>');
      return;
    }

    const alertId = parts[1];
    const alerts = userAlerts.get(userId) || [];
    
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      await bot.sendMessage(chatId, '❌ Alert not found. Check your alert ID with /myalerts');
      return;
    }

    const deletedAlert = alerts.splice(alertIndex, 1)[0];
    userAlerts.set(userId, alerts);

    await bot.sendMessage(chatId, 
      `🗑️ Alert deleted successfully!\n\n` +
      `📊 Token: ${deletedAlert.symbol}\n` +
      `💰 Price: $${deletedAlert.price}\n` +
      `🎯 Type: ${deletedAlert.type}`
    );

    console.log(`🗑️ Alert deleted for user ${userId}: ${deletedAlert.symbol}`);

  } catch (error) {
    console.error('Error deleting alert:', error);
    await bot.sendMessage(chatId, '❌ Error deleting alert. Please try again.');
  }
}

async function deleteAlert(chatId, alertId, userId) {
  try {
    const alerts = userAlerts.get(userId) || [];
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      await bot.sendMessage(chatId, '❌ Alert not found.');
      return;
    }

    const deletedAlert = alerts.splice(alertIndex, 1)[0];
    userAlerts.set(userId, alerts);

    await bot.sendMessage(chatId, 
      `🗑️ Alert deleted!\n${deletedAlert.symbol} - $${deletedAlert.price} (${deletedAlert.type})`
    );

  } catch (error) {
    console.error('Error deleting alert:', error);
    await bot.sendMessage(chatId, '❌ Error deleting alert.');
  }
}

async function sendUnknownCommand(chatId) {
  await bot.sendMessage(chatId, 
    '❓ Unknown command. Use /help to see available commands.'
  );
}

// Export for use in price monitoring
export { userAlerts, bot };
