'use client';

import Image from "next/image";
import Link from "next/link";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, Suspense } from 'react';
import { supabase } from '../lib/supabaseClient';

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
      <div className="min-h-screen bg-white flex flex-col">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

// Home content component
function HomeContent() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isClient, setIsClient] = useState(false);
  
  // Mark when we're in client side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch events only on client-side
  useEffect(() => {
    if (isClient) {
      fetchEvents();
    }
  }, [isClient]);
  
  const fetchEvents = useCallback(async () => {
    // Skip server-side execution
    if (typeof window === 'undefined') return;
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        setErrorMessage('Database connection error. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          description,
          event_date,
          city,
          state,
          event_images (image_url, is_cover),
          ticket_tiers (price)
        `)
        .eq('status', 'published')
        .limit(6);
      
      if (error) {
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        setUpcomingEvents([]);
        setIsLoading(false);
        return;
      }
      
      // Process events data
      const processedEvents = data.map(event => {
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
          name: event.name,
          description: event.description,
          date: event.event_date,
          location: `${event.city}, ${event.state}`,
          imageUrl: coverImage || '/placeholder-event.jpg',
          price: lowestPrice !== null ? `$${lowestPrice.toFixed(2)}` : 'Free'
        };
      });
      
      setUpcomingEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMessage('Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Show loading state before client-side render
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative py-12 md:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Discover the best events happening near you
              </h1>
              <p className="text-xl mb-8">
                Find concerts, classes, conferences, and many other amazing events
              </p>
              <SearchBox />
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              How IP Event Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Discover Events</h3>
                <p className="text-gray-600">
                  Search for events by location, category, or date to find the perfect event for you.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Buy Tickets</h3>
                <p className="text-gray-600">
                  Securely purchase tickets to your favorite events with just a few clicks.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Enjoy the Experience</h3>
                <p className="text-gray-600">
                  Attend the event and create unforgettable memories with friends and family.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Upcoming Events */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Upcoming Events</h2>
              <Link href="/explore" className="text-blue-600 hover:underline font-medium">
                View All
              </Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : errorMessage ? (
              <div className="bg-white p-6 rounded-lg shadow text-center my-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{errorMessage}</h3>
                <button 
                  onClick={fetchEvents} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center my-8">
                <p className="text-gray-600">No upcoming events found at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow z-10">
                      <div className="relative h-48">
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover"
                          unoptimized={!event.imageUrl.startsWith('/')}
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 line-clamp-1">{event.name}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                        <div className="flex items-center text-gray-500 mb-2">
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center text-gray-500 mb-4">
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                        <div className="font-bold text-blue-600">{event.price}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="text-center">
              <Link 
                href="/explore" 
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Explore All Events
              </Link>
            </div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              What Our Users Say
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden mr-4">
                    <Image src="/testimonial-1.jpg" alt="User" width={48} height={48} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sarah Johnson</h3>
                    <p className="text-gray-600 text-sm">Event Attendee</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "I found an amazing concert on IP Event last weekend. The ticket buying process was smooth, and I had no issues at the event. Highly recommend!"
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden mr-4">
                    <Image src="/testimonial-2.jpg" alt="User" width={48} height={48} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Michael Rodriguez</h3>
                    <p className="text-gray-600 text-sm">Event Organizer</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "As an event organizer, IP Event has made it incredibly easy to sell tickets and manage attendees. The platform is intuitive and the support team is fantastic."
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden mr-4">
                    <Image src="/testimonial-3.jpg" alt="User" width={48} height={48} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Emily Chen</h3>
                    <p className="text-gray-600 text-sm">Regular User</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "I use IP Event at least once a month to find interesting events in my city. The search filters are really helpful, and I've discovered so many cool activities!"
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-indigo-800 to-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Ready to discover amazing events?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of users who find and attend incredible events every day with IP Event.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/explore" 
                className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Explore Events
              </Link>
              <Link 
                href="/create-event" 
                className="px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-md hover:bg-white/10 transition-colors"
              >
                Create Event
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

// Main component with error boundary
export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-white flex flex-col">
          <Navbar />
          <div className="flex-grow flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
          <Footer />
        </div>
      }>
        <HomeContent />
      </Suspense>
    </ErrorBoundary>
  );
}

// Featured Event Card Component
function FeaturedEventCard({ id, title, image, date, location, price, category, attendees }) {
  return (
    <Link href={`/events/${id}`} className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-56">
          <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-800">
          {category}
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {attendees}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group-hover:text-purple-700 transition-colors">{title}</h3>
        <div className="flex items-center text-gray-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">{date}</p>
        </div>
        <div className="flex items-center text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">{location}</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-purple-700 font-bold">From {price}</p>
          <button className="text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors">
            Get Tickets
          </button>
        </div>
      </div>
    </Link>
  );
}

// Trending Event Card Component
function TrendingEventCard({ id, title, image, date, location, price, category, rating, reviews }) {
  return (
    <Link href={`/events/${id}`} className="group flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      <div className="relative md:w-2/5 h-56 md:h-auto">
          <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-800">
          {category}
        </div>
      </div>
      <div className="p-6 md:w-3/5 flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-current' : 'stroke-current fill-none'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">{rating} ({reviews} reviews)</span>
          </div>
          <h3 className="text-xl font-bold mb-3 group-hover:text-purple-700 transition-colors">{title}</h3>
          <div className="flex items-center text-gray-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">{date}</p>
          </div>
          <div className="flex items-center text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{location}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-purple-700 font-bold">From {price}</p>
          <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm hover:from-pink-600 hover:to-purple-700 transition-colors">
            Get Tickets
          </button>
        </div>
      </div>
    </Link>
  );
}

// Event Card Component
function EventCard({ id, title, image, date, location, price }) {
  return (
    <Link href={`/events/${id}`} className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-48">
          <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <h3 className="absolute bottom-4 left-4 text-white text-lg font-bold">{title}</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center text-gray-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">{date}</p>
        </div>
        <div className="flex items-center text-gray-500 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">{location}</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-purple-700 font-bold">From {price}</p>
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Category Card Component
function CategoryCard({ icon, title, count }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{count}</p>
    </div>
  );
}
