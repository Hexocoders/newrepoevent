'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// Mock data - In a real app, this would come from an API
const events = {
  1: {
    title: "Urban Marathon",
    date: "Monday, June 06",
    time: "06:00 AM",
    description: "Join us for an exhilarating urban marathon through the heart of the city. Experience the thrill of running through iconic streets and landmarks.",
    location: {
      venue: "Central Park",
      address: "New York, NY 10022",
      country: "United States"
    },
    price: 20,
    discount: 10,
    duration: "3 hours",
    likes: 245,
    shares: 89,
    image: "/urban.png"
  },
  // Add more events as needed
};

export default function EventDetails({ params }) {
  const router = useRouter();
  const eventId = use(params).id;
  const event = events[eventId] || events[1]; // Fallback to first event if ID not found

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 py-4 w-full">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Events</span>
        </button>
      </div>

      {/* Event Header */}
      <div className="relative h-[500px] mb-8">
        <Image
          src="/hero.png"
          alt="Event hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-purple-800/35 to-black/30"></div>
        <div className="relative z-10 h-full">
          <div className="max-w-6xl mx-auto h-full flex flex-col justify-center px-4">
            <div className="text-center animate-fade-in">
              <div className="inline-block bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-12 animate-bounce-in">
                {event.date.toUpperCase()}
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-12 text-white tracking-tight animate-slide-up">
                {event.title}
              </h1>
              <p className="text-gray-200 mb-16 max-w-2xl mx-auto leading-relaxed text-lg animate-fade-in">
                {event.description}
              </p>
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-3 text-white group cursor-pointer animate-bounce-in">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-lg font-medium group-hover:text-pink-400 transition-colors">{event.likes}</span>
                </div>
                <div className="flex items-center gap-3 text-white group cursor-pointer animate-bounce-in">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:text-pink-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-lg font-medium group-hover:text-pink-400 transition-colors">{event.shares}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Timing and Location */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Timing and Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="text-gray-600 text-sm font-medium tracking-wider">DATE AND TIME</div>
                  <div className="flex items-start gap-4 group">
                    <div className="text-pink-500 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{event.date}</div>
                      <div className="text-gray-600">{event.time}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-gray-600 text-sm font-medium tracking-wider">LOCATION</div>
                  <div className="flex items-start gap-4 group">
                    <div className="text-pink-500 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{event.location.venue}</div>
                      <div className="text-gray-600">{event.location.address}</div>
                      <div className="text-gray-600">{event.location.country}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Event */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">About Event</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="space-y-4">
                  <div className="text-gray-600 text-sm font-medium tracking-wider">DURATION</div>
                  <div className="flex items-center gap-4 group">
                    <div className="text-pink-500 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900">{event.duration}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-gray-600 text-sm font-medium tracking-wider">TICKET TYPE</div>
                  <div className="flex items-center gap-4 group">
                    <div className="text-pink-500 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900">Email eTicket</div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
              <button className="mt-4 text-pink-500 hover:text-pink-600 font-medium transition-colors">
                Read more
              </button>
            </div>

            {/* Event Album */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Event Gallery</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <div className="aspect-video bg-gray-200 rounded-xl relative overflow-hidden group">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                <div className="grid grid-rows-2 gap-4">
                  <div className="bg-gray-200 rounded-xl relative overflow-hidden group">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="bg-gray-200 rounded-xl relative overflow-hidden group">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Price and Purchase */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <div className="text-xl font-semibold text-gray-900">Price</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${event.price} <span className="text-sm text-gray-600 font-normal">/ Ticket</span>
                </div>
              </div>
              {event.discount && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium inline-block mb-6">
                  {event.discount}% OFF
                </div>
              )}
              <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Purchase Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Similar Events */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Similar <span className="text-pink-500">Events</span>
            </h2>
            <Link href="/events" className="text-pink-500 hover:text-pink-600 font-medium transition-colors">
              View more
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Similar Event Cards */}
            {[1, 2].map((index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <div className="aspect-video bg-gray-200 relative">
                  <Image
                    src={event.image}
                    alt="Similar event"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    20% OFF
                  </div>
                  <button className="absolute top-4 left-4 text-white hover:text-pink-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-pink-500 transition-colors">
                    {index === 1 ? "Fuel Your Passion for Rock Music" : "Musical Fusion Festival"}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {index === 1 ? "Tuesday, August 18" : "Monday, June 06"} | 08:00 PM
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    New York, NY
                  </div>
                  <div className="mt-4 text-right font-medium text-pink-500">
                    From ${index === 1 ? "100" : "85"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 