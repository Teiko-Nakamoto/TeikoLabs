// API Route: Show Token Data from Database
import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    
    let query = supabase
      .from('token_cards')
      .select('*')
      .order('id', { ascending: true });
    
    if (tokenId) {
      query = query.eq('id', tokenId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching token cards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Token data from Supabase database',
      tokenId: tokenId,
      tokenCards: data,
      count: data.length
    });

  } catch (error) {
    console.error('Error in show-token-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 