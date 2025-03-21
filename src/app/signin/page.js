'use client';

import { useState, useEffect } from 'react';
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
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('Checking credentials...');
      
      // Check credentials against users table
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
      
      if (queryError) {
        console.error('Login query error:', queryError);
        throw new Error('Invalid email or password');
      }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password (in a real app, you should use proper password hashing)
      if (user.password !== password) {
        throw new Error('Invalid email or password');
      }

      console.log('Login successful for user:', user.email);

      // Store user data in localStorage for session management
      const sessionUser = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at
      };
      
      localStorage.setItem('user', JSON.stringify(sessionUser));
      
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      }
      
      console.log('Sign-in successful, redirecting to dashboard...');
      
      // Use a slight delay to ensure localStorage is set before redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
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
            // Check if user exists in our users table
            const { data: existingUser, error: queryError } = await supabase
              .from('users')
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
            const sessionUser = {
              id: existingUser.id,
              email: existingUser.email,
              first_name: existingUser.first_name,
              last_name: existingUser.last_name,
              created_at: existingUser.created_at
            };
            
            localStorage.setItem('user', JSON.stringify(sessionUser));
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


