import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Debugging database state...');

    const results = {};

    // Check if quiz_competition_status table exists
    try {
      const { data: statusData, error: statusError } = await supabaseServer
        .from('quiz_competition_status')
        .select('*')
        .limit(5);

      if (statusError) {
        results.quiz_competition_status = {
          exists: false,
          error: statusError.message
        };
      } else {
        results.quiz_competition_status = {
          exists: true,
          data: statusData,
          count: statusData.length
        };
      }
    } catch (error) {
      results.quiz_competition_status = {
        exists: false,
        error: error.message
      };
    }

    // Check quiz_settings table
    try {
      const { data: settingsData, error: settingsError } = await supabaseServer
        .from('quiz_settings')
        .select('*')
        .limit(10);

      if (settingsError) {
        results.quiz_settings = {
          exists: false,
          error: settingsError.message
        };
      } else {
        results.quiz_settings = {
          exists: true,
          data: settingsData,
          count: settingsData.length
        };
      }
    } catch (error) {
      results.quiz_settings = {
        exists: false,
        error: error.message
      };
    }

    // Check quiz_attempts table
    try {
      const { data: attemptsData, error: attemptsError } = await supabaseServer
        .from('quiz_attempts')
        .select('*')
        .limit(1);

      if (attemptsError) {
        results.quiz_attempts = {
          exists: false,
          error: attemptsError.message
        };
      } else {
        results.quiz_attempts = {
          exists: true,
          data: attemptsData,
          count: attemptsData.length
        };
      }
    } catch (error) {
      results.quiz_attempts = {
        exists: false,
        error: error.message
      };
    }

    // Check user_points table
    try {
      const { data: pointsData, error: pointsError } = await supabaseServer
        .from('user_points')
        .select('*')
        .limit(5);

      if (pointsError) {
        results.user_points = {
          exists: false,
          error: pointsError.message
        };
      } else {
        results.user_points = {
          exists: true,
          data: pointsData,
          count: pointsData.length
        };
      }
    } catch (error) {
      results.user_points = {
        exists: false,
        error: error.message
      };
    }

    console.log('📊 Database debug results:', results);

    return NextResponse.json({
      success: true,
      message: 'Database state debugged',
      results: results
    });
    
  } catch (error) {
    console.error('❌ API: Error debugging database:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to debug database',
      message: error.message
    }, { status: 500 });
  }
}
