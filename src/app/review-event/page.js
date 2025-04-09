'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [isPromotionEnabled, setIsPromotionEnabled] = useState(false);

  // Fetch event data on component mount
  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        // Get event ID from session storage
        const eventId = sessionStorage.getItem('currentEventId');
        // Get promotion status from session storage
        const promotionStatus = sessionStorage.getItem('isPromotionEnabled');
        setIsPromotionEnabled(promotionStatus === 'true');
        
        if (!eventId) {
          throw new Error('No event found to review');
        }
        
        // Fetch event data from Supabase
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            event_images (*),
            ticket_tiers (*)
          `)
          .eq('id', eventId)
          .single();
          
        if (eventError) throw eventError;
        
        if (!eventData) {
          throw new Error('Event not found');
        }
        
        // Process the event data
        setEvent(eventData);
        
        // Process images
        if (eventData.event_images && eventData.event_images.length > 0) {
          // Find cover image
          const coverImage = eventData.event_images.find(img => img.is_cover === true);
          if (coverImage) {
            setEvent(prev => ({
              ...prev,
              cover_image_url: coverImage.image_url
            }));
          }
          
          // Set album images (non-cover images)
          const albumImgs = eventData.event_images.filter(img => !img.is_cover);
          if (albumImgs.length > 0) {
            setAlbumImages(albumImgs);
          }
        }

        // Process ticket data if this is a paid event
        if (eventData.is_paid && eventData.ticket_tiers && eventData.ticket_tiers.length > 0) {
          // Get the first/standard ticket tier
          const standardTicket = eventData.ticket_tiers[0];
          setEvent(prev => ({
            ...prev,
            ticket_price: standardTicket.price,
            ticket_quantity: standardTicket.quantity
          }));
        } else if (eventData.ticket_tiers && eventData.ticket_tiers.length > 0) {
          // If it's a free event but has tickets
          const freeTicket = eventData.ticket_tiers[0];
          setEvent(prev => ({
            ...prev,
            ticket_quantity: freeTicket.quantity
          }));
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
        updated_at: new Date().toISOString()
      };
      
      // If schedule is enabled, set scheduled publish date
      if (isScheduleEnabled && publishDate && publishTime) {
        const scheduledDate = new Date(`${publishDate}T${publishTime}`);
        publishData = {
          status: 'scheduled',
          scheduled_publish_date: scheduledDate.toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // We don't want to modify the is_promotion_enabled field here
      // since it was already set when creating the event
      
      // Update event in Supabase
      const { error } = await supabase
        .from('events')
        .update(publishData)
        .eq('id', event.id);
        
      if (error) throw error;
      
      // Redirect to dashboard
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-slate-600 font-medium text-center">Loading event details...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-slate-200">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Error loading event</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link href="/create-event" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md">
              Back to Create Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/create-event" className="text-slate-500 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Review Event</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-500">Last update</div>
              <div className="font-medium text-slate-800">
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
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-500">Status</div>
              <div className="font-medium text-slate-800">Draft</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">EVENT INFORMATION</h3>
              <ul className="space-y-2">
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('upload-cover')}
                >
                  Upload cover
                </li>
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('general-information')}
                >
                  General information
                </li>
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('location-and-time')}
                >
                  Location and time
                </li>
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => navigateToCreateEvent('ticket')}
                >
                  Ticket
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">PUBLISH EVENT</h3>
              <ul className="space-y-2">
                <li className="text-indigo-600 font-medium">Review and Publish</li>
              </ul>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Event Preview */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-slate-800">Preview</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Event Preview Card */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="relative h-48 bg-slate-200 rounded-lg mb-4 overflow-hidden">
                      {event?.cover_image_url ? (
                        <Image 
                          src={event.cover_image_url} 
                          alt={event.name} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                          No cover image
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs shadow-sm">
                          New event
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-indigo-600 font-medium">₦{event?.ticket_price || 0}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{event?.name}</h3>
                    
                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Date not set'} | {event?.start_time || 'Time not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {event?.city ? `${event.city}, ${event.state}` : 'Location not set'}
                      </span>
                    </div>
                    
                    {/* Album Images */}
                    {albumImages.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Event Gallery</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {albumImages.map((image, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-sm">
                              <Image 
                                src={image.image_url} 
                                alt={`Event image ${index + 1}`} 
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-300"
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
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-slate-800">Event Details</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700">Description</h3>
                    <p className="text-sm text-slate-600 mt-1">{event?.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Category</h3>
                      <p className="text-sm text-slate-600 mt-1 capitalize">{event?.category || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Visibility</h3>
                      <p className="text-sm text-slate-600 mt-1">{event?.is_public ? 'Public' : 'Private'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Promotion</h3>
                      <p className={`text-sm mt-1 ${event?.is_promotion_enabled ? 'text-green-600 font-medium' : 'text-slate-600'}`}>
                        {event?.is_promotion_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-slate-700">Location</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {event?.address ? `${event.address}, ` : ''}
                      {event?.city ? `${event.city}, ` : ''}
                      {event?.state ? `${event.state}, ` : ''}
                      {event?.country || 'Location not specified'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Date</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Date not set'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Start Time</h3>
                      <p className="text-sm text-slate-600 mt-1">{event?.start_time || 'Not set'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">End Time</h3>
                      <p className="text-sm text-slate-600 mt-1">{event?.end_time || 'Not set'}</p>
                    </div>
                  </div>
                  
                  {event?.is_paid && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">Price</h3>
                        <p className="text-sm text-slate-600 mt-1">₦{event?.ticket_price || '0'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">Quantity</h3>
                        <p className="text-sm text-slate-600 mt-1">{event?.ticket_quantity || '0'} tickets</p>
                      </div>
                    </div>
                  )}
                  
                  {!event?.is_paid && event?.ticket_quantity && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Free Tickets Available</h3>
                      <p className="text-sm text-slate-600 mt-1">{event?.ticket_quantity || '0'} tickets</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Publish Schedule */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-slate-800">Publish schedule</h2>
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
                      className={`block h-6 w-12 rounded-full cursor-pointer ${isScheduleEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    ></label>
                    <span 
                      className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out bg-white ${isScheduleEnabled ? 'right-1' : 'left-1'}`}
                    ></span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-4">
                  Set the publishing time to ensure that your event appears on the website at the designated time
                </p>
                
                {isScheduleEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="publishDate" className="block text-sm font-medium text-slate-700 mb-1">
                        Publish Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="publishDate"
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          required={isScheduleEnabled}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="publishTime" className="block text-sm font-medium text-slate-700 mb-1">
                        Publish Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          id="publishTime"
                          value={publishTime}
                          onChange={(e) => setPublishTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          required={isScheduleEnabled}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/create-event')}
                  className="w-full sm:w-auto px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-300"
                >
                  Save draft
                </button>
                
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || (isScheduleEnabled && (!publishDate || !publishTime))}
                  className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                    'Publish'
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
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