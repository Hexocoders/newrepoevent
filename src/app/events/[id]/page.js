'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

export default function EventPreview() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const eventId = params?.id;

  // Fetch event details when component mounts
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setError('Event ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Using fetch API instead of direct Supabase client
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to load event (${response.status})`);
        }
        
        const eventData = await response.json();
        
        if (!eventData) {
          throw new Error('No event data returned');
        }
        
        setEvent(eventData);
        
        // Set first ticket tier as default if available
        if (eventData.ticket_tiers && eventData.ticket_tiers.length > 0) {
          setSelectedTier(eventData.ticket_tiers[0]);
        }
      } catch (err) {
        console.error('Error loading event:', err);
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePurchase = () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (!selectedTier) {
      alert('Please select a ticket tier');
      return;
    }

    if (!window.PaystackPop) {
      alert('Payment system is loading. Please try again in a moment.');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: selectedTier.price * quantity * 100, // Convert to kobo
      currency: 'NGN',
      ref: new Date().getTime().toString(),
      metadata: {
        event_id: event.id,
        ticket_tier_id: selectedTier.id,
        quantity: quantity,
        custom_fields: [
          {
            display_name: "Event Name",
            variable_name: "event_name",
            value: event.name
          },
          {
            display_name: "Ticket Type",
            variable_name: "ticket_type",
            value: selectedTier.name
          }
        ]
      },
      onClose: () => {
        console.log('Payment canceled by user');
      },
      callback: (response) => {
        // Handle payment success
        router.push(`/payment/success?reference=${response.reference}`);
      }
    });

    handler.openIframe();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0077B6] mb-4"></div>
          <p className="text-gray-500">Loading event details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Event not found</h1>
            <p className="text-gray-600 mb-6">{error || "We couldn't find the event you're looking for."}</p>
            <Link href="/" className="inline-block bg-[#0077B6] text-white px-6 py-2 rounded-lg hover:bg-[#0077B6]/90 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Extract data with fallbacks to prevent errors
  const coverImage = event.event_images?.find(img => img.is_cover)?.image_url || '/placeholder-event.jpg';
  const eventDate = event.event_date ? new Date(event.event_date) : new Date();
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const ticketTiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : [];
  const userInfo = event.users || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="relative h-96">
        <Image
                  src={coverImage}
                  alt={event.name || 'Event'}
          fill
          className="object-cover"
          priority
        />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  {event.category && (
                    <span className="inline-block px-3 py-1 rounded-full bg-[#0077B6]/80 text-xs font-medium mb-3">
                      {event.category}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
        </div>
      </div>

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6 text-sm bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    <span>{formattedDate}</span>
                  </div>
                  {event.start_time && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.start_time}</span>
                    </div>
                  )}
                  {event.city && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{event.city}{event.state ? `, ${event.state}` : ''}</span>
                    </div>
                  )}
            </div>

                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold mb-3 text-gray-800">About this event</h2>
                  <div className="text-gray-600 mb-8">
                    {event.description || 'No description available for this event.'}
                  </div>
                  
                  {(event.address || event.city || event.state) && (
                    <>
                      <h2 className="text-xl font-semibold mb-3 text-gray-800">Location</h2>
                      <div className="flex items-start text-gray-600 mb-8">
                        <svg className="w-5 h-5 mr-3 mt-1 text-[#0077B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          {event.address && <p className="font-medium">{event.address}</p>}
                          {(event.city || event.state) && (
                            <p>{event.city || ''}{event.state ? `, ${event.state}` : ''}</p>
                          )}
                          {event.country && <p>{event.country}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  {(userInfo.first_name || userInfo.last_name) && (
                    <>
                      <h2 className="text-xl font-semibold mb-3 text-gray-800">Organizer</h2>
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-[#0077B6] rounded-full flex items-center justify-center text-white font-medium text-xl">
                          {userInfo.first_name?.[0] || ''}{userInfo.last_name?.[0] || ''}
                </div>
                        <div className="ml-4">
                          <p className="font-medium">
                            {userInfo.first_name || ''} {userInfo.last_name || ''}
                          </p>
                          {userInfo.email && <p className="text-gray-600">{userInfo.email}</p>}
                  </div>
                  </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Tickets</h2>
              
              {ticketTiers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No tickets available for this event.</p>
                </div>
              ) : (
                <>
                  {ticketTiers.map(tier => (
                    <div 
                      key={tier.id}
                      className={`border rounded-lg p-4 mb-4 cursor-pointer transition-all ${
                        selectedTier?.id === tier.id 
                          ? 'border-[#0077B6] bg-blue-50' 
                          : 'border-gray-200 hover:border-[#0077B6]'
                      }`}
                      onClick={() => setSelectedTier(tier)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{tier.name || 'Standard Ticket'}</h3>
                          <p className="text-sm text-gray-600">{tier.description || 'Regular admission'}</p>
                        </div>
                        <p className="font-semibold">{tier.price ? `₦${tier.price.toLocaleString()}` : 'Free'}</p>
              </div>
                      
                      {selectedTier?.id === tier.id && (
                        <div className="mt-4 pt-4 border-t">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <select
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="block w-full rounded-md border border-gray-300 p-2 focus:border-[#0077B6] focus:ring-[#0077B6]"
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                </div>
              )}
                    </div>
                  ))}
                  
                  {selectedTier && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Price per ticket</span>
                        <span>{selectedTier.price ? `₦${selectedTier.price.toLocaleString()}` : 'Free'}</span>
            </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Quantity</span>
                        <span>{quantity}</span>
          </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>{selectedTier.price ? `₦${(selectedTier.price * quantity).toLocaleString()}` : 'Free'}</span>
        </div>

                      <button
                        onClick={handlePurchase}
                        className="w-full mt-4 bg-[#0077B6] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0077B6]/90 transition-colors"
                      >
                        {selectedTier.price ? 'Get Tickets' : 'Register'}
                  </button>
                </div>
                  )}
                </>
              )}
              </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 