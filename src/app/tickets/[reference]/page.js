'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function TicketPage() {
  const { reference } = useParams();
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTicketData() {
      try {
        setLoading(true);
        
        // First try to get the debug data
        if (typeof window !== 'undefined') {
          console.log('Looking up ticket with reference:', reference);
          
          // Check for paid ticket data first
          const paidTicketData = localStorage.getItem('paidTicketData');
          if (paidTicketData) {
            const parsedData = JSON.parse(paidTicketData);
            // Only use if reference matches
            if (parsedData.reference === reference) {
              console.log('Using paid ticket data from localStorage:', parsedData);
              setTicket(parsedData);
              
              // Set event data from localStorage if available
              if (parsedData.event_title || parsedData.event_date || parsedData.event_time || parsedData.event_location) {
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available'
                });
                setLoading(false);
                return;
              }
              
              try {
                // Try to fetch event info if we have the ID
                if (parsedData.event_id) {
                  const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', parsedData.event_id)
                    .maybeSingle();
                  
                  if (!eventError && eventData) {
                    setEvent(eventData);
                  } else {
                    setEvent({
                      title: parsedData.event_title || 'Event',
                      date: parsedData.event_date || parsedData.purchase_date,
                      time: parsedData.event_time || 'Time not available',
                      location: parsedData.event_location || 'Location not available'
                    });
                  }
                }
              } catch (eventError) {
                console.error('Error fetching event data:', eventError);
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available'
                });
              }
              
              setLoading(false);
              return;
            }
          }
          
          // Check localStorage for temp free ticket data
          const tempTicketData = localStorage.getItem('tempTicketData');
          if (tempTicketData) {
            const parsedData = JSON.parse(tempTicketData);
            // Only use if reference matches
            if (parsedData.reference === reference) {
              console.log('Using free ticket data from localStorage:', parsedData);
              
              // Set ticket data from localStorage
              setTicket(parsedData);
              
              // Set event data from localStorage if available
              if (parsedData.event_title || parsedData.event_date || parsedData.event_time || parsedData.event_location) {
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available'
                });
                setLoading(false);
                return;
              }
              
              try {
                // Try to fetch event info if we have the ID
                if (parsedData.event_id) {
                  const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', parsedData.event_id)
                    .maybeSingle();
                  
                  if (!eventError && eventData) {
                    setEvent(eventData);
                  } else {
                    setEvent({
                      title: parsedData.event_title || 'Event',
                      date: parsedData.event_date || parsedData.purchase_date,
                      time: parsedData.event_time || 'Time not available',
                      location: parsedData.event_location || 'Location not available'
                    });
                  }
                }
              } catch (eventError) {
                console.error('Error fetching event data:', eventError);
                setEvent({
                  title: parsedData.event_title || 'Event',
                  date: parsedData.event_date || parsedData.purchase_date,
                  time: parsedData.event_time || 'Time not available',
                  location: parsedData.event_location || 'Location not available'
                });
              }
              
              setLoading(false);
              return;
            }
          }
        }
        
        // If no localStorage data or reference doesn't match, fetch from database
        console.log('Fetching ticket from database with reference:', reference);
        
        // First check the paid_tickets table
        const { data: paidTicketsData, error: paidTicketError } = await supabase
          .from('paid_tickets')
          .select('*')
          .eq('reference', reference);
        
        if (paidTicketError) {
          console.error('Failed to fetch from paid_tickets table:', paidTicketError.message);
          // Don't throw error yet, try the general tickets table
        }
        
        // Check if we got any results from paid tickets table
        if (paidTicketsData && paidTicketsData.length > 0) {
          // Use the first paid ticket result
          const paidTicketData = paidTicketsData[0];
          setTicket(paidTicketData);
          
          // For paid tickets, event data is already included
          setEvent({
            title: paidTicketData.event_title || 'Event',
            date: paidTicketData.event_date || paidTicketData.purchase_date,
            time: paidTicketData.event_time || 'Time not available',
            location: paidTicketData.event_location || 'Location not available'
          });
          
          console.log('Loaded paid ticket data:', { 
            type: paidTicketData.ticket_type,
            price: paidTicketData.price_paid,
            attendee: paidTicketData.customer_email,
            status: paidTicketData.status
          });
          
          return;
        } 
        
        // If not found in paid_tickets, try general tickets table
        console.log('No paid ticket found, checking general tickets table');
        const { data: generalTicketsData, error: generalTicketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('ticket_code', reference);
        
        if (generalTicketError) {
          console.error('Failed to fetch from tickets table:', generalTicketError.message);
          // Don't throw error yet, try the free_tickets table
        }
        
        // Check if we got any results from general tickets table
        if (generalTicketsData && generalTicketsData.length > 0) {
          // Use the first general ticket result
          const generalTicketData = generalTicketsData[0];
          setTicket(generalTicketData);
          
          // For general tickets, we need to fetch event data
          try {
            if (generalTicketData.event_id) {
              const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', generalTicketData.event_id)
                .maybeSingle();
              
              if (!eventError && eventData) {
                setEvent(eventData);
              } else {
                setEvent({
                  title: 'Event',
                  date: generalTicketData.purchase_date,
                  time: 'Time not available',
                  location: 'Location not available'
                });
              }
            }
          } catch (eventError) {
            console.error('Error fetching event data:', eventError);
            setEvent({
              title: 'Event',
              date: generalTicketData.purchase_date,
              time: 'Time not available',
              location: 'Location not available'
            });
          }
          
          console.log('Loaded general ticket data:', { 
            type: generalTicketData.ticket_type,
            price: generalTicketData.price_paid,
            attendee: generalTicketData.customer_email,
            status: generalTicketData.status
          });
          
          return;
        }
        
        // If not found in general tickets, try free_tickets table
        console.log('No general ticket found, checking free_tickets table');
        const { data: freeTicketsData, error: freeTicketError } = await supabase
          .from('free_tickets')
          .select('*')
          .eq('reference', reference);
        
        if (freeTicketError) {
          console.error('Failed to fetch from free_tickets table:', freeTicketError.message);
          throw new Error('Failed to fetch ticket from both tables');
        }
        
        // Check if we got any results from free tickets table
        if (freeTicketsData && freeTicketsData.length > 0) {
          // Use the first free ticket result
          const freeTicketData = freeTicketsData[0];
          setTicket(freeTicketData);
          
          // For free tickets, event data is already included
          setEvent({
            title: freeTicketData.event_title || 'Event',
            date: freeTicketData.event_date || freeTicketData.purchase_date,
            time: freeTicketData.event_time || 'Time not available',
            location: freeTicketData.event_location || 'Location not available'
          });
          
          console.log('Loaded free ticket data:', { 
            type: freeTicketData.ticket_type,
            price: freeTicketData.price_paid,
            attendee: freeTicketData.customer_email,
            status: freeTicketData.status
          });
          
          return;
        }
        
        // If we get here, no ticket was found in either table
        console.log('No ticket found in either table with reference:', reference);
        throw new Error('Ticket not found in any table');
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError(err.message);
        
        // Last resort: check localStorage even if reference doesn't match
        if (typeof window !== 'undefined') {
          // Try paid ticket data first
          const paidTicketData = localStorage.getItem('paidTicketData');
          if (paidTicketData) {
            const parsedData = JSON.parse(paidTicketData);
            console.log('Using fallback paid ticket data from localStorage');
            setTicket(parsedData);
            setEvent({
              title: parsedData.event_title || 'Event',
              date: parsedData.event_date || parsedData.purchase_date,
              time: parsedData.event_time || 'Time not available',
              location: parsedData.event_location || 'Location not available'
            });
            setError(null);
            return;
          }
          
          // Then try free ticket data
          const tempTicketData = localStorage.getItem('tempTicketData');
          if (tempTicketData) {
            const parsedData = JSON.parse(tempTicketData);
            console.log('Using fallback free ticket data from localStorage');
            setTicket(parsedData);
            setEvent({
              title: parsedData.event_title || 'Event',
              date: parsedData.event_date || parsedData.purchase_date,
              time: parsedData.event_time || 'Time not available',
              location: parsedData.event_location || 'Location not available'
            });
            setError(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (reference) {
      fetchTicketData();
    }
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Ticket Not Found</h1>
          <p className="text-gray-600 mb-4">{error || "We couldn't find the ticket you're looking for."}</p>
          <Link 
            href="/my-tickets"
            className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  // Format the date from the event or ticket
  const eventDate = event?.date ? new Date(event.date) : 
                    ticket.purchase_date ? new Date(ticket.purchase_date) : new Date();
  
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Generate QR code URL with full ticket details
  const ticketDetailsForQR = {
    event: event?.title || 'Event',
    date: formattedDate,
    time: event?.time || 'Time not available',
    location: event?.location || 'Location not available',
    ticketType: ticket.ticket_type,
    price: String(ticket.price_paid) === '0' || String(ticket.price_paid) === '0.00' ? 'Free' : `₦${ticket.price_paid}`,
    attendee: ticket.customer_name || ticket.customer_email,
    reference: ticket.reference,
    status: ticket.status === 'active' ? 'Confirmed' : ticket.status
  };

  // Format as text string for QR code
  const ticketDetailsText = Object.entries(ticketDetailsForQR)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // Generate QR code URL with complete ticket details
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ticketDetailsText)}&size=200x200`;

  // Use customer_name from ticket if available, or format from email
  const attendeeName = ticket.customer_name || ticket.customer_email;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-blue-600 text-white p-6 text-center">
            <h1 className="text-2xl font-bold">Event Ticket</h1>
            <p className="mt-2">Reference: {ticket.reference}</p>
          </div>
          
          {/* Event Info */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{event?.title || 'Event'}</h2>
            <p className="text-gray-600">
              {formattedDate}<br />
              {event?.time || 'Time not available'}<br />
              {event?.location || 'Location not available'}
            </p>
            
            {/* QR Code */}
            <div className="flex justify-center my-6">
              <div className="text-center">
                <Image 
                  src={qrCodeUrl}
                  alt="Ticket QR Code" 
                  width={200}
                  height={200}
                  className="mx-auto"
                />
                <p className="text-xs text-gray-500 mt-2">Scan for verification</p>
              </div>
            </div>
            
            {/* Ticket Details */}
            <div className="border-t border-b border-gray-200 py-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Ticket Type</p>
                  <p className="font-medium">{ticket.ticket_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">
                    {String(ticket.price_paid) === '0' || String(ticket.price_paid) === '0.00' ? 
                      'Free' : 
                      `₦${ticket.price_paid}`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Attendee</p>
                  <p className="font-medium">{attendeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {ticket.status === 'active' ? 'Confirmed' : ticket.status}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <p className="text-sm text-gray-600 mb-6">
              Bring this ticket (printed or on your phone) to the event<br />
              For support: support@eventips.com
            </p>
            
            {/* Back Button */}
            <div className="text-center">
              <Link 
                href="/my-tickets"
                className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to My Tickets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for fetching event data
async function fetchEventData(ticketData) {
  if (ticketData.event_id) {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', ticketData.event_id)
      .maybeSingle();
    
    if (!eventError && eventData) {
      setEvent(eventData);
    } else {
      // Create a minimal event object from ticket data
      setEvent({
        title: 'Event',
        date: ticketData.purchase_date,
        time: 'Time not available',
        location: 'Location not available'
      });
    }
  }
}