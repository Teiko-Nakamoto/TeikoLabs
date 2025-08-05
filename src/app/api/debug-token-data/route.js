// API Route: Debug Token Data (to see actual contract details)
import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function GET() {
  try {
    // Fetch token cards from Supabase
    const { data, error } = await supabase
      .from('token_cards')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching token cards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Token data from database',
      tokenCards: data
    });

  } catch (error) {
    console.error('Error in debug-token-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 