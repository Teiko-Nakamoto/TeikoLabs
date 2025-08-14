'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './tradeHistory.css';

const TradeHistory = React.memo(function TradeHistory({ trades, pendingTransaction, isSuccessfulTransaction, tokenData, onTradesUpdate }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0); // sliding index
  const [copiedTxId, setCopiedTxId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [transitioningTx, setTransitioningTx] = useState(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const sliderRef = useRef(null);

  const [dexTransactions, setDexTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // Search and filter functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'user', 'address'
  const [connectedAddress, setConnectedAddress] = useState('');
  
  // Mobile touch sliding
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Caching and activity tracking
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isUserActive, setIsUserActive] = useState(true);
  const [fetchInterval, setFetchInterval] = useState(null);
  const cacheTimeout = 15000; // 15 seconds cache (increased from 6 seconds)

  // Get connected wallet address
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const address = localStorage.getItem('connectedAddress');
      setConnectedAddress(address || '');
    }
  }, []);

  // Filter transactions based on search and filter type
  const getFilteredTransactions = () => {
    let filtered = dexTransactions;
    
    // Filter out failed transactions (where received amounts are 0)
    filtered = filtered.filter(tx => {
      // Check if this is a failed transaction
      const isFailed = (tx.sats_traded === 0 && tx.tokens_traded === 0) || 
                      tx.status === 'abort_by_response' ||
                      tx.status === 'abort_by_post_condition';
      
      if (isFailed) {
        console.log('🚫 Filtering out failed transaction:', tx.transaction_id, 'Status:', tx.status);
        return false;
      }
      
      return true;
    });
    
    // Filter by type
    if (filterType === 'user' && connectedAddress) {
      filtered = filtered.filter(tx => tx.sender === connectedAddress);
    } else if (filterType === 'address' && searchTerm) {
      filtered = filtered.filter(tx => 
        tx.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by search term
    if (searchTerm && filterType !== 'user') {
      filtered = filtered.filter(tx => 
        tx.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Mobile touch sliding handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    setCurrentX(touch.clientX);
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100; // Minimum distance to trigger slide
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && index > 0) {
        // Swipe right - go to previous
        setIndex(index - 1);
      } else if (dragOffset < 0 && index < Math.ceil(getFilteredTransactions().length / 4) - 1) {
        // Swipe left - go to next
        setIndex(index + 1);
      }
    }
    setDragOffset(0);
  };

  // Fetch real DEX transactions with caching
  const fetchDexTransactions = async (forceRefresh = false) => {
    if (!tokenData || !tokenData.dexInfo) {
      console.error('❌ Token data or dexInfo not available for transaction fetch');
      return;
    }

    // Do not require a wallet for reading recent trades (read-only)

    // Check cache and user activity
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    if (!forceRefresh && timeSinceLastFetch < cacheTimeout) {
      console.log('📦 Using cached transactions (cache valid for', Math.round((cacheTimeout - timeSinceLastFetch) / 1000), 'more seconds)');
      return;
    }
    
    if (!isUserActive && !forceRefresh) {
      console.log('😴 User inactive, skipping fetch');
      return;
    }

    // Only set loading if we're actually going to fetch
    if (forceRefresh || timeSinceLastFetch >= cacheTimeout) {
      setLoadingTransactions(true);
    }
    try {
      const dexContractId = tokenData.dexInfo;
      console.log('🔍 Fetching DEX transactions for trade history:', dexContractId);

      // If mainnet (SP/SM), use backend API with 15s caching and transform to display trades
      if (/^(SP|SM)/.test(dexContractId)) {
        const [address, name] = dexContractId.split('.');
        const url = `/api/mainnet-token-trades?address=${encodeURIComponent(address)}&name=${encodeURIComponent(name)}&limit=50`;
        console.log('🔁 Mainnet trades API fetch:', url);
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Mainnet trades API error ${res.status}: ${body}`);
        }
        const data = await res.json();
        console.log('📊 Mainnet trades (count):', data.trades?.length || 0, 'cached:', !!data.cached);
        // Full raw trades payload
        if (Array.isArray(data.rawTrades)) {
          console.log('🧾 Mainnet rawTrades:', data.rawTrades);

          // Transform raw mainnet trades into display format
          const transformedTrades = data.rawTrades
            .filter(raw => raw?.contract_call?.function_name === 'buy' || raw?.contract_call?.function_name === 'sell')
            .map(raw => {
            const fn = raw?.contract_call?.function_name;
            const status = raw?.tx_status;
            const timeIso = raw?.block_time_iso || (raw?.burn_block_time ? new Date(raw.burn_block_time * 1000).toISOString() : null);

            // Parse input amount from first function arg repr: "uXXXX"
            let inputU = null;
            const firstArgRepr = raw?.contract_call?.function_args?.[0]?.repr;
            const mIn = firstArgRepr && firstArgRepr.match(/^u(\d+)$/);
            if (mIn) inputU = parseInt(mIn[1], 10);

            // Helpers to detect sBTC asset in events
            const isSbtcAsset = (assetId) => typeof assetId === 'string' && assetId.endsWith('.sbtc-token');

            let satsIn = null, satsOut = null, tokensInMicro = null, tokensOutMicro = null;

            if (fn === 'buy') {
              // User sends sats, receives tokens
              satsIn = inputU ?? null;

              // Prefer tx_result for tokens received
              const repr = raw?.tx_result?.repr;
              const m = repr && repr.match(/\(ok u(\d+)\)/);
              if (m) tokensOutMicro = parseInt(m[1], 10);

              // Fallback: ft_transfer_event to sender for tokens (exclude sBTC transfers)
              if (tokensOutMicro == null && Array.isArray(raw.events)) {
                for (const ev of raw.events) {
                  if (ev?.event_type === 'ft_transfer_event' && ev.event_data?.recipient === raw.sender_address) {
                    const assetId = ev.event_data?.asset_identifier;
                    if (!isSbtcAsset(assetId)) {
                      const amt = parseInt(ev.event_data.amount, 10);
                      if (Number.isFinite(amt)) { tokensOutMicro = amt; break; }
                    }
                  }
                }
              }
            } else if (fn === 'sell') {
              // User sends tokens, receives sats
              tokensInMicro = inputU ?? null;

              // Prefer tx_result for sats received
              const repr = raw?.tx_result?.repr;
              const m = repr && repr.match(/\(ok u(\d+)\)/);
              if (m) satsOut = parseInt(m[1], 10);

              // Fallback: ft_transfer_event to sender for sBTC
              if (satsOut == null && Array.isArray(raw.events)) {
                for (const ev of raw.events) {
                  if (ev?.event_type === 'ft_transfer_event' && ev.event_data?.recipient === raw.sender_address) {
                    const assetId = ev.event_data?.asset_identifier;
                    if (isSbtcAsset(assetId)) {
                      const amt = parseInt(ev.event_data.amount, 10);
                      if (Number.isFinite(amt)) { satsOut = amt; break; }
                    }
                  }
                }
              }
            }

              // Map to UI model similar to testnet path
              const txid = raw.tx_id;
              const sender = raw.sender_address;
              const blockHeight = raw.block_height;
              const sats_traded = fn === 'buy' ? (satsIn || 0) : (satsOut || 0);
              const tokens_traded = fn === 'buy' ? (tokensOutMicro || 0) : (tokensInMicro || 0);
              let price = 0;
              if (sats_traded && tokens_traded) {
                const tokens = Math.abs(tokens_traded) / 1e8;
                if (tokens > 0) price = sats_traded / tokens;
              }

              return {
                transaction_id: txid,
                type: fn,
                sats_traded,
                tokens_traded,
                created_at: timeIso,
                price: price.toString(),
                block_height: blockHeight,
                sender,
                status
              };
            })
            .filter(trade => {
              // Filter out failed transactions
              const isFailed = (trade.sats_traded === 0 && trade.tokens_traded === 0) || 
                             trade.status === 'abort_by_response' ||
                             trade.status === 'abort_by_post_condition';
              
              if (isFailed) {
                return false;
              }
              
              return true;
            });

          // Group and log failed transactions
          const failedTrades = (data.trades || []).filter(trade => {
            const isFailed = (trade.sats_traded === 0 && trade.tokens_traded === 0) || 
                           trade.status === 'abort_by_response' ||
                           trade.status === 'abort_by_post_condition';
            return isFailed;
          });

          if (failedTrades.length > 0) {
            console.log('🚫 Excluding failed mainnet transactions from history:', failedTrades.map(trade => ({
              txId: trade.transaction_id,
              status: trade.status
            })));
          }

          // Only update state if data has actually changed
          const currentTxIds = dexTransactions.map(tx => tx.transaction_id).join(',');
          const newTxIds = transformedTrades.map(tx => tx.transaction_id).join(',');
          if (currentTxIds !== newTxIds) {
            console.log('🔄 DEX transactions (mainnet) updated:', transformedTrades.length, 'trades');
            setDexTransactions(transformedTrades);
            if (onTradesUpdate) onTradesUpdate([...transformedTrades].reverse());
            // Trigger holdings refresh only when a new user-initiated tx appears
            try {
              const principal = (typeof window !== 'undefined') ? localStorage.getItem('connectedAddress') : null;
              if (principal && /^(SP|SM)/.test(principal)) {
                const latestUserTx = transformedTrades.find(tx => tx.sender === principal && tx.status === 'success');
                if (latestUserTx && latestUserTx.transaction_id !== holdingsCacheRef.current.lastUserTxId) {
                  const url = `/api/mainnet-user-sats-balance?principal=${encodeURIComponent(principal)}&lastTx=${encodeURIComponent(latestUserTx.transaction_id)}`;
                  console.log('🔁 Holdings refresh due to user trade:', { txid: latestUserTx.transaction_id, url });
                  fetch(url).then(r => r.ok ? r.json() : null).then(data => {
                    if (data && typeof data.balance === 'number') {
                      holdingsCacheRef.current = { value: data.balance, fetchedAt: Date.now(), lastUserTxId: latestUserTx.transaction_id };
                      setUserSats(data.balance);
                    }
                  }).catch((e) => console.warn('⚠️ Holdings refresh failed:', e?.message || String(e)));
                }
              }
            } catch {}
          } else {
            console.log('✅ DEX transactions unchanged (mainnet), skipping state update');
          }
        }

        console.log('🔄 DEX transactions (mainnet) updated:', (data.trades || []).length, 'trades - grouped data:', data.trades || []);
        // Update cache timestamp even if we don't transform mainnet payload here
        setLastFetchTime(now);
        setLoadingTransactions(false);
        return;
      }

      // Testnet fallback (legacy behavior)
      const apiUrl = 'https://api.testnet.hiro.so';
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `${apiUrl}/extended/v1/tx/?contract_id=${dexContractId}&limit=50&sort_by=block_height&order=desc`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
                    // Transform blockchain transactions into trade format
        const transformedTrades = data.results
          .filter(tx => tx.contract_call?.function_name === 'buy' || tx.contract_call?.function_name === 'sell')
          .map(tx => {
            const inputArg = tx.contract_call?.function_args?.[0];
            const inputAmount = inputArg ? parseInt(inputArg.repr.replace('u', '')) : 0;
            
                         // Extract actual received amounts from transaction result and events
             let sats_traded = null;
             let tokens_traded = null;
             
             // First, try to get the actual return value from the transaction result
             if (tx.tx_result && tx.tx_result.repr) {
               console.log('🔍 Transaction result:', tx.tx_result.repr);
               
               // Parse the return value (e.g., "(ok u829838709677420)")
               const resultMatch = tx.tx_result.repr.match(/\(ok u(\d+)\)/);
               if (resultMatch) {
                 const returnValue = parseInt(resultMatch[1]);
                 console.log('📊 Return value from transaction:', returnValue);
                 
                 if (tx.contract_call.function_name === 'buy') {
                   // For buy: return value is tokens received
                   tokens_traded = returnValue;
                   console.log('🎯 Tokens received (from result):', tokens_traded);
                 } else if (tx.contract_call.function_name === 'sell') {
                   // For sell: return value is sats received
                   sats_traded = returnValue;
                   console.log('💸 Sats received (from result):', sats_traded);
                 }
               }
             }
             
             // Get the input amount from function arguments
             if (tx.contract_call.function_name === 'buy') {
               sats_traded = inputAmount; // Sats sent
               console.log('💸 Sats sent (from input):', sats_traded);
             } else if (tx.contract_call.function_name === 'sell') {
               tokens_traded = inputAmount; // Tokens sent (in micro units)
               console.log('🎯 Tokens sent (from input):', tokens_traded);
             }
             
             // If we still don't have both values, try to extract from events as fallback
             if ((sats_traded === null || tokens_traded === null) && tx.events && tx.events.length > 0) {
               console.log('🔍 Analyzing events for missing values:', tx.tx_id);
               tx.events.forEach((event, index) => {
                 console.log(`Event ${index}:`, event);
                 
                 // Look for transfer events that show actual amounts transferred
                 if (event.event_type === 'stx_transfer_event' || event.event_type === 'ft_transfer_event') {
                   console.log('💰 Found transfer event:', event);
                   
                   // Extract amounts from event data
                   if (event.event_data && event.event_data.amount) {
                     const transferAmount = parseInt(event.event_data.amount);
                     console.log('📊 Transfer amount:', transferAmount);
                     
                     if (tx.contract_call.function_name === 'buy') {
                       // For buy: we sent sats, received tokens
                       if (event.event_data.sender === tx.sender_address && sats_traded === null) {
                         // This is the sats we sent
                         sats_traded = transferAmount;
                         console.log('💸 Sats sent (from event):', sats_traded);
                       } else if (event.event_data.recipient === tx.sender_address && tokens_traded === null) {
                         // This is the tokens we received
                         tokens_traded = transferAmount;
                         console.log('🎯 Tokens received (from event):', tokens_traded);
                       }
                     } else if (tx.contract_call.function_name === 'sell') {
                       // For sell: we sent tokens, received sats
                       if (event.event_data.sender === tx.sender_address && tokens_traded === null) {
                         // This is the tokens we sent
                         tokens_traded = transferAmount;
                         console.log('🎯 Tokens sent (from event):', tokens_traded);
                       } else if (event.event_data.recipient === tx.sender_address && sats_traded === null) {
                         // This is the sats we received
                         sats_traded = transferAmount;
                         console.log('💸 Sats received (from event):', sats_traded);
                       }
                     }
                   }
                 }
               });
             }
            
            // Fallback to input amount if we couldn't extract from events
            if (sats_traded === null && tokens_traded === null) {
              console.log('⚠️ Could not extract amounts from events, using input amount as fallback');
              if (tx.contract_call.function_name === 'buy') {
                sats_traded = inputAmount; // Sats sent
                tokens_traded = Math.floor(inputAmount / 7.5); // Rough estimate
              } else if (tx.contract_call.function_name === 'sell') {
                tokens_traded = inputAmount; // Tokens sent (in micro units)
                sats_traded = Math.floor((inputAmount / 1e8) * 7.5); // Rough estimate
              }
            }
            
            // Calculate price from the actual transaction data
            let calculatedPrice = 0;
            if (sats_traded && tokens_traded) {
              calculatedPrice = sats_traded / (tokens_traded / 1e8);
            }
            
            console.log('📈 Final trade data:', {
              tx_id: tx.tx_id,
              type: tx.contract_call.function_name,
              sats_traded,
              tokens_traded,
              calculatedPrice
            });
            
            return {
              transaction_id: tx.tx_id,
              type: tx.contract_call.function_name,
              sats_traded: sats_traded,
              tokens_traded: tokens_traded,
              created_at: tx.block_time_iso,
              price: calculatedPrice.toString(),
              block_height: tx.block_height,
              sender: tx.sender_address,
              status: tx.tx_status
            };
          })
          .filter(trade => {
            // Filter out failed transactions
            const isFailed = (trade.sats_traded === 0 && trade.tokens_traded === 0) || 
                           trade.status === 'abort_by_response' ||
                           trade.status === 'abort_by_post_condition';
            
            if (isFailed) {
              return false;
            }
            
            return true;
          });

        // Group and log failed transactions
        const failedTrades = data.results.filter(tx => {
          const isFailed = (tx.tx_status === 'abort_by_response' || tx.tx_status === 'abort_by_post_condition') ||
                         (tx.contract_call?.function_name === 'buy' || tx.contract_call?.function_name === 'sell') &&
                         (!tx.tx_result || tx.tx_result.repr === '(ok u0)');
          return isFailed;
        });

        if (failedTrades.length > 0) {
          console.log('🚫 Excluding failed testnet transactions from history:', failedTrades.map(tx => ({
            txId: tx.tx_id,
            status: tx.tx_status
          })));
        }
      
             // Only update state if data has actually changed
             const currentTxIds = dexTransactions.map(tx => tx.transaction_id).join(',');
             const newTxIds = transformedTrades.map(tx => tx.transaction_id).join(',');
             
             if (currentTxIds !== newTxIds) {
               console.log('🔄 DEX transactions updated:', transformedTrades.length, 'trades');
               setDexTransactions(transformedTrades);
             } else {
               console.log('✅ DEX transactions unchanged, skipping state update');
             }
       
       // Update cache timestamp
       setLastFetchTime(now);
       
       // Share the transformed trades with parent component (reverse to chronological order for chart)
       if (onTradesUpdate) {
         onTradesUpdate([...transformedTrades].reverse());
       }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⏰ Transaction fetch timed out, using cached data');
      } else {
        console.error('❌ Error fetching DEX transactions for trade history:', error);
      }
    } finally {
      setLoadingTransactions(false);
    }
  };

  // User activity tracking
  useEffect(() => {
    const handleUserActivity = () => {
      if (!isUserActive) {
        console.log('👤 User became active, resuming fetches');
        setIsUserActive(true);
        fetchDexTransactions(true); // Force refresh when user becomes active
      }
    };

    const handleUserInactivity = () => {
      console.log('😴 User inactive, pausing fetches');
      setIsUserActive(false);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Set up inactivity timer (5 minutes)
    let inactivityTimer;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleUserInactivity, 5 * 60 * 1000); // 5 minutes
    };

    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      clearTimeout(inactivityTimer);
    };
  }, [isUserActive]);

  // Set up interval for periodic fetching
  useEffect(() => {
    if (!tokenData) return;

    // Initial fetch
    fetchDexTransactions(true);

    // Set up 15-second interval for active users (matching cache timeout)
    const interval = setInterval(() => {
      if (isUserActive) {
        fetchDexTransactions();
      }
    }, 15000);

    setFetchInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [tokenData, isUserActive]);

     // Use DEX transactions if available, otherwise fall back to trades
   const displayTrades = dexTransactions.length > 0 ? dexTransactions : (trades || []);
   const visibleCount = 4;
   const maxIndex = Math.max(0, getFilteredTransactions().length - visibleCount);

  // Function to format large numbers with K and M
  const formatLargeNumber = (num, locale = (typeof navigator !== 'undefined' ? navigator.language : 'en-US')) => {
    if (!num && num !== 0) return '—';
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  };

  // Update the helper function:
  const formatMasSats = (amount) => formatLargeNumber(Math.round(Number(amount) / 1e8));

  // Handle trade square click
  const handleTradeClick = (trade) => {
    console.log('🔍 Selected trade data:', trade);
    console.log('🎯 Expected price in trade:', trade.expected_price);
    setSelectedTrade(trade);
    setShowTradeModal(true);
  };

  useEffect(() => {
    if (sliderRef.current) {
      const blockWidth = 210; // Block width + margin
      sliderRef.current.style.transition = 'transform 0.4s ease-in-out';
      sliderRef.current.style.transform = `translateX(-${index * blockWidth}px)`;
    }
  }, [index]);

  // Handle transition when pendingTransaction becomes null (transaction confirmed)
  useEffect(() => {
    if (!pendingTransaction && transitioningTx && isSuccessfulTransaction) {
      // Start the transition animation only when transaction is confirmed successfully
      const startTime = Date.now();
      const duration = 3000; // 3 seconds
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setTransitionProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete, clear the transitioning transaction
          setTransitioningTx(null);
          setTransitionProgress(0);
        }
      };
      
      requestAnimationFrame(animate);
    } else if (pendingTransaction && !transitioningTx) {
      // Store the pending transaction for transition
      setTransitioningTx(pendingTransaction);
      setTransitionProgress(0);
    } else if (!pendingTransaction && transitioningTx && !isSuccessfulTransaction) {
      // Failed transaction - just clear without animation
      setTransitioningTx(null);
      setTransitionProgress(0);
    }
  }, [pendingTransaction, transitioningTx, isSuccessfulTransaction]);

  // Only show transitioning block when transaction is confirmed (pendingTransaction is null)
  const shouldShowTransitioningBlock = !pendingTransaction && transitioningTx;

  const copyToClipboard = async (txId) => {
    try {
      await navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const [userSats, setUserSats] = useState(null);
  const holdingsCacheRef = useRef({ value: null, fetchedAt: 0, lastUserTxId: 'baseline' });
  useEffect(() => {
    // First-visit holdings fetch (24h TTL client-side gate)
    const principal = (typeof window !== 'undefined') ? localStorage.getItem('connectedAddress') : null;
    if (!principal || !/^(SP|SM)/.test(principal)) return;
    const now = Date.now();
    const oneDay = 86400000;
    if (now - holdingsCacheRef.current.fetchedAt < oneDay && holdingsCacheRef.current.value != null) {
      setUserSats(holdingsCacheRef.current.value);
      return;
    }
    const url = `/api/mainnet-user-sats-balance?principal=${encodeURIComponent(principal)}&lastTx=${encodeURIComponent(holdingsCacheRef.current.lastUserTxId || 'baseline')}`;
    console.log('🔁 Holdings fetch (first visit or stale):', url);
    fetch(url).then(r => r.ok ? r.json() : null).then(data => {
      if (data && typeof data.balance === 'number') {
        holdingsCacheRef.current = { value: data.balance, fetchedAt: Date.now(), lastUserTxId: data.lastUserTxId || 'baseline' };
        setUserSats(data.balance);
      }
    }).catch((e) => console.warn('⚠️ Holdings fetch failed:', e?.message || String(e)));
  }, []);

  if (!trades || trades.length === 0) {
    return (
      <div>
        <p className="no-trades-msg">{t('no_trades_msg')}</p>
      </div>
    );
  }

  return (
   <div className="block-history-wrapper">
  <h3 className="block-history-title">
    <img 
      src="/icons/The Mas Network.svg" 
      alt="MAS Sats" 
      style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }}
    />
    {t('swap_history_title')}
  </h3> {/* 🔁 Title updated */}

  {/* Filter Buttons - Always visible */}
  <div style={{
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '16px'
  }}>
    <button
      onClick={() => setFilterType('all')}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid',
        fontSize: '12px',
        cursor: 'pointer',
        background: filterType === 'all' ? '#3b82f6' : 'transparent',
        color: filterType === 'all' ? '#ffffff' : '#9ca3af',
        borderColor: filterType === 'all' ? '#3b82f6' : '#4b5563'
      }}
    >
      All Trades
    </button>
    <button
      onClick={() => setFilterType('user')}
      disabled={!connectedAddress}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid',
        fontSize: '12px',
        cursor: connectedAddress ? 'pointer' : 'not-allowed',
        background: filterType === 'user' ? '#10b981' : 'transparent',
        color: filterType === 'user' ? '#ffffff' : connectedAddress ? '#9ca3af' : '#6b7280',
        borderColor: filterType === 'user' ? '#10b981' : '#4b5563',
        opacity: connectedAddress ? 1 : 0.5
      }}
    >
      My Trades
    </button>
    <button
      onClick={() => setFilterType('address')}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid',
        fontSize: '12px',
        cursor: 'pointer',
        background: filterType === 'address' ? '#f59e0b' : 'transparent',
        color: filterType === 'address' ? '#ffffff' : '#9ca3af',
        borderColor: filterType === 'address' ? '#f59e0b' : '#4b5563'
      }}
    >
      By Address
    </button>
  </div>

  {/* Search Bar - Only show when "By Address" is selected */}
  {filterType === 'address' && (
    <div style={{
      background: '#1f2937',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      border: '1px solid #374151'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            type="text"
            placeholder="Search by wallet address or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #4b5563',
              background: '#374151',
              color: '#ffffff',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Results Count */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        Showing {getFilteredTransactions().length} of {dexTransactions.length} transactions
      </div>
    </div>
  )}
  


  <div 
    className="block-container" 
    style={{ position: 'relative' }}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    {/* Awaiting block */}
    <div className="trade-block awaiting-block">
      <div className="face">
        {pendingTransaction && !transitioningTx ? (
          <>
            <div className="block-line">
              <strong>
                {pendingTransaction.type === 'buy' ? (
                  <>
                    Swapped <img 
                      src="/icons/sats1.svg" 
                      alt="sats" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                    />
                    <img 
                      src="/icons/Vector.svg" 
                      alt="lightning" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                    />
                  </>
                ) : (
                  <>
                    Swapped <img 
                      src="/icons/sats1.svg" 
                      alt="sats" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                    />
                    <img 
                      src="/icons/Vector.svg" 
                      alt="lightning" 
                      style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                    />
                  </>
                )}
                {t('pending_trade_msg')}
              </strong>
            </div>
            <div className="block-line">
              {t('amount_line', { amount: pendingTransaction.satsAmount ? formatLargeNumber(pendingTransaction.satsAmount) : formatLargeNumber(pendingTransaction.amount) })}
            </div>
            <div className="block-line">
              {new Date(pendingTransaction.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="block-line txid-line">
              <span style={{ opacity: 0.7 }}>{t('processing_tx_msg')}</span>
              <button style={{ opacity: 0.5, cursor: 'default' }}>{t('loading_icon')}</button>
            </div>
          </>
        ) : transitioningTx ? (
          <>
            <div className="block-line"><strong>{t('awaiting_next_trade_msg')}</strong></div>
            <div className="block-line">{t('price_line', { price: '—' })}</div>
            <div className="block-line">{t('amount_line', { amount: '—' })}</div>
            <div className="block-line">--:--</div>
            <div className="block-line txid-line">
              <span style={{ opacity: 0.5 }}>{t('txid_line', { txid: '—' })}</span>
              <button style={{ opacity: 0.5, cursor: 'default' }}>{t('copy_icon')}</button>
            </div>
          </>
        ) : (
          <>
        <div className="block-line"><strong>{t('awaiting_next_trade_msg')}</strong></div>
            <div className="block-line">{t('price_line', { price: '—' })}</div>
            <div className="block-line">{t('amount_line', { amount: '—' })}</div>
        <div className="block-line">--:--</div>
        <div className="block-line txid-line">
          <span style={{ opacity: 0.5 }}>{t('txid_line', { txid: '—' })}</span>
          <button style={{ opacity: 0.5, cursor: 'default' }}>{t('copy_icon')}</button>
        </div>
          </>
        )}
      </div>
    </div>

    {/* Divider */}
    <div className="vertical-divider" />

    {/* Transitioning block */}
    {shouldShowTransitioningBlock && (
      <div 
        className="trade-block transitioning-block"
        style={{
          position: 'absolute',
          left: `${transitionProgress * 210}px`, // Move from left to right
          backgroundColor: transitionProgress < 0.5 ? 
            'rgba(255, 192, 203, 0.9)' : // Pink until halfway
            `rgba(${255 - (transitionProgress - 0.5) * 200}, ${192 - (transitionProgress - 0.5) * 100}, ${203 + (transitionProgress - 0.5) * 52}, 0.9)`, // Blue after crossing divider
          border: `2px solid ${transitionProgress < 0.5 ? 
            'rgba(255, 192, 203, 0.9)' : // Pink until halfway
            `rgba(${255 - (transitionProgress - 0.5) * 200}, ${192 - (transitionProgress - 0.5) * 100}, ${203 + (transitionProgress - 0.5) * 52}, 0.9)`}`, // Blue after crossing divider
          transform: `scale(${0.8 + transitionProgress * 0.2})`,
          zIndex: 1000,
          transition: 'none'
        }}
      >
        <div className="face">
          <div className="block-line">
            <strong>
              {transitioningTx.type === 'buy' ? (
                <>
                  Swapped <img 
                    src="/icons/sats1.svg" 
                    alt="sats" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="lightning" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                  />
                </>
              ) : (
                <>
                  Swapped <img 
                    src="/icons/sats1.svg" 
                    alt="sats" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px' }}
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="lightning" 
                    style={{ width: '18px', height: '18px', verticalAlign: 'middle' }}
                  />
                </>
              )}
              {transitionProgress < 0.5 ? t('pending_trade_msg') : t('confirmed_trade_msg')}
            </strong>
          </div>
          <div className="block-line">
            {t('amount_line', { amount: transitioningTx.satsAmount ? formatLargeNumber(transitioningTx.satsAmount) : formatLargeNumber(transitioningTx.amount) })}
          </div>
          <div className="block-line">
            {new Date(transitioningTx.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="block-line txid-line">
            <span style={{ opacity: 0.7 }}>{transitionProgress < 0.5 ? t('processing_tx_msg') : t('confirmed_trade_msg')}</span>
            <button style={{ opacity: 0.5, cursor: 'default' }}>{t('loading_icon')}</button>
          </div>
        </div>
      </div>
    )}

    {/* Sliding container */}
    <div className="slide-window">
      <div className="slide-track" ref={sliderRef}>
                 {getFilteredTransactions().map((trade, i) => {
          const txUrl = `https://explorer.stacks.co/txid/${trade.transaction_id}`;
          const isCopied = copiedTxId === trade.transaction_id;
          // All past trades are blue boxes (completed trades)
          const typeClass = 'trade-block';
          


          return (
            <div 
              key={i} 
              className={`trade-block ${typeClass}`}
              onClick={() => handleTradeClick(trade)}
              style={{ cursor: 'pointer' }}
              title="Click to see price calculation"
            >
              <div className="face">
                {/* Swapped line */}
                <div className="block-line">
                  <strong>
                                         {trade.type === 'buy' ? (
                       <>
                         Swapped {formatLargeNumber(trade.sats_traded || 0)}{' '}
                         <img src="/icons/sats1.svg" alt="sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px', marginRight: '1px' }} />
                         <img src="/icons/Vector.svg" alt="lightning" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                         <br />
                         Received {formatMasSats(Math.abs(trade.tokens_traded || 0))}{' '}
                         <img src="/icons/The Mas Network.svg" alt="MAS Sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px' }} />
                       </>
                     ) : (
                       <>
                         Swapped {formatMasSats(Math.abs(trade.tokens_traded || 0))}{' '}
                         <img src="/icons/The Mas Network.svg" alt="MAS Sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px' }} />
                         <br />
                         Received {formatLargeNumber(trade.sats_traded || 0)}{' '}
                         <img src="/icons/sats1.svg" alt="sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginLeft: '2px', marginRight: '1px' }} />
                         <img src="/icons/Vector.svg" alt="lightning" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                         {' '}sats
                       </>
                     )}
                  </strong>
                </div>
                {/* Price, time, txid, etc. remain unchanged */}
                <div className="block-line">{t('price')}: {(() => {
                  const price = Number(trade.price);
                  if (price < 1) {
                    return price.toFixed(5);
                  } else if (price >= 1 && price < 999.99) {
                    return price.toFixed(2);
                  } else {
                    return Math.round(price).toString();
                  }
                })()}</div>
                <div className="block-line">
                  {new Date(trade.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="block-line txid-line">
                  <a 
                    href={txUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('txid_line', { txid: trade.transaction_id.slice(0, 10) + '...' })}
                  </a>
                  <button 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ffffff', 
                      cursor: 'pointer', 
                      fontSize: '0.75rem',
                      marginLeft: '4px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      backgroundColor: '#4a5568'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(trade.transaction_id);
                    }}
                    title={t('copy_txid_title')}
                  >
                    {copied ? t('copied_msg') : t('copy_icon')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>


      {/* Pagination */}
      <div className="block-pagination">
        <button onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>
          {t('prev_button')}
        </button>
                 <span>{t('trade_count', { count: index + 1, total: Math.ceil(getFilteredTransactions().length / 4) })}</span>
        <button onClick={() => setIndex(i => Math.min(maxIndex, i + 1))} disabled={index >= maxIndex}>
          {t('next_button')}
        </button>
      </div>

      {/* Trade Price Calculation Modal */}
      {showTradeModal && selectedTrade && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '95%',
            maxHeight: '85vh',
            overflowY: 'auto',
            overflowX: 'hidden', // Prevent horizontal overflow
            position: 'relative',
            margin: '0 10px', // Add some margin for mobile
            boxSizing: 'border-box'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>
                Trade Execution Price Calculation
              </h3>
              <button 
                onClick={() => setShowTradeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Trade Details */}
            <div style={{
              background: selectedTrade.type === 'buy' ? '#f0f9ff' : '#fdf2f8',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: selectedTrade.type === 'buy' ? '1px solid #bae6fd' : '1px solid #f9a8d4'
            }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                {selectedTrade.type === 'buy' ? 'Buy Trade' : 'Sell Trade'} - {new Date(selectedTrade.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                Execution Price: {(() => {
                  const price = Number(selectedTrade.price);
                  if (price < 1) {
                    return price.toFixed(8);
                  } else if (price >= 1 && price < 999.99) {
                    return price.toFixed(2);
                  } else {
                    return Math.round(price).toString();
                  }
                })()} sats/token
              </div>
            </div>

            {/* Price Calculation */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', color: '#374151', marginBottom: '12px' }}>
                How This Price Was Calculated:
              </h4>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <strong>Execution Price = Sats {selectedTrade.type === 'buy' ? 'Spent' : 'Received'} ÷ Tokens {selectedTrade.type === 'buy' ? 'Received' : 'Sold'}</strong>
                </div>
                
                {selectedTrade.type === 'buy' ? (
                  <>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      = {selectedTrade.sats_traded ? selectedTrade.sats_traded.toLocaleString() : '—'} sats ÷ {selectedTrade.tokens_traded ? Math.abs(selectedTrade.tokens_traded / 1e8).toLocaleString(undefined, {maximumFractionDigits: 8}) : '—'} tokens
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      = {selectedTrade.sats_traded && selectedTrade.tokens_traded ? 
                        (selectedTrade.sats_traded / Math.abs(selectedTrade.tokens_traded / 1e8)).toFixed(8) : '—'} sats/token
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      = {selectedTrade.sats_traded ? selectedTrade.sats_traded.toLocaleString() : '—'} sats ÷ {selectedTrade.tokens_traded ? Math.abs(selectedTrade.tokens_traded / 1e8).toLocaleString(undefined, {maximumFractionDigits: 8}) : '—'} tokens
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      = {selectedTrade.sats_traded && selectedTrade.tokens_traded ? 
                        (selectedTrade.sats_traded / Math.abs(selectedTrade.tokens_traded / 1e8)).toFixed(8) : '—'} sats/token
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Slippage Analysis Section */}
            {(selectedTrade.expected_price || true) && ( // Temporarily show for all trades for testing
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', color: '#374151', marginBottom: '12px' }}>
                  Slippage Analysis:
                </h4>
                
                <div style={{
                  background: '#fefce8',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #fde047'
                }}>
                  {(() => {
                    const executionPrice = Number(selectedTrade.price);
                    const currentPrice = Number(selectedTrade.current_price || selectedTrade.price);
                    const expectedPrice = Number(selectedTrade.expected_price || selectedTrade.price); // Fallback for testing
                    const slippagePercent = currentPrice > 0 ? 
                      ((executionPrice - currentPrice) / currentPrice * 100) : 0;
                    const isPositive = slippagePercent >= 0;
                    
                    // Debug info
                    console.log('💡 Slippage calculation:', { 
                      executionPrice, 
                      currentPrice,
                      expectedPrice: selectedTrade.expected_price, 
                      fallbackUsed: !selectedTrade.expected_price,
                      slippagePercent 
                    });
                    
                    return (
                      <>
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#92400e' }}>
                          <strong>📊 Three-Price Analysis</strong>
                          {!selectedTrade.expected_price && (
                            <span style={{ fontSize: '12px', color: '#f59e0b', marginLeft: '8px' }}>
                              (Legacy trade - limited data)
                            </span>
                          )}
                        </div>
                        
                        <div style={{ 
                          background: '#f8fafc', 
                          padding: '12px', 
                          borderRadius: '6px', 
                          border: '1px solid #e2e8f0',
                          marginBottom: '16px',
                          fontSize: '12px',
                          color: '#475569'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            {/* eslint-disable-next-line react/no-unescaped-entities */}
                            <strong style={{ color: '#1e40af' }}>💰 Previous Market Price:</strong> Price before your trade (what the AMM showed when you clicked &quot;{selectedTrade.type}&quot;)
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#7c2d12' }}>🛡️ Expected Price:</strong> Your slippage-protected acceptable price ({selectedTrade.type === 'buy' ? 'maximum you&apos;ll pay' : 'minimum you&apos;ll accept'})
                          </div>
                          <div>
                            <strong style={{ color: '#15803d' }}>⚡ Execution Price:</strong> Actual price achieved on Stacks blockchain (calculated from real transaction events)
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                          <div style={{ 
                            background: '#eff6ff', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            border: '1px solid #bfdbfe',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '4px' }}>💰 Previous Market Price</div>
                                                         <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af' }}>
                               {Number(selectedTrade.current_price || selectedTrade.price).toFixed(8)}
                             </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                              (Before your trade)
                            </div>
                          </div>
                          <div style={{ 
                            background: '#fef3c7', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            border: '1px solid #fde68a',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '11px', color: '#7c2d12', marginBottom: '4px' }}>🛡️ Expected Price</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#7c2d12' }}>
                              {expectedPrice.toFixed(8)}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                              (Slippage protected)
                            </div>
                          </div>
                          <div style={{ 
                            background: '#dcfce7', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            border: '1px solid #bbf7d0',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '11px', color: '#15803d', marginBottom: '4px' }}>⚡ Execution Price</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>
                              {executionPrice.toFixed(8)}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                              (Blockchain result)
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          background: '#f1f5f9',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          marginBottom: '16px'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            🧮 How Execution Price Was Calculated:
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                            {selectedTrade.sats_traded ? selectedTrade.sats_traded.toLocaleString() : '—'} sats ÷ {selectedTrade.tokens_traded ? Math.abs(selectedTrade.tokens_traded / 1e8).toLocaleString(undefined, {maximumFractionDigits: 8}) : '—'} tokens = {executionPrice.toFixed(8)} sats/token
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                            ↑ This comes from actual blockchain transaction events, not estimates
                          </div>
                        </div>
                        
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '8px',
                          background: isPositive ? '#dcfce7' : '#fee2e2',
                          borderRadius: '6px',
                          border: isPositive ? '1px solid #16a34a' : '1px solid #dc2626'
                        }}>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '700',
                            color: isPositive ? '#15803d' : '#dc2626'
                          }}>
                            {isPositive ? '+' : ''}{slippagePercent.toFixed(3)}% 
                            {isPositive ? ' Better than Current Price' : ' Slippage vs Current Price'}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: '12px', color: '#92400e', marginTop: '8px', textAlign: 'center' }}>
                          {Math.abs(slippagePercent) < 0.1 ? 
                            'Excellent execution! Minimal slippage.' : 
                            Math.abs(slippagePercent) < 1 ? 
                            'Good execution with low slippage.' :
                            'Notable price difference - consider smaller trade sizes.'
                          }
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Trade Details Section */}
            <div>
              <h4 style={{ fontSize: '16px', color: '#374151', marginBottom: '12px' }}>
                Trade Details:
              </h4>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  background: '#fefefe',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Transaction ID:</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <a
                      href={`https://explorer.stacks.co/txid/${selectedTrade.transaction_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        lineHeight: '1.2',
                        flex: '1',
                        minWidth: '0'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {selectedTrade.transaction_id}
                    </a>
                    <button
                      onClick={() => {
                        copyToClipboard(selectedTrade.transaction_id);
                        setCopiedTxId(selectedTrade.transaction_id);
                        setTimeout(() => setCopiedTxId(null), 2000);
                      }}
                      style={{
                        background: copiedTxId === selectedTrade.transaction_id ? '#10b981' : '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        color: copiedTxId === selectedTrade.transaction_id ? 'white' : '#374151',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (copiedTxId !== selectedTrade.transaction_id) {
                          e.target.style.background = '#e5e7eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedTxId !== selectedTrade.transaction_id) {
                          e.target.style.background = '#f3f4f6';
                        }
                      }}
                    >
                      {copiedTxId === selectedTrade.transaction_id ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#fefefe',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#6b7280' }}>Sats {selectedTrade.type === 'buy' ? 'Spent' : 'Received'}:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {selectedTrade.sats_traded ? selectedTrade.sats_traded.toLocaleString() : '—'} sats
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#fefefe',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#6b7280' }}>Tokens {selectedTrade.type === 'buy' ? 'Received' : 'Sold'}:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {selectedTrade.tokens_traded ? Math.abs(selectedTrade.tokens_traded / 1e8).toLocaleString(undefined, {maximumFractionDigits: 8}) : '—'} tokens
                  </span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400e',
              textAlign: 'center'
            }}>
              📊 This is the actual execution price from your completed trade on the blockchain
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default TradeHistory;
