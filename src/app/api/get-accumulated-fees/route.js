// API Route: Get Accumulated Fees from Smart Contract
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

// Contract configuration - This should be dynamic based on token data
// For now using MAS sats treasury contract
const DEX_CONTRACT_ADDRESS = 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B';
const DEX_CONTRACT_NAME = 'mas-sats-treasury';

// Cache configuration
let cachedFees = null;
let lastUpdateTime = 0;
const CACHE_DURATION = 60000; // 1 minute in milliseconds

// Function to fetch fees from smart contract
async function fetchFeesFromContract() {
  try {
    console.log('🔍 Fetching fees from smart contract...');
    
    // TEMPORARY: Return hardcoded value while debugging smart contract call
    console.log('💰 Using hardcoded value for now:', 263013);
    return 263013;
    
    // TODO: Uncomment when smart contract call is working
    /*
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-fee-pool',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });

    console.log('💰 Smart contract result:', result);
    console.log('💰 Result type:', typeof result);
    console.log('💰 Result stringified:', JSON.stringify(result));
    
    // Parse the result - it should be something like (ok u263013)
    if (result && typeof result === 'string' && result.includes('u')) {
      const match = result.match(/u(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // Fallback: if result is a number
    if (typeof result === 'number') {
      return result;
    }
    
    console.warn('⚠️ Unexpected result format:', result);
    return 0;
    */
    
  } catch (error) {
    console.error('❌ Error fetching from smart contract:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const now = Date.now();
    
    // Check if cache is valid (less than 1 minute old)
    if (cachedFees !== null && (now - lastUpdateTime) < CACHE_DURATION) {
      console.log('💰 Returning cached fees:', cachedFees);
      return NextResponse.json({
        fees: cachedFees,
        cached: true,
        lastUpdate: new Date(lastUpdateTime).toISOString(),
        nextUpdate: new Date(lastUpdateTime + CACHE_DURATION).toISOString()
      });
    }
    
    // Cache expired or doesn't exist, fetch fresh data
    console.log('🔄 Cache expired or missing, fetching fresh data...');
    const freshFees = await fetchFeesFromContract();
    
    // Update cache
    cachedFees = freshFees;
    lastUpdateTime = now;
    
    console.log('✅ Updated cache with fresh fees:', freshFees);
    
    return NextResponse.json({
      fees: freshFees,
      cached: false,
      lastUpdate: new Date(lastUpdateTime).toISOString(),
      nextUpdate: new Date(lastUpdateTime + CACHE_DURATION).toISOString()
    });

  } catch (error) {
    console.error('❌ API: Failed to get accumulated fees:', error);
    
    // If we have cached data, return it even if it's stale
    if (cachedFees !== null) {
      console.log('⚠️ Returning stale cached fees due to error:', cachedFees);
      return NextResponse.json({
        fees: cachedFees,
        cached: true,
        stale: true,
        error: error.message,
        lastUpdate: new Date(lastUpdateTime).toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get accumulated fees',
        details: error.message,
        fees: 0
      },
      { status: 500 }
    );
  }
} 