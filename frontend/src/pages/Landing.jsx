import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import isAuthenticated from '../utils/isAuthenticated'

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const authenticated=isAuthenticated();

  const handleNavigation = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token");
    handleNavigation("/");
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Navigation */}
      <nav className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <div className='flex-shrink-0'>
              <h2 className='text-xl font-semibold text-gray-900'>
                MeetHUB
              </h2>
            </div>

            {/* Desktop Navigation Links */}
            <div className='hidden md:flex items-center space-x-8'>
              <button
                onClick={() => handleNavigation('/aljk23')}
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
              >
                Join as Guest
              </button>
              <button
                onClick={() => handleNavigation('/auth')}
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
              >
                Register
              </button>
              { !authenticated &&(
                <button 
                onClick={() => handleNavigation('/auth')}
                className='bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200'
              >
                Login
              </button>
              )

              }
              
              { authenticated && (  // ✅ UPDATED
                  <div className="relative group">
                    <button
                      className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold"
                    >
                      U
                    </button>

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleNavigation("/history")}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        History
                      </button>

                      <button
                        onClick={
                          handleLogout
                        }
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}

            </div>

            {/* Mobile menu button */}
            <div className='md:hidden'>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='text-gray-600 hover:text-gray-900'
              >
                <svg
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className='md:hidden border-t border-gray-200 py-4'>
              <div className='flex flex-col space-y-3'>
                <button
                  onClick={() => handleNavigation('/aljk23')}
                  className='text-gray-600 hover:text-gray-900 px-3 py-2 text-left'
                >
                  Join as Guest
                </button>
                <button
                  onClick={() => handleNavigation('/auth')}
                  className='text-gray-600 hover:text-gray-900 px-3 py-2 text-left'
                >
                  Register
                </button>
                <button
                  onClick={() => handleNavigation('/auth')}
                  className='bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 mx-3'
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col lg:flex-row items-center justify-between py-12 lg:py-20'>
          {/* Content Section */}
          <div className='flex-1 lg:pr-12 mb-12 lg:mb-0'>
            <div className='max-w-2xl'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6'>
                <span className='text-blue-600'>Connect</span> with your
                <br />
                loved ones
              </h1>

              <p className='text-xl text-gray-600 mb-8 leading-relaxed'>
                Bridge any distance with high-quality video calls. Stay
                connected with family, friends, and colleagues from anywhere in
                the world.
              </p>

              <div className='flex flex-col sm:flex-row gap-4'>
              <Link to={isAuthenticated() ? '/home' : '/auth'}>
                <button
                  //   onClick={() => handleNavigation('/auth')}
                  className='inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-center'
                >
                  
                    Get Started
                  
                  <svg
                    className='ml-2 h-5 w-5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </button>
                </Link>

                <button
                  onClick={() => handleNavigation('/aljk23')}
                  className='inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200'
                >
                  Quick Join
                </button>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className='flex-1 flex justify-center lg:justify-end'>
            <div className='relative'>
              <div className='w-80 h-80 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-100 to-gray-100 rounded-3xl flex items-center justify-center shadow-xl'>
                <div className='w-64 h-80 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center border border-gray-200'>
                  {/* Phone mockup content */}
                  <div className='w-12 h-12 bg-blue-600 rounded-full mb-4 flex items-center justify-center'>
                    <svg
                      className='w-6 h-6 text-white'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  <div className='text-center px-4'>
                    <div className='w-32 h-2 bg-gray-200 rounded mb-2 mx-auto'></div>
                    <div className='w-24 h-2 bg-gray-200 rounded mb-6 mx-auto'></div>
                    <div className='grid grid-cols-3 gap-2 max-w-32 mx-auto'>
                      {[...Array(9)].map((_, i) => (
                        <div
                          key={i}
                          className='w-8 h-8 bg-gray-100 rounded-lg'
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className='absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full opacity-20 animate-pulse'></div>
              <div className='absolute -bottom-6 -right-6 w-12 h-12 bg-gray-400 rounded-full opacity-10 animate-pulse'></div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className='py-16 border-t border-gray-200'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Why Choose MeetHUB Video Call?
            </h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              Experience seamless video calling with features designed for the
              modern world
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Lightning Fast
              </h3>
              <p className='text-gray-600'>
                Connect instantly with optimized performance and minimal latency
                for crystal-clear conversations.
              </p>
            </div>

            <div className='text-center p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-6 h-6 text-green-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Secure & Private
              </h3>
              <p className='text-gray-600'>
                End-to-end encryption ensures your conversations stay private
                and secure at all times.
              </p>
            </div>

            <div className='text-center p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-6 h-6 text-purple-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Cross Platform
              </h3>
              <p className='text-gray-600'>
                Works seamlessly across all devices and platforms - desktop,
                mobile, and tablet.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='py-16 text-center'>
          <div className='bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12'>
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
              Ready to Connect?
            </h2>
            <p className='text-xl text-blue-100 mb-8 max-w-2xl mx-auto'>
              Join thousands of users who trust MeetHUB Video Call for their daily
              communication needs.
            </p>
            <Link to={isAuthenticated() ? '/home' : '/auth'}>
            <button
              //   onClick={() => handleNavigation('/auth')}
              className='bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center'
            >
              
                Start Your First Call
             
              <svg
                className='ml-2 h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </button>
             </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div className='col-span-1 md:col-span-2'>
              <h3 className='text-xl font-semibold mb-4'>MeetHUB Video Call</h3>
              <p className='text-gray-400 mb-4 max-w-md'>
                Connecting people worldwide with secure, high-quality video
                calling technology.
              </p>
            </div>

            <div>
              <h4 className='font-semibold mb-4'>Quick Links</h4>
              <ul className='space-y-2 text-gray-400'>
                <li>
                  <button
                    onClick={() => handleNavigation('/about')}
                    className='hover:text-white transition-colors'
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/features')}
                    className='hover:text-white transition-colors'
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/support')}
                    className='hover:text-white transition-colors'
                  >
                    Support
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className='font-semibold mb-4'>Legal</h4>
              <ul className='space-y-2 text-gray-400'>
                <li>
                  <button
                    onClick={() => handleNavigation('/privacy')}
                    className='hover:text-white transition-colors'
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/terms')}
                    className='hover:text-white transition-colors'
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className='border-t border-gray-800 mt-8 pt-8 text-center text-gray-400'>
            <p>© 2025 MeetHUB Video Call. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
