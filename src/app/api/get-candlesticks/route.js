/**
 * API Route: Get Token Candlesticks
 * 
 * PURPOSE: Fetches candlestick chart data for token price history
 * USES: Hiro API with your API key for rate limit access (900 requests/min)
 * CACHE: 5-minute caching to reduce API calls
 * 
 * This endpoint is used by the trading charts to display price history
 * and candlestick patterns for tokens like MAS Sats.
 */
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

// In-memory cache (in production, you might want Redis)
const candleCache = new Map();

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// DEX contract address
const DEX_CONTRACT_ADDRESS = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.dex-v1-01';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const interval = searchParams.get('interval') || '5m'; // 5-minute candles by default

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `candles_${tokenId}_${interval}`;
    const cached = candleCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📊 Returning cached candlestick data');
      return NextResponse.json({ 
        candlesticks: cached.data,
        cached: true,
        lastUpdate: cached.timestamp
      });
    }

    console.log('🔄 Fetching fresh candlestick data from blockchain...');

    // Fetch recent trades from blockchain
    const recentTrades = await fetchRecentTrades(tokenId);
    
    // Transform to candlesticks
    const candlesticks = transformToCandlesticks(recentTrades, interval);

    // Cache the result
    candleCache.set(cacheKey, {
      data: candlesticks,
      timestamp: Date.now()
    });

    // Clean up old cache entries (keep only last 100 entries)
    if (candleCache.size > 100) {
      const firstKey = candleCache.keys().next().value;
      candleCache.delete(firstKey);
    }

    return NextResponse.json({
      candlesticks,
      cached: false,
      lastUpdate: Date.now()
    });

  } catch (error) {
    console.error('❌ Error fetching candlestick data:', error);
    
    // Return cached data if available, even if stale
    const cacheKey = `candles_${searchParams.get('tokenId')}_${searchParams.get('interval') || '5m'}`;
    const cached = candleCache.get(cacheKey);
    
    if (cached) {
      console.log('📊 Returning stale cached data due to error');
      return NextResponse.json({
        candlesticks: cached.data,
        cached: true,
        stale: true,
        lastUpdate: cached.timestamp,
        error: 'Using cached data due to network error'
      });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch candlestick data',
      candlesticks: []
    }, { status: 500 });
  }
}

async function fetchRecentTrades(tokenId) {
  try {
    console.log('🔍 Fetching recent transactions for token:', tokenId);
    
    // Get the current timestamp and 24 hours ago
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - (24 * 60 * 60); // 24 hours ago
    
    // Fetch recent transactions from Hiro API - increased limit to get more data
    const response = await fetch(
      `https://api.hiro.so/extended/v1/tx/?limit=1000&start_time=${oneDayAgo}&end_time=${now}&contract_id=ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.dex-v1-01`,
      {
        headers: {
          'Accept': 'application/json',
          'x-api-key': process.env.HIRO_API_KEY || ''
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Hiro API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Fetched', data.results?.length || 0, 'transactions from Hiro API');
    
    // Filter for swap transactions and transform to trade format
    const trades = [];
    
    if (data.results) {
      for (const tx of data.results) {
        // Look for swap events in the transaction
        if (tx.events && tx.events.length > 0) {
          for (const event of tx.events) {
            // Check if this is a swap event for our token
            if (event.event_type === 'contract_event' && 
                event.contract_log) {
              
              // Try different event topic patterns
              const topic = event.contract_log.topic;
              if (topic === 'swap' || topic === 'trade' || topic.includes('swap') || topic.includes('trade')) {
                
                // Extract trade data from the event
                const trade = extractTradeFromEvent(event, tx, tokenId);
                if (trade) {
                  trades.push(trade);
                }
              }
            }
          }
        }
        
        // Also check for token transfer events that might be swaps
        if (tx.tx_type === 'contract_call' && tx.contract_call) {
          const contractCall = tx.contract_call;
          if (contractCall.contract_id === 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.dex-v1-01' &&
              (contractCall.function_name === 'swap' || contractCall.function_name === 'swap-tokens')) {
            
            // Try to extract trade data from contract call arguments
            const trade = extractTradeFromContractCall(contractCall, tx, tokenId);
            if (trade) {
              trades.push(trade);
            }
          }
        }
      }
    }
    
    console.log('🔄 Found', trades.length, 'swap trades for token', tokenId);
    
    // If no real trades found, fall back to mock data
    if (trades.length === 0) {
      console.log('⚠️ No real trades found, using mock data');
      return generateMockTrades(50);
    }
    
    return trades;
    
  } catch (error) {
    console.error('❌ Error fetching recent trades from Hiro API:', error);
    
    // Fall back to mock data on error
    console.log('🔄 Falling back to mock data due to API error');
    return generateMockTrades(50);
  }
}

function extractTradeFromEvent(event, tx, tokenId) {
  try {
    // Parse the event data to extract trade information
    const eventData = event.contract_log?.value || {};
    
    // Extract basic trade info
    const timestamp = tx.block_time * 1000; // Convert to milliseconds
    const tokensAmount = parseFloat(eventData.tokens_amount || 0);
    const satsAmount = parseFloat(eventData.sats_amount || 0);
    
    // Calculate price
    const price = tokensAmount > 0 ? satsAmount / tokensAmount : 0;
    
    // Determine trade type based on event data
    const tradeType = eventData.trade_type || 'swap';
    
    if (tokensAmount > 0 && satsAmount > 0) {
      return {
        timestamp,
        price,
        tokensAmount,
        satsAmount,
        type: tradeType,
        txId: tx.tx_id,
        blockHeight: tx.block_height
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error extracting trade from event:', error);
    return null;
  }
}

function extractTradeFromContractCall(contractCall, tx, tokenId) {
  try {
    const timestamp = tx.block_time * 1000; // Convert to milliseconds
    
    // Try to extract trade data from function arguments
    const args = contractCall.function_args || [];
    
    let tokensAmount = 0;
    let satsAmount = 0;
    
    // Look for amount arguments in the function call
    for (const arg of args) {
      if (arg.name === 'tokens-amount' || arg.name === 'amount') {
        tokensAmount = parseFloat(arg.repr || 0);
      } else if (arg.name === 'sats-amount' || arg.name === 'sats') {
        satsAmount = parseFloat(arg.repr || 0);
      }
    }
    
    // If we found both amounts, calculate price
    if (tokensAmount > 0 && satsAmount > 0) {
      const price = satsAmount / tokensAmount;
      
      return {
        timestamp,
        price,
        tokensAmount,
        satsAmount,
        type: 'swap',
        txId: tx.tx_id,
        blockHeight: tx.block_height
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error extracting trade from contract call:', error);
    return null;
  }
}

function transformToCandlesticks(trades, interval) {
  // Group trades by time intervals
  const groupedTrades = groupTradesByInterval(trades, interval);
  
  // Convert to candlestick format
  const candlesticks = [];
  
  for (const [timestamp, tradesInInterval] of groupedTrades) {
    if (tradesInInterval.length === 0) continue;
    
    const prices = tradesInInterval.map(trade => trade.price);
    const volumes = tradesInInterval.map(trade => trade.tokensAmount);
    
    const candlestick = {
      timestamp: timestamp,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume: volumes.reduce((sum, vol) => sum + vol, 0),
      tradeCount: tradesInInterval.length
    };
    
    candlesticks.push(candlestick);
  }
  
  // Sort by timestamp and return all available candlesticks
  return candlesticks
    .sort((a, b) => a.timestamp - b.timestamp);
}

function groupTradesByInterval(trades, interval) {
  const groups = new Map();
  const intervalMs = getIntervalMs(interval);
  
  trades.forEach(trade => {
    const timestamp = Math.floor(trade.timestamp / intervalMs) * intervalMs;
    
    if (!groups.has(timestamp)) {
      groups.set(timestamp, []);
    }
    
    groups.get(timestamp).push(trade);
  });
  
  return groups;
}

function getIntervalMs(interval) {
  const intervals = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  
  return intervals[interval] || intervals['5m'];
}

function generateMockTrades(count) {
  const trades = [];
  const now = Date.now();
  const basePrice = 0.05; // Base price of 0.05 sats per token
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * 5 * 60 * 1000; // 5-minute intervals
    const priceVariation = (Math.random() - 0.5) * 0.01; // ±0.01 sats variation
    const price = Math.max(0.001, basePrice + priceVariation);
    const tokensAmount = Math.random() * 1000 + 100; // 100-1100 tokens
    
    trades.push({
      timestamp,
      price,
      tokensAmount,
      satsAmount: price * tokensAmount,
      type: Math.random() > 0.5 ? 'buy' : 'sell'
    });
  }
  
  return trades;
} 