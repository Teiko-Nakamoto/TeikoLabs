// Mainnet Token Data Utilities - Separate from practice trading
// This file handles mainnet-specific blockchain interactions

import { STACKS_MAINNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, Cl, principalCV, cvToValue } from '@stacks/transactions';
import { getLocalStorage } from '@stacks/connect';
import { logCacheActivity, loggedBlockchainCall } from './cacheLogger';

// Mainnet-specific contract addresses (to be configured)
export const MAINNET_SBTC_CONTRACT_ADDRESS = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
export const MAINNET_SBTC_CONTRACT_NAME = 'sbtc-token';

// Utility function to parse mainnet contract info from tokenData
export function parseMainnetContractInfo(tokenData) {
  if (!tokenData) return null;
  
  // Always use mainnet network for mainnet tokens
  const network = STACKS_MAINNET;
  
  // Parse DEX contract info from dexInfo or dexContractAddress
  const dexContract = tokenData.dexInfo || tokenData.dexContractAddress;
  if (dexContract && dexContract.includes('.')) {
    const [address, name] = dexContract.split('.');
    return {
      address,
      name,
      network,
      tokenData,
      type: 'dex'
    };
  }
  
  // Parse token contract info from tokenInfo or tokenContractAddress
  const tokenContract = tokenData.tokenInfo || tokenData.tokenContractAddress;
  if (tokenContract && tokenContract.includes('.')) {
    const [address, name] = tokenContract.split('.');
    return {
      address,
      name,
      network,
      tokenData,
      type: 'token'
    };
  }
  
  console.warn('⚠️ No valid mainnet contract info found in tokenData:', tokenData);
  return null;
}

// Utility function to parse mainnet DEX contract info from tokenData
export function parseMainnetDexContractInfo(tokenData) {
  if (!tokenData) return null;
  
  // Always use mainnet network for mainnet tokens
  const network = STACKS_MAINNET;
  
  // Parse DEX contract info from dexInfo or dexContractAddress
  const dexContract = tokenData.dexInfo || tokenData.dexContractAddress;
  if (dexContract && dexContract.includes('.')) {
    const [address, name] = dexContract.split('.');
    return {
      address,
      name,
      network,
      tokenData,
      type: 'dex'
    };
  }
  
  console.warn('⚠️ No valid mainnet DEX contract info found in tokenData:', tokenData);
  return null;
}

// Utility function to parse mainnet token contract info from tokenData
export function parseMainnetTokenContractInfo(tokenData) {
  if (!tokenData) return null;
  
  // Always use mainnet network for mainnet tokens
  const network = STACKS_MAINNET;
  
  // Parse token contract info from tokenInfo or tokenContractAddress
  const tokenContract = tokenData.tokenInfo || tokenData.tokenContractAddress;
  if (tokenContract && tokenContract.includes('.')) {
    const [address, name] = tokenContract.split('.');
    return {
      address,
      name,
      network,
      tokenData,
      type: 'token'
    };
  }
  
  console.warn('⚠️ No valid mainnet token contract info found in tokenData:', tokenData);
  return null;
}

// Fetch mainnet token revenue balance via API
export async function getMainnetTokenRevenue(tokenData) {
  try {
    const contractInfo = parseMainnetDexContractInfo(tokenData);
    if (!contractInfo) {
      console.error('❌ No valid DEX contract info for mainnet revenue fetch');
      return 0;
    }
    
    console.log('🔍 getMainnetTokenRevenue using API with DEX contract:', { 
      address: contractInfo.address, 
      name: contractInfo.name 
    });
    console.log('🔍 CONTRACT ADDRESS VERIFICATION - Revenue API using:', {
      dexContract: tokenData.dexInfo || tokenData.dexContractAddress,
      parsedAddress: contractInfo.address,
      parsedName: contractInfo.name
    });
    
    // Call the API endpoint with proper caching
    const response = await fetch(`/api/mainnet-token-revenue?address=${contractInfo.address}&name=${contractInfo.name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, response.statusText);
      return 0;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API returned error:', data.error);
      return 0;
    }

    console.log('🔍 Mainnet revenue from API:', data.revenue);
    return data.revenue || 0;
    
  } catch (err) {
    console.error('❌ Failed to fetch mainnet token revenue via API:', err);
    return 0;
  }
}

// Fetch mainnet token liquidity balance via API
export async function getMainnetTokenLiquidity(tokenData) {
  try {
    const contractInfo = parseMainnetDexContractInfo(tokenData);
    if (!contractInfo) {
      console.error('❌ No valid DEX contract info for mainnet liquidity fetch');
      return 0;
    }
    
    console.log('🔍 getMainnetTokenLiquidity using API with DEX contract:', { 
      address: contractInfo.address, 
      name: contractInfo.name 
    });
    
    // Call the API endpoint with proper caching
    const response = await fetch(`/api/mainnet-token-liquidity?address=${contractInfo.address}&name=${contractInfo.name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, response.statusText);
      return 0;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API returned error:', data.error);
      return 0;
    }

    console.log('🔍 Mainnet liquidity from API:', data.liquidity);
    return data.liquidity || 0;
    
  } catch (err) {
    console.error('❌ Failed to fetch mainnet token liquidity via API:', err);
    return 0;
  }
}

// Fetch mainnet token symbol
export async function getMainnetTokenSymbol(tokenData) {
  try {
    const contractInfo = parseMainnetTokenContractInfo(tokenData);
    if (!contractInfo) {
      console.error('❌ No valid token contract info for mainnet symbol fetch');
      // Fallback to tokenData symbol if available
      if (tokenData?.symbol) {
        console.log('🔍 Using symbol from tokenData:', tokenData.symbol);
        return tokenData.symbol.toLowerCase();
      }
      return '???';
    }
    
    console.log('🔍 getMainnetTokenSymbol using API with token contract:', { 
      address: contractInfo.address, 
      name: contractInfo.name 
    });
    
    // Call the API endpoint with 24-hour caching
    const response = await fetch(`/api/mainnet-token-symbol?address=${contractInfo.address}&name=${contractInfo.name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, response.statusText);
      return tokenData.symbol || '???';
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API returned error:', data.error);
      return tokenData.symbol || '???';
    }

    if (data.symbol) {
      console.log('🔍 Mainnet symbol from API:', data.symbol);
      return data.symbol.toLowerCase();
    }
    
    // Fallback to tokenData.symbol if API doesn't return a symbol
    if (tokenData.symbol) {
      console.log('🔍 Using fallback symbol from tokenData:', tokenData.symbol);
      return tokenData.symbol.toLowerCase();
    }
    
    console.log('🔍 No mainnet symbol found, using default');
    return '???';
  } catch (err) {
    console.error('❌ Failed to fetch mainnet token symbol via API:', err);
    // Fallback to tokenData symbol if available
    if (tokenData?.symbol) {
      return tokenData.symbol.toLowerCase();
    }
    return '???';
  }
}

// Fetch mainnet token total supply via API
export async function getMainnetTokenTotalSupply(tokenData) {
  try {
    const contractInfo = parseMainnetTokenContractInfo(tokenData);
    if (!contractInfo) {
      console.error('❌ No valid token contract info for mainnet total supply fetch');
      return 0;
    }
    
    console.log('🔍 getMainnetTokenTotalSupply using API with token contract:', { 
      address: contractInfo.address, 
      name: contractInfo.name 
    });
    
    // Call the API endpoint with 30-day caching
    const response = await fetch(`/api/mainnet-token-supply?address=${contractInfo.address}&name=${contractInfo.name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ API call failed:', response.status, response.statusText);
      return 0;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API returned error:', data.error);
      return 0;
    }

    if (data.totalSupply > 0) {
      // Convert from micro units to actual tokens (assuming 8 decimals)
      const actualTokens = data.totalSupply / 100000000;
      console.log('🔍 Mainnet total supply from API:', actualTokens);
      return actualTokens;
    }
    
    console.log('🔍 No mainnet total supply found, using default');
    return 0;
  } catch (err) {
    console.error('❌ Failed to fetch mainnet token total supply via API:', err);
    return 0;
  }
}

// Get all mainnet token stats data
export async function getMainnetTokenStats(tokenData) {
  console.log('🔍 getMainnetTokenStats called with tokenData:', tokenData);
  
  try {
    if (!tokenData) {
      console.error('❌ Token data not available');
      return {
        revenue: 0,
        liquidity: 0,
        totalSupply: 0,
        symbol: '???'
      };
    }

    // Fetch all mainnet data in parallel
    const [revenue, liquidity, totalSupply, symbol] = await Promise.all([
      getMainnetTokenRevenue(tokenData),
      getMainnetTokenLiquidity(tokenData),
      getMainnetTokenTotalSupply(tokenData),
      getMainnetTokenSymbol(tokenData)
    ]);

    const result = {
      revenue,
      liquidity,
      totalSupply,
      symbol
    };
    
    console.log('🔍 Mainnet token stats result:', result);
    return result;
  } catch (err) {
    console.error('❌ Failed to fetch mainnet token stats:', err);
    return {
      revenue: 0,
      liquidity: 0,
      totalSupply: 0,
      symbol: '???'
    };
  }
}

// Validate mainnet token data
export function validateMainnetTokenData(tokenData) {
  if (!tokenData) {
    return { isValid: false, error: 'No token data provided' };
  }
  
  if (!tokenData.symbol) {
    return { isValid: false, error: 'Token symbol is required' };
  }
  
  if (!tokenData.dexInfo && !tokenData.dexContractAddress) {
    return { isValid: false, error: 'DEX contract information is required' };
  }
  
  if (!tokenData.tokenInfo && !tokenData.tokenContractAddress) {
    return { isValid: false, error: 'Token contract information is required' };
  }
  
  // Check if it's actually a mainnet token
  if (tokenData.tabType !== 'featured' && tokenData.tabType !== 'user_created_mainnet') {
    return { isValid: false, error: 'Token must be a mainnet token' };
  }
  
  return { isValid: true };
}
