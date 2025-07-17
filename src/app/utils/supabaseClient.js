// Import the Supabase client creator from the SDK
import { createClient } from '@supabase/supabase-js';

// Your unique Supabase project URL
const supabaseUrl = 'https://yivwcilvhtswlmdcjpqw.supabase.co';

// Your public anonymous API key (for client-side access)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdndjaWx2aHRzd2xtZGNqcHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjU5ODMsImV4cCI6MjA2Nzk0MTk4M30.THYtuWzFspiYPBwuJutX91GWE9zNUIMJmtG0OA_1qnc'; // ← move to .env in production

// Create and export a reusable Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey);
