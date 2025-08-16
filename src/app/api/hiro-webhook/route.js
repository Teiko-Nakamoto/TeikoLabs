import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// Initialize bot with token from environment
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// In-memory storage for alerts (in production, use database)
const userAlerts = new Map();

// Supported tokens and their contract addresses
const SUPPORTED_TOKENS = {
  'MAS': {
    contractAddress: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B',
    contractName: 'mas-sats-treasury',
    symbol: 'MAS'
  }
  // Add more tokens as needed
};

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('🔔 Hiro webhook received:', JSON.stringify(body, null, 2));
    
    // Verify the webhook is from Hiro (you can add more validation)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== process.env.HIRO_WEBHOOK_SECRET) {
      console.log('⚠️ Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Process the alert data
    await processHiroAlert(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Hiro webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processHiroAlert(alertData) {
  try {
    // Extract relevant information from Hiro alert
    const {
      contract_address,
      contract_name,
      function_name,
      function_args,
      block_height,
      tx_id,
      timestamp
    } = alertData;
    
    console.log(`📊 Processing alert for contract: ${contract_address}.${contract_name}`);
    console.log(`🔧 Function: ${function_name}`);
    console.log(`📦 Args: ${JSON.stringify(function_args)}`);
    
    // Determine which token this alert is for
    const tokenInfo = Object.values(SUPPORTED_TOKENS).find(
      token => token.contractAddress === contract_address && token.contractName === contract_name
    );
    
    if (!tokenInfo) {
      console.log(`⚠️ Unsupported contract: ${contract_address}.${contract_name}`);
      return;
    }
    
    // Get current price for the token
    const currentPrice = await getTokenPrice(tokenInfo.symbol);
    
    if (currentPrice === null) {
      console.log(`❌ Could not fetch price for ${tokenInfo.symbol}`);
      return;
    }
    
    console.log(`💰 Current ${tokenInfo.symbol} price: $${currentPrice}`);
    
    // Check all user alerts for this token
    await checkUserAlerts(tokenInfo.symbol, currentPrice, alertData);
    
  } catch (error) {
    console.error('❌ Error processing Hiro alert:', error);
  }
}

async function getTokenPrice(symbol) {
  try {
    // Use the existing working read-contract API to get price data
    const [sbtcResponse, totalTokensResponse, lockedTokensResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/read-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B',
          contractName: 'mas-sats-treasury',
          functionName: 'get-sbtc-balance',
          functionArgs: []
        })
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/read-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B',
          contractName: 'mas-sats-treasury',
          functionName: 'get-token-balance',
          functionArgs: []
        })
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/read-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B',
          contractName: 'mas-sats-treasury',
          functionName: 'get-total-locked',
          functionArgs: []
        })
      })
    ]);

    const [sbtcData, totalTokensData, lockedTokensData] = await Promise.all([
      sbtcResponse.json(),
      totalTokensResponse.json(),
      lockedTokensResponse.json()
    ]);

    if (sbtcData.success && totalTokensData.success && lockedTokensData.success) {
      const sbtcBalance = parseInt(sbtcData.result.value);
      const totalTokens = parseInt(totalTokensData.result.value);
      const lockedTokens = parseInt(lockedTokensData.result.value);
      
      const virtualSbtc = 1500000;
      const availableTokens = totalTokens - lockedTokens;
      
      if (availableTokens <= 0) {
        console.log('❌ No available tokens for price calculation');
        return null;
      }
      
      const calculatedPrice = (sbtcBalance + virtualSbtc) / availableTokens;
      const btcPrice = 0.0001; // This should be fetched from a real API
      const priceInDollars = calculatedPrice * btcPrice;
      
      console.log(`💰 Calculated price: ${calculatedPrice} sats = $${priceInDollars}`);
      return priceInDollars;
    }
    
    console.log('❌ Could not fetch price data from API');
    return null;
  } catch (error) {
    console.error(`❌ Error fetching price for ${symbol}:`, error);
    return null;
  }
}

async function checkUserAlerts(symbol, currentPrice, alertData) {
  try {
    let alertsTriggered = 0;
    
    // Check all user alerts
    for (const [userId, userAlertList] of userAlerts.entries()) {
      const triggeredAlerts = [];
      
      for (let i = 0; i < userAlertList.length; i++) {
        const alert = userAlertList[i];
        
        if (alert.symbol === symbol && alert.active) {
          let shouldTrigger = false;
          
          if (alert.type === 'buy' && currentPrice <= alert.price) {
            shouldTrigger = true;
          } else if (alert.type === 'sell' && currentPrice >= alert.price) {
            shouldTrigger = true;
          }
          
          if (shouldTrigger) {
            triggeredAlerts.push({ alert, index: i });
          }
        }
      }
      
      // Send notifications for triggered alerts
      for (const { alert, index } of triggeredAlerts) {
        await sendAlertNotification(userId, alert, currentPrice, alertData);
        
        // Mark alert as triggered (optional: remove or deactivate)
        userAlertList[index].active = false;
        userAlertList[index].triggeredAt = new Date().toISOString();
        userAlertList[index].triggeredPrice = currentPrice;
        
        alertsTriggered++;
      }
    }
    
    console.log(`🔔 Triggered ${alertsTriggered} alerts for ${symbol} at $${currentPrice}`);
    
  } catch (error) {
    console.error('❌ Error checking user alerts:', error);
  }
}

async function sendAlertNotification(userId, alert, currentPrice, alertData) {
  try {
    const { tx_id, block_height, timestamp } = alertData;
    
    const message = `🚨 **ALERT TRIGGERED!** 🚨

📊 **Token:** ${alert.symbol}
💰 **Target Price:** $${alert.price}
🎯 **Alert Type:** ${alert.type === 'buy' ? 'Buy Alert' : 'Sell Alert'}
💵 **Current Price:** $${currentPrice}
📈 **Price Change:** ${alert.type === 'buy' ? 'Price dropped!' : 'Price increased!'}

🔗 **Transaction:** [View on Hiro](https://explorer.hiro.so/txid/${tx_id})
📦 **Block:** ${block_height}
⏰ **Time:** ${new Date(timestamp).toLocaleString()}

${alert.type === 'buy' ? '🟢 This might be a good buying opportunity!' : '🔴 Consider taking profits!'}

_Alert ID: ${alert.id}_`;

    await bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
    
    console.log(`📱 Alert notification sent to user ${userId} for ${alert.symbol}`);
    
  } catch (error) {
    console.error(`❌ Error sending alert notification to user ${userId}:`, error);
  }
}

// Export functions for use in other parts of the system
export { userAlerts, bot, SUPPORTED_TOKENS };
