// API Route: Get Current Token Price (Server-side with API key + caching)
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { rateLimitMiddleware, addRateLimitHeaders } from '../../utils/rateLimiter';
import { withCors } from '../../utils/corsMiddleware';

// Contract configuration
const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
const DEX_CONTRACT_NAME = 'dear-cyan-dex';

async function handler(request) {
  try {

    // Apply rate limiting
    const rateLimitInfo = await rateLimitMiddleware(request, 'blockchain');
    
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60
        },
        { status: 429 }
      );
      return addRateLimitHeaders(response, rateLimitInfo);
    }

    console.log('🔍 API: Calculating current price with cached data...');

    // Get blockchain data
    const [sbtcBalance, tokenBalance, totalLocked] = await Promise.all([
      fetchCallReadOnlyFunction({
        contractAddress: DEX_CONTRACT_ADDRESS,
        contractName: DEX_CONTRACT_NAME,
        functionName: 'get-sbtc-balance',
        functionArgs: [],
        network: STACKS_TESTNET,
        senderAddress: DEX_CONTRACT_ADDRESS,
      }),
      fetchCallReadOnlyFunction({
        contractAddress: DEX_CONTRACT_ADDRESS,
        contractName: DEX_CONTRACT_NAME,
        functionName: 'get-token-balance',
        functionArgs: [],
        network: STACKS_TESTNET,
        senderAddress: DEX_CONTRACT_ADDRESS,
      }),
      fetchCallReadOnlyFunction({
        contractAddress: DEX_CONTRACT_ADDRESS,
        contractName: DEX_CONTRACT_NAME,
        functionName: 'get-total-locked',
        functionArgs: [],
        network: STACKS_TESTNET,
        senderAddress: DEX_CONTRACT_ADDRESS,
      })
    ]);

    // Extract values
    const sbtcValue = parseInt(sbtcBalance?.value?.value || sbtcBalance?.value || 0);
    const tokenValue = parseInt(tokenBalance?.value?.value || tokenBalance?.value || 0);
    const lockedValue = parseInt(totalLocked?.value?.value || totalLocked?.value || 0);

    console.log('💰 Balance data:', { sbtcValue, tokenValue, lockedValue });

    // Calculate tradeable tokens (total - locked)
    const tradeableTokenBalance = tokenValue - lockedValue;

    if (tradeableTokenBalance <= 0) {
      console.log('⚠️ No tradeable tokens available');
      return NextResponse.json({ 
        price: 0, 
        error: 'No tradeable tokens available',
        balances: { sbtcValue, tokenValue, lockedValue, tradeableTokenBalance }
      });
    }

    // AMM price calculation: SBTC / tradeable tokens
    const virtualSbtc = 1500000; // INITIAL_VIRTUAL_SBTC constant (0.015 sBTC)
    const pricePerTokenInSats = (sbtcValue + virtualSbtc) / tradeableTokenBalance;

    console.log('📊 Price calculation:', {
      formula: `(${sbtcValue} + ${virtualSbtc}) / ${tradeableTokenBalance} = ${pricePerTokenInSats}`,
      pricePerTokenInSats
    });

    const response = NextResponse.json({
      price: pricePerTokenInSats,
      balances: {
        sbtc: sbtcValue,
        totalTokens: tokenValue,
        lockedTokens: lockedValue,
        tradeableTokens: tradeableTokenBalance
      },
      cached: true
    });
    
    // Add rate limit headers
    return addRateLimitHeaders(response, rateLimitInfo);

  } catch (error) {
    console.error('❌ API: Failed to calculate current price:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate current price',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const GET = withCors(handler);