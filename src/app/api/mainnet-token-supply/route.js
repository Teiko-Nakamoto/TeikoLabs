// API Route: Get Mainnet Token Total Supply (Server-side with API key + 30-day caching)
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

    console.log('🔍 API: Mainnet token total supply using contract:', { contractAddress, contractName });

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

    // Try different total supply functions that might exist on token contracts
    const supplyFunctions = ['get-total-supply', 'get-supply', 'total-supply', 'supply', 'get-token-balance'];
    let totalSupply = 0;
    let successfulFunction = null;

    for (const funcName of supplyFunctions) {
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
          2592000000 // 30 days cache duration (once and never change)
        );

        const rawValue = result?.value?.value || result?.value || null;
        if (rawValue) {
          const supplyValue = typeof rawValue === 'string' ? parseInt(rawValue) : Number(rawValue);
          if (supplyValue > 0) {
            totalSupply = supplyValue;
            successfulFunction = funcName;
            console.log('🔍 Mainnet total supply found:', { totalSupply, function: funcName });
            break;
          }
        }
      } catch (error) {
        console.log(`Mainnet total supply function ${funcName} failed:`, error.message);
      }
    }

    console.log('💰 Mainnet token total supply:', { totalSupply, successfulFunction });

    const response = NextResponse.json({
      totalSupply,
      successfulFunction,
      contract: {
        address: contractAddress,
        name: contractName
      },
      cached: true,
      cacheDuration: '30 days'
    });

    return addRateLimitHeaders(response, rateLimitInfo);

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch mainnet token total supply',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Export with CORS middleware
export const GET = withCors(handler);
