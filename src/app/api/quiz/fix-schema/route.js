import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔧 Fixing quiz_attempts table schema...');

    // Try to add the completed column if it doesn't exist
    const { error: alterError } = await supabaseServer
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;' 
      });

    if (alterError) {
      console.error('❌ Error adding completed column:', alterError);
      
      // Try alternative approach - check if column exists first
      const { data: testData, error: testError } = await supabaseServer
        .from('quiz_attempts')
        .select('completed')
        .limit(1);
      
      if (testError && testError.message.includes('completed')) {
        console.log('❌ completed column definitely missing, trying direct SQL...');
        
        // Try direct SQL execution
        const { error: directError } = await supabaseServer
          .rpc('exec_sql', { 
            sql: 'ALTER TABLE quiz_attempts ADD COLUMN completed BOOLEAN DEFAULT false;' 
          });
        
        if (directError) {
          console.error('❌ Direct SQL also failed:', directError);
          return NextResponse.json({
            success: false,
            error: 'Failed to add completed column',
            message: directError.message
          });
        }
      }
    }

    // Test the column now exists
    const { data: testInsert, error: testError } = await supabaseServer
      .from('quiz_attempts')
      .insert({
        quiz_id: 1,
        wallet_address: 'test-schema-fix',
        score: 0,
        questions_answered: 0,
        completed: false
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Error testing completed column:', testError);
      return NextResponse.json({
        success: false,
        error: 'completed column still not working',
        message: testError.message
      });
    }

    // Clean up test record
    await supabaseServer
      .from('quiz_attempts')
      .delete()
      .eq('wallet_address', 'test-schema-fix');

    console.log('✅ Schema fix successful - completed column is working');

    return NextResponse.json({
      success: true,
      message: 'quiz_attempts table schema fixed - completed column added and tested',
      testResult: testInsert
    });
    
  } catch (error) {
    console.error('❌ API: Error fixing schema:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fix schema',
      message: error.message
    }, { status: 500 });
  }
}
