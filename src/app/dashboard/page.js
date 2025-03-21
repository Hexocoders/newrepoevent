'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import supabase from '../lib/supabase';

function DashboardContent() {
  const [sortBy, setSortBy] = useState('Sales');
  const { } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add state for dashboard data
  const [salesData, setSalesData] = useState([]);
  const [purchasesData, setPurchasesData] = useState([]);
  const [eventStats, setEventStats] = useState({
    revenue: 0,
    ticketsSold: 0,
    totalTickets: 0,
    shares: 0
  });
  
  // Get user data from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, []);

  // Fetch dashboard data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          throw new Error('User not found. Please sign in again.');
        }
        
        const user = JSON.parse(storedUser);
        console.log('Fetching data for user:', user.id);
        
        // Fetch user's events with ticket tiers
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            start_time,
            city,
            state,
            status,
            created_at,
            ticket_tiers (
              id, 
              price,
              quantity
            ),
            event_images (
              id,
              image_url,
              is_cover
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (eventsError) throw eventsError;
        
        // Process events for sales data display
        const processedSales = events.map(event => {
          // Find cover image
          const coverImage = event.event_images?.find(img => img.is_cover)?.image_url || '/placeholder.png';
          
          // Calculate total tickets and tickets sold (assuming we'd fetch this from a tickets table in a real app)
          const ticketTier = event.ticket_tiers?.[0];
          const totalTickets = ticketTier?.quantity || 0;
          const ticketsSold = Math.floor(Math.random() * totalTickets); // Simulate sold tickets for now
          
          // Calculate revenue
          const revenue = ticketsSold * (ticketTier?.price || 0);
          
          // Determine status based on event date
          const eventDate = new Date(event.event_date);
          const today = new Date();
          const diffTime = eventDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let status = '';
          let statusColor = '';
          
          if (diffDays < 0) {
            status = 'Past event';
            statusColor = 'text-gray-500 bg-gray-50';
          } else if (diffDays === 0) {
            status = 'Today';
            statusColor = 'text-orange-500 bg-orange-50';
          } else if (diffDays <= 7) {
            status = `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
            statusColor = 'text-pink-500 bg-pink-50';
          } else if (diffDays <= 14) {
            status = 'Next 2 weeks';
            statusColor = 'text-green-500 bg-green-50';
          } else if (diffDays <= 30) {
            status = 'Next month';
            statusColor = 'text-green-500 bg-green-50';
          } else {
            status = `in ${Math.floor(diffDays/30)} months`;
            statusColor = 'text-blue-500 bg-blue-50';
          }
          
          // Format date
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          });
          
          return {
            id: event.id,
            image: coverImage,
            event: event.name,
            date: formattedDate,
            status,
            statusColor,
            ticketsSold: `${ticketsSold}/${totalTickets}`,
            revenue: `$ ${revenue}`
          };
        });
        
        setSalesData(processedSales);
        
        // Calculate total stats
        let totalRevenue = 0;
        let totalTicketsSold = 0;
        let totalTickets = 0;
        
        events.forEach(event => {
          const ticketTier = event.ticket_tiers?.[0];
          const totalTicketsForEvent = ticketTier?.quantity || 0;
          const ticketsSoldForEvent = Math.floor(Math.random() * totalTicketsForEvent);
          
          totalTickets += totalTicketsForEvent;
          totalTicketsSold += ticketsSoldForEvent;
          totalRevenue += ticketsSoldForEvent * (ticketTier?.price || 0);
        });
        
        setEventStats({
          revenue: totalRevenue,
          ticketsSold: totalTicketsSold,
          totalTickets,
          shares: 0
        });
        
        // Fetch real ticket purchase data
        // Get all the event IDs to fetch purchases for
        const eventIds = events.map(event => event.id);
        
        if (eventIds.length > 0) {
          try {
            // First try to check if the tickets table exists and has basic fields
            const { data: ticketsData, error: ticketsError } = await supabase
              .from('tickets')
              .select(`
                id,
                event_id,
                ticket_tier_id,
                user_id,
                created_at,
                status,
                ticket_tiers (
                  price
                )
              `)
              .in('event_id', eventIds)
              .order('created_at', { ascending: false })
              .limit(5);
              
            if (ticketsError) {
              console.log('Tickets table not available yet:', ticketsError.message);
              setPurchasesData([]); // No purchases data yet
            } else if (ticketsData && ticketsData.length > 0) {
              // Process ticket data without requiring relationships
              const processedPurchases = await processTicketsData(ticketsData);
              setPurchasesData(processedPurchases);
            } else {
              // No tickets found
              setPurchasesData([]);
            }
          } catch (error) {
            console.error('Error in tickets handling:', error.message);
            setPurchasesData([]);
          }
        } else {
          // No events, so no purchases
          setPurchasesData([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        setError(error.message);
        setPurchasesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Process tickets data by fetching buyer info separately
    const processTicketsData = async (ticketsData) => {
      const processedPurchases = [];
      
      for (const ticket of ticketsData) {
        try {
          // Generate a random purchase name if we can't fetch the real buyer
          let buyerName = 'Anonymous User';
          let initials = 'AU';
          
          // Try to fetch buyer info if ticket has user_id
          if (ticket.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', ticket.user_id)
              .single();
              
            if (!userError && userData) {
              buyerName = `${userData.first_name} ${userData.last_name}`;
              initials = userData.first_name.charAt(0) + userData.last_name.charAt(0);
            }
          }
          
          const purchaseDate = new Date(ticket.created_at || new Date());
          const ticketPrice = ticket.ticket_tiers?.price || 0;
          
          processedPurchases.push({
            code: ticket.id ? `#${ticket.id.toString().slice(0, 8)}` : `#${Math.floor(10000000 + Math.random() * 90000000)}`,
            buyer: buyerName,
            initials: initials,
            date: purchaseDate.toLocaleDateString('en-US', { 
              month: '2-digit', 
              day: '2-digit', 
              year: 'numeric' 
            }),
            time: purchaseDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            ticketsSold: 1,
            totalPrice: `$${ticketPrice.toFixed(2)}`
          });
        } catch (err) {
          console.error('Error processing ticket:', err.message);
          // Skip this ticket and continue with others
        }
      }
      
      return processedPurchases;
    };
    
    fetchDashboardData();
  }, []);
  
  // Extract user information
  const firstName = userData?.first_name || 'User';
  const lastName = userData?.last_name || '';
  const email = userData?.email || '';
  const fullName = `${firstName} ${lastName}`.trim();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center">
            <div className="bg-pink-500 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span className="ml-3 text-xl font-semibold">Dashboard</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-pink-500 bg-pink-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <span className="ml-3">Dashboard</span>
          </Link>

          <Link href="/calendar" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="ml-3">Calendar</span>
          </Link>

          <Link href="/my-events" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="ml-3">My Events</span>
          </Link>

          <Link href="/revenue" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-3">Revenue</span>
          </Link>

          <Link href="/payment" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="ml-3">Payment</span>
          </Link>

          <Link href="/messages" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
            </div>
            <span className="ml-3">Messages</span>
          </Link>

          <Link href="/settings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="ml-3">Settings</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Account / Dashboard</div>
              <h1 className="text-2xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/create-event" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
                + Create event
              </Link>
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{fullName}</div>
                  <div className="text-xs text-gray-500">{email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-pink-500 text-2xl">$</div>
              </div>
              <div className="text-3xl font-bold text-pink-500">$ {eventStats.revenue.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Revenue</div>
            </div>

            {/* Tickets Sold Card */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{eventStats.ticketsSold}<span className="text-gray-400 text-xl">/{eventStats.totalTickets}</span></div>
              <div className="text-sm text-gray-500">Tickets Sold</div>
            </div>

            {/* Event Shares Card */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-yellow-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{eventStats.shares}</div>
              <div className="text-sm text-gray-500">Event Shares</div>
            </div>
          </div>

          {/* Sales by Event Section */}
          <div className="bg-white rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-medium">Sales by event</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">The last update: 10 minutes ago</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1"
                >
                  <option>Sort by: Sales</option>
                  <option>Sort by: Date</option>
                  <option>Sort by: Revenue</option>
                </select>
              </div>
            </div>

            {/* Sales Table */}
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-4">Event</th>
                  <th className="pb-4">Date of the event</th>
                  <th className="pb-4">Ticket sold</th>
                  <th className="pb-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesData.length > 0 ? (
                  salesData.map((sale) => (
                    <tr key={sale.id} className="border-t border-gray-100">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-gray-200 relative overflow-hidden">
                            <Image
                              src={sale.image}
                              alt={sale.event}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="font-medium text-gray-900">{sale.event}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="text-gray-900">{sale.date}</div>
                          <div className={`inline-block px-2 py-1 rounded-full text-xs ${sale.statusColor}`}>
                            {sale.status}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-900">{sale.ticketsSold}</td>
                      <td className="py-4 text-gray-900">{sale.revenue}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-gray-100">
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No events found. Create your first event to see sales data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Purchases Section */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <h2 className="text-lg font-medium">Recent purchases</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">The last update: 10 minutes ago</span>
                <button className="text-pink-500 text-sm hover:underline">
                  View all purchases
                </button>
              </div>
            </div>

            {/* Purchases Table */}
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-4">Code</th>
                  <th className="pb-4">Buyer</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Time</th>
                  <th className="pb-4">Ticket sold</th>
                  <th className="pb-4">Total price</th>
                </tr>
              </thead>
              <tbody>
                {purchasesData.length > 0 ? (
                  purchasesData.map((purchase, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="py-4">
                        <span className="text-blue-500 hover:underline cursor-pointer">
                          {purchase.code}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                            {purchase.initials}
                          </div>
                          <span>{purchase.buyer}</span>
                        </div>
                      </td>
                      <td className="py-4">{purchase.date}</td>
                      <td className="py-4">{purchase.time}</td>
                      <td className="py-4">{purchase.ticketsSold}</td>
                      <td className="py-4">{purchase.totalPrice}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-gray-100">
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No purchase data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
} 