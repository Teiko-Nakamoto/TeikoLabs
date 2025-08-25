import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    // Get the current quiz status from the database
    const { data: statusData, error } = await supabaseServer
      .from('quiz_competition_status')
      .select('status, updated_at')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching quiz status:', error);
      throw error;
    }
    
    // If no status record exists, create one with 'active' status
    if (!statusData) {
      const { data: newStatus, error: insertError } = await supabaseServer
        .from('quiz_competition_status')
        .insert({ status: 'active' })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error creating quiz status:', insertError);
        throw insertError;
      }
      
      return NextResponse.json({
        success: true,
        status: 'active',
        updated_at: newStatus.updated_at
      });
    }
    
    return NextResponse.json({
      success: true,
      status: statusData.status,
      updated_at: statusData.updated_at
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching quiz status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quiz status',
      message: error.message
    }, { status: 500 });
  }
}

