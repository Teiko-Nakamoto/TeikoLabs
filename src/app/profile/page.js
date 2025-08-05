'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/header';
import { supabase } from '../utils/supabaseClient';

export default function ProfilePage() {
  const { t } = useTranslation();
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [showTradeHistory, setShowTradeHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pnlData, setPnlData] = useState({
    buyTrades: 0,
    sellTrades: 0,
    totalBought: 0,
    totalSold: 0,
    currentHoldings: 0,
    totalCost: 0,
    weightedAvgCost: 0
  });
  
  useEffect(() => {
    // Check if there's a connected wallet address in localStorage
    const savedAddress = localStorage.getItem('connectedAddress');
    if (savedAddress) {
      setConnectedAddress(savedAddress);
      setIsConnected(true);
      fetchTradeHistory(savedAddress);
    }
  }, []);
  
  const fetchTradeHistory = async (walletAddress) => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const { data: trades, error } = await supabase
        .from('TestTrades')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching trades:', error);
        setTradeHistory([]);
        setPnlData({
          buyTrades: 0,
          sellTrades: 0,
          totalBought: 0,
          totalSold: 0,
          currentHoldings: 0,
          totalCost: 0,
          weightedAvgCost: 0
        });
      } else {
        setTradeHistory(trades || []);
        calculatePnlData(trades || []);
      }
    } catch (error) {
      console.error('Error fetching trade history:', error);
      setTradeHistory([]);
      setPnlData({
        buyTrades: 0,
        sellTrades: 0,
        totalBought: 0,
        totalSold: 0,
        currentHoldings: 0,
        totalCost: 0,
        weightedAvgCost: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePnlData = (trades) => {
    let buyTrades = 0;
    let sellTrades = 0;
    let totalBought = 0;
    let totalSold = 0;
    let totalCost = 0;
    let avgCostSum = 0;
    let avgCostCount = 0;

    trades.forEach(trade => {
      if (trade.type === 'buy') {
        buyTrades++;
        const tokensRaw = Math.abs(trade.tokens_traded || 0);
        const tokens = tokensRaw / 1e8; // Convert from base units to actual tokens
        const sats = Math.abs(trade.sats_traded || 0);
        const price = trade.price || 0;
        
        totalBought += tokens;
        totalCost += sats;
        
        if (tokens > 0 && price > 0) {
          avgCostSum += price * tokens;
          avgCostCount += tokens;
        }
      } else if (trade.type === 'sell') {
        sellTrades++;
        const tokensRaw = Math.abs(trade.tokens_traded || 0);
        totalSold += tokensRaw / 1e8;
      }
    });

    const currentHoldings = Math.max(0, totalBought - totalSold);
    const weightedAvgCost = avgCostCount > 0 ? avgCostSum / avgCostCount : 0;

    setPnlData({
      buyTrades,
      sellTrades,
      totalBought,
      totalSold,
      currentHoldings,
      totalCost,
      weightedAvgCost
    });
  };
  
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const formatNumber = (num) => {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  const formatPrice = (price) => {
    if (price < 1) {
      return price.toFixed(6);
    } else if (price < 999.99) {
      return price.toFixed(3);
    } else {
      return Math.round(price).toString();
    }
  };
  
  return (
    <>
      <Header />
      <main className="profile-page">
        <div className="profile-container">
          <h1 style={{ 
            color: '#fbbf24', 
            fontSize: '2rem', 
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Profile
          </h1>
          
                     {isConnected ? (
             <div className="wallet-info">
               <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Connected Wallet</h2>
               <div style={{
                 background: 'linear-gradient(to bottom, #001c34, #002b57)',
                 padding: '1.5rem',
                 borderRadius: '12px',
                 border: '2px solid orange',
                 marginBottom: '1rem'
               }}>
                 <p style={{ color: '#ccc', marginBottom: '0.5rem' }}>Address:</p>
                 <p style={{ 
                   color: '#fff', 
                   fontFamily: 'monospace', 
                   fontSize: '1.1rem',
                   wordBreak: 'break-all'
                 }}>
                   {connectedAddress}
                 </p>
                 <p style={{ 
                   color: '#fbbf24', 
                   fontFamily: 'monospace', 
                   fontSize: '1rem',
                   marginTop: '0.5rem'
                 }}>
                   {formatAddress(connectedAddress)}
                 </p>
               </div>
               
               {/* DEX Contract Information */}
               <div style={{
                 background: 'linear-gradient(to bottom, #001c34, #002b57)',
                 padding: '1.5rem',
                 borderRadius: '12px',
                 border: '2px solid orange',
                 marginBottom: '1rem'
               }}>
                 <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>DEX Contract Information</h3>
                 <p style={{ color: '#ccc', marginBottom: '0.5rem' }}>Smart Contract Address:</p>
                 <p style={{ 
                   color: '#fff', 
                   fontFamily: 'monospace', 
                   fontSize: '1rem',
                   wordBreak: 'break-all'
                 }}>
                   ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.dear-cyan-dex
                 </p>
                                   <p style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    All trades are executed through this DEX contract on The MAS Network
                  </p>
                </div>
                
                {/* P&L Calculation Section */}
                <div style={{
                  background: 'linear-gradient(to bottom, #001c34, #002b57)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid orange',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>📊 Average Cost Calculation (Since Reset)</h3>
                  
                  <div style={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#e5e7eb' }}>Buy Trades: </span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{pnlData.buyTrades}</span>
                      <span style={{ color: '#e5e7eb' }}> | Sell Trades: </span>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{pnlData.sellTrades}</span>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#e5e7eb' }}>Total Tokens Bought: </span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{formatNumber(pnlData.totalBought)}M MAS Sats</span>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#e5e7eb' }}>Total Tokens Sold: </span>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatNumber(pnlData.totalSold)}M MAS Sats</span>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#e5e7eb' }}>Current Holdings: </span>
                      <span style={{ 
                        color: pnlData.currentHoldings >= 0 ? '#22c55e' : '#ef4444', 
                        fontWeight: 'bold' 
                      }}>
                        {pnlData.currentHoldings >= 0 ? '' : '-'}{formatNumber(Math.abs(pnlData.currentHoldings))}K MAS Sats
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#e5e7eb' }}>Total Cost (Buys): </span>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                        {formatNumber(pnlData.totalCost)}M sats
                        <img 
                          src="/icons/sats1.svg" 
                          alt="sats" 
                          style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginLeft: '2px' }}
                        />
                        <img 
                          src="/icons/Vector.svg" 
                          alt="lightning" 
                          style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
                        />
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#e5e7eb' }}>Weighted Avg Cost: </span>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                        {pnlData.weightedAvgCost.toFixed(3)} sats
                        <img 
                          src="/icons/sats1.svg" 
                          alt="sats" 
                          style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginLeft: '2px' }}
                        />
                        <img 
                          src="/icons/Vector.svg" 
                          alt="lightning" 
                          style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
                        /> per token
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '0.9rem'
                  }}>
                    <p style={{ color: '#fbbf24', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      💡 Calculation Method:
                    </p>
                    <p style={{ color: '#d1d5db', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <strong>Current Holdings</strong> = Total Bought - Total Sold
                    </p>
                    <p style={{ color: '#d1d5db', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <strong>Average Cost</strong> is calculated only from BUY orders (does not change with sells)
                    </p>
                    <p style={{ color: '#d1d5db', fontSize: '0.85rem' }}>
                      For SELL orders: <strong>profit/loss</strong> = (sell price - avg cost) × tokens sold
                    </p>
                  </div>
                </div>
                
                {/* Trade History Section */}
               <div style={{
                 background: 'linear-gradient(to bottom, #001c34, #002b57)',
                 padding: '1.5rem',
                 borderRadius: '12px',
                 border: '2px solid orange',
                 marginBottom: '1rem'
               }}>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   marginBottom: '1rem'
                 }}>
                   <h3 style={{ color: '#fbbf24', margin: 0 }}>Detailed Trade History</h3>
                   <button
                     onClick={() => setShowTradeHistory(!showTradeHistory)}
                     style={{
                       padding: '8px 16px',
                       backgroundColor: '#374151',
                       color: '#e5e7eb',
                       border: '1px solid #4b5563',
                       borderRadius: '6px',
                       cursor: 'pointer',
                       fontSize: '13px',
                       fontWeight: 'bold'
                     }}
                   >
                     {showTradeHistory ? '📊 Hide' : '📊 View'} ({tradeHistory.length} trades)
                   </button>
                 </div>
                 
                 {showTradeHistory && (
                   <div style={{
                     backgroundColor: '#111827',
                     border: '1px solid #374151',
                     borderRadius: '6px',
                     padding: '12px',
                     maxHeight: '400px',
                     overflowY: 'auto'
                   }}>
                     <div style={{
                       fontSize: '12px',
                       fontWeight: 'bold',
                       color: '#fbbf24',
                       marginBottom: '8px',
                       borderBottom: '1px solid #374151',
                       paddingBottom: '4px'
                     }}>
                       Trade History from DEX Contract
                     </div>
                     
                     {loading ? (
                       <div style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                         Loading trade history...
                       </div>
                     ) : tradeHistory.length === 0 ? (
                       <div style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                         No trades found for this wallet
                       </div>
                     ) : (
                       tradeHistory.map((trade, index) => {
                         const tradeDate = new Date(trade.created_at);
                         const tokensRaw = Math.abs(trade.tokens_traded || 0);
                         const tokens = Math.floor(tokensRaw / 1e8); // Convert from base units and round down
                         const pricePerToken = trade.price || 0;
                         
                         return (
                           <div key={trade.transaction_id || index} style={{
                             display: 'flex',
                             justifyContent: 'space-between',
                             alignItems: 'center',
                             padding: '6px 0',
                             borderBottom: index < tradeHistory.length - 1 ? '1px solid #374151' : 'none',
                             fontSize: '11px'
                           }}>
                             <div style={{ flex: 1 }}>
                               <div style={{ 
                                 color: trade.type === 'buy' ? '#22c55e' : '#ef4444',
                                 fontWeight: 'bold'
                               }}>
                                 {trade.type.toUpperCase()}
                               </div>
                               <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                 {tradeDate.toLocaleDateString()} {tradeDate.toLocaleTimeString()}
                               </div>
                             </div>
                             
                             <div style={{ flex: 2, textAlign: 'right' }}>
                               <div style={{ color: '#e5e7eb' }}>
                                 {formatNumber(tokens)}{' '}
                                 <img 
                                   src="/icons/The Mas Network.svg" 
                                   alt="MAS Sats" 
                                   style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
                                 />
                               </div>
                               <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                 @ {formatPrice(pricePerToken)}{' '}
                                 <img 
                                   src="/icons/sats1.svg" 
                                   alt="sats" 
                                   style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '1px' }}
                                 />
                                 <img 
                                   src="/icons/Vector.svg" 
                                   alt="lightning" 
                                   style={{ width: '12px', height: '12px', verticalAlign: 'middle' }}
                                 /> each
                               </div>
                             </div>
                           </div>
                         );
                       })
                     )}
                   </div>
                 )}
               </div>
             </div>
           ) : (
             <div className="not-connected">
               <h2 style={{ color: '#fff', marginBottom: '1rem' }}>No Wallet Connected</h2>
               <p style={{ color: '#ccc', textAlign: 'center' }}>
                 Please connect your wallet to view your profile information.
               </p>
             </div>
           )}
        </div>
      </main>
    </>
  );
}
