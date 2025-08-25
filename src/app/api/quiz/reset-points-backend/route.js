import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔄 Backend reset: Starting...');
    
    // First, check if the table exists by trying to read from it
    const { data: existingData, error: readError } = await supabaseServer
      .from('user_points')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Cannot read from user_points table:', readError);
      return NextResponse.json({
        success: false,
        error: 'Database table error',
        message: readError.message
      }, { status: 500 });
    }
    
    console.log('✅ user_points table accessible, found', existingData?.length || 0, 'records');
    
    // Now try to update all records to 0
    const { data: updateData, error: updateError } = await supabaseServer
      .from('user_points')
      .update({
        total_points: 0,
        perfect_quizzes: 0,
        total_quizzes_attempted: 0,
        updated_at: new Date().toISOString()
      });
    
    if (updateError) {
      console.error('❌ Error updating user_points:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Update failed',
        message: updateError.message
      }, { status: 500 });
    }
    
    console.log('✅ Successfully reset all user points in database');
    
    return NextResponse.json({
      success: true,
      message: 'Backend user points reset successfully',
      updatedRecords: updateData?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Backend reset error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Backend reset failed',
      message: error.message
    }, { status: 500 });
  }
}
