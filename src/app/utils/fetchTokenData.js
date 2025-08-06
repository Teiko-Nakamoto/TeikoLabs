// utils/fetchTokenData.js

import { STACKS_TESTNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, Cl, principalCV, cvToValue } from '@stacks/transactions';
import { getLocalStorage } from '@stacks/connect';
export const SATS_CONTRACT_ADDRESS = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT';
export const SATS_CONTRACT_NAME = 'sbtc-token';


export const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
export const DEX_CONTRACT_NAME = 'pink-tuna-dex';
export const TOKEN_CONTRACT_NAME = 'pink-tuna';

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
    console.log('🔍 Fetching token symbol from contract...');
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: TOKEN_CONTRACT_NAME,
      functionName: 'get-symbol',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    const symbolValue = result?.value?.value;
    console.log('🔍 Raw token symbol result:', result);
    console.log('🔍 Token symbol value:', symbolValue);
    const finalSymbol = typeof symbolValue === 'string' ? symbolValue.toLowerCase() : '???';
    console.log('🔍 Final token symbol:', finalSymbol);
    return finalSymbol;
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
    console.log('🔍 getUserTokenBalance: Starting...');
    const data = getLocalStorage();
    const userAddress = data?.addresses?.stx?.[0]?.address;
    console.log('🔍 getUserTokenBalance: userAddress =', userAddress);
    if (!userAddress) {
      console.log('🔍 getUserTokenBalance: No user address found');
      return 0;
    }

    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: TOKEN_CONTRACT_NAME,
      functionName: 'get-balance',
      functionArgs: [principalCV(userAddress)],
      network: STACKS_TESTNET,
      senderAddress: userAddress,
    });

    console.log('🔍 getUserTokenBalance: Raw result =', result);
    const raw = result?.value?.value || result?.value || null;
    console.log('🔍 getUserTokenBalance: Raw value =', raw);
    if (!raw) {
      console.log('🔍 getUserTokenBalance: No raw value found');
      return 0;
    }
    
    // Convert from smallest units (8 decimal places) to whole tokens
    let rawValue = 0;
    if (typeof raw === 'bigint') {
      rawValue = Number(raw);
    } else {
      rawValue = parseInt(raw);
    }
    const tokensInWholeUnits = rawValue / 100000000;
    
    console.log('🔍 getUserTokenBalance: Raw value =', rawValue, 'Whole tokens =', tokensInWholeUnits);
    
    // Check if the result is reasonable (should be less than 100 million tokens)
    if (tokensInWholeUnits > 100000000) {
      console.error('❌ User token balance seems unreasonably large:', tokensInWholeUnits);
      console.log('🔍 This might be a conversion issue. Raw value was:', rawValue);
    } else {
      console.log('✅ User token balance looks reasonable:', tokensInWholeUnits);
    }
    
    return Math.floor(tokensInWholeUnits); // Round down to nearest whole number
  } catch (err) {
    console.error('❌ Failed to fetch user token balance:', err);
    return 0;
  }
}

// Fetch total token balance (all tokens in the contract)
export async function getTotalTokenBalance() {
  try {
    console.log('🔍 getTotalTokenBalance: Making blockchain call...');
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-token-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    console.log('🔍 getTotalTokenBalance: Raw result =', result);
    
    // Use cvToValue to properly convert the Clarity value
    const convertedValue = cvToValue(result);
    console.log('🔍 getTotalTokenBalance: Converted value =', convertedValue);
    
    // Handle bigint values properly and convert from smallest units to whole tokens
    let finalValue = 0;
    if (convertedValue && convertedValue.value) {
      if (typeof convertedValue.value === 'bigint') {
        finalValue = Number(convertedValue.value);
      } else {
        finalValue = parseInt(convertedValue.value);
      }
    }
    
    // Convert from smallest units (8 decimal places) to whole tokens
    const tokensInWholeUnits = finalValue / 100000000;
    
    console.log('🔍 getTotalTokenBalance: Raw value =', finalValue, 'Whole tokens =', tokensInWholeUnits);
    return tokensInWholeUnits;
  } catch (err) {
    console.error('❌ Failed to fetch total token balance:', err);
    return 0;
  }
}

// Fetch total locked tokens in the contract
export async function getTotalLockedTokens() {
  try {
    console.log('🔍 getTotalLockedTokens: Making blockchain call...');
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-total-locked',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    console.log('🔍 getTotalLockedTokens: Raw result =', result);
    
    // Use cvToValue to properly convert the Clarity value
    const convertedValue = cvToValue(result);
    console.log('🔍 getTotalLockedTokens: Converted value =', convertedValue);
    
    // Handle bigint values properly and convert from smallest units to whole tokens
    let finalValue = 0;
    if (convertedValue && convertedValue.value) {
      if (typeof convertedValue.value === 'bigint') {
        finalValue = Number(convertedValue.value);
      } else {
        finalValue = parseInt(convertedValue.value);
      }
    }
    
    // Convert from smallest units (8 decimal places) to whole tokens
    const tokensInWholeUnits = finalValue / 100000000;
    
    console.log('🔍 getTotalLockedTokens: Raw value =', finalValue, 'Whole tokens =', tokensInWholeUnits);
    return tokensInWholeUnits;
  } catch (err) {
    console.error('❌ Failed to fetch total locked tokens:', err);
    return 0;
  }
}

// Fetch SBTC balance
export async function getSbtcBalance() {
  try {
    console.log('🔍 getSbtcBalance: Making blockchain call...');
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    console.log('🔍 getSbtcBalance: Raw result =', result);
    
    // Use cvToValue to properly convert the Clarity value
    const convertedValue = cvToValue(result);
    console.log('🔍 getSbtcBalance: Converted value =', convertedValue);
    
    // Handle bigint values properly
    let finalValue = 0;
    if (convertedValue && convertedValue.value) {
      if (typeof convertedValue.value === 'bigint') {
        finalValue = Number(convertedValue.value);
      } else {
        finalValue = parseInt(convertedValue.value);
      }
    }
    
    console.log('🔍 getSbtcBalance: Final value =', finalValue);
    return finalValue;
  } catch (err) {
    console.error('❌ Failed to fetch SBTC balance:', err);
    return 0;
  }
}

// Calculate current price (SBTC / available token balance)
export async function getCurrentPrice() {
  try {
    console.log('🔍 getCurrentPrice: Starting price calculation...');
    
    // Get total token balance
    const totalTokenBalance = await getTotalTokenBalance();
    console.log('🔍 getCurrentPrice: totalTokenBalance =', totalTokenBalance);

    // Get total locked tokens
    const totalLockedTokens = await getTotalLockedTokens();
    console.log('🔍 getCurrentPrice: totalLockedTokens =', totalLockedTokens);

    // Calculate available token balance for trading
    const availableTokenBalance = totalTokenBalance - totalLockedTokens;
    console.log('🔍 getCurrentPrice: availableTokenBalance =', availableTokenBalance);

    // Get SBTC balance
    const sbtcBalance = await getSbtcBalance();
    console.log('🔍 getCurrentPrice: sbtcBalance =', sbtcBalance);

    // Check if we have valid data
    if (totalTokenBalance === 0 || sbtcBalance === 0) {
      console.log('🔍 getCurrentPrice: Invalid data - totalTokenBalance:', totalTokenBalance, 'sbtcBalance:', sbtcBalance);
      throw new Error('Invalid blockchain data for price calculation');
    }
    
    // Check if token balance is reasonable (should be around 21 million)
    if (totalTokenBalance > 50000000) { // More than 50 million tokens
      console.error('❌ Token balance is unreasonably large:', totalTokenBalance);
      console.log('🔍 Expected around 21 million tokens, but got:', totalTokenBalance);
      throw new Error(`Token balance too large: ${totalTokenBalance} (expected ~21 million)`);
    }

    // Calculate price per token using AMM formula with virtual SBTC
    const virtualSbtc = 1500000; // INITIAL_VIRTUAL_SBTC constant (0.015 sBTC)
    const pricePerToken = (sbtcBalance + virtualSbtc) / availableTokenBalance;

    console.log("🔍 Price calculation debug:", {
      sbtcBalance,
      virtualSbtc,
      availableTokenBalance,
      pricePerToken,
      isFinite: isFinite(pricePerToken),
      isNaN: isNaN(pricePerToken),
      formula: `(${sbtcBalance} + ${virtualSbtc}) / ${availableTokenBalance} = ${pricePerToken}`
    });
    
    // Add safety check for unreasonable prices
    if (pricePerToken < 0.000001 || pricePerToken > 1000000 || !isFinite(pricePerToken)) {
      console.error('❌ Unreasonable price calculated:', pricePerToken);
      throw new Error(`Invalid price calculated: ${pricePerToken}`);
    }
    
    // Additional check for division by zero or very small numbers
    if (availableTokenBalance <= 0) {
      console.error('❌ No available tokens for trading:', availableTokenBalance);
      throw new Error(`No available tokens for trading: ${availableTokenBalance}`);
    }
    
    console.log('🔍 getCurrentPrice: Final calculated price =', pricePerToken);
    return pricePerToken;
  } catch (err) {
    console.error('❌ Error calculating current price:', err);
    throw err; // Re-throw the error so we can see what's actually wrong
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
  console.log('🔍 calculateEstimatedTokensForSats inputs:', { satsAmount, currentPrice, type: typeof currentPrice });
  
  if (!satsAmount || satsAmount <= 0 || !currentPrice || currentPrice <= 0) {
    console.log('❌ Invalid inputs detected:', { satsAmount, currentPrice });
    return 0;
  }
  
  try {
    // Simple calculation: tokens = sats / price (with 2% fee)
    const satsAfterFee = satsAmount * 0.98; // 2% fee
    
    // Check if price is too small to avoid division issues
    if (currentPrice < 0.000001) {
      console.error('❌ Price too small for calculation:', currentPrice);
      return 0;
    }
    
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
    
    // Add safety check - if result is unreasonably large, return 0
    if (estimatedTokens > 21000000) { // Max supply check
      console.error('❌ Calculated tokens exceed max supply:', estimatedTokens);
      return 0;
    }
    
    // Return the calculated tokens (no conversion needed)
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
    
    // Return the calculated sats (no artificial cap)
    const roundedSats = Math.round(satsAfterFee * 1e8) / 1e8;
    return roundedSats;
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

// ============================================================================
// DYNAMIC TOKEN PAGE FUNCTIONS - Uses token-specific contract addresses
// ============================================================================

// Fetch token-specific revenue balance using read-only function
export async function getTokenRevenueBalance(tokenData) {
  try {
    // Use the hardcoded DEX contract address for all tokens
    // This ensures we get the actual accumulated fees from the DEX contract
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-fee-pool',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw token revenue value:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let satsValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        satsValue = parseInt(rawValue);
      } else {
        satsValue = Number(rawValue);
      }
    }
    
    console.log('🔍 Token revenue in SATS (final):', satsValue);
    return satsValue;
  } catch (err) {
    console.error('❌ Failed to fetch token revenue balance:', err);
    return 0;
  }
}

// Fetch token-specific liquidity balance using read-only function
export async function getTokenLiquidityBalance(tokenData) {
  try {
    // Use the hardcoded DEX contract address for all tokens
    // This ensures we get the actual liquidity from the DEX contract
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw token liquidity value:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let satsValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        satsValue = parseInt(rawValue);
      } else {
        satsValue = Number(rawValue);
      }
    }
    
    console.log('🔍 Token liquidity in SATS (final):', satsValue);
    return satsValue;
  } catch (err) {
    console.error('❌ Failed to fetch token liquidity balance:', err);
    return 0;
  }
}

// Fetch token-specific total token balance
export async function getTokenTotalBalance(tokenData) {
  try {
    // Use the hardcoded DEX contract address for all tokens
    // This ensures we get the actual total supply from the DEX contract
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-total-supply',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw token total supply value:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let tokenValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        tokenValue = parseInt(rawValue);
      } else {
        tokenValue = Number(rawValue);
      }
    }
    
    // Convert from micro units to actual tokens (assuming 8 decimals like the original)
    const actualTokens = tokenValue / 100000000;
    console.log('🔍 Token total supply (final):', actualTokens);
    return actualTokens;
  } catch (err) {
    console.error('❌ Failed to fetch token total balance:', err);
    return 0;
  }
}

// Fetch token-specific DEX balances (both token and SBTC)
export async function getTokenDexBalances(tokenData) {
  try {
    // Use the hardcoded DEX contract address for all tokens
    // This ensures we get the actual DEX balances from the contract
    console.log('🔍 Fetching DEX balances from contract:', DEX_CONTRACT_ADDRESS, DEX_CONTRACT_NAME);
    
    // Get token balance from the DEX contract
    const tokenBalanceResult = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-token-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    // Get SBTC balance from the DEX contract
    const sbtcBalanceResult = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-sbtc-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });

    console.log('🔍 Raw token balance result:', tokenBalanceResult);
    console.log('🔍 Raw SBTC balance result:', sbtcBalanceResult);

    // Handle token balance conversion
    const rawTokenBalance = tokenBalanceResult?.value?.value || tokenBalanceResult?.value || 0;
    let tokenBalance = 0;
    if (rawTokenBalance) {
      if (typeof rawTokenBalance === 'string') {
        tokenBalance = parseInt(rawTokenBalance);
      } else {
        tokenBalance = Number(rawTokenBalance);
      }
    }
    
    // Handle SBTC balance conversion
    const rawSbtcBalance = sbtcBalanceResult?.value?.value || sbtcBalanceResult?.value || 0;
    let sbtcBalance = 0;
    if (rawSbtcBalance) {
      if (typeof rawSbtcBalance === 'string') {
        sbtcBalance = parseInt(rawSbtcBalance);
      } else {
        sbtcBalance = Number(rawSbtcBalance);
      }
    }
    
    console.log('🔍 Extracted DEX balances:', { tokenBalance, sbtcBalance });
    
    const result = {
      tokenBalance: tokenBalance / 100000000, // Convert from micro units to actual tokens
      sbtcBalance: sbtcBalance
    };
    
    console.log('🔍 Final DEX balance object:', result);
    return result;
  } catch (err) {
    console.error('❌ Failed to get token DEX balances:', err);
    return { tokenBalance: 0, sbtcBalance: 0 };
  }
}

// Fetch token-specific locked tokens
export async function getTokenLockedBalance(tokenData) {
  try {
    // Use the hardcoded DEX contract address for all tokens
    // This ensures we get the actual locked tokens from the DEX contract
    console.log('🔍 Fetching locked tokens from DEX contract:', DEX_CONTRACT_ADDRESS, DEX_CONTRACT_NAME);
    
    // Get locked tokens from the DEX contract (same structure as original)
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: DEX_CONTRACT_NAME,
      functionName: 'get-total-locked',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEX_CONTRACT_ADDRESS,
    });
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw token locked value:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let tokenValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        tokenValue = parseInt(rawValue);
      } else {
        tokenValue = Number(rawValue);
      }
    }
    
    // Convert from micro units to actual tokens (assuming 8 decimals like the original)
    const actualTokens = tokenValue / 100000000;
    console.log('🔍 Token locked balance (final):', actualTokens);
    return actualTokens;
  } catch (err) {
    console.error('❌ Failed to fetch token locked balance:', err);
    // Return 0 for any error (no locked tokens)
    return 0;
  }
}

// Fetch token-specific current price
export async function getTokenCurrentPrice(tokenData) {
  try {
    if (!tokenData || !tokenData.dexInfo) {
      console.error('❌ Token data or dexInfo not available');
      return 0;
    }

    // Get DEX balances (same as modal calculation)
    const dexBalances = await getTokenDexBalances(tokenData);
    
    console.log('🔍 Token price calculation inputs:', {
      sbtcBalance: dexBalances.sbtcBalance,
      tokenBalance: dexBalances.tokenBalance
    });
    
    // Use actual DEX token balance as available tokens
    const availableTokens = dexBalances.tokenBalance;
    
    if (availableTokens <= 0) {
      console.error('❌ No available tokens for trading');
      return 0;
    }
    
    // Virtual SBTC for price stability (same as original)
    const virtualSbtc = 1500000;
    
    // Calculate price using AMM formula (same as modal)
    const pricePerToken = (dexBalances.sbtcBalance + virtualSbtc) / availableTokens;
    
    console.log('🔍 Token price calculation:', {
      sbtcBalance: dexBalances.sbtcBalance,
      virtualSbtc,
      availableTokens,
      pricePerToken,
      isFinite: isFinite(pricePerToken),
      isNaN: isNaN(pricePerToken)
    });
    
    if (!isFinite(pricePerToken) || isNaN(pricePerToken)) {
      console.error('❌ Invalid price calculation result');
      return 0;
    }
    
    console.log('🔍 getTokenCurrentPrice: Final calculated price =', pricePerToken);
    return pricePerToken;
  } catch (err) {
    console.error('❌ Failed to fetch token current price:', err);
    return 0;
  }
}

// Fetch token-specific user balance
export async function getTokenUserBalance(tokenData) {
  try {
    if (!tokenData || !tokenData.tokenInfo) {
      console.error('❌ Token data or tokenInfo not available');
      return 0;
    }

    const connectedAddress = localStorage.getItem('connectedAddress');
    if (!connectedAddress) {
      console.log('🔍 No connected address found');
      return 0;
    }

    const [contractAddress, contractName] = tokenData.tokenInfo.split('.');
    
    const result = await fetchCallReadOnlyFunction({
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-balance',
      functionArgs: [principalCV(connectedAddress)],
      network: STACKS_TESTNET,
      senderAddress: connectedAddress,
    });
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw token user balance value:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let tokenValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        tokenValue = parseInt(rawValue);
      } else {
        tokenValue = Number(rawValue);
      }
    }
    
    // Convert from micro units to actual tokens (assuming 8 decimals like the original)
    const actualTokens = tokenValue / 100000000;
    console.log('🔍 Token user balance (final):', actualTokens);
    return actualTokens;
  } catch (err) {
    console.error('❌ Failed to fetch token user balance:', err);
    return 0;
  }
}

// Calculate token-specific estimated tokens for sats
export async function calculateTokenEstimatedTokensForSats(satsAmount, tokenData) {
  try {
    if (!tokenData) {
      console.error('❌ Token data not available');
      return 0;
    }

    const currentPrice = await getTokenCurrentPrice(tokenData);
    if (currentPrice <= 0) {
      console.error('❌ Invalid current price for calculation');
      return 0;
    }
    
    const estimatedTokens = satsAmount / currentPrice;
    console.log('🔍 Token estimated tokens calculation:', {
      satsAmount,
      currentPrice,
      estimatedTokens,
      isFinite: isFinite(estimatedTokens)
    });
    
    if (!isFinite(estimatedTokens)) {
      console.error('❌ Invalid estimated tokens calculation');
      return 0;
    }
    
    return estimatedTokens;
  } catch (err) {
    console.error('❌ Failed to calculate token estimated tokens:', err);
    return 0;
  }
}

// Calculate token-specific estimated sats for tokens
export async function calculateTokenEstimatedSatsForTokens(tokenAmount, tokenData) {
  try {
    if (!tokenData) {
      console.error('❌ Token data not available');
      return 0;
    }

    const currentPrice = await getTokenCurrentPrice(tokenData);
    if (currentPrice <= 0) {
      console.error('❌ Invalid current price for calculation');
      return 0;
    }
    
    const estimatedSats = tokenAmount * currentPrice;
    console.log('🔍 Token estimated sats calculation:', {
      tokenAmount,
      currentPrice,
      estimatedSats,
      isFinite: isFinite(estimatedSats)
    });
    
    if (!isFinite(estimatedSats)) {
      console.error('❌ Invalid estimated sats calculation');
      return 0;
    }
    
    return Math.floor(estimatedSats);
  } catch (err) {
    console.error('❌ Failed to calculate token estimated sats:', err);
    return 0;
  }
}

// Get all token-specific data for stats display
export async function getTokenStatsData(tokenData) {
  console.log('🔍 getTokenStatsData called with tokenData:', tokenData);
  
  try {
    if (!tokenData) {
      console.error('❌ Token data not available');
      return {
        revenue: 0,
        liquidity: 0,
        remainingSupply: 0,
        currentPrice: 0,
        userBalance: 0
      };
    }

    if (!tokenData.dexInfo) {
      console.error('❌ Token dexInfo not available');
      return {
        revenue: 0,
        liquidity: 0,
        remainingSupply: 0,
        currentPrice: 0,
        userBalance: 0
      };
    }

    // Parse contract addresses from dexInfo (format: "address.contract-name")
    const [dexAddress, dexName] = tokenData.dexInfo.split('.');
    
    if (!dexAddress || !dexName) {
      console.error('❌ Invalid dexInfo format:', tokenData.dexInfo);
      return {
        revenue: 0,
        liquidity: 0,
        remainingSupply: 0,
        currentPrice: 0,
        userBalance: 0
      };
    }

    console.log('🔍 Fetching real data from contract:', dexAddress + '.' + dexName);

    // Import blockchain functions
    const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');
    const { STACKS_TESTNET, STACKS_MAINNET } = await import('@stacks/network');
    
    // Determine network based on token type (you might need to adjust this logic)
    const network = STACKS_TESTNET; // Default to testnet, adjust as needed

    // Fetch real data from blockchain
    const [revenueResult, liquidityResult, totalSupplyResult, lockedTokensResult] = await Promise.all([
      // Try different revenue functions
      fetchCallReadOnlyFunction({
        contractAddress: dexAddress,
        contractName: dexName,
        functionName: 'get-sbtc-fee-pool',
        functionArgs: [],
        network: network,
        senderAddress: dexAddress,
      }).catch(() => 
        fetchCallReadOnlyFunction({
          contractAddress: dexAddress,
          contractName: dexName,
          functionName: 'get-fee-pool',
          functionArgs: [],
          network: network,
          senderAddress: dexAddress,
        })
      ).catch(() => 
        fetchCallReadOnlyFunction({
          contractAddress: dexAddress,
          contractName: dexName,
          functionName: 'get-revenue',
          functionArgs: [],
          network: network,
          senderAddress: dexAddress,
        })
      ).catch(() => ({ value: 0 })),

      // Get liquidity (SBTC balance)
      fetchCallReadOnlyFunction({
        contractAddress: dexAddress,
        contractName: dexName,
        functionName: 'get-sbtc-balance',
        functionArgs: [],
        network: network,
        senderAddress: dexAddress,
      }).catch(() => ({ value: 0 })),

      // Get total token supply
      fetchCallReadOnlyFunction({
        contractAddress: dexAddress,
        contractName: dexName,
        functionName: 'get-token-balance',
        functionArgs: [],
        network: network,
        senderAddress: dexAddress,
      }).catch(() => ({ value: 0 })),

      // Get locked tokens
      fetchCallReadOnlyFunction({
        contractAddress: dexAddress,
        contractName: dexName,
        functionName: 'get-total-locked',
        functionArgs: [],
        network: network,
        senderAddress: dexAddress,
      }).catch(() => ({ value: 0 }))
    ]);

    // Extract values
    const revenue = parseInt(revenueResult?.value?.value || revenueResult?.value || 0);
    const liquidity = parseInt(liquidityResult?.value?.value || liquidityResult?.value || 0);
    const totalSupply = parseInt(totalSupplyResult?.value?.value || totalSupplyResult?.value || 0);
    const lockedTokens = parseInt(lockedTokensResult?.value?.value || lockedTokensResult?.value || 0);

    const remainingSupply = (totalSupply - lockedTokens) / 100000000; // Convert from micro units to actual tokens

    // Calculate current price
    const currentPrice = liquidity > 0 && remainingSupply > 0 ? liquidity / remainingSupply : 0;

    // Get user balance (if user is connected)
    const userBalance = 0; // TODO: Implement user balance fetching

    console.log('🔍 Token stats data (real blockchain data):', {
      revenue,
      liquidity,
      totalSupply,
      lockedTokens,
      remainingSupply,
      currentPrice,
      userBalance,
      contractAddress: dexAddress,
      contractName: dexName
    });

    const result = {
      revenue,
      liquidity,
      remainingSupply,
      currentPrice,
      userBalance
    };
    
    console.log('🔍 Returning result:', result);
    return result;
  } catch (err) {
    console.error('❌ Failed to fetch token stats data:', err);
    return {
      revenue: 0,
      liquidity: 0,
      remainingSupply: 0,
      currentPrice: 0,
      userBalance: 0
    };
  }
}
