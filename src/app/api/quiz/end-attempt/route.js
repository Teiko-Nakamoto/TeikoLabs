import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    const { 
      quizId, 
      walletAddress, 
      questionsAnswered, 
      correctAnswers, 
      failedAtQuestion 
    } = await request.json();
    
    // Validate required fields
    if (!quizId || !walletAddress || questionsAnswered === undefined || correctAnswers === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: quizId, walletAddress, questionsAnswered, correctAnswers' 
      }, { status: 400 });
    }
    
    console.log('📝 API: Ending quiz attempt:', { 
      quizId, 
      walletAddress, 
      questionsAnswered, 
      correctAnswers
    });

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
    const endGoalThreshold = parseInt(endGoalSetting?.setting_value);
    
    if (!endGoalSetting || !endGoalThreshold) {
      console.error('❌ No end goal threshold found in database');
      return NextResponse.json({
        success: false,
        error: 'No end goal threshold configured in database'
      }, { status: 400 });
    }

    if (competitionStatus === 'ended' || competitionStatus === 'paused') {
      return NextResponse.json({ 
        error: 'Competition has ended. No more quiz attempts allowed.' 
      }, { status: 403 });
    }

    // Check if user would exceed the end goal
    const { data: existingUserCheck, error: userCheckErrorInitial } = await supabaseServer
      .from('user_points')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (userCheckErrorInitial && userCheckErrorInitial.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Database error checking user points:', userCheckErrorInitial);
      throw userCheckErrorInitial;
    }

    // Get dynamic reward based on sBTC fee pool directly from database (1:1 mapping)
    let quizCompletionPoints = 0;
    let sbtcFeePool = 0;
    
    try {
      // Get the latest fee pool data from database
      const { data: latestRecord, error } = await supabaseServer
        .from('sbtc_fee_pool_history')
        .select('fee_pool_amount')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && latestRecord) {
        sbtcFeePool = latestRecord.fee_pool_amount;
        quizCompletionPoints = Math.floor(sbtcFeePool); // 1:1 with current sBTC fee pool
        console.log('🎯 Using 1:1 reward from database:', quizCompletionPoints, 'based on sBTC fee pool:', sbtcFeePool);
      } else {
        console.log('⚠️ No fee pool data found, using fallback');
        // Fallback to reasonable default if no database data
        sbtcFeePool = 10000;
        quizCompletionPoints = Math.floor(sbtcFeePool); // 1:1 fallback
        console.log('🎯 Using 1:1 fallback reward:', quizCompletionPoints, 'points');
      }
    } catch (error) {
      console.error('❌ Error getting fee pool data:', error.message);
      // Fallback to reasonable default
      sbtcFeePool = 10000;
      quizCompletionPoints = Math.floor(sbtcFeePool);
      console.log('🎯 Using 1:1 fallback reward due to error:', quizCompletionPoints, 'points');
    }

    const currentUserPoints = existingUserCheck ? existingUserCheck.total_points : 0;
    const potentialNewPoints = currentUserPoints + quizCompletionPoints;
    
    console.log('🎯 End goal check:', {
      currentUserPoints,
      sbtcFeePool,
      potentialNewPoints,
      endGoalThreshold,
      wouldExceed: potentialNewPoints >= endGoalThreshold
    });

    // Allow the quiz to complete even if it exceeds the end goal
    // The competition will end after this completion
    if (potentialNewPoints >= endGoalThreshold) {
      console.log('🏆 User will exceed end goal, but allowing completion to end competition');
    }

    // Record the quiz attempt
    const { data: attempt, error: attemptError } = await supabaseServer
      .from('quiz_attempts')
      .insert({
        wallet_address: walletAddress,
        quiz_id: quizId,
        questions_answered: questionsAnswered,
        correct_answers: correctAnswers, // Use correct_answers field
        points_earned: quizCompletionPoints, // Add points earned
        completed_at: new Date().toISOString() // Mark as completed with timestamp
      })
      .select()
      .single();

    if (attemptError) {
      console.error('❌ Database error recording attempt:', attemptError);
      throw attemptError;
    }

    // Update or create user points record
    const { data: existingUser, error: userCheckError } = await supabaseServer
      .from('user_points')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Database error checking user points:', userCheckError);
      throw userCheckError;
    }

    let newTotalPoints = 0;
    if (existingUser) {
      newTotalPoints = existingUser.total_points + quizCompletionPoints;
      
      // Update existing user
      const { error: updateError } = await supabaseServer
        .from('user_points')
        .update({
          total_points: newTotalPoints,
          total_quizzes_completed: existingUser.total_quizzes_completed + 1,
          perfect_scores: existingUser.perfect_scores + 1, // Every completed quiz is perfect
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error('❌ Database error updating user points:', updateError);
        throw updateError;
      }
    } else {
      newTotalPoints = quizCompletionPoints;
      
      // Create new user
      const { error: createError } = await supabaseServer
        .from('user_points')
        .insert({
          wallet_address: walletAddress,
          total_points: newTotalPoints,
          total_quizzes_completed: 1,
          perfect_scores: 1 // Every completed quiz is perfect
        });

      if (createError) {
        console.error('❌ Database error creating user points:', createError);
        throw createError;
      }
    }

    // Note: endGoalThreshold is already declared above, using existing value

    // Check if this user's completion will end the competition
    const willEndCompetition = potentialNewPoints >= endGoalThreshold;
    
    if (willEndCompetition) {
      console.log(`🏆 Competition will end! User will reach ${potentialNewPoints.toLocaleString()} points (threshold: ${endGoalThreshold.toLocaleString()})`);
      
      // Pause the quiz competition
      const { error: pauseError } = await supabaseServer
        .from('quiz_competition_status')
        .upsert({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        });
      
      if (pauseError) {
        console.error('❌ Error pausing quiz competition:', pauseError);
        throw pauseError;
      }
      
      // Also update the competition_active setting
      const { error: settingError } = await supabaseServer
        .from('quiz_settings')
        .update({ setting_value: 'false' })
        .eq('setting_key', 'competition_active');
      
      if (settingError) {
        console.error('❌ Error updating competition setting:', settingError);
        throw settingError;
      }
    } else {
      // Check if competition should be reactivated (points are now below threshold)
      const { data: currentStatus, error: statusError } = await supabaseServer
        .from('quiz_competition_status')
        .select('status')
        .single();
      
      if (!statusError && currentStatus?.status === 'paused') {
        console.log(`🔄 Competition should be reactivated! Current points (${potentialNewPoints.toLocaleString()}) < threshold (${endGoalThreshold.toLocaleString()})`);
        
        // Reactivate the quiz competition
        const { error: reactivateError } = await supabaseServer
          .from('quiz_competition_status')
          .upsert({ 
            status: 'active',
            updated_at: new Date().toISOString()
          });
        
        if (reactivateError) {
          console.error('❌ Error reactivating quiz competition:', reactivateError);
          throw reactivateError;
        }
        
        // Also update the competition_active setting
        const { error: settingError } = await supabaseServer
          .from('quiz_settings')
          .update({ setting_value: 'true' })
          .eq('setting_key', 'competition_active');
        
        if (settingError) {
          console.error('❌ Error updating competition setting:', settingError);
          throw settingError;
        }
      }
    }

    // Milestone logic removed - simplified to 21% reward structure only

    // Update total points earned globally
    const { data: totalPoints, error: totalError } = await supabaseServer
      .from('user_points')
      .select('total_points');

    if (totalError) {
      console.error('❌ Database error getting total points:', totalError);
      throw totalError;
    }

    const globalTotal = totalPoints.reduce((sum, user) => sum + user.total_points, 0);
    
    const { error: globalUpdateError } = await supabaseServer
      .from('quiz_settings')
      .update({ setting_value: globalTotal.toString() })
      .eq('setting_key', 'total_points_earned');

    if (globalUpdateError) {
      console.error('❌ Database error updating global total:', globalUpdateError);
      throw globalUpdateError;
    }

    console.log('✅ API: Successfully recorded quiz attempt and updated points');
    
    return NextResponse.json({
      success: true,
      attempt: attempt,
      pointsEarned: quizCompletionPoints, // Dynamic points based on sBTC fee pool
      totalPointsEarned: globalTotal,
      perfectScore: true, // Every completed quiz is perfect
      sbtcFeePool: sbtcFeePool, // Current sBTC fee pool for transparency
      dynamicReward: true // Indicates this was calculated dynamically
    });
    
  } catch (error) {
    console.error('❌ API: Error ending quiz attempt:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    return NextResponse.json({ 
      error: 'Failed to record quiz attempt', 
      message: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
