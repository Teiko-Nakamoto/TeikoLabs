// Script to add DEX transaction hash column to the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addDexTxColumn() {
  try {
    console.log('🔄 Adding DEX transaction hash column to user_tokens table...');
    
    // Add the new column
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE user_tokens 
        ADD COLUMN IF NOT EXISTS dex_deployment_tx_hash VARCHAR(255);
        
        CREATE INDEX IF NOT EXISTS idx_user_tokens_dex_tx_hash 
        ON user_tokens(dex_deployment_tx_hash);
      `
    });

    if (error) {
      console.error('❌ Error adding column:', error);
      // Try alternative approach using direct SQL
      console.log('🔄 Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('user_tokens')
        .select('id')
        .limit(1);
        
      if (altError) {
        console.error('❌ Database connection error:', altError);
        return;
      }
      
      console.log('✅ Database connection successful');
      console.log('ℹ️  Column addition may need to be done manually in Supabase dashboard');
      console.log('   SQL to run: ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS dex_deployment_tx_hash VARCHAR(255);');
    } else {
      console.log('✅ DEX transaction hash column added successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('ℹ️  You may need to add the column manually in your database:');
    console.log('   ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS dex_deployment_tx_hash VARCHAR(255);');
  }
}

addDexTxColumn();
