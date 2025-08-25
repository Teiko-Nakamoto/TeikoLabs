import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Checking quiz_attempts table schema...');

    // Check if the quiz_attempts table exists and get its columns
    const { data: columns, error: columnsError } = await supabaseServer
      .rpc('get_table_columns', { table_name: 'quiz_attempts' });

    if (columnsError) {
      console.error('❌ Error checking table columns:', columnsError);
      
      // Fallback: try to query the table directly to see what columns exist
      const { data: sampleData, error: sampleError } = await supabaseServer
        .from('quiz_attempts')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Error querying quiz_attempts table:', sampleError);
        throw sampleError;
      }
      
      return NextResponse.json({
        success: true,
        message: 'quiz_attempts table exists but column check failed',
        sampleData: sampleData,
        error: columnsError.message
      });
    }

    console.log('📊 quiz_attempts table columns:', columns);

    // Check if completed column exists
    const hasCompletedColumn = columns && columns.some(col => col.column_name === 'completed');
    
    if (!hasCompletedColumn) {
      console.log('❌ completed column missing from quiz_attempts table');
      
      // Try to add the completed column
      const { error: alterError } = await supabaseServer
        .rpc('add_column_if_not_exists', {
          table_name: 'quiz_attempts',
          column_name: 'completed',
          column_type: 'BOOLEAN DEFAULT false'
        });
      
      if (alterError) {
        console.error('❌ Error adding completed column:', alterError);
        return NextResponse.json({
          success: false,
          error: 'Failed to add completed column',
          message: alterError.message,
          columns: columns
        });
      }
      
      console.log('✅ Added completed column to quiz_attempts table');
    }

    // Test inserting a record with the completed field
    const { data: testInsert, error: testError } = await supabaseServer
      .from('quiz_attempts')
      .insert({
        quiz_id: 1,
        wallet_address: 'test-wallet',
        score: 0,
        questions_answered: 0,
        completed: false
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Error testing insert with completed field:', testError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test record with completed field',
        message: testError.message,
        columns: columns
      });
    }

    // Clean up test record
    await supabaseServer
      .from('quiz_attempts')
      .delete()
      .eq('wallet_address', 'test-wallet');

    return NextResponse.json({
      success: true,
      message: 'quiz_attempts table schema is correct',
      columns: columns,
      hasCompletedColumn: hasCompletedColumn,
      testInsert: testInsert
    });
    
  } catch (error) {
    console.error('❌ API: Error checking schema:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check schema',
      message: error.message
    }, { status: 500 });
  }
}
