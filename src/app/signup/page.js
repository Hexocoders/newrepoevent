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
            
            // Update the user metadata in Supabase Auth
            const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
              data: {
                first_name: firstName,
                last_name: lastName
              }
            });

            if (updateError) {
              console.error('Error updating user metadata:', updateError);
              // Continue anyway
            }

            // Check if user already exists in our custom table
            const { data: existingUser, error: queryError } = await supabase
              .from('user')
              .select('*')
              .eq('email', user.email)
              .single();
              
            if (queryError && queryError.code !== 'PGRST116') {
              console.error('Error checking for existing user:', queryError);
              // Continue anyway
            }
              
            if (!existingUser) {
              console.log('Creating new user in custom table with email:', user.email);
              
              // Create user in our custom table
              const { data: newUser, error: insertError } = await supabase
                .from('user')
                .insert([{
                  email: user.email,
                  first_name: firstName,
                  last_name: lastName,
                  password: 'GOOGLE_AUTH'
                }])
                .select();
              
              if (insertError) {
                console.error('Error creating user profile:', insertError);
                setError('Error creating user profile. Please try again.');
                return;
              }
              
              if (newUser && newUser.length > 0) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(newUser[0]));
                console.log('Successfully created user in custom table with email:', user.email);
              }
            } else {
              // User exists, store in localStorage
              localStorage.setItem('user', JSON.stringify(existingUser));
              console.log('User already exists in custom table with email:', user.email);
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
    
    try {
      setError(null);
      setLoading(true);
      
      // Create the user in our custom table only
      const { data: userData, error: userError } = await supabase
        .from('user')
        .insert([
          {
            email,
            first_name: firstName,
            last_name: lastName,
            password
          }
        ])
        .select();
      
      if (userError) {
        console.error('User table insert error:', userError);
        throw userError;
      }
      
      if (!userData || userData.length === 0) {
        throw new Error('Failed to create user profile');
      }
      
      console.log('Successfully created user in custom table');
      
      // Skip Supabase Auth signup since it's causing database errors
      // We'll just use our custom user table for authentication
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData[0]));
      
      // Redirect to onboarding
      router.push('/onboarding');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Initiate Google OAuth with proper redirect to onboarding
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (signInError) {
        console.error('Google OAuth error:', signInError);
        throw signInError;
      }
      
      // If we get here, the user will be redirected to Google
      // After authentication, they'll be redirected back to our app
      // The checkOAuthSession function will handle the rest
      console.log('Redirecting to Google OAuth...');
      
    } catch (error) {
      console.error('Google sign-up error:', error);
      setError(error.message || 'Failed to sign up with Google. Please try again.');
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

          {/* Commenting out Google sign-up button for now
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Or sign up with</p>
            <div className="mt-3">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Google
              </button>
            </div>
          </div>
          */}

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