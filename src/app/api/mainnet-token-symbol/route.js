// API Route: Get Mainnet Token Symbol (Server-side with API key + 24-hour caching)
import { NextResponse } from 'next/server';
import { rateLimitMiddleware, addRateLimitHeaders } from '../../utils/rateLimiter';
import { withCors } from '../../utils/corsMiddleware';
import { loggedBlockchainCall } from '../../utils/cacheLogger';
import { getHiroNetworkServerSide } from '../../utils/hiro-config';

async function handler(request) {
  try {
    // Parse query parameters for contract info
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('address');
    const contractName = searchParams.get('name');

    if (!contractAddress || !contractName) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          message: 'Both address and name parameters are required'
        },
        { status: 400 }
      );
    }

    console.log('🔍 API: Mainnet token symbol using contract:', { contractAddress, contractName });

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

    // Import fetchCallReadOnlyFunction for server-side use with API key
    const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');

    // Try different symbol functions that might exist on token contracts
    const symbolFunctions = ['get-symbol', 'get-token-symbol', 'symbol', 'get-name'];
    let symbol = null;
    let successfulFunction = null;

    for (const funcName of symbolFunctions) {
      try {
        const result = await loggedBlockchainCall(
          `mainnet-api-${funcName}`,
          async () => {
            return await fetchCallReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: funcName,
              functionArgs: [],
              network: getHiroNetworkServerSide('mainnet'), // Use mainnet with API key
              senderAddress: contractAddress,
            });
          },
          86400000 // 24 hours cache duration (once a day)
        );

        const rawValue = result?.value?.value || result?.value || null;
        if (rawValue) {
          const symbolValue = typeof rawValue === 'string' ? rawValue : String(rawValue);
          if (symbolValue && symbolValue.trim() !== '') {
            symbol = symbolValue.trim();
            successfulFunction = funcName;
            console.log('🔍 Mainnet symbol found:', { symbol, function: funcName });
            break;
          }
        }
      } catch (error) {
        console.log(`Mainnet symbol function ${funcName} failed:`, error.message);
      }
    }

    console.log('🏷️ Mainnet token symbol:', { symbol, successfulFunction });

    const response = NextResponse.json({
      symbol,
      successfulFunction,
      contract: {
        address: contractAddress,
        name: contractName
      },
      cached: true,
      cacheDuration: '24 hours'
    });

    return addRateLimitHeaders(response, rateLimitInfo);

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch mainnet token symbol',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Export with CORS middleware
export const GET = withCors(handler);
