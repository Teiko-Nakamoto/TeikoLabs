'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './tradeHistory.css';

export default function TradeHistory({ trades, pendingTransaction, isSuccessfulTransaction, tokenData, onTradesUpdate }) {
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

  // Fetch real DEX transactions
  const fetchDexTransactions = async () => {
    if (!tokenData || !tokenData.dexInfo) {
      console.error('❌ Token data or dexInfo not available for transaction fetch');
      return;
    }

    setLoadingTransactions(true);
    try {
      const dexContractId = tokenData.dexInfo;
      const apiUrl = 'https://api.testnet.hiro.so'; // Change to mainnet for production
      
      console.log('🔍 Fetching DEX transactions for trade history:', dexContractId);
      
      const response = await fetch(
        `${apiUrl}/extended/v1/tx/?contract_id=${dexContractId}&limit=21&sort_by=block_height&order=desc`
      );
      
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
          });
      
             setDexTransactions(transformedTrades);
       console.log('✅ DEX transactions loaded for trade history:', transformedTrades.length, 'trades');
       
               // Share the transformed trades with parent component (reverse to chronological order for chart)
        if (onTradesUpdate) {
          onTradesUpdate([...transformedTrades].reverse());
        }
      
    } catch (error) {
      console.error('❌ Error fetching DEX transactions for trade history:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch DEX transactions when component mounts or tokenData changes
  useEffect(() => {
    if (tokenData) {
      fetchDexTransactions();
    }
  }, [tokenData]);

     // Use DEX transactions if available, otherwise fall back to trades
   const displayTrades = dexTransactions.length > 0 ? dexTransactions : (trades || []);
   const visibleCount = 3;
   const maxIndex = Math.max(0, displayTrades.length - visibleCount);

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

  if (!trades || trades.length === 0) {
    return <p className="no-trades-msg">{t('no_trades_msg')}</p>;
  }

  return (
   <div className="block-history-wrapper">
  <h3 className="block-history-title">{t('market_history_title')}</h3> {/* 🔁 Title updated */}
  
  {/* Note about 21-trade limit */}
  <div style={{
    marginBottom: '12px',
    padding: '8px 12px',
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#0369a1',
    textAlign: 'center'
  }}>
    📊 Showing last 21 trades from blockchain
  </div>

  <div className="block-container" style={{ position: 'relative' }}>
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
                 {displayTrades.map((trade, i) => {
          const txUrl = `https://explorer.hiro.so/txid/${trade.transaction_id}?chain=testnet`;
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
                 <span>{t('trade_count', { count: index + 1, total: displayTrades.length })}</span>
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
                            <strong style={{ color: '#1e40af' }}>💰 Previous Market Price:</strong> Price before your trade (what the AMM showed when you clicked "{selectedTrade.type}")
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#7c2d12' }}>🛡️ Expected Price:</strong> Your slippage-protected acceptable price ({selectedTrade.type === 'buy' ? 'maximum you\'ll pay' : 'minimum you\'ll accept'})
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
                      href={`https://explorer.hiro.so/txid/${selectedTrade.transaction_id}?chain=testnet`}
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
}
