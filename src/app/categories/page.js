'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search query
  const filteredCategories = categoriesData.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        
        {/* Featured Categories */}
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
                <FeaturedCategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <CategoryTab 
              active={activeCategory === 'all'} 
              onClick={() => setActiveCategory('all')}
            >
              All Categories
            </CategoryTab>
            <CategoryTab 
              active={activeCategory === 'entertainment'} 
              onClick={() => setActiveCategory('entertainment')}
            >
              Entertainment
            </CategoryTab>
            <CategoryTab 
              active={activeCategory === 'business'} 
              onClick={() => setActiveCategory('business')}
            >
              Business
            </CategoryTab>
            <CategoryTab 
              active={activeCategory === 'lifestyle'} 
              onClick={() => setActiveCategory('lifestyle')}
            >
              Lifestyle
            </CategoryTab>
            <CategoryTab 
              active={activeCategory === 'education'} 
              onClick={() => setActiveCategory('education')}
            >
              Education
            </CategoryTab>
          </div>
          
          {/* All Categories Grid */}
          {filteredCategories.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {filteredCategories
                .filter(category => activeCategory === 'all' || category.type === activeCategory)
                .map((category) => (
                  <motion.div key={category.id} variants={itemVariants}>
                    <CategoryCard category={category} />
                  </motion.div>
                ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No categories found</h3>
              <p className="text-gray-500">Try adjusting your search to find what you're looking for.</p>
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
      </main>
      
      <Footer />
    </div>
  );
}

// Featured Category Card Component
function FeaturedCategoryCard({ category }) {
  return (
    <Link href={`/categories/${category.slug}`} className="block group">
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
    </Link>
  );
}

// Category Card Component
function CategoryCard({ category }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-48">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-800">
          {getCategoryTypeLabel(category.type)}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center mb-3">
          <span className="text-3xl mr-3">{category.icon}</span>
          <h3 className="text-xl font-bold group-hover:text-green-600 transition-colors">{category.name}</h3>
        </div>
        <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{category.eventCount} Events</p>
          <Link 
            href={`/categories/${category.slug}`}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white rounded-lg text-sm hover:from-green-600 hover:to-emerald-500 transition-colors"
          >
            Explore
          </Link>
        </div>
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

// Helper function
function getCategoryTypeLabel(type) {
  switch(type) {
    case 'entertainment': return 'Entertainment';
    case 'business': return 'Business';
    case 'lifestyle': return 'Lifestyle';
    case 'education': return 'Education';
    default: return 'General';
  }
}

// Sample data
const featuredCategories = [
  {
    id: 1,
    name: "Music",
    slug: "music",
    icon: "🎵",
    image: "/music-category.jpg",
    eventCount: "1,200+"
  },
  {
    id: 2,
    name: "Sports",
    slug: "sports",
    icon: "🏆",
    image: "/sports-category.jpg",
    eventCount: "850+"
  },
  {
    id: 3,
    name: "Food & Drink",
    slug: "food-drink",
    icon: "🍽️",
    image: "/food-category.jpg",
    eventCount: "750+"
  },
  {
    id: 4,
    name: "Technology",
    slug: "technology",
    icon: "💻",
    image: "/tech-category.jpg",
    eventCount: "620+"
  }
];

const categoriesData = [
  {
    id: 1,
    name: "Music",
    slug: "music",
    icon: "🎵",
    image: "/music-category.jpg",
    description: "Concerts, festivals, live performances, and more for music lovers of all genres.",
    eventCount: "1,200+",
    type: "entertainment"
  },
  {
    id: 2,
    name: "Sports",
    slug: "sports",
    icon: "🏆",
    image: "/sports-category.jpg",
    description: "From major leagues to local tournaments, find sporting events for fans and participants.",
    eventCount: "850+",
    type: "entertainment"
  },
  {
    id: 3,
    name: "Food & Drink",
    slug: "food-drink",
    icon: "🍽️",
    image: "/food-category.jpg",
    description: "Culinary festivals, tastings, cooking classes, and gastronomic experiences.",
    eventCount: "750+",
    type: "lifestyle"
  },
  {
    id: 4,
    name: "Technology",
    slug: "technology",
    icon: "💻",
    image: "/tech-category.jpg",
    description: "Tech conferences, hackathons, product launches, and innovation showcases.",
    eventCount: "620+",
    type: "business"
  },
  {
    id: 5,
    name: "Arts & Culture",
    slug: "arts-culture",
    icon: "🎨",
    image: "/arts-category.jpg",
    description: "Exhibitions, performances, cultural festivals, and artistic showcases.",
    eventCount: "580+",
    type: "entertainment"
  },
  {
    id: 6,
    name: "Business & Networking",
    slug: "business-networking",
    icon: "💼",
    image: "/business-category.jpg",
    description: "Conferences, networking events, workshops, and professional development opportunities.",
    eventCount: "520+",
    type: "business"
  },
  {
    id: 7,
    name: "Health & Wellness",
    slug: "health-wellness",
    icon: "🧘",
    image: "/wellness-category.jpg",
    description: "Fitness classes, wellness retreats, health seminars, and mindfulness sessions.",
    eventCount: "480+",
    type: "lifestyle"
  },
  {
    id: 8,
    name: "Education",
    slug: "education",
    icon: "📚",
    image: "/education-category.jpg",
    description: "Workshops, seminars, courses, and learning opportunities across various subjects.",
    eventCount: "450+",
    type: "education"
  },
  {
    id: 9,
    name: "Photography",
    slug: "photography",
    icon: "📸",
    image: "/photography-category.jpg",
    description: "Photography workshops, exhibitions, photo walks, and camera gear events.",
    eventCount: "320+",
    type: "lifestyle"
  },
  {
    id: 10,
    name: "Family & Kids",
    slug: "family-kids",
    icon: "👨‍👩‍👧‍👦",
    image: "/family-category.jpg",
    description: "Family-friendly activities, children's events, and entertainment for all ages.",
    eventCount: "380+",
    type: "entertainment"
  },
  {
    id: 11,
    name: "Science & Nature",
    slug: "science-nature",
    icon: "🔬",
    image: "/science-category.jpg",
    description: "Scientific exhibitions, nature walks, astronomical viewings, and environmental events.",
    eventCount: "290+",
    type: "education"
  },
  {
    id: 12,
    name: "Fashion & Beauty",
    slug: "fashion-beauty",
    icon: "👗",
    image: "/fashion-category.jpg",
    description: "Fashion shows, beauty expos, styling workshops, and industry showcases.",
    eventCount: "310+",
    type: "lifestyle"
  }
]; 