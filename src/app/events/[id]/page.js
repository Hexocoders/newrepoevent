'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
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

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchEventDetails = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          event_images (*),
          ticket_tiers (*),
          users!events_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);
      
      // Set first ticket tier as default
      if (eventData.ticket_tiers && eventData.ticket_tiers.length > 0) {
        setSelectedTier(eventData.ticket_tiers[0]);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackSuccessAction = async (reference) => {
    try {
      setLoading(true);
      
      // Create tickets in the database
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          event_id: event.id,
          user_id: user.id,
          ticket_tier_id: selectedTier.id,
          quantity: quantity,
          price_paid: selectedTier.price * quantity,
          payment_reference: reference.reference,
          ticket_code: `${event.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: 'CONFIRMED'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Redirect to tickets page
      router.push(`/tickets?event=${event.id}`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create ticket. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (!selectedTier) {
      alert('Please select a ticket tier');
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
        alert('Payment cancelled');
      },
      callback: (response) => {
        handlePaystackSuccessAction(response);
      }
    });

    handler.openIframe();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Event not found</h1>
          <Link href="/" className="text-pink-500 hover:text-pink-600">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = event.event_images?.find(img => img.is_cover)?.image_url || '/placeholder-event.jpg';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-96">
                <Image
                  src={coverImage}
                  alt={event.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    <span>{new Date(event.event_date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{event.start_time}</span>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold mb-2">About this event</h2>
                  <p className="text-gray-600">{event.description}</p>
                  
                  <h2 className="text-xl font-semibold mt-6 mb-2">Location</h2>
                  <div className="flex items-start text-gray-600">
                    <svg className="w-5 h-5 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    <div>
                      <p className="font-medium">{event.address}</p>
                      <p>{event.city}, {event.state}</p>
                      <p>{event.country}</p>
              </div>
            </div>

                  <h2 className="text-xl font-semibold mt-6 mb-2">Organizer</h2>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-xl">
                      {event.users.first_name[0]}{event.users.last_name[0]}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">{event.users.first_name} {event.users.last_name}</p>
                      <p className="text-gray-600">{event.users.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Select Tickets</h2>
              
              {event.ticket_tiers.map(tier => (
                <div 
                  key={tier.id}
                  className={`border rounded-lg p-4 mb-4 cursor-pointer transition-all ${
                    selectedTier?.id === tier.id 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-200 hover:border-pink-500'
                  }`}
                  onClick={() => setSelectedTier(tier)}
                >
                  <div className="flex justify-between items-start">
          <div>
                      <h3 className="font-medium">{tier.name}</h3>
                      <p className="text-sm text-gray-600">{tier.description}</p>
                </div>
                    <p className="font-semibold">₦{tier.price}</p>
                  </div>
                  
                  {selectedTier?.id === tier.id && (
                    <div className="mt-4 pt-4 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
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
                    <span>₦{selectedTier.price}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quantity</span>
                    <span>{quantity}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>₦{(selectedTier.price * quantity).toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={handlePurchase}
                    className="w-full mt-4 bg-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-600 transition-colors"
                  >
                    Get Tickets
                  </button>
                </div>
              )}
              </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 