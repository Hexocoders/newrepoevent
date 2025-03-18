'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import supabase from '../lib/supabase';

export default function Onboarding() {
  return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1">
          <OnboardingContent />
        </div>
        <Footer />
      </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { } = useAuth();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    preferences: {}
  });

  // Handle initial data loading
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get user from localStorage as fallback
        const storedUserData = localStorage.getItem('user');
        let localUser = null;
        
        if (storedUserData) {
          try {
            localUser = JSON.parse(storedUserData);
            console.log('Found user in localStorage:', localUser.email);
            
            // Pre-fill form with localStorage data
            setUserData({
              firstName: localUser.first_name || '',
              lastName: localUser.last_name || '',
              phoneNumber: localUser.phone_number || '',
              bio: localUser.bio || '',
              preferences: localUser.preferences || {}
            });
          } catch (e) {
            console.error('Error parsing stored user data:', e);
          }
        }
        
        // Try to get user from Supabase Auth (but don't fail if not available)
        try {
          const { data, error } = await supabase.auth.getUser();
          
          if (!error && data && data.user) {
            const authUser = data.user;
            console.log('Found auth user:', authUser.email);
            
            // Try to get the user's profile from the profiles table
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();
                
              if (!profileError && profile) {
                // Pre-fill form with profile data
                setUserData({
                  firstName: profile.first_name || userData.firstName,
                  lastName: profile.last_name || userData.lastName,
                  phoneNumber: profile.phone_number || userData.phoneNumber,
                  bio: profile.bio || userData.bio,
                  preferences: profile.preferences || userData.preferences
                });
                console.log('Pre-filled form with profile data');
              } else if (authUser.user_metadata) {
                // Fall back to auth user metadata if no profile
                setUserData({
                  firstName: authUser.user_metadata.first_name || userData.firstName,
                  lastName: authUser.user_metadata.last_name || userData.lastName,
                  phoneNumber: authUser.user_metadata.phone_number || userData.phoneNumber,
                  bio: authUser.user_metadata.bio || userData.bio,
                  preferences: authUser.user_metadata.preferences || userData.preferences
                });
                console.log('Pre-filled form with auth user metadata');
              }
            } catch (profileErr) {
              console.log('Error fetching profile (continuing):', profileErr.message);
            }
          } else if (error) {
            console.log('Auth session missing (continuing with localStorage):', error.message);
          }
        } catch (authErr) {
          console.log('Error getting auth user (continuing with localStorage):', authErr.message);
        }
        
        // Only show error if we've tried everything and still have no data
        // AND the user has been on the page for a while (to avoid flash of error)
        if (!localUser && !userData.firstName && !userData.lastName) {
          // Don't show error immediately - let user fill out form manually if needed
          console.log('No user data found, but allowing manual entry');
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        // Don't show error - let user fill out form manually
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Handle OAuth redirects
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      try {
        // Check if this is an OAuth redirect
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Error getting session:', error.message);
          return;
        }
        
        if (!data || !data.session) {
          console.log('No active session found');
          return;
        }
        
        const user = data.session.user;
        
        // Only handle OAuth users
        if (user.app_metadata?.provider) {
          console.log('Processing OAuth user:', user.email);
          
          // Get the user's profile from the profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            return;
          }
          
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify({
            id: user.id,
            email: user.email,
            first_name: profile?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: profile?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            phone_number: profile?.phone_number || '',
            bio: profile?.bio || '',
            preferences: profile?.preferences || {}
          }));
          
          console.log('User profile stored in localStorage');
          
          // Pre-fill form with profile data
          setUserData({
            firstName: profile?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: profile?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            phoneNumber: profile?.phone_number || '',
            bio: profile?.bio || '',
            preferences: profile?.preferences || {}
          });
        }
      } catch (err) {
        console.error('Error handling OAuth redirect:', err);
      }
    };
    
    handleOAuthRedirect();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  const handleUserInfoSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user ID from localStorage as fallback
      const storedUserData = localStorage.getItem('user');
      let userId = null;
      let userEmail = null;
      
      if (storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData);
          userId = parsedUser.id;
          userEmail = parsedUser.email;
          console.log('Found user ID from localStorage:', userId);
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Try to get user from Supabase Auth
      let authUser = null;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data && data.user) {
          authUser = data.user;
          userId = authUser.id; // Prefer auth user ID if available
          userEmail = authUser.email;
          console.log('Found auth user:', authUser.email);
          
          // Try to update the user metadata in Supabase Auth
          try {
            const { error: updateAuthError } = await supabase.auth.updateUser({
              data: {
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone_number: userData.phoneNumber,
                bio: userData.bio,
                preferences: userData.preferences
              }
            });
            
            if (updateAuthError) {
              console.log('Error updating auth user metadata (continuing):', updateAuthError.message);
            } else {
              console.log('Successfully updated auth user metadata');
            }
          } catch (updateErr) {
            console.log('Error updating auth user (continuing):', updateErr.message);
          }
        } else if (error) {
          console.log('Auth session missing (continuing with localStorage):', error.message);
        }
      } catch (authErr) {
        console.log('Error getting auth user (continuing with localStorage):', authErr.message);
      }
      
      // If we don't have a user ID or email, we need to create a temporary user
      // This allows users to proceed with onboarding even if auth fails
      if (!userId || !userEmail) {
        console.log('No user ID found, creating temporary user data');
        
        // Generate a temporary ID and use form data for email
        const tempEmail = `${userData.firstName.toLowerCase()}.${userData.lastName.toLowerCase()}@example.com`;
        const tempId = 'temp_' + Math.random().toString(36).substring(2, 15);
        
        userId = tempId;
        userEmail = tempEmail;
        
        // Store temporary user data in localStorage
        localStorage.setItem('user', JSON.stringify({
          id: tempId,
          email: tempEmail,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone_number: userData.phoneNumber,
          bio: userData.bio,
          preferences: userData.preferences,
          is_temporary: true
        }));
        
        console.log('Created temporary user:', tempEmail);
      }
      
      // Try to update the profiles table if we have a real user ID (not temporary)
      if (userId && !userId.startsWith('temp_')) {
        try {
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({
              first_name: userData.firstName,
              last_name: userData.lastName,
              phone_number: userData.phoneNumber,
              bio: userData.bio,
              preferences: userData.preferences
            })
            .eq('id', userId);
          
          if (updateProfileError) {
            console.log('Error updating profile (trying insert):', updateProfileError.message);
            
            // If update fails, try to insert
            const { error: insertProfileError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: userEmail,
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone_number: userData.phoneNumber,
                bio: userData.bio,
                preferences: userData.preferences,
                auth_method: authUser?.app_metadata?.provider || 'email'
              });
            
            if (insertProfileError) {
              console.error('Error inserting profile:', insertProfileError);
              console.log('Continuing with localStorage only');
            } else {
              console.log('Successfully inserted profile');
            }
          } else {
            console.log('Successfully updated profile');
          }
        } catch (profileErr) {
          console.error('Error updating/inserting profile:', profileErr);
          console.log('Continuing with localStorage only');
        }
      }
      
      // Update localStorage with new user data (even if we couldn't update the profile)
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        email: userEmail,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: userData.phoneNumber,
        bio: userData.bio,
        preferences: userData.preferences,
        is_temporary: userId.startsWith('temp_')
      }));
      console.log('User data saved to localStorage');
      
      // Move to the next step (interests)
      setStep(2);
    } catch (err) {
      console.error('Error in user info submission:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (category) => {
    if (interests.includes(category)) {
      setInterests(interests.filter(item => item !== category));
    } else {
      setInterests([...interests, category]);
    }
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      
      // Get user ID from localStorage as fallback
      const storedUserData = localStorage.getItem('user');
      let userId = null;
      let isTemporary = false;
      
      if (storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData);
          userId = parsedUser.id;
          isTemporary = parsedUser.is_temporary === true;
          console.log('Found user ID from localStorage:', userId, isTemporary ? '(temporary)' : '');
          
          // Update localStorage with interests
          parsedUser.interests = interests.length > 0 ? interests.join(', ') : null;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          console.log('Updated interests in localStorage');
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Only try to update Supabase if we have a non-temporary user
      if (userId && !isTemporary) {
        // Try to get user from Supabase Auth
        try {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data && data.user) {
            const authUser = data.user;
            userId = authUser.id; // Prefer auth user ID if available
            console.log('Found auth user:', authUser.email);
            
            // Try to update the user metadata in Supabase Auth
            if (interests.length > 0) {
              try {
                const { error: updateAuthError } = await supabase.auth.updateUser({
                  data: {
        interests: interests
                  }
                });
                
                if (updateAuthError) {
                  console.log('Error updating auth user interests (continuing):', updateAuthError.message);
                } else {
                  console.log('Successfully updated auth user interests');
                }
              } catch (updateErr) {
                console.log('Error updating auth user interests (continuing):', updateErr.message);
              }
            }
            
            // Try to update the profiles table
            try {
              const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({
                  interests: interests.length > 0 ? interests.join(', ') : null
                })
                .eq('id', userId);
              
              if (updateProfileError) {
                console.log('Error updating profile interests (continuing):', updateProfileError.message);
              } else {
                console.log('Successfully updated profile interests');
              }
            } catch (profileErr) {
              console.log('Error updating profile interests (continuing):', profileErr.message);
            }
          } else if (error) {
            console.log('Auth session missing (continuing with localStorage):', error.message);
          }
        } catch (authErr) {
          console.log('Error getting auth user (continuing with localStorage):', authErr.message);
        }
      } else {
        console.log('Using temporary user, skipping Supabase updates');
      }
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error in handleNext:', err);
      setError('An error occurred while saving your interests');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Navigate to dashboard instead of location
    router.push('/dashboard');
  };

  // Music categories
  const musicCategories = [
    'Blues & Jazz', 'Country', 'EDM', 'Hip Hop', 'RAP', 'Pop', 'R&B',
    'Electronic', 'Experimental', 'Psychedelic'
  ];

  // Sport categories
  const sportCategories = [
    'Football (soccer)', 'Basketball', 'Tennis', 'Baseball', 'Swimming',
    'Volleyball', 'Athletics', 'Rugby', 'Ice hockey'
  ];

  // Business categories
  const businessCategories = [
    'Trade Shows', 'Product Launches', 'Business Seminars',
    'Workshops', 'Business Awards', 'Investor Pitch Events'
  ];

  // Exhibition categories
  const exhibitionCategories = [
    'Oil paints', 'Canvas', 'Watercolor set', 'Sketchbook', 'Charcoal pencils',
    'Chalkboard', 'Pottery wheel', 'Colored pencils', 'Wood carving tools'
  ];

  // Render user info form (Step 1)
  const renderUserInfoForm = () => {
    return (
      <div className="flex flex-1">
        {/* Left side with questions */}
        <div className="w-1/2 pr-8">
          <div className="mb-4 text-sm text-gray-500">Tell us</div>
          
          {/* Progress Steps */}
          <div className="flex flex-col gap-8 mb-8">
            {/* Step 1 - User Info */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <h1 className="text-4xl font-bold">Your Information</h1>
            </div>

            {/* Step 2 - Interests */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              </div>
              <h2 className="text-2xl text-gray-400">What are your interests?</h2>
            </div>
            
            {/* Step 3 - Location */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              </div>
              <h2 className="text-2xl text-gray-400">What is your preferred location?</h2>
            </div>
          </div>
        </div>

        {/* Right side with form */}
        <div className="w-1/2">
          <div className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={userData.firstName}
                onChange={handleInputChange}
                placeholder="John"
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
                name="lastName"
                value={userData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={userData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1 (123) 456-7890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render interests selection (Step 2)
  const renderInterestsSelection = () => {
  return (
        <div className="flex flex-1">
          {/* Left side with questions */}
          <div className="w-1/2 pr-8">
            <div className="mb-4 text-sm text-gray-500">Tell us</div>
            
            {/* Progress Steps */}
            <div className="flex flex-col gap-8 mb-8">
            {/* Step 1 - User Info */}
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl text-gray-400">Your Information</h2>
            </div>

            {/* Step 2 - Interests */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <h1 className="text-4xl font-bold">What Are Your Interests?</h1>
              </div>

            {/* Step 3 - Location */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                </div>
                <h2 className="text-2xl text-gray-400">What is your preferred location?</h2>
              </div>
            </div>
          </div>

          {/* Right side with interest categories */}
          <div className="w-1/2">
            {/* Music Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">♫</span> Music
              </h3>
              <div className="flex flex-wrap gap-2">
                {musicCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sport Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">⚽</span> Sport
              </h3>
              <div className="flex flex-wrap gap-2">
                {sportCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">💼</span> Business
              </h3>
              <div className="flex flex-wrap gap-2">
                {businessCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Exhibition Section */}
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <span className="text-gray-500">🎨</span> Exhibition
              </h3>
              <div className="flex flex-wrap gap-2">
                {exhibitionCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleInterestToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      interests.includes(category)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
    );
  };

  // Effect to update userData fields when they change
  useEffect(() => {
    // This effect ensures userData fields are included as dependencies
  }, [userData.firstName, userData.lastName, userData.phoneNumber, userData.bio, userData.preferences]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm mx-8 mt-4">
          {error}
        </div>
      )}
      
      <div className="flex-1 p-8 flex flex-col">
        {step === 1 ? renderUserInfoForm() : renderInterestsSelection()}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step === 1 ? (
            <>
              <button 
                onClick={() => setStep(2)}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Skip
              </button>
              <button 
                onClick={handleUserInfoSubmit}
                disabled={loading}
                className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Next'}
              </button>
            </>
          ) : (
            <>
          <button 
            onClick={handleSkip}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            Skip
          </button>
          <button 
            onClick={handleNext}
            className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-md"
          >
            Next
          </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 