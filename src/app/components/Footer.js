import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-purple-900 text-white pt-16 pb-8 relative overflow-hidden w-full z-10">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 mix-blend-overlay"></div>
      
      {/* Curved Top Edge - Fixed positioning */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320" 
          className="absolute -top-1 left-0 w-full"
          preserveAspectRatio="none"
          style={{ transform: 'rotateX(180deg)' }}
        >
          <path 
            fill="#ffffff" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
          </path>
        </svg>
      </div>
      
      <div className="w-full px-0 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 px-4 md:px-8">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <div className="relative w-14 h-14">
              <Image 
                src="/logo.png" 
                alt="IP Event" 
                width={56}
                height={56}
                className="object-contain w-14 h-14"
                unoptimized
              />
            </div>
            <p className="text-gray-300 max-w-md">Discover and experience the best events happening around you. Connect with like-minded people and create unforgettable memories.</p>
            <div className="flex space-x-4 pt-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-500 transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-500 transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-500 transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-500 transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10">Categories</span>
              <span className="absolute bottom-0 left-0 w-10 h-1 bg-gradient-to-r from-pink-500 to-purple-500"></span>
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-2"></span>All Events
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-2"></span>Music
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-2"></span>Sports
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-2"></span>Arts
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-2"></span>Photography
              </a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10">Resources</span>
              <span className="absolute bottom-0 left-0 w-10 h-1 bg-gradient-to-r from-pink-500 to-purple-500"></span>
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></span>User Guides
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></span>Help Center
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></span>Partners
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></span>News & Updates
              </a></li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10">Company</span>
              <span className="absolute bottom-0 left-0 w-10 h-1 bg-gradient-to-r from-pink-500 to-purple-500"></span>
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>About Us
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>Careers
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>Contact Us
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>Blog
              </a></li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-6 relative">
              <span className="relative z-10">Stay Connected</span>
              <span className="absolute bottom-0 left-0 w-10 h-1 bg-gradient-to-r from-pink-500 to-purple-500"></span>
            </h3>
            <p className="text-gray-300 mb-4">Subscribe to our newsletter for updates and exclusive offers</p>
            <div className="flex flex-col space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-gray-400"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center px-4 md:px-8">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <select className="bg-white/10 text-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-pink-500">
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
            </select>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} IP Event. All rights reserved.
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
} 