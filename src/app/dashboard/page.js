'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock data for sales by event
const salesData = [
  {
    id: 1,
    image: '/rock.png',
    event: 'Rock Revolt: A Fusion of Power and Passion',
    date: 'Monday, June 10',
    status: 'in 5 days',
    statusColor: 'text-pink-500 bg-pink-50',
    ticketsSold: '100/300',
    revenue: '$ 234'
  },
  {
    id: 2,
    image: '/stage.png',
    event: 'Rock Fest Extravaganza',
    date: 'Tuesday, June 21',
    status: 'Next 2 weeks',
    statusColor: 'text-green-500 bg-green-50',
    ticketsSold: '200/300',
    revenue: '$ 1,390'
  },
  {
    id: 3,
    image: '/festival.png',
    event: 'A Legendary Gathering of Rock Icons',
    date: 'Friday, July 20',
    status: 'Next month',
    statusColor: 'text-green-500 bg-green-50',
    ticketsSold: '120/300',
    revenue: '$ 2,345'
  }
];

// Mock data for recent purchases
const purchasesData = [
  {
    code: '#238920483',
    buyer: 'Ashley Wilson',
    date: '11/18/2022',
    time: '11:25 PM',
    ticketsSold: 1,
    totalPrice: '$58'
  },
  {
    code: '#238920359',
    buyer: 'Anna Fernandez',
    date: '11/18/2022',
    time: '09:15 PM',
    ticketsSold: 2,
    totalPrice: '$68'
  },
  {
    code: '#238920459',
    buyer: 'Elizabeth Bailey',
    date: '11/18/2022',
    time: '03:55 AM',
    ticketsSold: 3,
    totalPrice: '$7'
  },
  {
    code: '#238920359',
    buyer: 'John Edwards',
    date: '11/18/2022',
    time: '03:09 AM',
    ticketsSold: 1,
    totalPrice: '$21'
  },
  {
    code: '#238920483',
    buyer: 'Jacob Jackson',
    date: '11/18/2022',
    time: '03:43 PM',
    ticketsSold: 2,
    totalPrice: '$81'
  }
];

function DashboardContent() {
  const [sortBy, setSortBy] = useState('Sales');
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  
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
  
  // Extract user information
  const firstName = userData?.first_name || 'User';
  const lastName = userData?.last_name || '';
  const email = userData?.email || '';
  const fullName = `${firstName} ${lastName}`.trim();

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

          <Link href="/teams" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="ml-3">Teams</span>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-medium">
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
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-pink-500 text-2xl">$</div>
              </div>
              <div className="text-3xl font-bold text-pink-500">$ 5,000</div>
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
              <div className="text-3xl font-bold text-gray-900">420<span className="text-gray-400 text-xl">/900</span></div>
              <div className="text-sm text-gray-500">Tickets Sold</div>
            </div>

            {/* Event Views Card */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">1,000</div>
              <div className="text-sm text-gray-500">Event Views</div>
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
              <div className="text-3xl font-bold text-gray-900">200</div>
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
                {salesData.map((sale) => (
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
                ))}
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
                {purchasesData.map((purchase, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-4">
                      <span className="text-blue-500 hover:underline cursor-pointer">
                        {purchase.code}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <span className="text-gray-900">{purchase.buyer}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-900">{purchase.date}</td>
                    <td className="py-4 text-gray-900">{purchase.time}</td>
                    <td className="py-4 text-gray-900">{purchase.ticketsSold}</td>
                    <td className="py-4 text-gray-900">{purchase.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-6">
              <button className="p-2 text-gray-500 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="px-3 py-1 text-pink-500 bg-pink-50 rounded">1</button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-900">2</button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-900">3</button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-900">4</button>
              <span className="text-gray-500">...</span>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-900">10</button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-900">11</button>
              <button className="p-2 text-gray-500 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
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