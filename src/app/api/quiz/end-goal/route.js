import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('📝 API: Fetching quiz end goal');
    
    // Get current end goal from quiz_settings
    const { data: endGoalSetting, error } = await supabaseServer
      .from('quiz_settings')
      .select('setting_value')
      .eq('setting_key', 'competition_end_threshold')
      .single();

    if (error) {
      console.error('❌ Database error fetching end goal:', error);
      throw error;
    }

    const endGoal = parseInt(endGoalSetting?.setting_value);
    
    if (!endGoalSetting || !endGoal) {
      console.error('❌ No end goal threshold found in database');
      return NextResponse.json({
        success: false,
        error: 'No end goal threshold configured in database'
      }, { status: 400 });
    }
    
    console.log('✅ API: Successfully fetched end goal:', endGoal);
    
    return NextResponse.json({
      success: true,
      endGoal: endGoal
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching end goal:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch end goal', 
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { endGoal } = await request.json();
    
    // Validate required fields
    if (!endGoal || endGoal < 1000 || endGoal > 100000000) {
      return NextResponse.json({ 
                  error: 'Invalid end goal. Must be between 1,000 and 100,000,000 points.' 
      }, { status: 400 });
    }
    
    console.log('📝 API: Updating quiz end goal to:', endGoal);

    // Update the end goal in quiz_settings
    const { error } = await supabaseServer
      .from('quiz_settings')
      .update({ setting_value: endGoal.toString() })
      .eq('setting_key', 'competition_end_threshold');

    if (error) {
      console.error('❌ Database error updating end goal:', error);
      throw error;
    }

    console.log('✅ API: Successfully updated end goal to:', endGoal);
    
    return NextResponse.json({
      success: true,
      endGoal: endGoal,
      message: 'End goal updated successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Error updating end goal:', error);
    return NextResponse.json({ 
      error: 'Failed to update end goal', 
      message: error.message 
    }, { status: 500 });
  }
}
