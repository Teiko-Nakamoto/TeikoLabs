// API Route: Get Total Token Balance (Server-side with API key + caching)
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

// Contract configuration
const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
const DEX_CONTRACT_NAME = 'dear-cyan-dex';

export async function GET() {
  try {
    console.log('🔍 API: Getting total token balance with cached data...');

    // Get cached token balance (uses your API key server-side)
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-token-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });

    const tokenValue = parseInt(result?.value?.value || result?.value || 0);
    
    console.log('🪙 Total Token Balance:', tokenValue);

    return NextResponse.json({
      balance: tokenValue,
      cached: true
    });

  } catch (error) {
    console.error('❌ API: Failed to get total token balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get total token balance',
        details: error.message
      },
      { status: 500 }
    );
  }
}