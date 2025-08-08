// API Route: Get Current Majority Holder Information
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching majority holder data for token:', tokenId);

    // Get token data
    const { data: token, error: tokenError } = await supabaseServer
      .from('token_cards')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError) {
      console.error('Error fetching token:', tokenError);
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Get all holders for this token
    const { data: holders, error: holdersError } = await supabaseServer
      .from('user_tokens')
      .select('*')
      .eq('token_symbol', token.token_symbol);

    if (holdersError) {
      console.error('Error fetching holders:', holdersError);
      return NextResponse.json({ error: 'Failed to fetch holders' }, { status: 500 });
    }

    // Calculate total supply and find majority holder
    const totalSupply = token.total_supply || 0;
    let majorityHolder = null;
    let majorityPercentage = 0;

    if (holders && holders.length > 0) {
      // Find the holder with the highest balance
      const sortedHolders = holders.sort((a, b) => (b.balance || 0) - (a.balance || 0));
      const topHolder = sortedHolders[0];
      
      if (topHolder && topHolder.balance) {
        majorityHolder = {
          wallet: topHolder.admin_wallet || topHolder.creator_wallet_address,
          balance: topHolder.balance,
          percentage: totalSupply > 0 ? (topHolder.balance / totalSupply) * 100 : 0
        };
        majorityPercentage = majorityHolder.percentage;
      }
    }

    console.log('✅ Majority holder data fetched successfully');

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        symbol: token.token_symbol,
        name: token.token_name,
        totalSupply: totalSupply
      },
      majorityHolder: majorityHolder,
      majorityPercentage: majorityPercentage,
      totalHolders: holders ? holders.length : 0
    });

  } catch (error) {
    console.error('❌ Error fetching majority holder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 