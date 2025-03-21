'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';

function RevenueContent() {
  const [timeframe, setTimeframe] = useState('monthly');
  const { user } = useAuth();
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: '$0.00',
    monthlyGrowth: '0%',
    averageTicketPrice: '$0.00',
    totalEvents: '0',
    paidEvents: '0',
    freeEvents: '0'
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user details from metadata
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : user?.email || 'User';
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
    : user?.email?.charAt(0) || 'U';
  
  // Fetch revenue data
  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true);
      try {
        if (!user) return;
        
        // Fetch events created by the current user
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            is_paid,
            status
          `)
          .eq('user_id', user.id);
          
        if (eventsError) throw eventsError;
        
        // Fetch tickets data for revenue calculation
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            id,
            event_id,
            ticket_tier_id,
            status,
            created_at,
            ticket_tiers(price)
          `)
          .in('event_id', eventsData.map(event => event.id))
          .eq('status', 'sold');
          
        if (ticketsError && !ticketsError.message.includes('does not exist')) {
          throw ticketsError;
        }
        
        // Calculate revenue stats
        const tickets = ticketsData || [];
        const totalRevenue = tickets.reduce((sum, ticket) => {
          return sum + (ticket.ticket_tiers?.price || 0);
        }, 0);
        
        // Count event types
        const totalEvents = eventsData.length;
        const paidEvents = eventsData.filter(event => event.is_paid).length;
        const freeEvents = totalEvents - paidEvents;
        
        // Calculate average ticket price
        const averageTicketPrice = tickets.length > 0 
          ? totalRevenue / tickets.length 
          : 0;
        
        // Format transactions for display
        const recentTransactions = [];
        
        if (tickets.length > 0) {
          // Group tickets by event and date
          const eventTickets = {};
          
          tickets.forEach(ticket => {
            const eventId = ticket.event_id;
            const dateKey = new Date(ticket.created_at).toISOString().split('T')[0];
            
            if (!eventTickets[eventId]) {
              eventTickets[eventId] = {};
            }
            
            if (!eventTickets[eventId][dateKey]) {
              eventTickets[eventId][dateKey] = {
                count: 0,
                amount: 0
              };
            }
            
            eventTickets[eventId][dateKey].count++;
            eventTickets[eventId][dateKey].amount += (ticket.ticket_tiers?.price || 0);
          });
          
          // Create transaction records
          Object.keys(eventTickets).forEach(eventId => {
            const event = eventsData.find(e => e.id === eventId);
            
            if (event) {
              Object.keys(eventTickets[eventId]).forEach(date => {
                const { count, amount } = eventTickets[eventId][date];
                
                recentTransactions.push({
                  event: event.name,
                  date: date,
                  amount: `$${amount.toFixed(2)}`,
                  ticketCount: count,
                  status: 'Completed'
                });
              });
            }
          });
        }
        
        // Sort transactions by date (most recent first)
        recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // If no real transactions, create demo transaction data
        if (recentTransactions.length === 0) {
          // Use events to create sample transactions if available
          if (eventsData.length > 0) {
            eventsData.slice(0, 3).forEach((event, index) => {
              const daysAgo = index + 1;
              const date = new Date();
              date.setDate(date.getDate() - daysAgo);
              
              recentTransactions.push({
                event: event.name,
                date: date.toISOString().split('T')[0],
                amount: '$0.00',
                ticketCount: 0,
                status: 'No Sales'
              });
            });
          }
        }
        
        // Update revenue stats
        setRevenueStats({
          totalRevenue: `$${totalRevenue.toFixed(2)}`,
          monthlyGrowth: '+0%', // Would need historical data for real calculation
          averageTicketPrice: `$${averageTicketPrice.toFixed(2)}`,
          totalEvents: totalEvents.toString(),
          paidEvents: paidEvents.toString(),
          freeEvents: freeEvents.toString()
        });
        
        setTransactions(recentTransactions);
      } catch (error) {
        console.error('Error fetching revenue data:', error.message);
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRevenueData();
  }, [user, timeframe]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Revenue</div>
              <h1 className="text-2xl font-semibold">Revenue Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-medium">{fullName}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : (
            <>
              {/* Timeframe selector */}
              <div className="mb-6">
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
                  {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimeframe(period)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        timeframe === period
                          ? 'bg-pink-500 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                  <div className="mt-2 flex items-baseline">
                    <p className="text-3xl font-semibold text-gray-900">{revenueStats.totalRevenue}</p>
                    <span className="ml-2 text-sm font-medium text-green-600">{revenueStats.monthlyGrowth}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium">Average Ticket Price</h3>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{revenueStats.averageTicketPrice}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{revenueStats.totalEvents}</p>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Paid: {revenueStats.paidEvents}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">Free: {revenueStats.freeEvents}</span>
                  </div>
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <h3 className="text-gray-900 text-lg font-medium mb-4">Revenue Trend</h3>
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Revenue visualization coming soon</p>
                </div>
              </div>

              {/* Recent transactions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-900 text-lg font-medium">Recent Transactions</h3>
                    <button className="text-sm text-pink-500 hover:text-pink-600">View All</button>
                  </div>
                </div>
                {transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No transactions found. Create events and sell tickets to see revenue data.</p>
                    <Link href="/create-event" className="mt-4 inline-block px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
                      Create Event
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.event}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.ticketCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                transaction.status === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : transaction.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RevenuePage() {
  return (
    <ProtectedRoute>
      <RevenueContent />
    </ProtectedRoute>
  );
} 