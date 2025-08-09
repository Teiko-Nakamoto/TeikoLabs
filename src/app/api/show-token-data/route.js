// API Route: Show Token Data from Database
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenSymbol = searchParams.get('tokenSymbol');

    if (!tokenSymbol) {
      return NextResponse.json({ error: 'Token symbol is required' }, { status: 400 });
    }

    console.log('🔍 Fetching token data for symbol:', tokenSymbol);

    // Get token card data
    const { data: tokenCard, error: tokenError } = await supabaseServer
      .from('token_cards')
      .select('*')
      .eq('token_symbol', tokenSymbol)
      .single();

    if (tokenError) {
      console.error('❌ Error fetching token card:', tokenError);
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Get user tokens data
    const { data: userTokens, error: userTokensError } = await supabaseServer
      .from('user_tokens')
      .select('*')
      .eq('token_symbol', tokenSymbol);

    if (userTokensError) {
      console.error('❌ Error fetching user tokens:', userTokensError);
    }

    // Get trades data
    const { data: trades, error: tradesError } = await supabaseServer
      .from('trades')
      .select('*')
      .eq('token_symbol', tokenSymbol)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError);
    }

    console.log('✅ Token data fetched successfully');

    return NextResponse.json({
      success: true,
      tokenCard: tokenCard,
      userTokens: userTokens || [],
      trades: trades || [],
      summary: {
        tokenCardExists: !!tokenCard,
        userTokensCount: userTokens ? userTokens.length : 0,
        tradesCount: trades ? trades.length : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching token data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
    // Get trades data
    const { data: trades, error: tradesError } = await supabaseServer
      .from('trades')
      .select('*')
      .eq('token_symbol', tokenSymbol)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError);
    }

    console.log('✅ Token data fetched successfully');

    return NextResponse.json({
      success: true,
      tokenCard: tokenCard,
      userTokens: userTokens || [],
      trades: trades || [],
      summary: {
        tokenCardExists: !!tokenCard,
        userTokensCount: userTokens ? userTokens.length : 0,
        tradesCount: trades ? trades.length : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching token data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 