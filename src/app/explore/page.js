'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, location, selectedCategory, filterEvents]);

  const fetchEvents = useCallback(async () => {
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
          id,
          name,
          description,
          event_date,
          start_time,
          city,
          state,
          category,
          is_paid,
          status,
          created_at,
          event_images (
            image_url,
            is_cover
          ),
          ticket_tiers (
            price,
            is_active
          )
        `);

      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
        return;
      }

      if (!eventsData || eventsData.length === 0) {
        console.log('No events found');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
        return;
      }

      // Process events data
      const processedEvents = eventsData.map(event => {
        // Check if event_images is null or not an array
        const eventImages = Array.isArray(event.event_images) ? event.event_images : [];
        // Check if ticket_tiers is null or not an array
        const ticketTiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : [];
        
        // Default to placeholder if no cover image found
        const coverImage = eventImages.find(img => img?.is_cover)?.image_url || '/placeholder-event.jpg';
        
        let lowestPrice = 0;
        if (ticketTiers.length > 0) {
          const prices = ticketTiers
            .filter(tier => tier?.is_active)
            .map(tier => tier?.price || 0)
            .filter(price => price > 0);
          
          lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
        }

        // Check if event was created in the last 7 days
        const isNew = event.created_at && new Date(event.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          description: event.description || 'No description available',
          date: event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }) : 'Date TBA',
          time: event.start_time || 'Time TBA',
          location: `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
          price: lowestPrice,
          category: event.category || 'General',
          image: coverImage,
          isFree: lowestPrice === 0,
          isNew: isNew,
          rawDate: event.event_date // For sorting
        };
      });

      console.log(`Processed ${processedEvents.length} events`);
      setEvents(processedEvents);
      setFilteredEvents(processedEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

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
          event.name?.toLowerCase().includes(query) || 
          event.description?.toLowerCase().includes(query) ||
          event.city?.toLowerCase().includes(query) ||
          event.state?.toLowerCase().includes(query)
      );
    }

    // Filter by location
    if (location) {
      const locationQuery = location.toLowerCase();
      filtered = filtered.filter(
        event => 
          event.city?.toLowerCase().includes(locationQuery) || 
          event.state?.toLowerCase().includes(locationQuery)
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Main content with bottom padding to prevent footer overlap */}
      <div className="flex-grow pb-16">
        {/* Search Header */}
        <div className="max-w-6xl mx-auto px-4 w-full pt-8 pb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">
            Search Event
          </h1>
          
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 w-[220px]"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 w-[220px]"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : error ? (
          <div className="max-w-6xl mx-auto px-4 py-10 text-center">
            <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
              <button 
                onClick={fetchEvents}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 w-full">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Filters Sidebar */}
              <div className="w-full md:w-[240px] flex-shrink-0 mb-8 md:mb-0">
                <div className="pr-0 md:pr-6">
                  <div className="mb-8">
                    <h2 className="text-base font-medium text-gray-900 mb-3">Category</h2>
                    <div className="space-y-2">
                      {['All', 'Music', 'Sports', 'Arts', 'Business', 'Photography', 'Food', 'Technology', 'Health'].map((category) => (
                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === category}
                            onChange={() => setSelectedCategory(category)}
                            className="w-4 h-4 text-pink-500 border-gray-300 focus:ring-pink-500"
                          />
                          <span className={`text-sm ${selectedCategory === category ? 'text-pink-500' : 'text-gray-600'}`}>
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-base font-medium text-gray-900 mb-3">Pricing</h2>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" />
                        <span className="text-sm text-gray-600">Free</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" />
                        <span className="text-sm text-gray-600">Paid</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleClearFilters}
                      className="text-sm text-pink-500"
                    >
                      Clear all
                    </button>
                    <button 
                      onClick={handleApplyFilters}
                      className="text-sm text-white bg-gray-600 px-4 py-1 rounded"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Listings */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-sm text-gray-600">
                    {filteredEvents.length} results
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="text-sm text-gray-600 flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-lg"
                      onClick={() => {
                        const sorted = [...filteredEvents].sort((a, b) => {
                          if (!a.rawDate) return 1;
                          if (!b.rawDate) return -1;
                          return new Date(a.rawDate) - new Date(b.rawDate);
                        });
                        setFilteredEvents(sorted);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date
                    </button>
                    <button 
                      className="text-sm text-gray-600 flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-lg"
                      onClick={() => {
                        const sorted = [...filteredEvents].sort((a, b) => a.price - b.price);
                        setFilteredEvents(sorted);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Price
                    </button>
                  </div>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No events found matching your criteria.</p>
                    <button 
                      onClick={handleClearFilters}
                      className="mt-4 text-pink-500 font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 mb-12">
                    {filteredEvents.map((event) => (
                      <Link 
                        href={`/events/${event.id}`}
                        key={event.id}
                        className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-[280px] h-48 relative">
                            <Image
                              src={event.image}
                              alt={event.title}
                              fill
                              className="object-cover"
                              unoptimized={event.image.startsWith('http')}
                            />
                            <button className="absolute top-2 right-2 z-10 text-white hover:text-pink-400 transition-colors">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-center gap-2 text-pink-500 mb-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm">{event.date} | {event.time}</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span className="text-sm">{event.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-pink-500 text-sm">
                                {event.isFree ? 'Free Ticket' : `From ₦${event.price.toLocaleString()}`}
                              </div>
                              {event.isNew && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                  New Event
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}