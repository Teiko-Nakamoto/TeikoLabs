// utils/fetchTokenData.js

import { STACKS_TESTNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, Cl, principalCV } from '@stacks/transactions';
import { getLocalStorage } from '@stacks/connect';
export const SATS_CONTRACT_ADDRESS = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT';
export const SATS_CONTRACT_NAME = 'sbtc-token';


export const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
export const DEX_CONTRACT_NAME = 'dear-cyan-dex';
export const TOKEN_CONTRACT_NAME = 'dear-cyan';

// Fetch SBTC fee pool (revenue) using read-only function
export async function getRevenueBalance() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-fee-pool',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw revenue value:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let satsValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        satsValue = parseInt(rawValue);
      } else {
        satsValue = Number(rawValue);
      }
    }
    
    console.log('🔍 Revenue in SATS (final):', satsValue);
    return satsValue;
  } catch (err) {
    console.error('❌ Failed to fetch revenue balance:', err);
    return 0;
  }
}

// Fetch SBTC liquidity balance using read-only function
export async function getLiquidityBalance() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw liquidity value:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let satsValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        satsValue = parseInt(rawValue);
      } else {
        satsValue = Number(rawValue);
      }
    }
    
    console.log('🔍 Liquidity in SATS (final):', satsValue);
    return satsValue;
  } catch (err) {
    console.error('❌ Failed to fetch liquidity balance:', err);
    return 0;
  }
}

// Fetch token symbol (e.g., DCY)
export async function getTokenSymbol() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: TOKEN_CONTRACT_NAME,
      functionName: 'get-symbol',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    const symbolValue = result?.value?.value;
    return typeof symbolValue === 'string' ? symbolValue.toLowerCase() : '???';
  } catch (err) {
    console.error('❌ Failed to fetch token symbol:', err);
    return '???';
  }
}

// Fetch token name (e.g., "teiko")
export async function getTokenName() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: TOKEN_CONTRACT_NAME,
      functionName: 'get-name',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    const name = result?.value?.value || result?.value?.data || '';
    return name;
  } catch (err) {
    console.error('❌ Failed to fetch token name:', err);
    return '';
  }
}

// Fetch current user's token balance
// Fetch current user's token balance (rounded up to nearest whole number)
export async function getUserTokenBalance() {
  try {
    const data = getLocalStorage();
    const userAddress = data?.addresses?.stx?.[0]?.address;
    if (!userAddress) return 0;

    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: TOKEN_CONTRACT_NAME,
      functionName: 'get-balance',
      functionArgs: [principalCV(userAddress)],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });

    const raw = result?.value?.value || result?.value || null;
    return raw ? Math.ceil(parseInt(raw)) : 0;
  } catch (err) {
    console.error('❌ Failed to fetch user token balance:', err);
    return 0;
  }
}

// Fetch total token balance (all tokens in the contract)
export async function getTotalTokenBalance() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-token-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    const rawValue = result?.value?.value || result?.value || null;
    return rawValue ? parseInt(rawValue) : 0;
  } catch (err) {
    console.error('❌ Failed to fetch total token balance:', err);
    return 0;
  }
}

// Fetch total locked tokens in the contract
export async function getTotalLockedTokens() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-total-locked',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    const rawValue = result?.value?.value || result?.value || null;
    return rawValue ? parseInt(rawValue) : 0;
  } catch (err) {
    console.error('❌ Failed to fetch total locked tokens:', err);
    return 0;
  }
}

// Fetch SBTC balance
export async function getSbtcBalance() {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    const rawValue = result?.value?.value || result?.value || null;
    return rawValue ? parseInt(rawValue) : 0;
  } catch (err) {
    console.error('❌ Failed to fetch SBTC balance:', err);
    return 0;
  }
}

// Calculate current price (SBTC / available token balance)
export async function getCurrentPrice() {
  try {
    // Get total token balance
    const totalTokenBalance = await getTotalTokenBalance();

    // Get total locked tokens
    const totalLockedTokens = await getTotalLockedTokens();

    // Calculate available token balance for trading
    const availableTokenBalance = totalTokenBalance - totalLockedTokens;

    // Get SBTC balance
    const sbtcBalance = await getSbtcBalance();

    // Calculate price per token
    const pricePerToken = sbtcBalance / availableTokenBalance;

    console.log("Current price per token:", pricePerToken);
    return pricePerToken;
  } catch (err) {
    console.error('❌ Error calculating current price:', err);
    return 0;
  }
}

// Calculate estimated sats to receive for a given token amount
export async function getEstimatedSatsForTokens(tokenAmount) {
  try {
    if (!tokenAmount) return 0;
    
    // Convert token amount to base units (1e8)
    const tokensInBaseUnits = Math.floor(parseFloat(tokenAmount) * 1e8);
    
    // Use the contract's sell estimation function
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sellable-sbtc',
      functionArgs: [Cl.uint(tokensInBaseUnits)],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    if (result && result.value) {
      const sellData = result.value;
      console.log('Sell estimation result:', sellData);
      console.log('Sell estimation result keys:', Object.keys(sellData));
      console.log('Sell estimation result values:', Object.values(sellData));
      console.log('Full result structure:', JSON.stringify(result, null, 2));
      
      // Try different ways to access the sbtc-receive value
      let satsToReceive = 0;
      
      // Check if it's a tuple structure
      if (sellData && Array.isArray(sellData)) {
        console.log('Sell data is an array:', sellData);
        // Look for the sbtc-receive value in the tuple
        for (let i = 0; i < sellData.length; i++) {
          console.log(`Index ${i}:`, sellData[i]);
        }
      } else if (sellData['sbtc-receive']) {
        satsToReceive = sellData['sbtc-receive'];
      } else if (sellData.sbtc_receive) {
        satsToReceive = sellData.sbtc_receive;
      } else if (sellData['sbtc-receive'] && sellData['sbtc-receive'].value) {
        satsToReceive = sellData['sbtc-receive'].value;
      } else if (sellData.sbtc_receive && sellData.sbtc_receive.value) {
        satsToReceive = sellData.sbtc_receive.value;
      }
      
      console.log('Extracted sats to receive:', satsToReceive);
      return satsToReceive ? parseInt(satsToReceive) : 0;
    }
    
    return 0;
  } catch (err) {
    console.error('❌ Failed to calculate estimated sats:', err);
    return 0;
  }
}

export async function getUserSatsBalance() {
  try {
    const data = getLocalStorage();
    const userAddress = data?.addresses?.stx?.[0]?.address;
    if (!userAddress) return 0;

    const result = await fetchCallReadOnlyFunction({
      contractAddress: SATS_CONTRACT_ADDRESS,
      contractName: SATS_CONTRACT_NAME,
      functionName: 'get-balance',
      functionArgs: [principalCV(userAddress)],
      network: STACKS_TESTNET,
      senderAddress: userAddress,
    });

    const raw = result?.value?.value || result?.value || null;
    return raw ? parseInt(raw) : 0;
  } catch (err) {
    console.error('❌ Failed to fetch user SATS balance:', err);
    return 0;
  }
}

// Simple price-based calculations (no blockchain calls needed)
export function calculateEstimatedTokensForSats(satsAmount, currentPrice) {
  if (!satsAmount || satsAmount <= 0 || !currentPrice || currentPrice <= 0) return 0;
  
  try {
    // Simple calculation: tokens = sats / price (with 2% fee)
    const satsAfterFee = satsAmount * 0.98; // 2% fee
    const estimatedTokens = satsAfterFee / currentPrice;
    
    console.log('🔍 Buy calculation (price-based):', {
      satsAmount,
      currentPrice,
      satsAfterFee,
      formula: `${satsAfterFee} / ${currentPrice} = ${estimatedTokens}`,
      estimatedTokens: Math.floor(estimatedTokens),
      rawEstimatedTokens: estimatedTokens,
      expectedForExample: '17 SATS ÷ 17.08 SATS/token = ~0.995 tokens'
    });
    
    // Return the calculated tokens (no caps or adjustments for normal prices)
    return Math.floor(estimatedTokens);
  } catch (err) {
    console.error('❌ Failed to calculate estimated tokens:', err);
    return 0;
  }
}

export function calculateEstimatedSatsForTokens(tokenAmount, currentPrice) {
  if (!tokenAmount || tokenAmount <= 0 || !currentPrice || currentPrice <= 0) return 0;
  
  try {
    // Simple calculation: sats = tokens * price (with 2% fee)
    const estimatedSats = tokenAmount * currentPrice;
    const satsAfterFee = estimatedSats * 0.98; // 2% fee
    
    console.log('🔍 Sell calculation (price-based):', {
      tokenAmount,
      currentPrice,
      estimatedSats,
      satsAfterFee: Math.floor(satsAfterFee)
    });
    
    // Return reasonable number of sats (max 8 decimal places)
    const roundedSats = Math.round(satsAfterFee * 1e8) / 1e8;
    return Math.min(roundedSats, 999999999); // Cap at reasonable number
  } catch (err) {
    console.error('❌ Failed to calculate estimated sats:', err);
    return 0;
  }
}

// Helper function to get current balances for calculations
export async function getCurrentBalancesForCalculation() {
  try {
    console.log('🔍 Fetching token balance...');
    const tokenBalanceResult = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-token-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    console.log('🔍 Token balance result:', tokenBalanceResult);

    console.log('🔍 Fetching SBTC balance...');
    const sbtcBalanceResult = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    console.log('🔍 SBTC balance result:', sbtcBalanceResult);

    const tokenBalance = tokenBalanceResult?.value || 0;
    const sbtcBalance = sbtcBalanceResult?.value || 0;
    
    console.log('🔍 Extracted balances:', { tokenBalance, sbtcBalance });
    
    const result = {
      tokenBalance: parseInt(tokenBalance),
      sbtcBalance: parseInt(sbtcBalance)
    };
    
    console.log('🔍 Final balance object:', result);
    return result;
  } catch (err) {
    console.error('❌ Failed to get current balances:', err);
    return { tokenBalance: 0, sbtcBalance: 0 };
  }
}
