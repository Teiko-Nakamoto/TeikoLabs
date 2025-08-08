#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please check your .env.local file for:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAppSettings() {
  console.log('🔧 Setting up App Settings Table...\n');
  
  try {
    // Read the SQL schema
    const sqlSchema = fs.readFileSync('app-settings-schema.sql', 'utf8');
    
    console.log('1️⃣ Creating app_settings table...');
    
    // Execute the SQL to create the table
    const { error } = await supabase.rpc('exec_sql', { sql: sqlSchema });
    
    if (error) {
      console.log('   ⚠️  Could not execute SQL directly, trying alternative approach...');
      
      // Alternative: Create table manually
      const { error: createError } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1);
      
      if (createError && createError.message.includes('does not exist')) {
        console.log('   ❌ app_settings table does not exist');
        console.log('   💡 Please create the table manually in your Supabase dashboard:');
        console.log('');
        console.log('   SQL to run in Supabase SQL Editor:');
        console.log('   ----------------------------------------');
        console.log(sqlSchema);
        console.log('   ----------------------------------------');
        console.log('');
        console.log('   Or run this command in your Supabase SQL Editor:');
        console.log('   CREATE TABLE IF NOT EXISTS app_settings (');
        console.log('     id SERIAL PRIMARY KEY,');
        console.log('     key VARCHAR(100) NOT NULL UNIQUE,');
        console.log('     value TEXT,');
        console.log('     description TEXT,');
        console.log('     created_at TIMESTAMP DEFAULT NOW(),');
        console.log('     updated_at TIMESTAMP DEFAULT NOW()');
        console.log('   );');
        return;
      }
    }
    
    console.log('   ✅ app_settings table created or already exists');
    
    // Test 2: Insert default settings
    console.log('\n2️⃣ Inserting default settings...');
    const { data: insertData, error: insertError } = await supabase
      .from('app_settings')
      .upsert([
        {
          key: 'default_tab',
          value: 'featured',
          description: 'Default tab to show on home page (featured or practice)'
        },
        {
          key: 'maintenance_mode',
          value: 'false',
          description: 'Whether the application is in maintenance mode'
        },
        {
          key: 'feature_flags',
          value: '{}',
          description: 'JSON object containing feature flags'
        }
      ], {
        onConflict: 'key'
      });
    
    if (insertError) {
      console.log('   ❌ Error inserting default settings:', insertError.message);
    } else {
      console.log('   ✅ Default settings inserted successfully');
    }
    
    // Test 3: Verify the setup
    console.log('\n3️⃣ Verifying setup...');
    const { data: settings, error: verifyError } = await supabase
      .from('app_settings')
      .select('*');
    
    if (verifyError) {
      console.log('   ❌ Error verifying settings:', verifyError.message);
    } else {
      console.log('   ✅ App settings table is working');
      console.log('   📊 Current settings:');
      settings.forEach(setting => {
        console.log(`      - ${setting.key}: ${setting.value}`);
      });
    }
    
    console.log('\n🎉 App Settings setup complete!');
    console.log('💡 You can now configure the default tab in the admin panel.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupAppSettings();
