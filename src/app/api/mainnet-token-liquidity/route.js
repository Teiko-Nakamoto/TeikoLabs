// API Route: Get Mainnet Token Liquidity (Server-side with API key + caching)
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

    console.log('🔍 API: Mainnet token liquidity using contract:', { contractAddress, contractName });

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

    // Try different liquidity functions
    const liquidityFunctions = ['get-sbtc-balance', 'get-liquidity', 'get-total-liquidity'];
    let liquidity = 0;
    let successfulFunction = null;

    for (const funcName of liquidityFunctions) {
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
          15000 // 15 seconds cache duration
        );

        const rawValue = result?.value?.value || result?.value || null;
        if (rawValue) {
          const satsValue = typeof rawValue === 'string' ? parseInt(rawValue) : Number(rawValue);
          if (satsValue > 0) {
            liquidity = satsValue;
            successfulFunction = funcName;
            console.log('🔍 Mainnet liquidity found:', { liquidity, function: funcName });
            break;
          }
        }
      } catch (error) {
        console.log(`Mainnet liquidity function ${funcName} failed:`, error.message);
      }
    }

    console.log('💰 Mainnet token liquidity:', { liquidity, successfulFunction });

    const response = NextResponse.json({
      liquidity,
      successfulFunction,
      contract: {
        address: contractAddress,
        name: contractName
      },
      cached: true,
      cacheDuration: '15 seconds'
    });

    return addRateLimitHeaders(response, rateLimitInfo);

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch mainnet token liquidity',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Export with CORS middleware
export const GET = withCors(handler);
