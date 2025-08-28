import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('📝 API: Fetching leaderboard');
    
    // Get leaderboard data
    const { data: leaderboard, error } = await supabaseServer
      .from('user_points')
      .select(`
        wallet_address,
        total_points,
        total_quizzes_completed,
        perfect_scores,
        created_at,
        updated_at
      `)
      .order('total_points', { ascending: false })
      .limit(100); // Top 100 users

    if (error) {
      console.error('❌ Database error fetching leaderboard:', error);
      throw error;
    }

    // Get competition status from quiz_competition_status table and end goal from settings
    const { data: competitionStatusData, error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .select('status')
      .single();

    const { data: settings, error: settingsError } = await supabaseServer
      .from('quiz_settings')
      .select('setting_key, setting_value')
      .eq('setting_key', 'competition_end_threshold');

    if (settingsError) {
      console.error('❌ Error checking competition settings:', settingsError);
      throw settingsError;
    }

    const competitionStatus = competitionStatusData?.status || 'active';
    const endGoalSetting = settings[0];
    const endGoal = parseInt(endGoalSetting?.setting_value || '1000000');

    // Get total points earned globally
    const { data: totalPoints, error: totalError } = await supabaseServer
      .from('user_points')
      .select('total_points');

    if (totalError) {
      console.error('❌ Database error getting total points:', totalError);
      throw totalError;
    }

    const globalTotal = totalPoints.reduce((sum, user) => sum + user.total_points, 0);

    // Format leaderboard with rankings
    const formattedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.wallet_address,
      totalPoints: user.total_points,
      totalQuizzesCompleted: user.total_quizzes_completed,
      perfectScores: user.perfect_scores,
      joinedAt: user.created_at,
      lastActive: user.updated_at
    }));

    console.log('✅ API: Successfully fetched leaderboard:', formattedLeaderboard.length);
    
    return NextResponse.json({
      success: true,
      leaderboard: formattedLeaderboard,
      competitionActive: competitionStatus === 'active',
      totalPointsEarned: globalTotal,
      totalParticipants: leaderboard.length,
      endGoal: endGoal
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching leaderboard:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard', 
      message: error.message 
    }, { status: 500 });
  }
}
