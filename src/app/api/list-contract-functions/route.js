// API Route: List Contract Functions (for debugging)
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dexInfo = searchParams.get('dexInfo');
    
    if (!dexInfo) {
      return NextResponse.json({ error: 'dexInfo parameter is required' }, { status: 400 });
    }

    console.log('🔍 API: Listing functions for dexInfo:', dexInfo);

    // Parse contract addresses from dexInfo (format: "address.contract-name")
    const [dexAddress, dexName] = dexInfo.split('.');
    
    if (!dexAddress || !dexName) {
      return NextResponse.json({ error: 'Invalid dexInfo format' }, { status: 400 });
    }

    console.log('🔍 Contract details:', { dexAddress, dexName });

    // Common function names to try
    const commonFunctions = [
      'get-threshold',
      'get-minimum-threshold',
      'get-unlock-threshold',
      'get-revenue-threshold',
      'get-minimum-revenue',
      'get-unlock-amount',
      'get-liquidity-threshold',
      'get-sbtc-balance',
      'get-token-balance',
      'get-total-locked',
      'get-revenue',
      'get-fee-pool'
    ];

    const results = {};

    // Try both testnet and mainnet
    const networks = [
      { name: 'testnet', network: STACKS_TESTNET },
      { name: 'mainnet', network: STACKS_MAINNET }
    ];

    for (const { name, network } of networks) {
      results[name] = {};
      
      for (const funcName of commonFunctions) {
        try {
          console.log(`🔍 Trying ${name} network, function: ${funcName}`);
          
          const result = await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: funcName,
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });

          console.log(`✅ ${name}.${funcName} result:`, result);
          
          // Try to extract value
          let value = null;
          if (result) {
            if (result.value) {
              value = result.value;
            } else if (result.value?.value) {
              value = result.value.value;
            } else if (typeof result === 'number') {
              value = result;
            } else if (result.repr) {
              value = result.repr;
            }
          }
          
          results[name][funcName] = {
            success: true,
            value: value,
            rawResult: result
          };
          
        } catch (error) {
          console.log(`❌ ${name}.${funcName} failed:`, error.message);
          results[name][funcName] = {
            success: false,
            error: error.message
          };
        }
      }
    }

    return NextResponse.json({
      contractAddress: dexAddress,
      contractName: dexName,
      dexInfo: dexInfo,
      results: results
    });

  } catch (error) {
    console.error('❌ API: Failed to list functions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list functions',
        details: error.message
      },
      { status: 500 }
    );
  }
} 