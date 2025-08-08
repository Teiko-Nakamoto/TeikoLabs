// Simple test API to debug get-locked-balance function
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenSymbol = searchParams.get('tokenSymbol');

    if (!tokenSymbol) {
      return NextResponse.json({ error: 'Token symbol is required' }, { status: 400 });
    }

    console.log('🔍 Testing locked balance for token:', tokenSymbol);

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

    // Get locked balance data
    const { data: lockedData, error: lockedError } = await supabaseServer
      .from('locked_balances')
      .select('*')
      .eq('token_symbol', tokenSymbol);

    if (lockedError) {
      console.error('❌ Error fetching locked balances:', lockedError);
    }

    console.log('✅ Locked balance test completed');

    return NextResponse.json({
      success: true,
      tokenSymbol: tokenSymbol,
      tokenCard: tokenCard,
      lockedBalances: lockedData || [],
      summary: {
        tokenExists: !!tokenCard,
        lockedBalancesCount: lockedData ? lockedData.length : 0,
        totalLocked: lockedData ? lockedData.reduce((sum, item) => sum + (item.locked_amount || 0), 0) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error testing locked balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 