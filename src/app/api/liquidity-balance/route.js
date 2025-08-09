// API Route: Get SBTC Liquidity Balance (Server-side with API key + caching)
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

// Contract configuration
const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
const DEX_CONTRACT_NAME = 'dear-cyan-dex';

export async function GET(request) {
  try {
    // Parse query parameters for contract info
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('address') || DEX_CONTRACT_ADDRESS;
    const contractName = searchParams.get('name') || DEX_CONTRACT_NAME;
    const networkParam = searchParams.get('network') || 'testnet';
    const network = networkParam === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

    console.log('🔍 API: Getting SBTC balance from contract:', { contractAddress, contractName, network: networkParam });

    // Get cached SBTC balance (uses your API key server-side)
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      network,
      senderAddress: contractAddress,
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