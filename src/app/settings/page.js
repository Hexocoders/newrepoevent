'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import { motion } from 'framer-motion';

function SettingsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    newMessages: true,
    ticketSales: true,
    eventReminders: true
  });

  // Get user details from metadata
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        bio: user.user_metadata?.bio || ''
      });
      
      // Fetch notification settings from Supabase if available
      const fetchNotificationSettings = async () => {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (data && !error) {
            setNotificationSettings({
              emailNotifications: data.email_notifications ?? true,
              pushNotifications: data.push_notifications ?? false,
              marketingEmails: data.marketing_emails ?? true,
              newMessages: data.new_messages ?? true,
              ticketSales: data.ticket_sales ?? true,
              eventReminders: data.event_reminders ?? true
            });
          }
        } catch (error) {
          console.error('Error fetching notification settings:', error);
        }
      };
      
      fetchNotificationSettings();
    }
  }, [user]);

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          bio: profileData.bio
        }
      });
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
      
      // If email was changed, we need to handle that separately
      if (profileData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email
        });
        
        if (emailError) {
          setMessage({ 
            type: 'warning', 
            text: 'Profile updated, but email change requires verification. Check your inbox.' 
          });
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setIsSaving(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update password. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notification settings update
  const updateNotificationSetting = async (key, value) => {
    try {
      const updatedSettings = {
        ...notificationSettings,
        [key]: value
      };
      
      setNotificationSettings(updatedSettings);
      
      // Convert to snake_case for database
      const dbSettings = {
        user_id: user.id,
        email_notifications: updatedSettings.emailNotifications,
        push_notifications: updatedSettings.pushNotifications,
        marketing_emails: updatedSettings.marketingEmails,
        new_messages: updatedSettings.newMessages,
        ticket_sales: updatedSettings.ticketSales,
        event_reminders: updatedSettings.eventReminders
      };
      
      // Upsert notification settings
      const { error } = await supabase
        .from('user_preferences')
        .upsert(dbSettings, { onConflict: 'user_id' });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert the setting if there was an error
      setNotificationSettings(prev => ({
        ...prev,
        [key]: !value
      }));
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Format message type to Tailwind classes
  const getMessageClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Settings</div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Account Settings
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium shadow-md">
                  {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {profileData.firstName} {profileData.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{profileData.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Settings Navigation */}
          <div className="mb-6 flex space-x-4">
            <motion.button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              whileHover={activeTab !== 'profile' ? { scale: 1.05 } : {}}
              whileTap={activeTab !== 'profile' ? { scale: 0.95 } : {}}
            >
              Profile
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'notifications' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              whileHover={activeTab !== 'notifications' ? { scale: 1.05 } : {}}
              whileTap={activeTab !== 'notifications' ? { scale: 0.95 } : {}}
            >
              Notifications
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'security' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              whileHover={activeTab !== 'security' ? { scale: 1.05 } : {}}
              whileTap={activeTab !== 'security' ? { scale: 0.95 } : {}}
            >
              Security
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'billing' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              whileHover={activeTab !== 'billing' ? { scale: 1.05 } : {}}
              whileTap={activeTab !== 'billing' ? { scale: 0.95 } : {}}
            >
              Billing
            </motion.button>
          </div>

          {/* Status Message */}
          {message.text && (
            <motion.div 
              className={`mb-6 p-4 border rounded-lg ${getMessageClasses(message.type)}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message.text}
            </motion.div>
          )}

          {/* Settings Content */}
          <div className="grid grid-cols-12 gap-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <motion.div 
                className="col-span-12 md:col-span-9 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Settings</h3>
                    <form className="space-y-6" onSubmit={handleProfileSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          rows={4}
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <motion.button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 shadow-md flex items-center gap-2 disabled:opacity-50"
                          disabled={isSaving}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <motion.div 
                className="col-span-12 md:col-span-9 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
                    <div className="space-y-6">
                      {Object.entries(notificationSettings).map(([key, value], index) => (
                        <motion.div 
                          key={key} 
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {key.split(/(?=[A-Z])/).join(' ')}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Receive notifications about {key.split(/(?=[A-Z])/).join(' ').toLowerCase()}
                            </p>
                          </div>
                          <button
                            onClick={() => updateNotificationSetting(key, !value)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                              value ? 'bg-pink-500' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <motion.div 
                className="col-span-12 md:col-span-9 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
                    <form className="space-y-6" onSubmit={handlePasswordChange}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>
                      <div className="flex justify-between">
                        <motion.button
                          type="button"
                          onClick={handleSignOut}
                          className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Sign Out
                        </motion.button>
                        <motion.button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 shadow-md flex items-center gap-2 disabled:opacity-50"
                          disabled={isSaving}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Billing */}
            {activeTab === 'billing' && (
              <motion.div 
                className="col-span-12 md:col-span-9 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Billing Information</h3>
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2 3h20v14H2V3zm2 2v10h16V5H4zm0 12h16v2H4v-2zm8-7h6v2h-6v-2z" />
                            </svg>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">Visa ending in 4242</p>
                              <p className="text-sm text-gray-500">Expires 12/24</p>
                            </div>
                          </div>
                          <motion.button 
                            className="text-sm text-pink-500 hover:text-pink-600"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Edit
                          </motion.button>
                        </div>
                      </div>
                      <motion.button 
                        className="w-full px-4 py-2 text-sm text-pink-500 border border-pink-500 rounded-lg hover:bg-pink-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Add Payment Method
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
} 