import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function EventPreviewModal({ event, isOpen, onClose, onGetTickets, ticketCount }) {
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isSoldOut = ticketCount === 'No available ticket for this event';

  useEffect(() => {
    if (isOpen && event?.id) {
      fetchEventDetails(event.id);
    } else if (isOpen && event) {
      // If we have event data from the parent but no ID to fetch details
      // Use the existing event data as fallback
      setLoading(false);
      setEventDetails(null);
    }
  }, [isOpen, event]);

  const fetchEventDetails = async (eventId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setError('Database connection error');
        setLoading(false);
        return;
      }

      console.log('Fetching event details for ID:', eventId);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_images (*),
          ticket_tiers (*)
        `)
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Supabase error fetching event details:', error.message || JSON.stringify(error));
        setError(`Failed to load event details: ${error.message || 'Database error'}`);
        // Use event data from parent as fallback
        if (event) {
          console.log('Using event data from parent as fallback');
          setError(null);
          setEventDetails(null); // Keep eventDetails null to use the event prop from parent
        }
      } else if (!data) {
        console.warn('No event data found for ID:', eventId);
        setError('Event not found');
        // Use event data from parent as fallback
        if (event) {
          console.log('Using event data from parent as fallback');
          setError(null);
          setEventDetails(null); // Keep eventDetails null to use the event prop from parent
        }
      } else {
        console.log('Successfully fetched event details');
        setEventDetails(data);
      }
    } catch (err) {
      console.error('Exception during event fetch:', err?.message || JSON.stringify(err));
      setError('An unexpected error occurred');
      // Use event data from parent as fallback
      if (event) {
        console.log('Using event data from parent as fallback after error');
        setError(null);
        setEventDetails(null); // Keep eventDetails null to use the event prop from parent
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Extract and format data
  const getCoverImage = () => {
    if (!eventDetails) return event?.image || '/placeholder-event.jpg';
    
    const coverImage = eventDetails.event_images?.find(img => img?.is_cover)?.image_url;
    return coverImage || event?.image || '/placeholder-event.jpg';
  };

  const getFormattedDate = () => {
    if (!eventDetails?.event_date) return event?.date || 'Date TBA';
    
    return new Date(eventDetails.event_date).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTicketTiers = () => {
    if (!eventDetails?.ticket_tiers) return [];
    return Array.isArray(eventDetails.ticket_tiers) ? eventDetails.ticket_tiers : [];
  };

  const getLowestPrice = () => {
    const ticketTiers = getTicketTiers();
    if (ticketTiers.length === 0) return 'Free';
    
    const prices = ticketTiers
      .map(tier => tier?.price || 0)
      .filter(price => price > 0);
    
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    return lowestPrice === 0 ? 'Free' : `₦${lowestPrice.toLocaleString()}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white hover:text-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0077B6]"></div>
                </div>
              ) : error && !event ? (
                <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
                  <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Event</h3>
                  <p className="text-gray-600">{error}</p>
                </div>
              ) : (
                <>
                  {/* Hero image */}
                  <div className="relative h-64 md:h-80">
                    <Image
                      src={getCoverImage()}
                      alt={eventDetails?.name || event?.title || 'Event'}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/70"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      {(eventDetails?.category || event?.category) && (
                        <span className="inline-block px-3 py-1 rounded-full bg-[#0077B6]/70 text-xs font-medium mb-3">
                          {eventDetails?.category || event?.category}
                        </span>
                      )}
                      <h1 className="text-2xl md:text-3xl font-bold">
                        {eventDetails?.name || event?.title || "Event"}
                      </h1>
                    </div>
                  </div>
                  
                  {/* Event details */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6 text-sm bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{getFormattedDate()}</span>
                      </div>
                      {(eventDetails?.start_time || event?.time) && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{eventDetails?.start_time || event?.time}</span>
                        </div>
                      )}
                      {(eventDetails?.city || event?.location) && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{eventDetails?.city ? 
                            `${eventDetails.city}${eventDetails.state ? `, ${eventDetails.state}` : ''}` : 
                            event?.location || 'Location TBA'
                          }</span>
                        </div>
                      )}
                      <div className="flex items-center ml-auto">
                        <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{event?.price || getLowestPrice()}</span>
                      </div>
                    </div>
                    
                    {/* About section */}
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-3 text-gray-800">About this event</h2>
                      <div className="text-gray-600 prose max-w-none">
                        {eventDetails?.description || event?.description || 'No description available for this event.'}
                      </div>
                    </div>
                    
                    {/* Location section */}
                    {(eventDetails?.address || eventDetails?.city || event?.location) && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-gray-800">Location</h2>
                        <div className="flex items-start text-gray-600">
                          <svg className="w-5 h-5 mr-3 mt-1 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            {eventDetails?.address && <p className="font-medium">{eventDetails.address}</p>}
                            {!eventDetails?.address && event?.location && <p className="font-medium">{event.location}</p>}
                            {(eventDetails?.city || eventDetails?.state) && (
                              <p>{eventDetails.city || ''}{eventDetails.state ? `, ${eventDetails.state}` : ''}</p>
                            )}
                            {eventDetails?.country && <p>{eventDetails.country}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Organizer section - removed since we don't have users data anymore */}
                    {/* Display organizer info from event if available */}
                    {(event?.organizer || eventDetails?.organizer_name) && (
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-gray-800">Organizer</h2>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-[#0077B6] rounded-full flex items-center justify-center text-white font-medium text-xl">
                            {(eventDetails?.organizer_name || event?.organizer || 'EV').substring(0, 2)}
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">
                              {eventDetails?.organizer_name || event?.organizer || 'Event Organizer'}
                            </p>
                            {eventDetails?.organizer_email && <p className="text-gray-600">{eventDetails.organizer_email}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Footer actions */}
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Starts at</p>
                  <p className="font-medium">{event?.time || eventDetails?.start_time || 'Time TBA'}</p>
                </div>
                <button
                  onClick={(e) => !isSoldOut && onGetTickets(event || eventDetails, e)}
                  disabled={isSoldOut}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isSoldOut
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#0077B6] text-white hover:bg-[#0077B6]/90'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Get Tickets'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 