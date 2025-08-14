// API Route: Get Total Token Balance (Server-side with API key + caching)
import { NextResponse } from 'next/server';
import { rateLimitMiddleware, addRateLimitHeaders } from '../../utils/rateLimiter';
import { withCors } from '../../utils/corsMiddleware';
import { loggedBlockchainCall } from '../../utils/cacheLogger';
import { getHiroNetworkServerSide } from '../../utils/hiro-config';

// Contract configuration
const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
const DEX_CONTRACT_NAME = 'mas-sats-dex';

async function handler(request) {
  try {
    // Parse query parameters for contract info
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('address') || DEX_CONTRACT_ADDRESS;
    const contractName = searchParams.get('name') || DEX_CONTRACT_NAME;

    console.log('🔍 API: Total token balance using contract:', { contractAddress, contractName });

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

    // Get total token balance with 15-second caching and API key
    const result = await loggedBlockchainCall(
      'api-total-token-balance',
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-token-balance',
          functionArgs: [],
          network: getHiroNetworkServerSide(), // Use API key
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );

    const totalBalance = parseInt(result?.value?.value || result?.value || 0);
    const balanceInTokens = totalBalance / 100000000; // Convert from micro units

    console.log('💰 Total token balance:', { totalBalance, balanceInTokens });

    const response = NextResponse.json({
      totalBalance: balanceInTokens,
      rawBalance: totalBalance,
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
        error: 'Failed to fetch total token balance',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Export with CORS middleware
export const GET = withCors(handler);