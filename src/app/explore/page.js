'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Mock data
const mockEvents = [
  {
    id: 1,
    title: "Rock Revolt: Power and Passion Unite",
    date: "Saturday, February 20",
    time: "08:00 PM",
    location: "New York, NY",
    price: 50,
    image: "/stage.png"
  },
  {
    id: 2,
    title: "Rock Fest Extravaganza",
    date: "Friday, December 17",
    time: "08:00 PM",
    location: "New York, NY",
    price: 80,
    image: "/rock.png",
    isNew: true
  },
  {
    id: 3,
    title: "A Legendary Gathering of Rock Icons",
    date: "Tuesday, June 23",
    time: "08:00 PM",
    location: "New York, NY",
    isFree: true,
    image: "/festival.png",
    isNew: true
  },
  {
    id: 4,
    title: "Classic Rock Hits",
    date: "Monday, June 05",
    time: "08:00 PM",
    location: "New York, NY",
    price: 100,
    image: "/harmony.png"
  }
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

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
              placeholder="Rock"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 w-[180px]"
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
              placeholder="New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 w-[180px]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 w-full">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-[240px] flex-shrink-0">
            <div className="pr-6">
              <div className="mb-8">
                <h2 className="text-base font-medium text-gray-900 mb-3">Category</h2>
                <div className="space-y-2">
                  {['All', 'Trending', 'Upcoming', 'Music', 'Sport', 'Exhibition', 'Business', 'Photography'].map((category) => (
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

              <div className="mb-8">
                <h2 className="text-base font-medium text-gray-900 mb-3">Type</h2>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" />
                    <span className="text-sm text-gray-600">Online</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" />
                    <span className="text-sm text-gray-600">Offline - Indoor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" />
                    <span className="text-sm text-gray-600">Offline - Outdoor</span>
                  </label>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-base font-medium text-gray-900 mb-3">Language</h2>
                <div className="space-y-2">
                  {['English', 'German', 'French', 'Spanish'].map((lang) => (
                    <label key={lang} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500" />
                      <span className="text-sm text-gray-600">{lang}</span>
                    </label>
                  ))}
                </div>
                <button className="text-sm text-pink-500 mt-3">Show more</button>
              </div>

              <div className="flex gap-3">
                <button className="text-sm text-pink-500">
                  Clear all
                </button>
                <button className="text-sm text-white bg-gray-600 px-4 py-1 rounded">
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Event Listings */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                {mockEvents.length} results
              </div>
              <button className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort by
              </button>
            </div>

            <div className="space-y-4">
              {mockEvents.map((event) => (
                <Link 
                  href={`/events/${event.id}`}
                  key={event.id}
                  className="block bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="w-[280px] h-[160px] relative">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                      <button className="absolute top-2 right-2 z-10 text-white hover:text-pink-400 transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 py-4 pr-4">
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
                          {event.isFree ? 'Free Ticket' : `From $${event.price}`}
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

            {/* Load More Button */}
            <div className="mt-6">
              <button className="text-sm text-pink-500">
                View more
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 