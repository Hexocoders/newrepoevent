'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';

// Error boundary component
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Add global error handler
    const errorHandler = (error) => {
      console.error('Caught runtime error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We're sorry, but there was an error loading this page. Please try refreshing or come back later.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return children;
}

function ExploreContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // Mark when we're in client side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchEvents();
    }
  }, [isClient]);

  const fetchEvents = useCallback(async () => {
    // Skip server-side execution
    if (typeof window === 'undefined') return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        setError('Database connection error. Please try again later.');
        setLoading(false);
        return;
      }
      
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          event_images (*),
          ticket_tiers (*)
        `)
        .eq('status', 'published');
      
      if (error) {
        throw error;
      }
      
      if (!eventsData || !Array.isArray(eventsData)) {
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
        return;
      }
      
      // Map the events data to include needed fields
      const processedEvents = eventsData.map(event => {
        // Find cover image
        const coverImage = event.event_images && Array.isArray(event.event_images) 
          ? event.event_images.find(img => img.is_cover)?.image_url 
          : null;
        
        // Find lowest price
        let lowestPrice = null;
        if (event.ticket_tiers && Array.isArray(event.ticket_tiers) && event.ticket_tiers.length > 0) {
          const prices = event.ticket_tiers
            .filter(tier => tier.price !== null && !isNaN(tier.price))
            .map(tier => tier.price);
          
          if (prices.length > 0) {
            lowestPrice = Math.min(...prices);
          }
        }
        
        return {
          id: event.id,
          title: event.name || 'Unnamed Event',
          description: event.description || '',
          date: event.event_date || '',
          time: event.start_time || '',
          location: `${event.city || ''}, ${event.state || ''}`,
          image: coverImage || '/placeholder-event.jpg',
          price: lowestPrice !== null ? `$${lowestPrice.toFixed(2)}` : 'Free',
          category: event.category || 'Other'
        };
      });
      
      setEvents(processedEvents);
      setFilteredEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      filterEvents();
    }
  }, [events, searchQuery, location, selectedCategory]);

  const filterEvents = useCallback(() => {
    // If there are no events yet, don't filter
    if (!events || events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    let filtered = [...events];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        event => 
          event.title?.toLowerCase().includes(query) || 
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
      );
    }

    // Filter by location
    if (location) {
      const locationQuery = location.toLowerCase();
      filtered = filtered.filter(
        event => 
          event.location?.toLowerCase().includes(locationQuery)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(
        event => event.category === selectedCategory
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, location, selectedCategory]);

  const handleApplyFilters = () => {
    filterEvents();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setSelectedCategory('All');
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 mb-16">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-purple-900 to-pink-600 rounded-xl p-8 md:p-12 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Explore Amazing Events</h1>
            <p className="text-lg mb-6 max-w-2xl">Discover and attend the most exciting events happening around you. Find something for everyone!</p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="md:w-1/4">
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <button
                onClick={filterEvents}
                className="px-6 py-3 bg-white text-pink-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Find Events
              </button>
            </div>
          </div>
        </section>
        
        {/* Category Filters */}
        <section className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'All'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } transition-colors whitespace-nowrap`}
            >
              All Events
            </button>
            <button
              onClick={() => setSelectedCategory('Music')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'Music'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } transition-colors whitespace-nowrap`}
            >
              🎵 Music
            </button>
            <button
              onClick={() => setSelectedCategory('Sports')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'Sports'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } transition-colors whitespace-nowrap`}
            >
              🏆 Sports
            </button>
            <button
              onClick={() => setSelectedCategory('Food')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'Food'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } transition-colors whitespace-nowrap`}
            >
              🍽️ Food
            </button>
            <button
              onClick={() => setSelectedCategory('Technology')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'Technology'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } transition-colors whitespace-nowrap`}
            >
              💻 Technology
            </button>
            <button
              onClick={() => setSelectedCategory('Business')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'Business'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } transition-colors whitespace-nowrap`}
            >
              💼 Business
            </button>
          </div>
        </section>
        
        {/* Event Cards */}
        <section className="mb-12">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
              <button 
                onClick={fetchEvents} 
                className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No events found</h2>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters to find more events.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setLocation('');
                  setSelectedCategory('All');
                }} 
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 z-10">
              {filteredEvents.map((event) => (
                <Link 
                  href={`/events/${event.id}`} 
                  key={event.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow z-10"
                >
                  <div className="relative h-48">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover"
                      unoptimized={!event.image.startsWith('/')}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{event.date}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.time}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.location}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-pink-600">{event.price}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">{event.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

// Main component with error boundary
export default function ExplorePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <div className="flex-grow flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
          <Footer />
        </div>
      }>
        <ExploreContent />
      </Suspense>
    </ErrorBoundary>
  );
}