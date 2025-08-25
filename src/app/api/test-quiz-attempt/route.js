import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    
    console.log('🧪 Testing quiz_attempts table insert...');
    
    // Test 1: Check if table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .limit(1);
    
    console.log('📋 Table structure test:', { tableInfo, tableError });
    
    // Test 2: Try to insert a simple record
    const { data: insertTest, error: insertError } = await supabase
      .from('quiz_attempts')
      .insert({
        wallet_address: 'test-wallet-123',
        quiz_id: 1,
        questions_answered: 6,
        score: 6,
        completed: true
      })
      .select()
      .single();
    
    console.log('📝 Insert test:', { insertTest, insertError });
    
    // Test 3: Check RLS policies (simplified)
    console.log('🔒 RLS policies: Will check manually');
    
    return NextResponse.json({
      success: true,
      tableTest: { tableInfo, tableError },
      insertTest: { insertTest, insertError },
      message: 'Test completed - check console for details'
    });
    
  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
