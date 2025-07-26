// utils/fetchTokenData.js

import { STACKS_TESTNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, Cl } from '@stacks/transactions';
import { getLocalStorage } from '@stacks/connect';
export const SATS_CONTRACT_ADDRESS = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT';
export const SATS_CONTRACT_NAME = 'sbtc-token';


export const DEX_CONTRACT_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
export const DEX_CONTRACT_NAME = 'dear-cyan-dex';
export const TOKEN_CONTRACT_NAME = 'dear-cyan';

// Fetch SBTC fee pool (revenue)
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
    return rawValue ? parseInt(rawValue) : 0;
  } catch (err) {
    console.error('❌ Failed to fetch revenue balance:', err);
    return 0;
  }
}

// Fetch SBTC liquidity balance
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
    return rawValue ? parseInt(rawValue) : 0;
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
      functionArgs: [Cl.principal(userAddress)],
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

export async function getUserSatsBalance() {
  try {
    const data = getLocalStorage();
    const userAddress = data?.addresses?.stx?.[0]?.address;
    if (!userAddress) return 0;

    const result = await fetchCallReadOnlyFunction({
      contractAddress: SATS_CONTRACT_ADDRESS,
      contractName: SATS_CONTRACT_NAME,
      functionName: 'get-balance',
      functionArgs: [Cl.principal(userAddress)],
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
