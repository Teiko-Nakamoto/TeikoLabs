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

    // Get competition status and dynamic reward
    const { data: settings, error: settingsError } = await supabaseServer
      .from('quiz_settings')
      .select('setting_key, setting_value')
      .eq('setting_key', 'competition_active')
      .single();

    if (settingsError) {
      console.error('❌ Error checking competition status:', settingsError);
      throw settingsError;
    }

    const competitionActive = settings?.setting_value;

    if (competitionActive === 'false') {
      return NextResponse.json({ 
        error: 'Competition has ended. No more quiz attempts allowed.' 
      }, { status: 403 });
    }

    // Get dynamic reward based on sBTC fee pool directly from database
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
        quizCompletionPoints = sbtcFeePool; // Full fee pool amount = quiz reward
        console.log('🎯 Using dynamic reward from database:', quizCompletionPoints, 'based on sBTC fee pool:', sbtcFeePool);
      } else {
        // Fallback to reasonable default if no database data
        sbtcFeePool = 10000;
        quizCompletionPoints = sbtcFeePool;
        console.log('🎯 Using fallback reward:', quizCompletionPoints, 'sats');
      }
    } catch (error) {
      console.error('❌ Error getting fee pool data:', error.message);
      // Fallback to reasonable default
      sbtcFeePool = 10000;
      quizCompletionPoints = sbtcFeePool;
      console.log('🎯 Using fallback reward due to error:', quizCompletionPoints, 'sats');
    }

    // Record the quiz attempt
    const { data: attempt, error: attemptError } = await supabaseServer
      .from('quiz_attempts')
      .insert({
        wallet_address: walletAddress,
        quiz_id: quizId,
        questions_answered: questionsAnswered,
        correct_answers: correctAnswers,
        points_earned: quizCompletionPoints, // Configurable points for completing any quiz
        completed_at: new Date().toISOString(),
        failed_at_question: failedAtQuestion || null
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

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabaseServer
        .from('user_points')
                           .update({
            total_points: existingUser.total_points + quizCompletionPoints, // Configurable points for completing any quiz
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
             // Create new user
       const { error: createError } = await supabaseServer
         .from('user_points')
                   .insert({
            wallet_address: walletAddress,
            total_points: quizCompletionPoints, // Configurable points for completing any quiz
            total_quizzes_completed: 1,
            perfect_scores: 1 // Every completed quiz is perfect
          });

      if (createError) {
        console.error('❌ Database error creating user points:', createError);
        throw createError;
      }
    }

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
    return NextResponse.json({ 
      error: 'Failed to record quiz attempt', 
      message: error.message 
    }, { status: 500 });
  }
}
