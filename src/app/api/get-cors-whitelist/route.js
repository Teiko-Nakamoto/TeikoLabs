import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Fetching CORS whitelist...');
    
    const { data, error } = await supabaseServer
      .from('cors_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching CORS whitelist:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ CORS whitelist fetched successfully');
    
    return NextResponse.json({ 
      success: true, 
      corsWhitelist: data || [],
      count: data ? data.length : 0
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
