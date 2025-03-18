import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Create the Supabase client only if we have valid credentials
let supabase;

try {
  // Only create the client if both URL and key are provided
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    
    // Log successful initialization
    console.log('Supabase client initialized successfully');
    
    // Test the connection
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('Supabase client: User signed in:', session?.user?.id);
        console.log('Auth provider:', session?.user?.app_metadata?.provider);
      } else if (event === 'SIGNED_OUT') {
        console.log('Supabase client: User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Supabase client: Token refreshed');
      } else if (event === 'USER_UPDATED') {
        console.log('Supabase client: User updated');
      }
    });
  } else {
    // Create a mock client for development/testing
    console.warn('Using mock Supabase client - authentication will not work');
    supabase = {
      auth: {
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          }),
          insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        }),
      }),
    };
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Provide a fallback mock client
  supabase = {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
          maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
    }),
  };
}

export default supabase; 