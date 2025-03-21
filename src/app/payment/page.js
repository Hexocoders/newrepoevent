'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

function PaymentContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: '$0.00',
    pendingPayments: '$0.00',
    successfulPayments: 0,
    refundedAmount: '$0.00'
  });
  const [error, setError] = useState(null);

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch payment methods
      const { data: methodsData, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id);

      if (methodsError) throw methodsError;
      
      setPaymentMethods(methodsData || []);

      // Fetch tickets (transactions) for the user's events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          name,
          event_date
        `)
        .eq('user_id', user.id);

      if (eventsError) throw eventsError;

      if (eventsData && eventsData.length > 0) {
        // Get all event IDs
        const eventIds = eventsData.map(event => event.id);
        
        // Fetch tickets for these events
        let query = supabase
          .from('tickets')
          .select(`
            id,
            event_id,
            user_id,
            created_at,
            status,
            ticket_tiers(price)
          `)
          .in('event_id', eventIds);
        
        // Apply status filter if needed
        if (selectedStatus !== 'all') {
          query = query.eq('status', selectedStatus);
        }
        
        // Apply date filter if needed
        if (dateRange !== 'all') {
          const now = new Date();
          let startDate = new Date();
          
          switch(dateRange) {
            case 'today':
              startDate.setHours(0, 0, 0, 0);
              break;
            case 'week':
              startDate.setDate(now.getDate() - 7);
              break;
            case 'month':
              startDate.setMonth(now.getMonth() - 1);
              break;
            case 'year':
              startDate.setFullYear(now.getFullYear() - 1);
              break;
          }
          
          query = query.gte('created_at', startDate.toISOString());
        }
        
        const { data: ticketsData, error: ticketsError } = await query;
        
        if (ticketsError) throw ticketsError;
        
        // Process ticket data
        const processedTransactions = [];
        let totalRevenue = 0;
        let pendingAmount = 0;
        let successfulCount = 0;
        let refundedAmount = 0;
        
        if (ticketsData && ticketsData.length > 0) {
          // Fetch users info for these tickets
          const userIds = [...new Set(ticketsData.map(ticket => ticket.user_id))];
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
            
          if (usersError) throw usersError;
          
          // Create a map of users for easy lookup
          const usersMap = {};
          if (usersData) {
            usersData.forEach(user => {
              usersMap[user.id] = user;
            });
          }
          
          // Create a map of events for easy lookup
          const eventsMap = {};
          eventsData.forEach(event => {
            eventsMap[event.id] = event;
          });
          
          // Process tickets into transactions
          ticketsData.forEach(ticket => {
            const event = eventsMap[ticket.event_id];
            const buyer = usersMap[ticket.user_id] || { full_name: 'Unknown', email: 'unknown@example.com' };
            const price = ticket.ticket_tiers?.price || 0;
            
            // Calculate stats
            if (ticket.status === 'completed') {
              totalRevenue += price;
              successfulCount++;
            } else if (ticket.status === 'pending') {
              pendingAmount += price;
            } else if (ticket.status === 'refunded') {
              refundedAmount += price;
            }
            
            processedTransactions.push({
              id: ticket.id,
              eventName: event?.name || 'Unknown Event',
              amount: `$${price.toFixed(2)}`,
              status: ticket.status || 'Pending',
              date: new Date(ticket.created_at).toISOString().split('T')[0],
              paymentMethod: 'Credit Card',
              customer: buyer.full_name,
              email: buyer.email
            });
          });
        }
        
        // Update stats
        setPaymentStats({
          totalRevenue: `$${totalRevenue.toFixed(2)}`,
          pendingPayments: `$${pendingAmount.toFixed(2)}`,
          successfulPayments: successfulCount,
          refundedAmount: `$${refundedAmount.toFixed(2)}`
        });
        
        // Sort transactions by date, newest first
        processedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setTransactions(processedTransactions);
      } else {
        // No events found
        setTransactions([]);
        setPaymentStats({
          totalRevenue: '$0.00',
          pendingPayments: '$0.00',
          successfulPayments: 0,
          refundedAmount: '$0.00'
        });
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError('Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedStatus, dateRange]);

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user, fetchPaymentData]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRequestPayment = () => {
    if (paymentMethods.length === 0) {
      router.push('/add-payment');
    } else {
      // Show confirmation dialog for payment request
      if (confirm('Your payment request will be processed within 72 hours. Do you want to proceed?')) {
        alert('Payment request submitted. You will receive an email confirmation shortly.');
      }
    }
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex justify-between items-center px-8 py-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Payments</div>
            <h1 className="text-2xl font-semibold">Payment History</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/add-payment')} 
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              + Add Payment Method
            </button>
            <button 
              onClick={handleRequestPayment}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Request Payment
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="text-sm font-medium">{user?.user_metadata?.full_name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-semibold">{paymentStats.totalRevenue}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Payments</p>
                    <p className="text-2xl font-semibold">{paymentStats.pendingPayments}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Successful Payments</p>
                    <p className="text-2xl font-semibold">{paymentStats.successfulPayments}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Refunded Amount</p>
                    <p className="text-2xl font-semibold">{paymentStats.refundedAmount}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                <button className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
                  Export CSV
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">Your Payment Methods</h2>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">{method.bank_name}</p>
                        <p className="text-sm text-gray-500">
                          {method.account_type.charAt(0).toUpperCase() + method.account_type.slice(1)} •••• 
                          {method.account_number.slice(-4)}
                        </p>
                        {method.is_default && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                            Default
                          </span>
                        )}
                      </div>
                      <button className="text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium">Payment History</h2>
              </div>
              
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{payment.eventName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{payment.customer}</div>
                            <div className="text-sm text-gray-500">{payment.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{payment.amount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-gray-400 hover:text-gray-900">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 mb-4">No payment history found</p>
                  <button 
                    onClick={() => router.push('/create-event')} 
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                  >
                    Create an Event
                  </button>
                </div>
              )}
            </div>
            
            {/* Processing Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Payment Processing Notice</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Please note that when you request a payment:</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>Payments typically take 72 hours to process</li>
                      <li>You will receive a confirmation email once the payment is initiated</li>
                      <li>You can track the payment status in your payment history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Payment() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <ProtectedRoute>
        <PaymentContent />
      </ProtectedRoute>
    </div>
  );
} 