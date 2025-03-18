'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      setLoading(true);
      
      // Check credentials against our custom user table
      const { data: users, error: queryError } = await supabase
        .from('user')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      
      if (queryError) {
        console.error('Login error:', queryError);
        throw new Error('Invalid email or password');
      }

      if (!users) {
        throw new Error('Invalid email or password');
      }

      // Store user data in localStorage for session management
      localStorage.setItem('user', JSON.stringify(users));
      
      console.log('Sign-in successful, redirecting to dashboard...');
      
      // Use a slight delay to ensure localStorage is set before redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Initiate Google OAuth with proper redirect
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
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
      // After authentication, they'll be redirected directly to onboarding
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  // Check for OAuth callback on component mount
  useEffect(() => {
    const checkOAuthSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('Error checking authentication session. Please try again.');
          return;
        }
        
        if (!session || !session.user) {
          return;
        }
        
        const user = session.user;
        
        // Only handle Google OAuth users
        if (user.app_metadata?.provider === 'google') {
          console.log('Processing Google OAuth user for signin');
          
          try {
            // Check if user exists in our custom table
            const { data: existingUser, error: queryError } = await supabase
              .from('user')
              .select('*')
              .eq('email', user.email)
              .single();
              
            if (queryError && queryError.code !== 'PGRST116') {
              console.error('Error checking for existing user:', queryError);
              setError('Error checking user account. Please try again.');
              return;
            }
              
            if (!existingUser) {
              setError('No account found with this Google email. Please sign up first.');
              return;
            }
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(existingUser));
            console.log('Google sign-in successful, redirecting...');
            
            // Use a slight delay to ensure localStorage is set before redirect
            setTimeout(() => {
              router.push('/dashboard');
            }, 100);
          } catch (err) {
            console.error('Error processing OAuth user:', err);
            setError('Failed to process Google sign in. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error in OAuth session check:', err);
        setError('Failed to complete Google sign in. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkOAuthSession();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-500/20 to-teal-500/20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="bg-white rounded-lg p-8 w-full max-w-md relative shadow-xl">
          {/* Close Button */}
          <Link href="/" className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>

          {/* Header */}
          <h1 className="text-3xl font-bold text-center mb-2">Welcome back.</h1>
          <p className="text-gray-500 text-center mb-8">Log in to your account</p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example.email@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M3 3l18 18M10.94 6.08A6.002 6.002 0 0118 12c0 .34-.03.67-.09 1M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                  {!showPassword && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                </svg>
              </button>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-400 text-white py-2 px-4 rounded-md hover:from-blue-600 hover:to-teal-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          {/* Temporarily disabled Google Sign In
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
          */}

          {/* Sign Up Link */}
          <p className="text-center mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
} 


