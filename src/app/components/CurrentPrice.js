'use client';

import { useEffect, useState } from 'react';

export default function CurrentPrice({ fetchPriceOnDemand }) {
  const [price, setPrice] = useState(null);
  const [totalSupply, setTotalSupply] = useState(null);  // Track total supply

  const DEX_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4'; // Contract address
  const SIMULATED_INPUT = 1_000_000; // 1 STX in microstacks (1 STX = 1,000,000 microstacks)
  const TOKEN_CONTRACT = 'plum-aardvark'; // Token contract name

  // =============================
  // Fetch the price based on token and STX balance from the blockchain
  // =============================
  const fetchPrice = async () => {
    try {
      // Fetch the token balance from the blockchain (using Stacks Node API)
      const tokenBalanceResponse = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/accounts/${DEX_ADDRESS}`);
      const tokenBalanceData = await tokenBalanceResponse.json();
      const tokenBalance = parseInt(tokenBalanceData.balance); // In microtokens

      // Fetch the STX balance (same way)
      const stxBalanceResponse = await fetch(`https://stacks-node-api.testnet.stacks.co/v2/accounts/${DEX_ADDRESS}`);
      const stxBalanceData = await stxBalanceResponse.json();
      const stxBalance = parseInt(stxBalanceData.balance); // In microstacks

      // Fetch the token metadata to get the total supply
      const tokenMetadataResponse = await fetch(`https://api.hiro.so/metadata/v1/ft/${DEX_ADDRESS}.${TOKEN_CONTRACT}`);
      const metadata = await tokenMetadataResponse.json();
      const totalTokenSupply = metadata?.total_supply || 0; // Total supply of tokens

      console.log('📊 Current Token Balance (microtokens):', tokenBalance);
      console.log('📊 Current STX Balance (microstacks):', stxBalance);
      console.log('📊 Total Token Supply (microtokens):', totalTokenSupply);

      if (tokenBalance > 0) {
        // Calculate the price: price = (STX balance) / (Token balance)
        const price = (stxBalance / 1e6) / (tokenBalance / 1e8); // Convert microstacks to STX, and microtokens to full tokens
        setPrice(price); // Update the price
      } else {
        setPrice(null); // Reset if no balance
      }

      // Set total supply in the state
      setTotalSupply(totalTokenSupply / 1e8); // Convert to full tokens
    } catch (err) {
      console.error('❌ Error fetching current price from blockchain:', err);
      setPrice(null); // Reset on error
    }
  };

  useEffect(() => {
    if (fetchPriceOnDemand) {
      fetchPrice(); // Fetch price whenever requested (after transaction confirmation)
    }
  }, [fetchPriceOnDemand]); // Only fetch when triggered

  // =============================
  // UI Display: Price Badge
  // =============================
  return (
    <div className="current-price-container">
      {price !== null ? (
        <div className="price-badge">
          Current Price: {price.toFixed(6)} STX
        </div>
      ) : (
        <div className="price-badge">Fetching price...</div>
      )}
      {/* Display total token supply */}
      {totalSupply !== null && (
        <div className="total-supply-badge">
          Total Supply: {totalSupply.toFixed(6)} Tokens
        </div>
      )}
    </div>
  );
}
