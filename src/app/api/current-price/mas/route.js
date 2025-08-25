import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch MAS trades to get the current price from the last trade
    const response = await fetch('/api/get-trades?network=mainnet&limit=1');
    
    if (!response.ok) {
      throw new Error('Failed to fetch trades');
    }
    
    const data = await response.json();
    
    if (data.trades && data.trades.length > 0) {
      // Get the price from the last trade
      const lastTrade = data.trades[0]; // Most recent trade
      const currentPrice = parseFloat(lastTrade.price) || 0;
      
      console.log('💰 MAS price from last trade:', currentPrice);
      
      return NextResponse.json({
        success: true,
        price: currentPrice,
        source: 'last_trade'
      });
    } else {
      // Fallback to a default price if no trades
      console.log('💰 No MAS trades found, using fallback price');
      return NextResponse.json({
        success: true,
        price: 0.00000123, // Fallback price based on mainnet patterns
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching MAS price:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch MAS price',
      message: error.message
    }, { status: 500 });
  }
}
