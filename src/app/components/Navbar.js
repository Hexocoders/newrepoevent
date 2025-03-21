'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const dropdownRef = useRef(null);
  const [userData, setUserData] = useState(null);
  
  // Get user data from localStorage on component mount (client-side only)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, []);
  
  // Get user's name from localStorage
  const firstName = userData?.first_name || 'User';
  const lastName = userData?.last_name || '';
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('user');
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if user is logged in (either from context or localStorage)
  const isLoggedIn = !!userData || !!user;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
      `}</style>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md py-3' : 'bg-white py-4 border-b border-gray-100'
        }`}
      >
        <div className="w-full px-0 flex justify-between items-center">
          {/* Logo at extreme left with no padding */}
          <div className="pl-4 md:pl-8">
            <Link href="/" className="flex items-center group">
              <div className="relative w-14 h-14">
                <Image 
                  src="/logo.png" 
                  alt="IP Event" 
                  width={56}
                  height={56}
                  className="object-contain transition-all duration-300 group-hover:scale-105"
                  priority
                  unoptimized
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - pushed to the right */}
          <div className="hidden md:flex items-center gap-6 pr-4 md:pr-8">
            <NavLink href="/" isActive={pathname === '/'}>Home</NavLink>
            <NavLink href="/explore" isActive={pathname === '/explore'}>Explore</NavLink>
            <NavLink href="/upcoming-events" isActive={pathname === '/upcoming-events'}>Upcoming Events</NavLink>
            <NavLink href="/categories" isActive={pathname === '/categories'}>Categories</NavLink>
            <NavLink href="/new-events" isActive={pathname === '/new-events'}>New Events</NavLink>
            
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 text-gray-700 hover:text-pink-500 focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{firstName}</p>
                    </div>
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <NavLink href="/signin" isActive={pathname === '/signin'}>Log in</NavLink>
                <Link 
                  href="/signup" 
                  className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden pr-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-96 border-b border-gray-100' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col space-y-3 px-4 py-5">
            <MobileNavLink href="/" isActive={pathname === '/'} onClick={() => setIsOpen(false)}>
              Home
            </MobileNavLink>
            <MobileNavLink href="/explore" isActive={pathname === '/explore'} onClick={() => setIsOpen(false)}>
              Explore
            </MobileNavLink>
            <MobileNavLink href="/upcoming-events" isActive={pathname === '/upcoming-events'} onClick={() => setIsOpen(false)}>
              Upcoming Events
            </MobileNavLink>
            <MobileNavLink href="/categories" isActive={pathname === '/categories'} onClick={() => setIsOpen(false)}>
              Categories
            </MobileNavLink>
            <MobileNavLink href="/new-events" isActive={pathname === '/new-events'} onClick={() => setIsOpen(false)}>
              New Events
            </MobileNavLink>
            <div className="h-px w-full bg-gray-100 my-2"></div>
            
            {isLoggedIn ? (
              <>
                {/* User info in mobile menu */}
                <div className="px-2 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                      {firstName.charAt(0)}{lastName.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{firstName}</p>
                  </div>
                </div>
                <MobileNavLink href="/dashboard" isActive={pathname === '/dashboard'} onClick={() => setIsOpen(false)}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink href="/profile" isActive={pathname === '/profile'} onClick={() => setIsOpen(false)}>
                  Profile
                </MobileNavLink>
                <button
                  onClick={handleSignOut}
                  className="px-2 py-2 rounded-lg text-red-600 hover:bg-gray-50 transition-colors text-left flex items-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 opacity-0"></span>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <MobileNavLink href="/signin" isActive={pathname === '/signin'} onClick={() => setIsOpen(false)}>
                  Log in
                </MobileNavLink>
                <Link
                  href="/signup"
                  className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-center font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className={`${scrolled ? 'h-16' : 'h-20'} transition-all duration-300`}></div>
    </>
  );
}

// Desktop Navigation Link Component with subtle animation and active state
function NavLink({ href, children, isActive }) {
  return (
    <Link 
      href={href} 
      className={`relative py-2 transition-colors duration-300 group ${
        isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'
      }`}
    >
      {children}
      <span 
        className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-transform duration-300 origin-left ${
          isActive ? 'transform scale-x-100' : 'transform scale-x-0 group-hover:scale-x-100'
        }`}
      ></span>
    </Link>
  );
}

// Mobile Navigation Link Component with subtle animation and active state
function MobileNavLink({ href, onClick, children, isActive }) {
  return (
    <Link
      href={href}
      className={`px-2 py-2 rounded-lg transition-colors duration-300 flex items-center ${
        isActive ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <span 
        className={`w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 ${
          isActive ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
      ></span>
      {children}
    </Link>
  );
}
