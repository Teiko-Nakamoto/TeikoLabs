// API Route: Get SBTC Liquidity Balance (Server-side with API key + caching)
import { NextResponse } from 'next/server';
import { getCachedBlockchainData } from '../../utils/hiro-config';

// Contract configuration
const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
const DEX_CONTRACT_NAME = 'dear-cyan-dex';

export async function GET() {
  try {
    console.log('🔍 API: Getting SBTC balance with cached data...');

    // Get cached SBTC balance (uses your API key server-side)
    const result = await getCachedBlockchainData({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      senderAddress: DEX_CONTRACT_ADDRESS,
    });

    const sbtcValue = parseInt(result?.value?.value || result?.value || 0);
    
    console.log('💰 SBTC Balance:', sbtcValue);

    return NextResponse.json({
      balance: sbtcValue,
      cached: true
    });

  } catch (error) {
    console.error('❌ API: Failed to get SBTC balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get SBTC balance',
        details: error.message
      },
      { status: 500 }
    );
  }
}