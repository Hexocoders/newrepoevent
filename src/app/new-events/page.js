'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NewEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');

  // Simulate loading events
  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(sampleEvents);
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Sort events based on selected option
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'popular') {
      return b.attendees - a.attendees;
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    return 0;
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
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[350px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="New Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-orange-600/70"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-medium mb-4"
          >
            Just Added
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Discover New Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-amber-100 max-w-2xl text-lg"
          >
            Be the first to experience the latest and most exciting events added to our platform
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Latest Events</h2>
            <p className="text-gray-600">Explore our newest additions</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setSelectedView('grid')}
                className={`p-2 ${selectedView === 'grid' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-amber-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setSelectedView('list')}
                className={`p-2 ${selectedView === 'list' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-amber-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {selectedView === 'grid' && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {sortedEvents.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {/* List View */}
            {selectedView === 'list' && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {sortedEvents.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <EventListItem event={event} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
        
        {/* Notification Section */}
        <div className="mt-20 bg-white rounded-2xl overflow-hidden shadow-xl border border-amber-100">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <div className="inline-block bg-amber-100 text-amber-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
                Stay Updated
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Never Miss a New Event</h3>
              <p className="text-gray-600 mb-6">
                Get notified when new events are added that match your interests. Be the first to know and never miss out!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-grow px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button className="bg-gradient-to-r from-amber-500 to-orange-400 text-white font-medium px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-500 transition-colors shadow-md hover:shadow-lg">
                  Notify Me
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-3">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
            <div className="relative hidden md:block">
              <Image
                src="/notification-image.jpg"
                alt="Stay updated"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
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
        />
        {event.isNew && (
          <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            New
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-800">
          {event.category}
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600 text-sm">{event.date}</span>
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-amber-600 transition-colors">{event.title}</h3>
        <p className="text-gray-600 mb-4 text-sm flex-grow">{event.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-500 text-sm">{event.location}</span>
          </div>
          <span className="font-bold text-amber-600">${event.price}</span>
        </div>
      </div>
      <div className="px-6 pb-6">
        <Link 
          href={`/events/${event.id}`}
          className="block w-full py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white text-center rounded-lg hover:from-amber-600 hover:to-orange-500 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

// Event List Item Component
function EventListItem({ event }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-64 h-48 md:h-auto">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {event.isNew && (
            <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              New
            </div>
          )}
        </div>
        <div className="p-6 flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-medium">
              {event.category}
            </div>
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600 text-sm">{event.date}</span>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-amber-600 transition-colors">{event.title}</h3>
          <p className="text-gray-600 mb-4">{event.description}</p>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-500 text-sm">{event.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-500 text-sm">{event.attendees} attending</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-amber-600 text-lg">${event.price}</span>
              <Link 
                href={`/events/${event.id}`}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-lg hover:from-amber-600 hover:to-orange-500 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sample data
const sampleEvents = [
  {
    id: 1,
    title: "Tech Innovation Summit 2023",
    description: "Join industry leaders for a day of insights on the latest technological innovations and future trends.",
    date: "Dec 15, 2023",
    location: "San Francisco, CA",
    category: "Technology",
    price: 149,
    attendees: 342,
    image: "/tech-event.jpg",
    isNew: true
  },
  {
    id: 2,
    title: "Winter Music Festival",
    description: "Experience an unforgettable night of live performances from top artists across multiple genres.",
    date: "Dec 18, 2023",
    location: "Austin, TX",
    category: "Music",
    price: 89,
    attendees: 520,
    image: "/music-event.jpg",
    isNew: true
  },
  {
    id: 3,
    title: "Culinary Masterclass",
    description: "Learn cooking techniques from renowned chefs and elevate your culinary skills in this hands-on workshop.",
    date: "Dec 20, 2023",
    location: "Chicago, IL",
    category: "Food & Drink",
    price: 75,
    attendees: 128,
    image: "/food-event.jpg",
    isNew: true
  },
  {
    id: 4,
    title: "Digital Marketing Conference",
    description: "Discover the latest strategies and tools to boost your online presence and drive business growth.",
    date: "Jan 5, 2024",
    location: "New York, NY",
    category: "Business",
    price: 199,
    attendees: 275,
    image: "/marketing-event.jpg",
    isNew: true
  },
  {
    id: 5,
    title: "Wellness Retreat Weekend",
    description: "Rejuvenate your mind and body with yoga, meditation, and wellness workshops in a serene setting.",
    date: "Jan 12-14, 2024",
    location: "Denver, CO",
    category: "Health & Wellness",
    price: 299,
    attendees: 85,
    image: "/wellness-event.jpg",
    isNew: true
  },
  {
    id: 6,
    title: "Photography Workshop",
    description: "Master the art of photography with expert guidance on composition, lighting, and editing techniques.",
    date: "Jan 18, 2024",
    location: "Seattle, WA",
    category: "Arts",
    price: 120,
    attendees: 64,
    image: "/photography-event.jpg",
    isNew: true
  }
]; 