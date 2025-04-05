'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabaseClient';
import TicketModal from '../../components/TicketModal';
import EventPreviewModal from '../../components/EventPreviewModal';

export default function UpcomingEvents() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

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
        setError('Failed to load events');
        return;
      }

      // Process events data
      const processedEvents = eventsData.map(event => {
        // Get cover image or use placeholder
        const coverImage = event.event_images?.find(img => img?.is_cover)?.image_url || '/placeholder-event.jpg';
        
        // Calculate ticket information
        let lowestPrice = 0;
        let totalAvailableTickets = 0;
        let ticketCount = 'No available ticket for this event';
        let isSoldOut = true;
        
        if (event.ticket_tiers && event.ticket_tiers.length > 0) {
          // Filter active ticket tiers
          const activeTickets = event.ticket_tiers.filter(tier => tier.is_active !== false);
          
          if (activeTickets.length > 0) {
            // Calculate available tickets
            activeTickets.forEach(tier => {
              const availableTickets = tier.quantity - (tier.price > 0 ? (tier.paid_quantity_sold || 0) : (tier.quantity_sold || 0));
              if (availableTickets > 0) {
                totalAvailableTickets += availableTickets;
                isSoldOut = false;
              }
            });
            
            // Get lowest price from active tiers
            const prices = activeTickets.map(tier => tier.price || 0).filter(price => price > 0);
            lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
            
            // Format ticket count text
            if (totalAvailableTickets > 0) {
              ticketCount = totalAvailableTickets.toString();
            }
          }
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
        
        // Final price display
        const finalPrice = isSoldOut ? 'Sold Out' : (lowestPrice === 0 ? "Free" : `From ₦${lowestPrice.toLocaleString()}`);
        
        return {
          id: event.id,
          title: event.name || 'Untitled Event',
          description: event.description,
          date: event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { 
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : 'Date TBA',
          eventDate: event.event_date ? new Date(event.event_date) : null,
          time: event.start_time || 'Time TBA',
          location: `${event.city || ''}${event.state ? `, ${event.state}` : ''}`,
          price: finalPrice,
          numericPrice: lowestPrice,
          category: event.category || 'General',
          image: coverImage,
          timeFrame: timeFrame,
          featured: isFeatured,
          ticketCount: ticketCount,
          isSoldOut: isSoldOut,
          ticket_tiers: event.ticket_tiers
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

  // Handle event click to show preview modal
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Close the preview modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Handle "Get Tickets" button click
  const handleGetTickets = (event, e) => {
    if (e) {
      e.preventDefault(); // Prevent default link behavior
      e.stopPropagation(); // Stop event bubbling
    }
    
    // Set the selected event and show the ticket modal
    setSelectedEvent(event);
    closeModal(); // Close the preview modal if it's open
    setShowTicketModal(true);
  };

  // Close the ticket modal
  const closeTicketModal = () => {
    setShowTicketModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
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
    
      <Navbar />
      
      {/* Hero Section - Updated with amber/orange theme */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Upcoming Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-600/70"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md"
          >
            Upcoming Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-base sm:text-lg drop-shadow"
          >
            Discover and plan for the most anticipated events coming your way
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search and Filters Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search events or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-amber-500 absolute left-3 top-1/2 transform -translate-y-1/2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Time Period Filters */}
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 w-full md:w-auto">
            <div className="flex space-x-2 md:space-x-4">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Events</FilterButton>
              <FilterButton active={filter === 'today'} onClick={() => setFilter('today')}>Today</FilterButton>
              <FilterButton active={filter === 'tomorrow'} onClick={() => setFilter('tomorrow')}>Tomorrow</FilterButton>
              <FilterButton active={filter === 'thisWeek'} onClick={() => setFilter('thisWeek')}>This Week</FilterButton>
              <FilterButton active={filter === 'thisMonth'} onClick={() => setFilter('thisMonth')}>This Month</FilterButton>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-red-50 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-3">{error}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't load the events. Please try again or check back later.
            </p>
            <button 
              onClick={fetchEvents}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Results Count and Info */}
            <div className="mb-8 text-center">
              <p className="text-gray-600">
                Showing <span className="font-bold text-amber-600">{filteredEvents.length}</span> {filteredEvents.length === 1 ? 'event' : 'events'}
                {filter !== 'all' && ` for ${getTimeFrameLabel(filter).toLowerCase()}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
            
            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
              >
                {filteredEvents.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <EventCard 
                      event={event} 
                      onClick={() => handleEventClick(event)}
                      onGetTickets={(e) => handleGetTickets(event, e)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-10 text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No events found</h3>
                <p className="text-gray-500 mb-6">
                  We couldn't find any events matching your criteria. Try adjusting your search or filter.
                </p>
                <button 
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow"
                >
                  Show All Events
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Newsletter Section - Updated with black theme and shine effect */}
        <div className="mt-20 bg-black rounded-2xl overflow-hidden shadow-xl relative">
          {/* Animated shine effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-30 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-45deg] animate-shine"></div>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Never Miss a New Event</h3>
                <p className="text-white/80 max-w-md">
                  Stay updated with the most exclusive events in your area. Get notified about upcoming events that match your interests.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <div className="relative h-48 w-full md:w-64 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                    alt="Events notification"
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
      
      <Footer />
      
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
      
      {/* Ticket Purchase Modal */}
      {showTicketModal && selectedEvent && (
      <TicketModal
        event={selectedEvent}
        isOpen={showTicketModal}
        onClose={closeTicketModal}
      />
      )}
    </div>
  );
}

// Filter Button Component
function FilterButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
        active 
          ? 'bg-amber-500 text-white shadow-md' 
          : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-500/30 hover:shadow-sm'
      }`}
    >
      {children}
    </button>
  );
}

// Event Card Component
function EventCard({ event, onClick, onGetTickets }) {
  const isSoldOut = event.ticketCount === 'No available ticket for this event';
  
  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group h-full flex flex-col cursor-pointer border border-gray-100"
      onClick={() => onClick(event)}
    >
      <div className="relative h-52 md:h-64 overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-40 group-hover:opacity-60 transition-opacity"></div>
        
        {/* Category badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-800 shadow-sm group-hover:bg-white transition-all">
            {event.category}
          </span>
        </div>
        
        {/* Featured badge */}
        {event.featured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-medium shadow-md">
              <svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              Featured
            </span>
          </div>
        )}
        
        {/* Time badge */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getTimeFrameBackgroundColor(event.timeFrame)}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getTimeFrameDotColor(event.timeFrame)}`}></span>
            {getTimeFrameLabel(event.timeFrame)}
          </div>
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-lg font-bold mb-3 text-gray-800 group-hover:text-amber-600 transition-colors line-clamp-2">{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">{event.date}</p>
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <p className="text-sm font-medium line-clamp-1">{event.location || 'Location TBA'}</p>
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className={`font-bold text-base ${event.price === 'Free' ? 'text-green-600' : event.price === 'Sold Out' ? 'text-red-500' : 'text-amber-600'}`}>
              {event.price}
            </p>
            {event.price !== 'Free' && event.price !== 'Sold Out' && !isSoldOut && (
              <p className="text-xs text-gray-500">{event.ticketCount} available</p>
            )}
            {event.price === 'Free' && !isSoldOut && (
              <p className="text-xs text-gray-500">{event.ticketCount} free tickets</p>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the card's onClick
              if (onGetTickets) {
                onGetTickets(event, e);
              } else {
              onClick(event); 
              }
            }}
            disabled={isSoldOut}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm transition-colors ${
              isSoldOut 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500 group-hover:shadow-md transform group-hover:translate-y-0 hover:translate-y-[-2px]'
            }`}
          >
            {isSoldOut ? 'Sold Out' : 'Get Tickets'}
            {!isSoldOut && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
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

function getTimeFrameDotColor(timeFrame) {
  switch(timeFrame) {
    case 'today': return 'bg-red-500';
    case 'tomorrow': return 'bg-orange-500';
    case 'thisWeek': return 'bg-white';
    case 'thisMonth': return 'bg-white';
    default: return 'bg-white';
  }
}

function getTimeFrameBackgroundColor(timeFrame) {
  switch(timeFrame) {
    case 'today': return 'bg-red-500 text-white';
    case 'tomorrow': return 'bg-orange-500 text-white';
    case 'thisWeek': return 'bg-amber-500 text-white';
    case 'thisMonth': return 'bg-amber-500/80 text-white';
    default: return 'bg-gray-200 text-gray-800';
  }
} 