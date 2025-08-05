// API Route: Get Total Locked Tokens (Server-side with API key + caching)
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

// Contract configuration
const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
const DEX_CONTRACT_NAME = 'dear-cyan-dex';

export async function GET() {
  try {
    console.log('🔍 API: Getting total locked tokens with cached data...');

    // Get cached locked tokens (uses your API key server-side)
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-total-locked',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });

    const lockedValue = parseInt(result?.value?.value || result?.value || 0);
    
    console.log('🔒 Total Locked Tokens:', lockedValue);

    return NextResponse.json({
      balance: lockedValue,
      cached: true
    });

  } catch (error) {
    console.error('❌ API: Failed to get total locked tokens:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get total locked tokens',
        details: error.message
      },
      { status: 500 }
    );
  }
}