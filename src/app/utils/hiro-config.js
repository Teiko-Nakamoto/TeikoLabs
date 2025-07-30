// Hiro API Configuration with 15-second caching
export const HIRO_CONFIG = {
  // Your API Key - keep this in .env.local for security
  API_KEY: process.env.HIRO_API_KEY || 'your-api-key-here',
  
  // API endpoint 
  API_URL: process.env.HIRO_API_URL || 'https://stacks-node-api.testnet.stacks.co',
  
  // Request headers with API key
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'X-API-Key': HIRO_CONFIG.API_KEY
  })
};

// Enhanced network configuration for Stacks.js with Hiro (SERVER-SIDE ONLY)
export function getHiroNetworkServerSide() {
  const { STACKS_TESTNET } = require('@stacks/network');
  
  // This only works server-side where process.env is available
  const serverApiKey = process.env.HIRO_API_KEY;
  const serverApiUrl = process.env.HIRO_API_URL || 'https://stacks-node-api.testnet.stacks.co';
  
  // Debug logging
  console.log('🔍 Debug: Environment check:', {
    hasApiKey: !!serverApiKey,
    keyLength: serverApiKey?.length || 0,
    keyStart: serverApiKey?.substring(0, 8) || 'none',
    url: serverApiUrl
  });
  
  if (serverApiKey && serverApiKey !== 'your-api-key-here') {
    console.log('🔑 Server: Using Hiro API with your API key');
    return {
      ...STACKS_TESTNET,
      coreApiUrl: serverApiUrl,
      fetchFn: (url, init = {}) => {
        return fetch(url, {
          ...init,
          headers: {
            ...init.headers,
            'Content-Type': 'application/json',
            'X-API-Key': serverApiKey
          }
        });
      }
    };
  } else {
    console.log('🌐 Server: Using public node (add HIRO_API_KEY to .env.local for better performance)');
    return STACKS_TESTNET;
  }
}

// Client-side network (no API key for security)
export function getHiroNetwork() {
  const { STACKS_TESTNET } = require('@stacks/network');
  console.log('🌐 Client: Using public node (API keys are server-side only for security)');
  return STACKS_TESTNET;
}

// 15-second cache storage
const blockchainCache = new Map();
const CACHE_DURATION = 15000; // 15 seconds

// Helper function to get cached blockchain data
export async function getCachedBlockchainData(params) {
  // Create cache key from contract and function
  const cacheKey = `${params.contractAddress}.${params.contractName}.${params.functionName}`;
  
  // Check if we have valid cached data
  if (blockchainCache.has(cacheKey)) {
    const cached = blockchainCache.get(cacheKey);
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    
    if (!isExpired) {
      console.log(`💾 Cache HIT for ${params.functionName} (age: ${Date.now() - cached.timestamp}ms)`);
      return cached.data;
    } else {
      console.log(`⏰ Cache EXPIRED for ${params.functionName} (age: ${Date.now() - cached.timestamp}ms)`);
    }
  }
  
  // Cache miss or expired - make fresh blockchain call
  console.log(`🔄 Cache MISS for ${params.functionName} - fetching fresh data...`);
  
  // Use server-side API if we're running server-side (API routes)
  const isServerSide = typeof window === 'undefined';
  const result = isServerSide 
    ? await fetchCallReadOnlyFunctionWithHiroServerSide(params)
    : await fetchCallReadOnlyFunctionWithHiro(params);
  
  // Cache the result
  blockchainCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  console.log(`✅ Cached fresh data for ${params.functionName}`);
  return result;
}

// Helper function to make blockchain calls with Hiro API keys (SERVER-SIDE)
export async function fetchCallReadOnlyFunctionWithHiroServerSide(params) {
  const { fetchCallReadOnlyFunction } = require('@stacks/transactions');
  
  try {
    const result = await fetchCallReadOnlyFunction({
      ...params,
      network: getHiroNetworkServerSide()
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Server Hiro API call failed:', error.message);
    throw error;
  }
}

// Helper function to make blockchain calls (CLIENT-SIDE)
export async function fetchCallReadOnlyFunctionWithHiro(params) {
  const { fetchCallReadOnlyFunction } = require('@stacks/transactions');
  
  try {
    const result = await fetchCallReadOnlyFunction({
      ...params,
      network: getHiroNetwork()
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Client API call failed:', error.message);
    throw error;
  }
}

// Get cache statistics (for monitoring)
export function getCacheStats() {
  const now = Date.now();
  const totalEntries = blockchainCache.size;
  let validEntries = 0;
  let expiredEntries = 0;
  
  blockchainCache.forEach((cached, key) => {
    const age = now - cached.timestamp;
    if (age <= CACHE_DURATION) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });
  
  return {
    totalEntries,
    validEntries, 
    expiredEntries,
    cacheDurationMs: CACHE_DURATION,
    cacheKeys: Array.from(blockchainCache.keys())
  };
}