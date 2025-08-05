// API Route: Get Threshold from Smart Contract (for testing)
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dexInfo = searchParams.get('dexInfo');
    const tokenInfo = searchParams.get('tokenInfo');
    
    if (!dexInfo) {
      return NextResponse.json({ error: 'dexInfo parameter is required' }, { status: 400 });
    }

    console.log('🔍 API: Getting threshold for dexInfo:', dexInfo);

    // Parse contract addresses from dexInfo (format: "address.contract-name")
    const [dexAddress, dexName] = dexInfo.split('.');
    
    if (!dexAddress || !dexName) {
      return NextResponse.json({ error: 'Invalid dexInfo format' }, { status: 400 });
    }

    console.log('🔍 Contract details:', { dexAddress, dexName });

    // Try both testnet and mainnet
    const networks = [
      { name: 'testnet', network: STACKS_TESTNET },
      { name: 'mainnet', network: STACKS_MAINNET }
    ];

    for (const { name, network } of networks) {
      try {
        console.log(`🔍 Trying ${name} network...`);
        
        const result = await fetchCallReadOnlyFunction({
          contractAddress: dexAddress,
          contractName: dexName,
          functionName: 'get-threshold',
          functionArgs: [],
          network: network,
          senderAddress: dexAddress,
        });

        console.log(`🔍 ${name} result:`, result);

        // Try different ways to extract the value
        let threshold = 0;
        if (result) {
          if (result.value && result.value.value) {
            // Handle bigint values
            threshold = typeof result.value.value === 'bigint' ? Number(result.value.value) : parseInt(result.value.value);
          } else if (result.value) {
            threshold = parseInt(result.value);
          } else if (typeof result === 'number') {
            threshold = result;
          } else if (result.repr) {
            // Handle Clarity value representation
            const match = result.repr.match(/u(\d+)/);
            if (match) {
              threshold = parseInt(match[1]);
            }
          }
        }

        console.log(`🔍 Extracted threshold from ${name}:`, threshold);
        console.log(`🔍 Threshold >= 0 check:`, threshold >= 0);

        if (threshold >= 0) { // Changed from > 0 to >= 0 to allow 0 values
          console.log(`✅ Found threshold on ${name}:`, threshold);
          console.log(`✅ Returning success response for ${name}`);
          return NextResponse.json({
            threshold: threshold,
            network: name,
            contractAddress: dexAddress,
            contractName: dexName,
            isRealData: true
          });
        } else {
          console.log(`❌ Threshold not valid for ${name}:`, threshold);
        }
      } catch (error) {
        console.log(`❌ ${name} failed:`, error.message);
      }
    }

    return NextResponse.json({ 
      error: 'Threshold not found on any network',
      dexInfo: dexInfo,
      tokenInfo: tokenInfo
    }, { status: 404 });

  } catch (error) {
    console.error('❌ API: Failed to get threshold:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get threshold',
        details: error.message
      },
      { status: 500 }
    );
  }
} 