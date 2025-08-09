// API Route: Get Current Majority Holder Address from Smart Contract
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

export async function GET(request) {
  try {
    // Parse query parameters for contract info
    const { searchParams } = new URL(request.url);
    const dexInfo = searchParams.get('dexInfo');
    const tokenInfo = searchParams.get('tokenInfo');
    const networkParam = searchParams.get('network') || 'testnet';
    const network = networkParam === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

    if (!dexInfo) {
      return NextResponse.json({ error: 'dexInfo is required' }, { status: 400 });
    }

    console.log('🔍 API: Getting majority holder address from contract:', { dexInfo, network: networkParam });

    // Parse the dexInfo to get contract address and name
    const [contractAddress, contractName] = dexInfo.split('.');

    if (!contractAddress || !contractName) {
      return NextResponse.json({ error: 'Invalid dexInfo format' }, { status: 400 });
    }

    try {
      // Call the get-majority-holder function from the smart contract
      const result = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-majority-holder',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
      });

      console.log('🔍 Smart contract result:', result);

      // Parse the result
      let majorityHolderAddress = null;
      
      if (result && result.value) {
        // Handle different possible response formats
        if (result.value.value) {
          // Response format: { value: { value: "address" } }
          majorityHolderAddress = result.value.value;
        } else if (typeof result.value === 'string') {
          // Response format: { value: "address" }
          majorityHolderAddress = result.value;
        } else if (result.value.type === 'principal') {
          // Response format: { value: { type: "principal", value: "address" } }
          majorityHolderAddress = result.value.value;
        }
      }

      // Check if address is valid (not null, empty, or zero address)
      const isValidAddress = majorityHolderAddress && 
                            majorityHolderAddress !== '' && 
                            majorityHolderAddress !== 'null' &&
                            !majorityHolderAddress.includes('none') &&
                            !majorityHolderAddress.includes('0x00');

      console.log('👑 Majority holder address:', majorityHolderAddress, 'Valid:', isValidAddress);

      return NextResponse.json({
        success: true,
        majorityHolderAddress: isValidAddress ? majorityHolderAddress : null,
        hasValidHolder: isValidAddress,
        rawResult: result
      });

    } catch (contractError) {
      console.error('❌ Smart contract call failed:', contractError);
      
      // Return "None" if contract call fails
      return NextResponse.json({
        success: true,
        majorityHolderAddress: null,
        hasValidHolder: false,
        error: 'Contract call failed'
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get majority holder address',
        details: error.message
      },
      { status: 500 }
    );
  }
}
