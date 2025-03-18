'use client';

import Image from "next/image";
import Link from "next/link";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[600px] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-pink-600/60"></div>
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-pink-200 text-3xl md:text-4xl mb-3 font-light tracking-wide"
          >
            Discover & Experience
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight"
          >
            <span className="block">Find Your Perfect</span>
            <motion.span 
              initial={{ backgroundPosition: "200% 0" }}
              animate={{ backgroundPosition: "0% 0" }}
              transition={{ duration: 1.5, delay: 0.4 }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-200"
            >
              Event Experience
            </motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-200 max-w-xl mb-10 text-lg"
          >
            Connect with thousands of events happening around you. From concerts to workshops, find what moves you.
          </motion.p>
          
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col md:flex-row w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:shadow-pink-500/20 hover:-translate-y-1"
          >
            <div className="flex-1 flex flex-col md:flex-row bg-white">
              <div className="flex items-center px-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search for events, concerts, workshops..."
                  className="w-full p-3 text-gray-800 outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center px-4 py-3 md:py-0 flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full p-3 text-gray-800 outline-none bg-transparent"
                />
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 font-medium transition-all hover:from-pink-700 hover:to-purple-700"
            >
              Discover Events
            </motion.button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center mt-8 text-white/80 text-sm"
          >
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              10,000+ Events
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Trusted Platform
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Secure Payments
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Featured Events Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Events</h2>
              <p className="text-gray-600">Discover the most popular events in your area</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors">
                This Weekend
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors">
                This Month
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-sm hover:from-pink-600 hover:to-purple-700 transition-colors">
                View All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeaturedEventCard
              id={1}
              title="Urban Marathon"
              image="/urban.png"
              date="Monday, June 06 | 06:00 AM"
              location="Central Park, New York"
              price="$20"
              category="Sports"
              attendees={1240}
            />
            <FeaturedEventCard
              id={2}
              title="Melody Mania"
              image="/melody.png"
              date="Wednesday, June 21 | 07:00 PM"
              location="Madison Square Garden, NY"
              price="$40"
              category="Music"
              attendees={3500}
            />
            <FeaturedEventCard
              id={3}
              title="Rockin' the Stage"
              image="/stage.png"
              date="Monday, March 14 | 04:00 PM"
              location="Brooklyn Music Hall, NY"
              price="$125"
              category="Concert"
              attendees={2100}
            />
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-2">Browse Categories</h2>
          <p className="text-gray-600 mb-10">Find events that match your interests</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <CategoryCard icon="🎵" title="Music" count="1,200+ Events" />
            <CategoryCard icon="🏃" title="Sports" count="800+ Events" />
            <CategoryCard icon="🎨" title="Arts" count="650+ Events" />
            <CategoryCard icon="💼" title="Business" count="450+ Events" />
            <CategoryCard icon="📸" title="Photography" count="320+ Events" />
          </div>
        </div>

        {/* Trending Events Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Trending This Week</h2>
              <p className="text-gray-600">Don&apos;t miss out on the hottest events</p>
            </div>
            <Link href="/explore" className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-colors flex items-center">
              Explore All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TrendingEventCard
              id={4}
              title="Musical Fusion Festival"
              image="/festival.png"
              date="Monday, June 06 | 06:00 AM"
              location="Riverside Park, New York"
              price="$100"
              category="Festival"
              rating={4.8}
              reviews={120}
            />
            <TrendingEventCard
              id={5}
              title="Business in the United States"
              image="/business.png"
              date="Tuesday, June 7 | 06:00 AM"
              location="Convention Center, Atlanta"
              price="$50"
              category="Conference"
              rating={4.6}
              reviews={85}
            />
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
              <p className="text-gray-600">Plan ahead for these amazing experiences</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors">
                All
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors">
                Today
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors">
                This Week
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors">
                This Month
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EventCard
              id={6}
              title="Marathon"
              image="/marathon.png"
              date="Monday, June 06 | 06:00 AM"
              location="New York, NY"
              price="$125"
            />
            <EventCard
              id={7}
              title="Rock Festival"
              image="/rock.png"
              date="Monday, March 21 | 06:00 PM"
              location="New York, NY"
              price="$175"
            />
            <EventCard
              id={8}
              title="Harmony of Melodies Concert"
              image="/harmony.png"
              date="Wednesday, June 24 | 07:00 PM"
              location="New York, NY"
              price="$150"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-pink-600"></div>
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-10 md:p-16">
            <div className="text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Host Your Own Event?</h2>
              <p className="text-purple-100 max-w-xl">
                Create, manage, and promote your events with our powerful platform. Reach thousands of potential attendees.
              </p>
            </div>
            <Link href="/signup" className="px-8 py-4 bg-white text-purple-900 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg">
              Get Started for Free
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
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
