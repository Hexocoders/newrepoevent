'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedExactCategory, setSelectedExactCategory] = useState(null);

  // Initial featured categories state definition
  const [featuredCategories, setFeaturedCategories] = useState([
    {
      id: 1,
      name: "Music",
      slug: "music",
      icon: "🎵",
      image: "/music-category.jpg",
      eventCount: "0",
      exactCategory: "music"
    },
    {
      id: 2,
      name: "Sports",
      slug: "sports",
      icon: "🏆",
      image: "/sports-category.jpg",
      eventCount: "0",
      exactCategory: "sports"
    },
    {
      id: 3,
      name: "Food",
      slug: "food",
      icon: "🍽️",
      image: "/food-category.jpg",
      eventCount: "0",
      exactCategory: "food"
    },
    {
      id: 4,
      name: "Technology",
      slug: "technology",
      icon: "💻",
      image: "/tech-category.jpg",
      eventCount: "0",
      exactCategory: "technology"
    }
  ]);

  // Fetch events on component mount
  useEffect(() => {
    console.log('Categories component mounted, fetching events...');
    fetchEvents();
  }, [fetchEvents]);

  // Filter events when activeCategory, selectedExactCategory or searchQuery changes
  useEffect(() => {
    if (events && events.length > 0) {
      console.log('Filtering events based on new criteria');
      filterEvents();
    }
  }, [events, activeCategory, selectedExactCategory, searchQuery, filterEvents]);

  const fetchEvents = useCallback(async () => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Server-side rendering, skipping data fetch');
      return;
    }
    
    try {
      console.log('Starting to fetch events from Supabase');
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        setError('Database connection error. Please try again later.');
        setLoading(false);
        return;
      }
      
      // Added timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const fetchPromise = supabase
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
            price,
            is_active
          )
        `)
        .order('created_at', { ascending: false });
      
      const { data: eventsData, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
        setLoading(false);
        return;
      }

      console.log(`Successfully fetched ${eventsData?.length || 0} events`);
      
      // If no events data or empty array
      if (!eventsData || eventsData.length === 0) {
        console.log('No events found in database');
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
        return;
      }

      // Process events data
      const processedEvents = eventsData.map(event => {
        try {
          // Get cover image or use placeholder
          const eventImages = Array.isArray(event.event_images) ? event.event_images : [];
          const coverImage = eventImages.find(img => img?.is_cover)?.image_url || '/placeholder-event.jpg';
          
          // Get lowest price
          const ticketTiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : [];
          let lowestPrice = 0;
          if (ticketTiers.length > 0) {
            const prices = ticketTiers
              .filter(tier => tier?.is_active)
              .map(tier => tier?.price || 0)
              .filter(price => price > 0);
            
            lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
          }
          
          return {
            id: event.id,
            title: event.name || 'Untitled Event',
            description: event.description || 'No description available',
            date: event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }) : 'Date TBA',
            time: event.start_time || 'Time TBA',
            location: `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
            price: lowestPrice,
            category: event.category || 'General',
            image: coverImage,
            categoryType: getCategoryType(event.category || 'General')
          };
        } catch (err) {
          console.error('Error processing event:', event.id, err);
          // Return a minimal valid event object if processing fails
          return {
            id: event.id || 'unknown',
            title: event.name || 'Untitled Event',
            description: 'Error loading event details',
            date: 'Date unavailable',
            time: 'Time unavailable',
            location: 'Location unavailable',
            price: 0,
            category: 'General',
            image: '/placeholder-event.jpg',
            categoryType: 'all'
          };
        }
      }).filter(event => event); // Filter out any undefined items
      
      console.log(`Processed ${processedEvents.length} events successfully`);
      setEvents(processedEvents);
      setFilteredEvents(processedEvents);
      
      // Get category counts for display
      const categoryCounts = getCategoryCounts(processedEvents);
      setFeaturedCategories(featuredCategories.map(cat => ({
        ...cat,
        eventCount: String(categoryCounts[cat.exactCategory] || 0)
      })));
      
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      setError(`An unexpected error occurred: ${error.message}. Please try again later.`);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  }, [featuredCategories]);
  
  // Get category counts from events data
  const getCategoryCounts = (events) => {
    if (!Array.isArray(events)) {
      console.error('getCategoryCounts received non-array:', events);
      return {};
    }
    
    const counts = {};
    events.forEach(event => {
      if (event && event.category) {
        const category = event.category.toLowerCase();
        counts[category] = (counts[category] || 0) + 1;
      }
    });
    return counts;
  };

  const filterEvents = useCallback(() => {
    if (!events || !Array.isArray(events) || events.length === 0) {
      setFilteredEvents([]);
      return;
    }
    
    let filtered = [...events];
    
    // Filter by exact category if specified
    if (selectedExactCategory) {
      console.log(`Filtering by exact category: ${selectedExactCategory}`);
      filtered = filtered.filter(event => 
        event.category && event.category.toLowerCase() === selectedExactCategory.toLowerCase()
      );
    }
    // Otherwise filter by category type
    else if (activeCategory !== 'all') {
      if (activeCategory === 'sports') {
        // Direct category match for sports
        filtered = filtered.filter(event => 
          event.category && event.category.toLowerCase() === 'sports' || 
          event.category && event.category.toLowerCase() === 'dfgdfg'
        );
      } else if (activeCategory === 'entertainment') {
        // Music and related categories
        filtered = filtered.filter(event => 
          event.category && ['music', 'srmrgrew', 'svds'].includes(event.category.toLowerCase())
        );
      } else {
        // Use the categoryType function for other categories
        filtered = filtered.filter(event => 
          event.categoryType === activeCategory
        );
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      // Direct search by category value
      filtered = filtered.filter(event => 
        (event.title && event.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.category && event.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      console.log(`Search for "${searchQuery}" returned ${filtered.length} results`);
    }
    
    console.log(`Filtered to ${filtered.length} events`);
    setFilteredEvents(filtered);
  }, [events, activeCategory, selectedExactCategory, searchQuery]);
  
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

  // If loading takes more than 10 seconds, show a timeout message
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Determine whether to show the fallback UI
  const showFallback = (!loading && filteredEvents.length === 0 && !error);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Event Categories"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-emerald-600/70"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Event Categories
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-green-100 max-w-2xl text-lg"
          >
            Explore events by category and find experiences that match your interests
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
        
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            {loadingTimeout && (
              <div className="text-center">
                <p className="text-gray-600 mb-2">Taking longer than expected...</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-green-600 underline"
                >
                  Refresh the page
                </button>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-800 mb-2">{error}</h3>
            <button 
              onClick={fetchEvents}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : showFallback ? (
          <>
            {/* Featured Categories with No Events Message */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Categories</h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {featuredCategories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                    <FeaturedCategoryCard 
                      category={category}
                      onClick={() => {
                        setActiveCategory('all');
                        setSelectedExactCategory(category.exactCategory);
                        document.getElementById('event-listings').scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Category Tabs */}
            <div className="mb-8" id="event-listings">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <CategoryTab 
                  active={activeCategory === 'all' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('all');
                    setSelectedExactCategory(null);
                  }}
            >
              All Categories
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'entertainment' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('entertainment');
                    setSelectedExactCategory(null);
                  }}
            >
              Entertainment
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'business' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('business');
                    setSelectedExactCategory(null);
                  }}
            >
              Business
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'lifestyle' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('lifestyle');
                    setSelectedExactCategory(null);
                  }}
            >
              Lifestyle
            </CategoryTab>
            <CategoryTab 
                  active={activeCategory === 'education' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('education');
                    setSelectedExactCategory(null);
                  }}
            >
              Education
            </CategoryTab>
          </div>
          
              {/* No Events Message */}
              <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Oops! No events under this category</h3>
                <p className="text-gray-500">Check back later for exciting events in this category.</p>
                <button 
                  onClick={fetchEvents} 
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Featured Categories with Real Events */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Featured Categories</h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
                {featuredCategories.map((category) => (
                  <motion.div key={category.id} variants={itemVariants}>
                    <FeaturedCategoryCard 
                      category={category}
                      onClick={() => {
                        setActiveCategory('all');
                        setSelectedExactCategory(category.exactCategory);
                        document.getElementById('event-listings').scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Category Tabs */}
            <div className="mb-8" id="event-listings">
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                <CategoryTab 
                  active={activeCategory === 'all' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('all');
                    setSelectedExactCategory(null);
                  }}
                >
                  All Categories
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'entertainment' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('entertainment');
                    setSelectedExactCategory(null);
                  }}
                >
                  Entertainment
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'business' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('business');
                    setSelectedExactCategory(null);
                  }}
                >
                  Business
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'lifestyle' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('lifestyle');
                    setSelectedExactCategory(null);
                  }}
                >
                  Lifestyle
                </CategoryTab>
                <CategoryTab 
                  active={activeCategory === 'education' && !selectedExactCategory} 
                  onClick={() => {
                    setActiveCategory('education');
                    setSelectedExactCategory(null);
                  }}
                >
                  Education
                </CategoryTab>
              </div>
              
              {/* Events Grid */}
              {filteredEvents.length > 0 ? (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  {filteredEvents.map((event) => (
                    <motion.div key={event.id} variants={itemVariants}>
                      <EventCard event={event} />
                  </motion.div>
                ))}
            </motion.div>
          ) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No events found</h3>
                  <p className="text-gray-500">Try adjusting your search or category selection.</p>
            </div>
          )}
        </div>
        
        {/* Suggest Category Section */}
        <div className="mt-20 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl overflow-hidden shadow-xl">
          <div className="relative p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Can&apos;t Find Your Category?</h3>
                <p className="text-green-100 max-w-md">
                  Suggest a new category and help us improve our platform for everyone.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <button className="bg-white text-green-600 font-medium px-6 py-3 rounded-lg hover:bg-green-50 transition-colors w-full md:w-auto">
                  Suggest a Category
                </button>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

// Featured Category Card Component
function FeaturedCategoryCard({ category, onClick }) {
  return (
    <div onClick={onClick} className="block group cursor-pointer">
      <div className="relative h-40 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="flex items-center mb-1">
            <span className="text-2xl mr-2">{category.icon}</span>
            <h3 className="text-lg font-bold text-white group-hover:text-green-300 transition-colors">{category.name}</h3>
          </div>
          <p className="text-sm text-white/80">{category.eventCount} Events</p>
        </div>
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
      <div className="relative h-48">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={event.image.startsWith('http')}
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-800">
          {event.category}
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600 text-sm">{event.date}</span>
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-green-600 transition-colors">{event.title}</h3>
        <p className="text-gray-600 mb-4 text-sm flex-grow line-clamp-2">{event.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-500 text-sm line-clamp-1">{event.location}</span>
          </div>
          <span className="font-bold text-green-600">{event.price === 0 ? "Free" : `₦${event.price.toLocaleString()}`}</span>
        </div>
      </div>
      <div className="px-6 pb-6">
        <Link 
          href={`/events/${event.id}`}
          className="block w-full py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white text-center rounded-lg hover:from-green-600 hover:to-emerald-500 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

// Category Tab Component
function CategoryTab({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-md' 
          : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:shadow-sm'
      }`}
    >
      {children}
    </button>
  );
}

// Helper function to determine category type
function getCategoryType(category) {
  if (!category) return 'all';
  
  category = category.toLowerCase().trim();
  
  // Exact categories from database
  switch (category) {
    case 'music':
      return 'entertainment';
    case 'sports':
      return 'entertainment';
    case 'srmrgrew':
      return 'entertainment';
    case 'svds':
      return 'entertainment';
    case 'dfgdfg':
      return 'sports';
    default:
      // For any unknown categories
      return 'all';
  }
} 