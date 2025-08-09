// API Route: Debug Token Data (to see actual contract details)
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    console.log('🔍 Debug: Fetching token data for ID:', tokenId);

    // Get token card data
    const { data: tokenCard, error: tokenError } = await supabaseServer
      .from('token_cards')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError) {
      console.error('❌ Error fetching token card:', tokenError);
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Get user tokens data
    const { data: userTokens, error: userTokensError } = await supabaseServer
      .from('user_tokens')
      .select('*')
      .eq('token_symbol', tokenCard.token_symbol);

    if (userTokensError) {
      console.error('❌ Error fetching user tokens:', userTokensError);
    }

    // Get trades data
    const { data: trades, error: tradesError } = await supabaseServer
      .from('trades')
      .select('*')
      .eq('token_symbol', tokenCard.token_symbol)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError);
    }

    console.log('✅ Debug: Token data fetched successfully');

    return NextResponse.json({
      success: true,
      tokenCard: tokenCard,
      userTokens: userTokens || [],
      trades: trades || [],
      debug: {
        tokenCardCount: tokenCard ? 1 : 0,
        userTokensCount: userTokens ? userTokens.length : 0,
        tradesCount: trades ? trades.length : 0
      }
    });

  } catch (error) {
    console.error('❌ Debug: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 