'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

export default function Signup() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for OAuth callback on component mount
  useEffect(() => {
    const checkOAuthSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (!session || !session.user) {
          return;
        }
        
        const user = session.user;
        
        // Only handle Google OAuth users
        if (user.app_metadata?.provider === 'google') {
          console.log('Processing Google OAuth user:', user.email);
          
          try {
            // Extract name from user metadata
            let firstName = '';
            let lastName = '';
            
            if (user.user_metadata?.full_name) {
              const nameParts = user.user_metadata.full_name.split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            } else {
              firstName = user.email.split('@')[0];
            }

            // Check if user already exists in users table
            const { data: existingUser, error: queryError } = await supabase
              .from('users')
              .select('*')
              .eq('email', user.email)
              .single();
              
            if (queryError && queryError.code !== 'PGRST116') {
              console.error('Error checking for existing user:', queryError);
              // Continue anyway
            }
              
            if (!existingUser) {
              console.log('Creating new user in users table with email:', user.email);
              
              // Create user in our users table
              const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{
                  email: user.email,
                  first_name: firstName,
                  last_name: lastName,
                  password: 'GOOGLE_AUTH', // Special password for Google Auth users
                  is_google_user: true
                }])
                .select();
              
              if (insertError) {
                console.error('Error creating user profile:', insertError);
                setError('Error creating user profile. Please try again.');
                return;
              }
              
              if (newUser && newUser.length > 0) {
                // Store user data in localStorage
                const sessionUser = {
                  id: newUser[0].id,
                  email: newUser[0].email,
                  first_name: newUser[0].first_name,
                  last_name: newUser[0].last_name,
                  created_at: newUser[0].created_at
                };
                localStorage.setItem('user', JSON.stringify(sessionUser));
                console.log('Successfully created user in users table');
              }
            } else {
              // User exists, store in localStorage
              const sessionUser = {
                id: existingUser.id,
                email: existingUser.email,
                first_name: existingUser.first_name,
                last_name: existingUser.last_name,
                created_at: existingUser.created_at
              };
              localStorage.setItem('user', JSON.stringify(sessionUser));
              console.log('User already exists in users table');
            }

            // Redirect to onboarding
            router.push('/onboarding');
          } catch (err) {
            console.error('Error processing OAuth user:', err);
            setError('Error processing Google sign up. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error in OAuth session check:', err);
        setError('Error checking authentication. Please try again.');
      }
    };
    
    checkOAuthSession();
  }, [router]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions');
      return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
        throw new Error('Error checking user existence. Please try again.');
      }

      if (existingUser) {
        throw new Error('Email already registered. Please sign in instead.');
      }

      // Prepare user data
      const newUser = {
        email: email.toLowerCase().trim(),
        password: password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_google_user: false
      };

      console.log('Attempting to create user with data:', {
        ...newUser,
        password: '[REDACTED]'
      });

      // Create the user in users table
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select();

      if (insertError) {
        console.error('Detailed insert error:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(insertError.message || 'Failed to create account. Please try again.');
      }

      if (!data || data.length === 0) {
        console.error('No data returned after insert');
        throw new Error('Failed to create user profile - no data returned');
      }

      const userData = data[0];
      console.log('User created successfully:', {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name
      });

      // Store user data in localStorage
      const sessionUser = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        created_at: userData.created_at
      };
      localStorage.setItem('user', JSON.stringify(sessionUser));
      
      // Redirect to onboarding
      router.push('/onboarding');
    } catch (error) {
      console.error('Signup error details:', {
        message: error.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      setError(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-500/20 to-teal-500/20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2">Welcome.</h1>
          <p className="text-gray-500 text-center mb-8">Create an account</p>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree with <Link href="/terms" className="text-blue-600 hover:underline">Terms & Conditions</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-400 text-white py-2 px-4 rounded-md hover:from-blue-600 hover:to-teal-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account? <Link href="/signin" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 