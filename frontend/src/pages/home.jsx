import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

// function HomeComponent() {


//     let navigate = useNavigate();
//     const [meetingCode, setMeetingCode] = useState("");


//     const {addToUserHistory} = useContext(AuthContext);
//     let handleJoinVideoCall = async () => {
//         // console.log(meetingCode);
//         await addToUserHistory(meetingCode)
//         navigate(`/${meetingCode}`)
//     }

//     return (
//         <>

//             <div className="navBar">

//                 <div style={{ display: "flex", alignItems: "center" }}>

//                     <h2>Apna Video Call</h2>
//                 </div>

//                 <div style={{ display: "flex", alignItems: "center" }}>
//                     <IconButton onClick={
//                         () => {
//                             navigate("/history")
//                         }
//                     }>
//                         <RestoreIcon />
//                     </IconButton>
//                     <p>History</p>

//                     <Button onClick={() => {
//                         localStorage.removeItem("token")
//                         navigate("/")
//                     }}>
//                         Logout
//                     </Button>
//                 </div>


//             </div>


//             <div className="meetContainer">
//                 <div className="leftPanel">
//                     <div>
//                         <h2>Providing Quality Video Call Just Like Quality Education</h2>

//                         <div style={{ display: 'flex', gap: "10px" }}>

//                             <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" />
//                             <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>

//                         </div>
//                     </div>
//                 </div>
//                 <div className='rightPanel'>
//                     <img srcSet='/logo3.png' alt="" />
//                 </div>
//             </div>
//         </>
//     )
// }


// export default withAuth(HomeComponent)
// import React, { useState } from 'react';

// Mock functions for demo
// const withAuth = (Component) => Component;
const mockAddToUserHistory = async (code) => console.log('Added to history:', code);

function HomeComponent() {
  const [meetingCode, setMeetingCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigation = useNavigate();

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;
    
    setIsLoading(true);
    try {
      await mockAddToUserHistory(meetingCode);
      handleNavigation(`/${meetingCode}`);
    } catch (error) {
      console.error('Error joining call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    handleNavigation("/");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinVideoCall();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                MeetHUB Video Call
              </h2>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-4">
              {/* History Button */}
              <button
                onClick={() => handleNavigation("/history")}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">History</span>
              </button>

              {/* Logout Button */}
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Panel - Content */}
          <div className="flex-1 max-w-2xl">
            <div className="space-y-8">
              {/* Welcome Section */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  Providing Quality Video Call Just Like Quality Education
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Connect with anyone, anywhere in the world with crystal-clear video quality and seamless performance.
                </p>
              </div>

              {/* Meeting Join Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Join a Meeting
                </h3>
                
                <div className="space-y-4">
                  {/* Meeting Code Input */}
                  <div>
                    <label htmlFor="meetingCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Code
                    </label>
                    <input
                      id="meetingCode"
                      type="text"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter meeting code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={handleJoinVideoCall}
                    disabled={!meetingCode.trim() || isLoading}
                    className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Meeting
                        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleNavigation("/create")}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">New Meeting</h4>
                      <p className="text-sm text-gray-600">Start an instant meeting</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigation("/schedule")}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Schedule</h4>
                      <p className="text-sm text-gray-600">Plan for later</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Visual */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main Illustration Container */}
              <div className="w-80 h-80 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-50 to-gray-100 rounded-3xl flex items-center justify-center shadow-lg">
                
                {/* Video Call Interface Mockup */}
                <div className="w-72 h-72 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">12:34 PM</div>
                  </div>

                  {/* Video Grid */}
                  <div className="flex-1 p-4">
                    <div className="grid grid-cols-2 gap-3 h-full">
                      {/* Video participant boxes */}
                      <div className="bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-blue-600 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 rounded-b-2xl">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-500 bg-opacity-20 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-6 -right-6 w-8 h-8 bg-gray-400 bg-opacity-30 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 -right-8 w-6 h-6 bg-green-500 bg-opacity-20 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-16">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <button
                onClick={() => handleNavigation("/history")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-sm text-gray-600">Meetings This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">5h 30m</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">12</div>
                <div className="text-sm text-gray-600">Contacts</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(HomeComponent);