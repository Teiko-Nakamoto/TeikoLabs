import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const limit = parseInt(searchParams.get('limit') || 21);

    // Generate mock trade data for demonstration
    const mockTrades = [];
    const now = Date.now();
    
    for (let i = 0; i < limit; i++) {
      const isBuy = Math.random() > 0.5;
      const timestamp = now - (limit - i) * 60000; // Each trade 1 minute apart
      
      mockTrades.push({
        type: isBuy ? 'buy' : 'sell',
        price: (Math.random() * 0.0001 + 0.00001).toFixed(8),
        expected_price: (Math.random() * 0.0001 + 0.00001).toFixed(8),
        created_at: new Date(timestamp).toISOString(),
        transaction_id: `tx_${Math.random().toString(36).substr(2, 9)}_${i}`,
        tokens_traded: isBuy ? Math.floor(Math.random() * 1000000) + 100000 : -(Math.floor(Math.random() * 1000000) + 100000),
        sats_traded: Math.floor(Math.random() * 10000) + 1000
      });
    }

    return NextResponse.json({ 
      trades: mockTrades,
      count: mockTrades.length 
    });

  } catch (error) {
    console.error('❌ Error in get-trades API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 