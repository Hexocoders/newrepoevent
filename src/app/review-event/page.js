'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '../lib/supabase';
import Image from 'next/image';

function ReviewEventContent() {
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
  const [albumImages, setAlbumImages] = useState([]);

  // Fetch event data on component mount
  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        // Get event ID from session storage
        const eventId = sessionStorage.getItem('currentEventId');
        
        if (!eventId) {
          throw new Error('No event found to review');
        }
        
        // Fetch event data from Supabase
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          throw new Error('Event not found');
        }
        
        setEvent(data);
        
        // Fetch cover image and album images
        try {
          const { data: imageData, error: imageError } = await supabase
            .from('event_images')
            .select('*')
            .eq('event_id', eventId);
            
          if (imageError) {
            console.error('Error fetching images:', imageError.message);
          } else if (imageData && imageData.length > 0) {
            // Find cover image
            const coverImage = imageData.find(img => img.is_cover === true);
            if (coverImage) {
              // Add cover image URL to event object
              setEvent(prev => ({
                ...prev,
                cover_image_url: coverImage.image_url
              }));
              console.log('Cover image found:', coverImage.image_url);
            } else {
              console.log('No cover image found in event_images');
            }
            
            // Set album images (non-cover images)
            const albumImgs = imageData.filter(img => img.is_cover === false);
            if (albumImgs.length > 0) {
              setAlbumImages(albumImgs);
              console.log('Album images found:', albumImgs.length);
            }
          } else {
            console.log('No images found for event');
          }
        } catch (imageError) {
          console.error('Error fetching images:', imageError.message);
          // Continue without images
        }
      } catch (error) {
        console.error('Error fetching event:', error.message);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, []);
  
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      let publishData = {
        status: 'published',
        published_at: new Date().toISOString(),
      };
      
      // If schedule is enabled, set scheduled publish date
      if (isScheduleEnabled && publishDate && publishTime) {
        const scheduledDate = new Date(`${publishDate}T${publishTime}`);
        publishData = {
          status: 'scheduled',
          scheduled_publish_date: scheduledDate.toISOString(),
        };
      }
      
      // Update event in Supabase
      const { error } = await supabase
        .from('events')
        .update(publishData)
        .eq('id', event.id);
        
      if (error) throw error;
      
      // Redirect to dashboard or success page
      router.push('/dashboard');
    } catch (error) {
      console.error('Error publishing event:', error.message);
      setError('Failed to publish event. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Function to navigate to create-event page with specific section
  const navigateToCreateEvent = (section) => {
    // Store the section in session storage to be used when the create-event page loads
    sessionStorage.setItem('activeSection', section);
    router.push('/create-event');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 text-pink-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Link href="/create-event" className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
            Back to Create Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/create-event" className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Review Event</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Last update</div>
              <div className="font-medium">
                {new Date(event?.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })} | {new Date(event?.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium">Draft</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold uppercase text-sm text-gray-500 mb-4">EVENT INFORMATION</h3>
              <ul className="space-y-2">
                <li 
                  className="text-gray-700 cursor-pointer hover:text-pink-500"
                  onClick={() => navigateToCreateEvent('upload-cover')}
                >
                  Upload cover
                </li>
                <li 
                  className="text-gray-700 cursor-pointer hover:text-pink-500"
                  onClick={() => navigateToCreateEvent('general-information')}
                >
                  General information
                </li>
                <li 
                  className="text-gray-700 cursor-pointer hover:text-pink-500"
                  onClick={() => navigateToCreateEvent('location-and-time')}
                >
                  Location and time
                </li>
                <li 
                  className="text-gray-700 cursor-pointer hover:text-pink-500"
                  onClick={() => navigateToCreateEvent('ticket')}
                >
                  Ticket
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold uppercase text-sm text-gray-500 mb-4">PUBLISH EVENT</h3>
              <ul className="space-y-2">
                <li className="text-pink-500 font-medium">Review and Publish</li>
              </ul>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-8">
              {/* Event Preview */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 text-xl">🖼️</span>
                    <h2 className="text-lg font-medium">Review</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Event Preview Card */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="relative h-48 bg-gray-200 rounded-md mb-4 overflow-hidden">
                      {event?.cover_image_url ? (
                        <Image 
                          src={event.cover_image_url} 
                          alt={event.name} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                          No cover image
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="bg-pink-500 text-white px-2 py-1 rounded-md text-xs">
                          New event
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-pink-500 text-sm">From ${event?.price || 0}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-1">{event?.name}</h3>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span className="mr-1">📅</span>
                      <span>
                        {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Date not set'} | {event?.start_time || 'Time not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-1">📍</span>
                      <span>
                        {event?.city ? `${event.city}, ${event.state}` : 'Location not set'}
                      </span>
                    </div>
                    
                    {/* Album Images */}
                    {albumImages.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Event Gallery</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {albumImages.map((image, index) => (
                            <div key={index} className="aspect-square rounded-md overflow-hidden">
                              <Image 
                                src={image.image_url} 
                                alt={`Event image ${index + 1}`} 
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Event Details Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 text-xl">📋</span>
                    <h2 className="text-lg font-medium">Event Details</h2>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Description</h3>
                    <p className="text-sm text-gray-600 mt-1">{event?.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Category</h3>
                      <p className="text-sm text-gray-600 mt-1 capitalize">{event?.category || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Visibility</h3>
                      <p className="text-sm text-gray-600 mt-1">{event?.is_public ? 'Public' : 'Private'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Location</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {event?.address ? `${event.address}, ` : ''}
                      {event?.city ? `${event.city}, ` : ''}
                      {event?.state ? `${event.state}, ` : ''}
                      {event?.country || 'Location not specified'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Date</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Date not set'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Start Time</h3>
                      <p className="text-sm text-gray-600 mt-1">{event?.start_time || 'Not set'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">End Time</h3>
                      <p className="text-sm text-gray-600 mt-1">{event?.end_time || 'Not set'}</p>
                    </div>
                  </div>
                  
                  {event?.is_paid && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Price</h3>
                        <p className="text-sm text-gray-600 mt-1">${event?.price || '0'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Quantity</h3>
                        <p className="text-sm text-gray-600 mt-1">{event?.quantity || '0'} tickets</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Publish Schedule */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium">Publish schedule</h2>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      id="schedule" 
                      checked={isScheduleEnabled}
                      onChange={() => setIsScheduleEnabled(!isScheduleEnabled)}
                      className="sr-only"
                    />
                    <label 
                      htmlFor="schedule"
                      className={`block h-6 w-12 rounded-full cursor-pointer ${isScheduleEnabled ? 'bg-pink-500' : 'bg-gray-200'}`}
                    ></label>
                    <span 
                      className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out bg-white ${isScheduleEnabled ? 'right-1' : 'left-1'}`}
                    ></span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Set the publishing time to ensure that your event appears on the website at the designated time
                </p>
                
                {isScheduleEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Publish Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="publishDate"
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                          required={isScheduleEnabled}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="publishTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Publish Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          id="publishTime"
                          value={publishTime}
                          onChange={(e) => setPublishTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                          required={isScheduleEnabled}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Advanced Settings */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium">Advanced settings</h2>
                  </div>
                  <button type="button" className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-sm text-gray-500">
                  Configure additional settings for your event
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => router.push('/create-event')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Save draft
                </button>
                
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || (isScheduleEnabled && (!publishDate || !publishTime))}
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish
                    </>
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewEvent() {
  return <ReviewEventContent />;
} 