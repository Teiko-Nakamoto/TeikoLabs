// utils/fetchTokenData.js

import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, Cl, principalCV, cvToValue } from '@stacks/transactions';
import { getLocalStorage } from '@stacks/connect';
import { logCacheActivity, loggedBlockchainCall } from './cacheLogger';
import { getCachedBlockchainData } from './hiro-config';

// Custom JSON replacer to handle BigInt serialization
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString() + 'n'; // Convert BigInt to string with 'n' suffix
  }
  return value;
}

export const SATS_CONTRACT_ADDRESS = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT';
export const SATS_CONTRACT_NAME = 'sbtc-token';

// Default fallback values (for backward compatibility)
export const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
// Remove the hardcoded contract name - it should come from backend data
// export const DEX_CONTRACT_NAME = 'mas-sats-dex';
export const TOKEN_CONTRACT_NAME = 'mas-sats';

// Utility function to parse contract info from tokenData (source of truth)
export function parseContractInfo(tokenData) {
  if (!tokenData) return null;

  // Parse DEX contract info from dexInfo or dexContractAddress FIRST
  const dexContract = tokenData.dexInfo || tokenData.dexContractAddress;
  if (dexContract && dexContract.includes('.')) {
    const [address, name] = dexContract.split('.');

    // PRIORITY: Force network by address prefix when determinable
    // SP/SM => mainnet, ST/SN => testnet
    let network = STACKS_TESTNET; // default
    if (address?.startsWith('SP') || address?.startsWith('SM')) {
      network = STACKS_MAINNET;
      console.log('🔍 Address prefix SP/SM detected, forcing mainnet for:', address);
    } else if (address?.startsWith('ST') || address?.startsWith('SN')) {
      network = STACKS_TESTNET;
      console.log('🔍 Address prefix ST/SN detected, forcing testnet for:', address);
    } else {
      // Fallback to provided flags only if address prefix is not determinable
      if (tokenData.network) {
        network = tokenData.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
      } else if (tokenData.tabType === 'featured') {
        network = STACKS_MAINNET;
      } else if (tokenData.tabType === 'practice') {
        network = STACKS_TESTNET;
      }
    }

    console.log('🔍 parseContractInfo result:', { 
      address, 
      name, 
      network: network === STACKS_MAINNET ? 'mainnet' : 'testnet', 
      tokenDataNetwork: tokenData.network 
    });
    return {
      address,
      name,
      network,
      tokenData
    };
  }

  // Fallback logic for when no valid contract info is found
  let network = STACKS_TESTNET; // default
  if (tokenData.network) {
    network = tokenData.network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
  } else if (tokenData.tabType === 'featured') {
    network = STACKS_MAINNET;
  } else if (tokenData.tabType === 'practice') {
    network = STACKS_TESTNET;
  }

  // Fallback to defaults if no valid contract info
  console.warn('⚠️ No valid contract info found in tokenData, using defaults:', tokenData);
  return {
    address: DEX_CONTRACT_ADDRESS,
    name: DEX_CONTRACT_NAME,
    network,
    tokenData
  };
}

// Fetch SBTC fee pool (revenue) using read-only function with caching
export async function getRevenueBalance(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getRevenueBalance using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-sbtc-fee-pool', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-sbtc-fee-pool',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch SBTC liquidity balance using read-only function with caching
export async function getLiquidityBalance(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getLiquidityBalance using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-sbtc-balance', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-sbtc-balance',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw SBTC Balance:', rawValue, typeof rawValue);
    
    // Handle string or number conversion
    let sbtcBalance = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        sbtcBalance = parseInt(rawValue);
      } else {
        sbtcBalance = Number(rawValue);
      }
    }
    
    console.log('🔍 SBTC Balance (final):', sbtcBalance);
    return sbtcBalance;
  } catch (err) {
    console.error('❌ Failed to fetch SBTC Balance:', err);
    return 0;
  }
}

// Fetch token symbol (e.g., DCY) with caching
export async function getTokenSymbol(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || TOKEN_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTokenSymbol using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-symbol', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-symbol',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch token name (e.g., "teiko") with caching
export async function getTokenName(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || TOKEN_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTokenName using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-name', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-name',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
    const name = result?.value?.value || result?.value?.data || '';
    return name;
  } catch (err) {
    console.error('❌ Failed to fetch token name:', err);
    return '';
  }
}

// Fetch current user's token balance with caching
export async function getUserTokenBalance(contractInfo = null) {
  try {
    console.log('🔍 getUserTokenBalance: Starting...');
    const data = getLocalStorage();
    const userAddress = data?.addresses?.stx?.[0]?.address;
    console.log('🔍 getUserTokenBalance: userAddress =', userAddress);
    if (!userAddress) {
      console.log('🔍 getUserTokenBalance: No user address found');
      return 0;
    }

    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || TOKEN_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getUserTokenBalance using contract:', { 
      contractAddress, 
      contractName, 
      network: network.name || 'testnet',
      userAddress: userAddress
    });

    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-user-token-balance', 
      async () => {
        console.log('🚀 Making blockchain call for getUserTokenBalance with:', {
          contractAddress,
          contractName,
          functionName: 'get-balance',
          functionArgs: [principalCV(userAddress)],
          network: network.name || 'testnet',
          senderAddress: userAddress,
        });
        
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-balance',
          functionArgs: [principalCV(userAddress)],
          network,
          senderAddress: userAddress,
        });
      },
      15000 // 15 seconds cache duration
    );

    console.log('🔍 getUserTokenBalance: Raw result - FULL:', JSON.stringify(result, jsonReplacer, 2));
    console.log('🔍 getUserTokenBalance: Raw result - TYPE:', typeof result);
    console.log('🔍 getUserTokenBalance: Raw result - CONSTRUCTOR:', result?.constructor?.name);
    console.log('🔍 getUserTokenBalance: Raw result - KEYS:', Object.keys(result || {}));
    
    const raw = result?.value?.value || result?.value || null;
    console.log('🔍 getUserTokenBalance: Raw value =', raw, 'Type:', typeof raw);
    if (!raw) {
      console.log('🔍 getUserTokenBalance: No raw value found');
      return 0;
    }
    
    // Convert from smallest units (8 decimal places) to whole tokens
    let rawValue = 0;
    if (typeof raw === 'bigint') {
      rawValue = Number(raw);
      console.log('🔍 getUserTokenBalance: Converted bigint to number:', rawValue);
    } else {
      rawValue = parseInt(raw);
      console.log('🔍 getUserTokenBalance: Parsed string to integer:', rawValue);
    }
    const tokensInWholeUnits = rawValue / 100000000;
    
    console.log('🔍 getUserTokenBalance: CONVERSION DETAILS:', {
      rawValue: rawValue,
      tokensInWholeUnits: tokensInWholeUnits,
      finalResult: Math.floor(tokensInWholeUnits)
    });
    
    // Check if the result is reasonable (should be less than 100 million tokens)
    if (tokensInWholeUnits > 100000000) {
      console.error('❌ User token balance seems unreasonably large:', tokensInWholeUnits);
      console.log('🔍 This might be a conversion issue. Raw value was:', rawValue);
    } else {
      console.log('✅ User token balance looks reasonable:', tokensInWholeUnits);
    }
    
    const finalResult = Math.floor(tokensInWholeUnits); // Round down to nearest whole number
    console.log('🎯 getUserTokenBalance: FINAL RESULT =', finalResult);
    
    return finalResult;
  } catch (err) {
    console.error('❌ Failed to fetch user token balance - FULL:', err);
    console.error('❌ Failed to fetch user token balance - MESSAGE:', err.message);
    console.error('❌ Failed to fetch user token balance - STACK:', err.stack);
    return 0;
  }
}

// Fetch total token balance (all tokens in the contract) with caching
export async function getTotalTokenBalance(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTotalTokenBalance using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-token-balance', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-token-balance',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch total locked tokens in the contract with caching
export async function getTotalLockedTokens(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTotalLockedTokens using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-total-locked', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-total-locked',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch SBTC balance with caching
export async function getSbtcBalance(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getSbtcBalance using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-sbtc-balance', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-sbtc-balance',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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



// Calculate estimated sats to receive for a given token amount with caching
export async function getEstimatedSatsForTokens(tokenAmount, contractInfo = null) {
  try {
    if (!tokenAmount) return 0;
    
    // Convert token amount to base units (1e8)
    const tokensInBaseUnits = Math.floor(parseFloat(tokenAmount) * 1e8);
    
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getEstimatedSatsForTokens using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-sellable-sbtc', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-sellable-sbtc',
          functionArgs: [Cl.uint(tokensInBaseUnits)],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch user SATS balance with caching
export async function getUserSatsBalance() {
  try {
    const data = getLocalStorage();
    const userAddress = data?.addresses?.stx?.[0]?.address;
    if (!userAddress) return 0;

    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-user-sats-balance', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress: SATS_CONTRACT_ADDRESS,
          contractName: SATS_CONTRACT_NAME,
          functionName: 'get-balance',
          functionArgs: [principalCV(userAddress)],
          network: STACKS_TESTNET,
          senderAddress: userAddress,
        });
      },
      15000 // 15 seconds cache duration
    );

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

// Helper function to get current balances for calculations with caching
export async function getCurrentBalancesForCalculation(contractInfo = null) {
  try {
    // Use provided contract info or fall back to defaults
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getCurrentBalancesForCalculation using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain calls with 15-second cache
    const [tokenBalanceResult, sbtcBalanceResult] = await Promise.all([
      loggedBlockchainCall(
        'get-token-balance', 
        async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-token-balance',
            functionArgs: [],
            network,
            senderAddress: contractAddress,
          });
        },
        15000 // 15 seconds cache duration
      ),
      loggedBlockchainCall(
        'get-sbtc-balance', 
        async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-sbtc-balance',
            functionArgs: [],
            network,
            senderAddress: contractAddress,
          });
        },
        15000 // 15 seconds cache duration
      )
    ]);
    
    console.log('🔍 Token balance result:', tokenBalanceResult);
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

// Fetch token-specific revenue balance using read-only function with caching
export async function getTokenRevenueBalance(tokenData) {
  try {
    // Parse contract info from tokenData
    const contractInfo = parseContractInfo(tokenData);
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTokenRevenueBalance using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-sbtc-fee-pool', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-sbtc-fee-pool',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch token-specific liquidity balance using read-only function with caching
export async function getTokenLiquidityBalance(tokenData) {
  try {
    // Parse contract info from tokenData
    const contractInfo = parseContractInfo(tokenData);
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTokenLiquidityBalance using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-sbtc-balance', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-sbtc-balance',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch token-specific total token balance with caching
export async function getTokenTotalBalance(tokenData) {
  try {
    // Parse contract info from tokenData
    const contractInfo = parseContractInfo(tokenData);
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTokenTotalBalance using contract:', { contractAddress, contractName, network: network.name || 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-total-supply', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-total-supply',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
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

// Fetch token-specific DEX balances (both token and SBTC) with caching
export async function getTokenDexBalances(tokenData) {
  try {
    // Parse contract info from tokenData (source of truth)
    const contractInfo = parseContractInfo(tokenData);
    
    if (!contractInfo) {
      console.error('❌ Failed to parse contract info from tokenData:', tokenData);
      return { sbtcBalance: 0, tokenBalance: 0 };
    }
    
    const { address, name, network } = contractInfo;
    console.log('🔍 getTokenDexBalances using contract:', { address, name, network: network === STACKS_MAINNET ? 'mainnet' : 'testnet' });
    console.log('🔍 Actual network being used for blockchain calls:', network === STACKS_MAINNET ? 'mainnet' : 'testnet');
    
    // Use logged blockchain calls with 15-second cache
    const [tokenBalanceResult, sbtcBalanceResult] = await Promise.all([
      loggedBlockchainCall(
        'get-token-balance', 
        async () => {
          console.log('🔍 Making blockchain call with network:', network === STACKS_MAINNET ? 'mainnet' : 'testnet');
          return await fetchCallReadOnlyFunction({
            contractAddress: address,
            contractName: name,
            functionName: 'get-token-balance',
            functionArgs: [],
            network,
            senderAddress: address,
          });
        },
        15000, // 15 seconds cache duration
        network === STACKS_MAINNET ? 'mainnet' : 'testnet'
      ),
      loggedBlockchainCall(
        'get-sbtc-balance', 
        async () => {
          console.log('🔍 Making blockchain call with network:', network === STACKS_MAINNET ? 'mainnet' : 'testnet');
          return await fetchCallReadOnlyFunction({
            contractAddress: address,
            contractName: name,
            functionName: 'get-sbtc-balance',
            functionArgs: [],
            network,
            senderAddress: address,
          });
        },
        15000, // 15 seconds cache duration
        network === STACKS_MAINNET ? 'mainnet' : 'testnet'
      )
    ]);

    console.log('🔍 Raw token balance result:', tokenBalanceResult);
    console.log('🔍 Raw SBTC balance result:', sbtcBalanceResult);

    // Helper function to extract numeric value from blockchain response
    const extractNumericValue = (result) => {
      if (!result) return 0;
      
      // Handle different response structures
      let value = null;
      
      // Structure 1: { type: 'ok', value: { type: 'uint', value: 3357 } }
      if (result.type === 'ok' && result.value && result.value.type === 'uint') {
        value = result.value.value;
      }
      // Structure 2: { value: { value: 3357 } }
      else if (result.value && result.value.value !== undefined) {
        value = result.value.value;
      }
      // Structure 3: { value: 3357 }
      else if (result.value !== undefined) {
        value = result.value;
      }
      // Structure 4: Direct value
      else if (typeof result === 'number') {
        value = result;
      }
      
      // Convert to number
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          return parseInt(value);
        } else {
          return Number(value);
        }
      }
      
      return 0;
    };

    // Handle token balance conversion
    const tokenBalance = extractNumericValue(tokenBalanceResult);
    
    // Handle SBTC balance conversion
    const sbtcBalance = extractNumericValue(sbtcBalanceResult);
    
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

// Fetch token-specific locked tokens with caching
export async function getTokenLockedBalance(tokenData) {
  try {
    // Parse contract info from tokenData
    const contractInfo = parseContractInfo(tokenData);
    const contractAddress = contractInfo?.address || DEX_CONTRACT_ADDRESS;
    const contractName = contractInfo?.name || DEX_CONTRACT_NAME;
    const network = contractInfo?.network || STACKS_TESTNET;
    
    console.log('🔍 getTokenLockedBalance using contract:', { contractAddress, contractName, network: network === STACKS_MAINNET ? 'mainnet' : 'testnet' });
    
    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-total-locked', 
      async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-total-locked',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });
      },
      15000, // 15 seconds cache duration
      network === STACKS_MAINNET ? 'mainnet' : 'testnet'
    );
    
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



// Fetch token-specific user balance
export async function getTokenUserBalance(tokenData) {
  try {
    console.log('🔍 getTokenUserBalance: Starting with tokenData:', tokenData);
    
    if (!tokenData || !tokenData.tokenInfo) {
      console.error('❌ Token data or tokenInfo not available');
      return 0;
    }

    const connectedAddress = localStorage.getItem('connectedAddress');
    console.log('🔍 getTokenUserBalance: connectedAddress =', connectedAddress);
    
    if (!connectedAddress) {
      console.log('🔍 No connected address found');
      return 0;
    }

    const [contractAddress, contractName] = tokenData.tokenInfo.split('.');
    console.log('🔍 getTokenUserBalance: Parsed contract info:', {
      contractAddress,
      contractName,
      fullTokenInfo: tokenData.tokenInfo
    });
    
    // Pick network by principal prefix (SP/SM => mainnet, ST/SN => testnet)
    const isMainnet = /^SP|^SM/.test(contractAddress) || /^SP|^SM/.test(connectedAddress);
    const network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;
    
    console.log('🔍 getTokenUserBalance: Network detection:', {
      contractAddress,
      connectedAddress,
      isMainnet,
      network: network.name || 'testnet'
    });

    // Use logged blockchain call with 15-second cache
    const result = await loggedBlockchainCall(
      'get-token-user-balance', 
      async () => {
        console.log('🚀 Making blockchain call for getTokenUserBalance with:', {
          contractAddress,
          contractName,
          functionName: 'get-balance',
          functionArgs: [principalCV(connectedAddress)],
          network: network.name || 'testnet',
          senderAddress: connectedAddress,
        });
        
        return await fetchCallReadOnlyFunction({
          contractAddress: contractAddress,
          contractName: contractName,
          functionName: 'get-balance',
          functionArgs: [principalCV(connectedAddress)],
          network,
          senderAddress: connectedAddress,
        });
      },
      15000 // 15 seconds cache duration
    );
    
    console.log('🔍 getTokenUserBalance: Raw result - FULL:', JSON.stringify(result, jsonReplacer, 2));
    console.log('🔍 getTokenUserBalance: Raw result - TYPE:', typeof result);
    console.log('🔍 getTokenUserBalance: Raw result - CONSTRUCTOR:', result?.constructor?.name);
    
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 getTokenUserBalance: Raw value extracted:', rawValue, 'Type:', typeof rawValue);
    
    // Handle string or number conversion
    let tokenValue = 0;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        tokenValue = parseInt(rawValue);
        console.log('🔍 getTokenUserBalance: Parsed string to integer:', tokenValue);
      } else {
        tokenValue = Number(rawValue);
        console.log('🔍 getTokenUserBalance: Converted to number:', tokenValue);
      }
    } else {
      console.log('🔍 getTokenUserBalance: No raw value found');
    }
    
    // Convert from micro units to actual tokens (assuming 8 decimals like the original)
    const actualTokens = tokenValue / 100000000;
    console.log('🔍 getTokenUserBalance: CONVERSION DETAILS:', {
      rawValue: rawValue,
      tokenValue: tokenValue,
      actualTokens: actualTokens,
      finalResult: actualTokens
    });
    
    console.log('🎯 getTokenUserBalance: FINAL RESULT =', actualTokens);
    return actualTokens;
  } catch (err) {
    console.error('❌ Failed to fetch token user balance - FULL:', err);
    console.error('❌ Failed to fetch token user balance - MESSAGE:', err.message);
    console.error('❌ Failed to fetch token user balance - STACK:', err.stack);
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

    // No AMM price calculation available
    const estimatedTokens = 0;
    console.log('🔍 Token estimated tokens calculation:', {
      satsAmount,
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

    // No AMM price calculation available
    const estimatedSats = 0;
    console.log('🔍 Token estimated sats calculation:', {
      tokenAmount,
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
    // Check if we're in a browser environment and if wallet is connected
    if (typeof window !== 'undefined') {
      const connectedAddress = localStorage.getItem('connectedAddress');
      if (!connectedAddress) {
        console.log('⚠️ No wallet connected, returning default values');
        return {
          revenue: 0,
          liquidity: 0,
          remainingSupply: 0,
          currentPrice: 0,
          userBalance: 0
        };
      }
    }

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

    // Parse contract info using our utility function (source of truth)
    const contractInfo = parseContractInfo(tokenData);
    
    if (!contractInfo) {
      console.error('❌ Failed to parse contract info from tokenData:', tokenData);
      return {
        revenue: 0,
        liquidity: 0,
        remainingSupply: 0,
        currentPrice: 0,
        userBalance: 0
      };
    }

    const { address: dexAddress, name: dexName, network } = contractInfo;
    console.log('🔍 Fetching real data from contract:', { dexAddress, dexName, network: network.name || 'testnet' });

    // Import blockchain functions
    const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');

    // Fetch real data from blockchain with caching
    const [revenueResult, liquidityResult, totalSupplyResult, lockedTokensResult] = await Promise.all([
      // Try different revenue functions with caching
      loggedBlockchainCall(
        'get-sbtc-fee-pool', 
        async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: 'get-sbtc-fee-pool',
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
        },
        15000 // 15 seconds cache duration
      ).catch(() => 
        loggedBlockchainCall(
          'get-fee-pool', 
          async () => {
            return await fetchCallReadOnlyFunction({
              contractAddress: dexAddress,
              contractName: dexName,
              functionName: 'get-fee-pool',
              functionArgs: [],
              network: network,
              senderAddress: dexAddress,
            });
          },
          15000 // 15 seconds cache duration
        )
      ).catch(() => 
        loggedBlockchainCall(
          'get-revenue', 
          async () => {
            return await fetchCallReadOnlyFunction({
              contractAddress: dexAddress,
              contractName: dexName,
              functionName: 'get-revenue',
              functionArgs: [],
              network: network,
              senderAddress: dexAddress,
            });
          },
          15000 // 15 seconds cache duration
        )
      ).catch(() => ({ value: 0 })),

      // Get liquidity (SBTC balance) with caching
      loggedBlockchainCall(
        'get-sbtc-balance', 
        async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: 'get-sbtc-balance',
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
        },
        15000 // 15 seconds cache duration
      ).catch(() => ({ value: 0 })),

      // Get total token supply with caching
      loggedBlockchainCall(
        'get-token-balance', 
        async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: 'get-token-balance',
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
        },
        15000 // 15 seconds cache duration
      ).catch(() => ({ value: 0 })),

      // Get locked tokens with caching
      loggedBlockchainCall(
        'get-total-locked', 
        async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: 'get-total-locked',
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
        },
        15000 // 15 seconds cache duration
      ).catch(() => ({ value: 0 }))
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
