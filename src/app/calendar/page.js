'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import { motion } from 'framer-motion';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentDate = new Date();

// Fallback mock events
const mockEvents = [
  {
    id: 1,
    title: 'Rock Revolt',
    time: '7:00 PM',
    date: new Date(2024, 2, 15),
    type: 'Music',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    id: 2,
    title: 'Tech Conference',
    time: '9:00 AM',
    date: new Date(2024, 2, 18),
    type: 'Conference',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 3,
    title: 'Art Exhibition',
    time: '3:00 PM',
    date: new Date(2024, 2, 20),
    type: 'Art',
    color: 'bg-purple-100 text-purple-800'
  }
];

// Map event categories to colors with gradients
const getCategoryColor = (category) => {
  const categoryColors = {
    'music': {
      bg: 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800',
      dot: 'bg-pink-500'
    },
    'conference': {
      bg: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
      dot: 'bg-blue-500'
    },
    'art': {
      bg: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800',
      dot: 'bg-purple-500'
    },
    'sports': {
      bg: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800',
      dot: 'bg-green-500'
    },
    'food': {
      bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800',
      dot: 'bg-yellow-500'
    },
    'business': {
      bg: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800',
      dot: 'bg-indigo-500'
    },
    'education': {
      bg: 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800',
      dot: 'bg-teal-500'
    },
    'health': {
      bg: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800',
      dot: 'bg-red-500'
    },
    'technology': {
      bg: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
      dot: 'bg-blue-500'
    },
    'other': {
      bg: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800',
      dot: 'bg-gray-500'
    }
  };
  
  return categoryColors[category?.toLowerCase()] || categoryColors['other'];
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

function CalendarContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [view, setView] = useState('month'); // month, week, day
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // Get user details from metadata
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : user?.email || 'User';
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}` 
    : user?.email?.charAt(0) || 'U';

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Fetch all published events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            start_time,
            end_time,
            category,
            city,
            state,
            status,
            description
          `)
          .in('status', ['published', 'scheduled'])
          .order('event_date', { ascending: true });
          
        if (eventsError) throw eventsError;
        
        console.log('Fetched events for calendar:', eventsData);
        
        // Process events data
        const processedEvents = eventsData.map(event => {
          // Parse date
          let eventDate;
          try {
            eventDate = new Date(event.event_date);
          } catch (error) {
            console.error(`Error parsing date: ${event.event_date}`, error);
            eventDate = new Date(); // Fallback to current date
          }
          
          const categoryStyle = getCategoryColor(event.category);
          
          return {
            id: event.id,
            title: event.name,
            time: event.start_time || '12:00 PM',
            date: eventDate,
            type: event.category || 'Other',
            color: categoryStyle.bg,
            dotColor: categoryStyle.dot,
            location: event.city && event.state ? `${event.city}, ${event.state}` : (event.city || event.state || ''),
            description: event.description || 'No description available'
          };
        });
        
        setEvents(processedEvents);
      } catch (error) {
        console.error('Error fetching events for calendar:', error.message);
        // Use mock data as fallback
        setEvents(mockEvents);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Get calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = [];
    
    // Add previous month's days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i);
      daysInMonth.unshift({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      daysInMonth.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add next month's days
    const remainingDays = 42 - daysInMonth.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      daysInMonth.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return daysInMonth;
  };

  const calendarDays = getDaysInMonth(selectedDate);

  const getEventsForDate = (date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const handleCreateEvent = () => {
    router.push('/create-event');
  };

  const formatMonthYear = (date) => {
    return date.toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Calendar</div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Event Calendar
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <motion.button 
                onClick={handleCreateEvent}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 shadow-md flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Event
              </motion.button>
              <button className="text-gray-400 hover:text-gray-600 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {events.length > 0 ? Math.min(events.length, 9) : 0}
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-md">
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-medium">{fullName}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Calendar Controls */}
              <motion.div 
                className="bg-white rounded-xl shadow-md mb-6 overflow-hidden"
                variants={itemVariants}
              >
                <div className="p-4 flex items-center justify-between border-b">
                  <div className="flex items-center gap-4">
                    <motion.button
                      onClick={() => setSelectedDate(new Date())}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Today
                    </motion.button>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedDate(newDate);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.button>
                      <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                        {formatMonthYear(selectedDate)}
                      </h2>
                      <motion.button
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedDate(newDate);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => setView('month')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        view === 'month' 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={view !== 'month' ? { scale: 1.05 } : {}}
                      whileTap={view !== 'month' ? { scale: 0.95 } : {}}
                    >
                      Month
                    </motion.button>
                    <motion.button
                      onClick={() => setView('week')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        view === 'week' 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={view !== 'week' ? { scale: 1.05 } : {}}
                      whileTap={view !== 'week' ? { scale: 0.95 } : {}}
                    >
                      Week
                    </motion.button>
                    <motion.button
                      onClick={() => setView('day')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        view === 'day' 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={view !== 'day' ? { scale: 1.05 } : {}}
                      whileTap={view !== 'day' ? { scale: 0.95 } : {}}
                    >
                      Day
                    </motion.button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-4">
                  {/* Days of week */}
                  <div className="grid grid-cols-7 gap-4 mb-4">
                    {days.map(day => (
                      <div key={day} className="text-sm font-medium text-gray-500 text-center">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-4">
                    {calendarDays.map(({ date, isCurrentMonth }, index) => {
                      const dayEvents = getEventsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const hasEvents = dayEvents.length > 0;

                      return (
                        <motion.div
                          key={index}
                          className={`min-h-[100px] p-2 rounded-lg border transition-all ${
                            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                          } ${isToday ? 'border-pink-500 shadow-md' : 'border-gray-200'} 
                          ${hasEvents ? 'hover:shadow-md' : ''}`}
                          whileHover={hasEvents ? { scale: 1.02 } : {}}
                          variants={itemVariants}
                        >
                          <div className="text-right">
                            <span className={`inline-block rounded-full w-7 h-7 flex items-center justify-center text-sm ${
                              isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                            } ${isToday ? 'bg-pink-500 text-white font-bold' : ''}`}>
                              {date.getDate()}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {dayEvents.map(event => (
                              <motion.div
                                key={event.id}
                                className={`text-xs p-1.5 rounded-md ${event.color} shadow-sm truncate cursor-pointer relative`}
                                title={`${event.title} - ${event.time}${event.location ? ` - ${event.location}` : ''}`}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={() => setHoveredEvent(event)}
                                onMouseLeave={() => setHoveredEvent(null)}
                              >
                                <div className="flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${event.dotColor}`}></span>
                                  <span className="font-medium">{event.time}</span> - {event.title}
                                </div>
                                
                                {/* Event tooltip on hover */}
                                {hoveredEvent?.id === event.id && (
                                  <motion.div 
                                    className="absolute z-10 left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg p-3 text-left"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <h4 className="font-bold text-gray-900">{event.title}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{event.time}</p>
                                    {event.location && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Location:</span> {event.location}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                                  </motion.div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div 
                className="bg-white rounded-xl shadow-md p-6"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Upcoming Events
                </h3>
                {events.length === 0 ? (
                  <motion.div 
                    className="text-center py-8 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No upcoming events found.</p>
                    <motion.button 
                      onClick={handleCreateEvent}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Create an Event
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {events
                      .filter(event => event.date >= new Date(new Date().setHours(0, 0, 0, 0)))
                      .sort((a, b) => a.date - b.date)
                      .slice(0, 5)
                      .map((event, index) => (
                        <motion.div 
                          key={event.id} 
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className={`w-10 h-10 rounded-full ${event.dotColor} flex items-center justify-center text-white`}>
                            <span className="text-sm font-bold">{event.date.getDate()}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {event.date.toLocaleDateString()} at {event.time}
                            </p>
                            {event.location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.location}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-3 py-1.5 rounded-full ${event.color} shadow-sm`}>
                            {event.type}
                          </span>
                        </motion.div>
                      ))
                    }
                    
                    {events.filter(event => event.date >= new Date(new Date().setHours(0, 0, 0, 0))).length > 5 && (
                      <motion.div 
                        className="text-center mt-4"
                        whileHover={{ scale: 1.05 }}
                      >
                        <button className="text-pink-500 font-medium hover:text-pink-600 flex items-center gap-1 mx-auto">
                          View all events
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  return (
    <ProtectedRoute>
      <CalendarContent />
    </ProtectedRoute>
  );
} 