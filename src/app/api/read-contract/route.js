/**
 * API Route: Read Contract Data
 * 
 * PURPOSE: Generic endpoint to read any contract function on Stacks blockchain
 * USES: Hiro API with your API key for rate limit access (900 requests/min)
 * 
 * This endpoint is used to read token balances, total supply, and other
 * contract data for tokens like MAS Sats.
 */
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction, cvToValue, standardPrincipalCV } from '@stacks/transactions';
import { getHiroNetworkServerSide } from '../../utils/hiro-config';

// Custom JSON replacer to handle BigInt serialization
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString() + 'n'; // Convert BigInt to string with 'n' suffix
  }
  return value;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { contractAddress, contractName, functionName, functionArgs } = body;

    console.log('🔍 Read contract request - FULL BODY:', JSON.stringify(body, jsonReplacer, 2));
    console.log('🔍 Read contract request - PARSED:', {
      contractAddress,
      contractName,
      functionName,
      functionArgs: JSON.stringify(functionArgs, jsonReplacer)
    });

    // Validate required parameters
    if (!contractAddress || !contractName || !functionName) {
      console.log('❌ Missing required parameters:', { contractAddress, contractName, functionName });
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: contractAddress, contractName, functionName'
      });
    }

    // Auto-detect network based on address prefix
    const network = contractAddress.startsWith('ST') ? 'testnet' : 'mainnet';
    
    // Select network with API key support
    const stacksNetwork = getHiroNetworkServerSide(network);
    
    // Get the API URL for the selected network
    const apiUrl = network === 'mainnet' 
      ? 'https://api.hiro.so' 
      : 'https://api.testnet.hiro.so';

    console.log('🌐 Network detection details:', {
      originalAddress: contractAddress,
      addressPrefix: contractAddress.substring(0, 2),
      detectedNetwork: network,
      apiUrl: apiUrl,
      stacksNetworkConfig: JSON.stringify(stacksNetwork, jsonReplacer, 2)
    });

    try {
      // Convert function arguments to Clarity values if needed
      let clarityArgs = functionArgs || [];
      console.log('🔧 Original functionArgs:', JSON.stringify(functionArgs, jsonReplacer));
      console.log('🔧 Initial clarityArgs:', JSON.stringify(clarityArgs, jsonReplacer));
      
      if (functionName === 'get-balance' && clarityArgs.length > 0) {
        // Convert address string to principal CV
        console.log('🔧 Converting address to principal CV:', clarityArgs[0]);
        clarityArgs = [standardPrincipalCV(clarityArgs[0])];
        console.log('🔧 Converted clarityArgs:', JSON.stringify(clarityArgs, jsonReplacer));
      }

      console.log('🚀 Making blockchain call with:', {
        contractAddress,
        contractName,
        functionName,
        functionArgs: JSON.stringify(clarityArgs, jsonReplacer),
        network: JSON.stringify(stacksNetwork, jsonReplacer),
        senderAddress: contractAddress
      });

      // Call the read-only function with API key support
      const result = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName,
        functionArgs: clarityArgs,
        network: stacksNetwork,
        senderAddress: contractAddress, // Use contract address as sender for read-only calls
      });

      console.log('📊 Raw contract result - FULL OBJECT:', JSON.stringify(result, jsonReplacer, 2));
      console.log('📊 Raw contract result - TYPE:', typeof result);
      console.log('📊 Raw contract result - CONSTRUCTOR:', result?.constructor?.name);
      console.log('📊 Raw contract result - KEYS:', Object.keys(result || {}));

      // Convert the Clarity value to a JavaScript value
      const jsValue = cvToValue(result);
      
      console.log('✅ Converted result - FULL:', JSON.stringify(jsValue, jsonReplacer, 2));
      console.log('✅ Converted result - TYPE:', typeof jsValue);
      console.log('✅ Converted result - VALUE:', jsValue);
      
      // Handle the specific format "ok u4683430196513" - extract the number
      let finalResult = jsValue;
      if (typeof jsValue === 'string' && jsValue.startsWith('ok u')) {
        const numberPart = jsValue.substring(4); // Remove "ok u"
        finalResult = parseInt(numberPart);
        console.log('🔢 Extracted number from "ok u" format:', {
          original: jsValue,
          numberPart: numberPart,
          finalResult: finalResult
        });
      } else if (typeof jsValue === 'string' && jsValue.startsWith('ok ')) {
        const numberPart = jsValue.substring(3); // Remove "ok "
        finalResult = parseInt(numberPart);
        console.log('🔢 Extracted number from "ok " format:', {
          original: jsValue,
          numberPart: numberPart,
          finalResult: finalResult
        });
      }

      console.log('🎯 FINAL RESULT:', {
        originalJsValue: jsValue,
        finalResult: finalResult,
        type: typeof finalResult
      });

      return NextResponse.json({
        success: true,
        result: finalResult,
        network,
        contract: `${contractAddress}.${contractName}`,
        function: functionName,
        debug: {
          originalJsValue: jsValue,
          finalResult: finalResult,
          resultType: typeof finalResult
        }
      });

    } catch (contractError) {
      console.error('❌ Contract call error - FULL:', contractError);
      console.error('❌ Contract call error - MESSAGE:', contractError.message);
      console.error('❌ Contract call error - STACK:', contractError.stack);
      
      return NextResponse.json({
        success: false,
        error: contractError.message,
        details: {
          contract: `${contractAddress}.${contractName}`,
          function: functionName,
          network,
          fullError: contractError.toString()
        }
      });
    }

  } catch (error) {
    console.error('❌ API error - FULL:', error);
    console.error('❌ API error - MESSAGE:', error.message);
    console.error('❌ API error - STACK:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
