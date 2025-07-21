import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Announcements from '../components/Announcements';
import Timetable from '../components/Timetable';
import Profile from '../components/Profile';
import Feedback from '../components/Feedback';
import Library from '../components/Library';
import MaterialList from '../components/MaterialList';
import StudentScholarship from '../components/StudentScholarship';
import StudentDashboard from './StudentDashboard';

const Dashboard = () => {
  const [section, setSection] = useState('announcements');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Get student data from localStorage (set during login)
    const storedStudentData = localStorage.getItem('studentData');
    if (storedStudentData) {
      try {
        const parsedData = JSON.parse(storedStudentData);
        setStudentData({
          _id: parsedData._id,
          name: `${parsedData.firstName} ${parsedData.middleName || ''} ${parsedData.lastName}`.trim(),
          department: parsedData.department?.name || 'N/A',
          email: parsedData.email || 'N/A',
          semester: parsedData.semester?.number || 'N/A',
          section: 'A', // Default section, you can modify this based on your data structure
          studentId: parsedData.studentId,
          enrollmentNumber: parsedData.enrollmentNumber,
          mobileNumber: parsedData.mobileNumber,
          stream: parsedData.stream?.name || 'N/A',
          photo: parsedData.photo
        });
      } catch (error) {
        console.error('Error parsing student data:', error);
        // If data is corrupted, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('studentData');
        window.location.href = '/login';
      }
    }
    setLoading(false);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 md:h-24 md:w-24 border-t-4 border-b-4 border-primary-600 shadow-glow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center animate-pulse-slow">
              <span className="text-white font-bold text-sm md:text-lg">N</span>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center px-4">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
            NIET Student Portal
          </h2>
          <p className="text-gray-600 animate-pulse text-sm md:text-base">Loading your dashboard...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <Sidebar
        setSection={setSection}
        isCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-gray-200/50 sticky top-0 z-30">
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="mr-3 sm:mr-4 p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center">
                  <h1 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </h1>
                  <div className="hidden sm:block ml-3 px-2 py-1 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full">
                    <span className="text-xs font-medium text-primary-700">{studentData.department}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden lg:flex items-center space-x-4 mr-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Semester</div>
                    <div className="text-sm font-semibold text-primary-600">{studentData.semester}</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>
                <button className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 group">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 animate-pulse"></span>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
                </button>
                <div className="flex items-center group cursor-pointer">
                  <div className="hidden sm:block text-right mr-3">
                    <div className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                      {studentData.name.split(' ')[0]}
                    </div>
                    <div className="text-xs text-gray-500">Student</div>
                  </div>
                  <div className="relative">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-medium shadow-soft group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                      {studentData.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {section === 'announcements' && (
              <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-600 rounded-2xl text-white shadow-card animate-slide-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold mb-1">
                      Welcome back, {studentData.name.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-primary-100 text-sm sm:text-base">
                      Ready to explore what's new in your student portal today?
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-6 flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{studentData.semester}</div>
                      <div className="text-xs text-primary-200">Semester</div>
                    </div>
                    <div className="w-px h-12 bg-primary-400"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{studentData.department}</div>
                      <div className="text-xs text-primary-200">Department</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="transition-all duration-500 ease-in-out transform">
              <div className="animate-fade-in">
                {section === 'announcements' && <Announcements />}
                {section === 'timetables' && (
                  <Timetable
                    department={studentData.department}
                    semester={studentData.semester}
                    section={studentData.section || 'A'}
                  />
                )}
                {section === 'profile' && <Profile />}
                {section === 'feedback' && <Feedback studentId={studentData._id} />}
                {section === 'library' && <Library studentId={studentData.studentId} />}
                {section === 'scholarship' && <StudentScholarship />}
                {section === 'busManagement' && <StudentDashboard />}
                {section === 'materials' && (
                  <div>
                    <h2 className="text-xl font-bold mb-2">Study Materials</h2>
                    <input
                      type="text"
                      placeholder="Enter subject name"
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="border p-2 mb-4"
                    />
                    {selectedSubject && <MaterialList subject={selectedSubject} />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 py-4 px-3 sm:px-6 lg:px-8 mt-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">
                  © {new Date().getFullYear()} NIET Student Portal. All rights reserved.
                </p>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6">
                <a href="#" className="text-xs sm:text-sm text-gray-500 hover:text-primary-600 transition-colors duration-200 hover:underline">Privacy Policy</a>
                <a href="#" className="text-xs sm:text-sm text-gray-500 hover:text-primary-600 transition-colors duration-200 hover:underline">Terms of Service</a>
                <a href="#" className="text-xs sm:text-sm text-gray-500 hover:text-primary-600 transition-colors duration-200 hover:underline">Contact Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
