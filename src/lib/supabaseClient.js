import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file.' + 
    '\nNEXT_PUBLIC_SUPABASE_URL: ' + (supabaseUrl ? 'Set' : 'Missing') +
    '\nNEXT_PUBLIC_SUPABASE_ANON_KEY: ' + (supabaseAnonKey ? 'Set' : 'Missing')
  );
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  }
); 