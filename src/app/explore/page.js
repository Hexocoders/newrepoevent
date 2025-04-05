'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';
import TicketModal from '../../components/TicketModal';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [priceFilter, setPriceFilter] = useState({ free: false, paid: false });

  // Preview modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

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
            id,
            name,
            price,
            quantity,
            quantity_sold,
            paid_quantity_sold,
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
        let totalTickets = 0;
        let isSoldOut = false;
        
        if (ticketTiers.length > 0) {
          const prices = ticketTiers
            .filter(tier => tier?.is_active)
            .map(tier => tier?.price || 0)
            .filter(price => price > 0);
          
          lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
          
          if (lowestPrice > 0) {
            // For paid tickets
            totalTickets = ticketTiers
              .filter(tier => tier?.price > 0)
              .reduce((sum, tier) => sum + (tier?.quantity - (tier?.paid_quantity_sold || 0)), 0);
            
            // Check if all paid tickets are sold out
            isSoldOut = ticketTiers
              .filter(tier => tier?.price > 0)
              .every(tier => tier?.quantity <= (tier?.paid_quantity_sold || 0));
          } else {
            // For free tickets
            totalTickets = ticketTiers
              .filter(tier => tier?.price === 0)
              .reduce((sum, tier) => sum + (tier?.quantity - (tier?.quantity_sold || 0)), 0);
            
            // Check if all free tickets are sold out
            isSoldOut = ticketTiers
              .filter(tier => tier?.price === 0)
              .every(tier => tier?.quantity <= (tier?.quantity_sold || 0));
          }
        }

        // Check if event was created in the last 7 days
        const isNew = event.created_at && new Date(event.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Normalize and validate the category
        const validCategories = ['Music', 'Sports', 'Arts', 'Business', 'Photography', 'Food', 'Technology', 'Health'];
        let normalizedCategory = event.category;
        
        // Ensure the category exists and is properly capitalized
        if (normalizedCategory) {
          // Normalize case for comparison
          const categoryLower = normalizedCategory.toLowerCase();
          
          // Try to find a matching category from our valid list
          const matchedCategory = validCategories.find(c => c.toLowerCase() === categoryLower);
          
          if (matchedCategory) {
            normalizedCategory = matchedCategory; // Use the properly cased version
          }
        } else {
          normalizedCategory = 'General'; // Default category
        }
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          description: event.description || 'No description available',
          date: event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }) : 'Date TBA',
          eventDate: event.event_date ? new Date(event.event_date) : null,
          time: event.start_time || 'Time TBA',
          location: `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
          price: isSoldOut ? 'Sold Out' : lowestPrice === 0 ? 'Free' : `₦${lowestPrice.toLocaleString()}`,
          numericPrice: lowestPrice,
          category: normalizedCategory,
          image: coverImage,
          isFree: lowestPrice === 0,
          isNew: isNew,
          rawDate: event.event_date, // For sorting
          ticketCount: isSoldOut ? 'No available ticket for this event' : totalTickets,
          ticket_tiers: event.ticket_tiers
        };
      });

      console.log(`Processed ${processedEvents.length} events`);
      
      // Log categories found
      const categories = processedEvents.map(event => event.category);
      const uniqueCategories = [...new Set(categories)];
      console.log('Categories found in data:', uniqueCategories);
      
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

    console.log('Filtering events with:');
    console.log('- Category:', selectedCategory);
    console.log('- Price filters:', priceFilter);
    console.log('- Search:', searchQuery);
    console.log('- Location:', location);

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
        event => event.location?.toLowerCase().includes(locationQuery)
      );
    }

    // Filter by category - only apply if not 'All'
    if (selectedCategory && selectedCategory !== 'All') {
      console.log('Filtering by category:', selectedCategory);
      // Log available categories before filtering
      const availableCategories = [...new Set(events.map(event => event.category))];
      console.log('Available categories in data:', availableCategories);
      
      // Remove excessive logging of each event
      filtered = filtered.filter(event => event.category === selectedCategory);
      
      console.log(`Found ${filtered.length} events matching category "${selectedCategory}"`);
    }

    // Filter by price
    if (priceFilter.free && !priceFilter.paid) {
      // Only free events
      filtered = filtered.filter(event => event.isFree);
      console.log('Filtering for FREE events only');
    } else if (!priceFilter.free && priceFilter.paid) {
      // Only paid events
      filtered = filtered.filter(event => !event.isFree);
      console.log('Filtering for PAID events only');
    }
    // If both or neither are selected, don't filter by price

    // Sort events
    if (sortBy === 'date') {
      filtered.sort((a, b) => {
        if (!a.rawDate) return 1;
        if (!b.rawDate) return -1;
        return new Date(a.rawDate) - new Date(b.rawDate);
      });
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.numericPrice - b.numericPrice);
    }

    console.log(`Found ${filtered.length} matching events total after all filters`);
    setFilteredEvents(filtered);
  }, [events, searchQuery, location, selectedCategory, priceFilter, sortBy]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  const handleApplyFilters = () => {
    filterEvents();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setSelectedCategory('All');
    setPriceFilter({ free: false, paid: false });
  };

  const togglePriceFilter = (type) => {
    console.log('Toggling price filter:', type);
    setPriceFilter(prev => {
      const newFilters = { ...prev, [type]: !prev[type] };
      console.log('New price filters:', newFilters);
      return newFilters;
    });
  };

  // Function to handle event card click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Function to handle "Get Tickets" button click
  const handleGetTickets = (event, e) => {
    if (e) {
      e.preventDefault(); // Prevent default link behavior
      e.stopPropagation(); // Stop event bubbling
    }
    
    setSelectedEvent(event);
    closeModal(); // Close the preview modal if it's open
    setShowTicketModal(true);
  };

  // Function to close the ticket modal
  const closeTicketModal = () => {
    setShowTicketModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-amber-50">
      <Navbar />

      {/* Main content with bottom padding to prevent footer overlap */}
      <div className="flex-grow pb-16">
        {/* Hero Search Section */}
        <div className="bg-gradient-to-r from-amber-900 to-orange-600 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-4xl font-bold mb-6 tracking-tight">
              Discover Amazing Events
            </h1>
            <p className="text-lg text-amber-100 mb-10 max-w-2xl">
              Find events that match your interests, connect with like-minded people, and create unforgettable memories.
            </p>
            
            {/* Enhanced Search Area */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-amber-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-100/50 text-white placeholder-amber-100/70 transition-all border border-white/10"
                  />
                </div>
                <div className="md:w-64 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-amber-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-100/50 text-white placeholder-amber-100/70 transition-all border border-white/10"
                  />
                </div>
                <button 
                  onClick={handleApplyFilters}
                  className="px-6 py-3 bg-white text-amber-600 font-medium rounded-lg hover:bg-white/90 transition-all shadow-md flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto px-4 w-full -mt-8">
          {loading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-lg py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
                <p className="text-gray-500">Finding amazing events for you...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
              <button 
                onClick={fetchEvents}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 mt-8">
              {/* Enhanced Filters Sidebar */}
              <div className="w-full md:w-[280px] flex-shrink-0 mb-8 md:mb-0">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">Filters</h2>
                  
                  <div className="mb-8">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-medium">Category</h3>
                    <div className="space-y-2.5">
                      {['All', 'Music', 'Sports', 'Arts', 'Business', 'Photography', 'Food', 'Technology', 'Health'].map((category) => (
                        <label key={category} className="flex items-center gap-3 cursor-pointer group">
                          <span 
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${selectedCategory === category ? 'bg-amber-500' : 'border border-gray-300 group-hover:border-amber-500'}`}
                            onClick={() => {
                              setSelectedCategory(category);
                              setTimeout(() => filterEvents(), 0);
                            }}
                          >
                            {selectedCategory === category && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span 
                            className={`text-base transition-colors ${selectedCategory === category ? 'text-amber-600 font-medium' : 'text-gray-600 group-hover:text-amber-600'}`}
                            onClick={() => {
                              setSelectedCategory(category);
                              setTimeout(() => filterEvents(), 0);
                            }}
                          >
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-medium">Price</h3>
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <span 
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${priceFilter.free ? 'bg-amber-500' : 'border border-gray-300 group-hover:border-amber-500'}`}
                          onClick={() => {
                            togglePriceFilter('free');
                            setTimeout(() => filterEvents(), 0);
                          }}
                        >
                          {priceFilter.free && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span 
                          className={`text-base transition-colors ${priceFilter.free ? 'text-amber-600 font-medium' : 'text-gray-600 group-hover:text-amber-600'}`}
                          onClick={() => {
                            togglePriceFilter('free');
                            setTimeout(() => filterEvents(), 0);
                          }}
                        >
                          Free
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <span 
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${priceFilter.paid ? 'bg-amber-500' : 'border border-gray-300 group-hover:border-amber-500'}`}
                          onClick={() => {
                            togglePriceFilter('paid');
                            setTimeout(() => filterEvents(), 0);
                          }}
                        >
                          {priceFilter.paid && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span 
                          className={`text-base transition-colors ${priceFilter.paid ? 'text-amber-600 font-medium' : 'text-gray-600 group-hover:text-amber-600'}`}
                          onClick={() => {
                            togglePriceFilter('paid');
                            setTimeout(() => filterEvents(), 0);
                          }}
                        >
                          Paid
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleApplyFilters}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-lg hover:from-amber-600 hover:to-orange-500 transition-colors font-medium"
                    >
                      Apply Filters
                    </button>
                    <button 
                      onClick={() => {
                        handleClearFilters();
                        setTimeout(() => filterEvents(), 0);
                      }}
                      className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Event Listings */}
              <div className="flex-1">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="text-gray-700">
                      <span className="font-semibold text-amber-600">{filteredEvents.length}</span> events found
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Sort by:</span>
                      <button 
                        className={`text-sm px-3 py-1.5 rounded-md transition-all ${sortBy === 'date' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setSortBy('date')}
                      >
                        Date
                      </button>
                      <button 
                        className={`text-sm px-3 py-1.5 rounded-md transition-all ${sortBy === 'price' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setSortBy('price')}
                      >
                        Price
                      </button>
                    </div>
                  </div>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-500 mb-4">We couldn't find any events matching your criteria.</p>
                    <button 
                      onClick={handleClearFilters}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {filteredEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        {...event} 
                        onClick={() => handleEventClick(event)}
                        onGetTickets={(e) => handleGetTickets(event, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animated Shine Black Section */}
      <div className="max-w-6xl mx-auto px-4 w-full mb-12">
        {/* Inline style for shine animation */}
        <style jsx global>{`
          @keyframes shine {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(200%);
            }
          }
          .animate-shine {
            animation: shine 3s infinite linear;
          }
        `}</style>

        <div className="bg-black rounded-2xl overflow-hidden shadow-xl relative">
          {/* Animated shine effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-30 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Find Your Perfect Event Experience</h3>
                <p className="text-white/80 max-w-md">
                  From intimate concerts to massive festivals, business conferences to casual meetups—explore events that match your interests and expand your horizons.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <div className="relative h-48 w-full md:w-64 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                    alt="Explore events"
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Preview Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Close button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col md:flex-row h-full">
              {/* Event Image */}
              <div className="relative md:w-1/2 h-64 md:h-auto">
                <Image
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                
                {/* Category tag */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-amber-900 shadow-sm">
                  {selectedEvent.category || "Event"}
                </div>
              </div>
              
              {/* Event Details */}
              <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto max-h-[70vh] md:max-h-[90vh]">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-900 mb-4">{selectedEvent.title}</h2>
                
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Date</p>
                      <p className="text-gray-600">{selectedEvent.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Time</p>
                      <p className="text-gray-600">{selectedEvent.time || "TBA"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Location</p>
                      <p className="text-gray-600">{selectedEvent.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-amber-50 rounded-full p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Price</p>
                      <p className="text-amber-600 font-bold">{selectedEvent.price}</p>
                      {selectedEvent.price !== 'Free' && selectedEvent.price !== 'Sold Out' && (
                        <p className="text-xs text-gray-500">{selectedEvent.ticketCount} tickets available</p>
                      )}
                      {selectedEvent.price === 'Free' && selectedEvent.ticketCount !== 'No available ticket for this event' && (
                        <p className="text-xs text-gray-500">{selectedEvent.ticketCount} free tickets available</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">About This Event</h3>
                  <p className="text-gray-600">
                    {selectedEvent.description || "Join us for an amazing event experience. More details will be provided soon!"}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <Link href="/my-tickets" className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors">
                    My Tickets
                  </Link>
                  <button 
                    onClick={(e) => handleGetTickets(selectedEvent, e)}
                    disabled={selectedEvent.ticketCount === 'No available ticket for this event'}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedEvent.ticketCount === 'No available ticket for this event'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {selectedEvent.ticketCount === 'No available ticket for this event' ? 'Sold Out' : 'Get Tickets'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      <TicketModal
        event={selectedEvent}
        isOpen={showTicketModal}
        onClose={closeTicketModal}
      />

      <Footer />
    </div>
  );
}

// Event Card Component
function EventCard({ id, title, image, date, location, price, ticketCount, onClick, onGetTickets }) {
  const isSoldOut = ticketCount === 'No available ticket for this event';
  
  return (
    <div onClick={onClick} className="group bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
      <div className="relative h-48">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{title}</h3>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {date}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">Starting from</span>
            <p className="text-gray-900 font-medium">{price}</p>
            {price !== 'Free' && price !== 'Sold Out' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} available</span>
            )}
            {price === 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} free tickets available</span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the card's onClick
              onGetTickets(e);
            }}
            disabled={isSoldOut}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              isSoldOut 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isSoldOut ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Trending Event Card Component
function TrendingEventCard({ id, title, image, date, location, price, category = "Trending", rating = 4.5, reviews = 27, ticketCount, onClick, onGetTickets }) {
  const isSoldOut = ticketCount === 'No available ticket for this event';
  
  return (
    <div onClick={onClick} className="group flex flex-col md:flex-row bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
      <div className="relative md:w-2/5 h-64 md:h-auto">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-4 left-4">
          <div className="bg-white px-3 py-1 text-xs font-medium text-gray-700">
          {category}
          </div>
        </div>
      </div>
      <div className="p-6 md:w-3/5 flex flex-col justify-between">
        <div>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <div className="flex text-gray-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-gray-900' : 'text-gray-300'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600">{rating} ({reviews} reviews)</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 line-clamp-2">{title}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
              {date}
          </div>
            <div className="flex items-center text-gray-600 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
              {location}
          </div>
        </div>
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">Starting from</span>
            <p className="text-gray-900 font-medium">{price}</p>
            {price !== 'Free' && price !== 'Sold Out' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} tickets available</span>
            )}
            {price === 'Free' && ticketCount !== 'No available ticket for this event' && (
              <span className="text-xs text-gray-500">{ticketCount} free tickets available</span>
            )}
          </div>
          <button 
            onClick={onGetTickets}
            disabled={isSoldOut}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              isSoldOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isSoldOut ? 'Sold Out' : 'Get Tickets'}
            {!isSoldOut && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}