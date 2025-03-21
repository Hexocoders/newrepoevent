'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';

export default function UpcomingEvents() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          description,
          event_date,
          start_time,
          city,
          state,
          category,
          created_at,
          event_images (
            image_url,
            is_cover
          ),
          ticket_tiers (
            price
          )
        `);

      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events');
        return;
      }

      // Process events data
      const processedEvents = eventsData.map(event => {
        // Get cover image or use placeholder
        const coverImage = event.event_images?.find(img => img?.is_cover)?.image_url || '/placeholder-event.jpg';
        
        // Get lowest price
        let lowestPrice = 0;
        if (event.ticket_tiers && event.ticket_tiers.length > 0) {
          const prices = event.ticket_tiers.map(tier => tier.price).filter(price => price > 0);
          lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
        }
        
        // Determine time frame (for filtering purposes only)
        const eventDate = new Date(event.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        let timeFrame = 'all';
        if (eventDate.toDateString() === today.toDateString()) {
          timeFrame = 'today';
        } else if (eventDate.toDateString() === tomorrow.toDateString()) {
          timeFrame = 'tomorrow';
        } else if (eventDate > today && eventDate <= nextWeek) {
          timeFrame = 'thisWeek';
        } else if (eventDate > nextWeek && eventDate <= nextMonth) {
          timeFrame = 'thisMonth';
        }
        
        // Just for UI purposes - not for limiting display
        const isFeatured = event.created_at && new Date(event.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          description: event.description,
          date: event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : 'Date TBA',
          time: event.start_time || 'Time TBA',
          location: `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
          price: lowestPrice === 0 ? "Free" : `From ₦${lowestPrice.toLocaleString()}`,
          category: event.category || 'General',
          image: coverImage,
          timeFrame: timeFrame,
          featured: isFeatured
        };
      });

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events based on selected filter and search query, but if filter is 'all', show everything
  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.timeFrame === filter;
    const matchesSearch = searchQuery === '' || 
                          event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Upcoming Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-teal-600/70"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Upcoming Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-blue-100 max-w-2xl text-lg"
          >
            Discover and plan for the most anticipated events coming your way
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Events</FilterButton>
            <FilterButton active={filter === 'today'} onClick={() => setFilter('today')}>Today</FilterButton>
            <FilterButton active={filter === 'tomorrow'} onClick={() => setFilter('tomorrow')}>Tomorrow</FilterButton>
            <FilterButton active={filter === 'thisWeek'} onClick={() => setFilter('thisWeek')}>This Week</FilterButton>
            <FilterButton active={filter === 'thisMonth'} onClick={() => setFilter('thisMonth')}>This Month</FilterButton>
          </div>
          
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search events or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-800 mb-2">{error}</h3>
            <button 
              onClick={fetchEvents}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredEvents.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No events found</h3>
                <p className="text-gray-500">Try adjusting your search or filter to find what you&apos;re looking for.</p>
              </div>
            )}
          </>
        )}
        
        {/* Newsletter Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl overflow-hidden shadow-xl">
          <div className="relative p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Never Miss an Event</h3>
                <p className="text-blue-100 max-w-md">
                  Subscribe to our newsletter and be the first to know about upcoming events, exclusive offers, and more.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[250px]"
                  />
                  <button className="bg-white text-blue-600 font-medium px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Filter Button Component
function FilterButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-md' 
          : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      {children}
    </button>
  );
}

// Event Card Component
function EventCard({ event }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-48">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-800">
          {event.category}
        </div>
        {event.featured && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white px-3 py-1 rounded-full text-xs font-medium">
            Featured
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center text-sm text-blue-500 font-medium mb-2">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getTimeFrameColor(event.timeFrame)}`}></span>
          {getTimeFrameLabel(event.timeFrame)}
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">{event.title}</h3>
        <div className="flex items-center text-gray-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">{event.date}</p>
        </div>
        <div className="flex items-center text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">{event.location}</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-blue-600 font-bold">{event.price}</p>
          <Link 
            href={`/events/${event.id}`}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-lg text-sm hover:from-blue-600 hover:to-teal-500 transition-colors"
          >
            Get Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getTimeFrameLabel(timeFrame) {
  switch(timeFrame) {
    case 'today': return 'Today';
    case 'tomorrow': return 'Tomorrow';
    case 'thisWeek': return 'This Week';
    case 'thisMonth': return 'This Month';
    default: return 'Upcoming';
  }
}

function getTimeFrameColor(timeFrame) {
  switch(timeFrame) {
    case 'today': return 'bg-red-500';
    case 'tomorrow': return 'bg-orange-500';
    case 'thisWeek': return 'bg-blue-500';
    case 'thisMonth': return 'bg-teal-500';
    default: return 'bg-gray-500';
  }
} 