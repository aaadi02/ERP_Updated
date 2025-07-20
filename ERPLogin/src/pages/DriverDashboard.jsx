// import React, { useState, useEffect } from 'react';
// import { Routes, Route, Link, Outlet } from 'react-router-dom';
// import Navbar from '../dashboard/common/Navbar';
// import { getCurrentUser } from '../services/authService';
// import './DriverDashboard.css';

// const DriverDashboard = () => {
//   const [activeTab, setActiveTab] = useState('bus-details');
//   const user = getCurrentUser();

//   return (
//     <div className="driver-dashboard">
//       <Navbar role="driver" />
//       <div className="dashboard-content">
//         <div className="sidebar">
//           <h3>Driver Panel</h3>
//           <nav>
//             <Link
//               to="bus-details"
//               className={activeTab === 'bus-details' ? 'active' : ''}
//               onClick={() => setActiveTab('bus-details')}
//             >
//               Bus Details
//             </Link>
//             <Link
//               to="route-info"
//               className={activeTab === 'route-info' ? 'active' : ''}
//               onClick={() => setActiveTab('route-info')}
//             >
//               Route Information
//             </Link>
//             <Link
//               to="schedule"
//               className={activeTab === 'schedule' ? 'active' : ''}
//               onClick={() => setActiveTab('schedule')}
//             >
//               Schedule
//             </Link>
//             <Link
//               to="profile"
//               className={activeTab === 'profile' ? 'active' : ''}
//               onClick={() => setActiveTab('profile')}
//             >
//               My Profile
//             </Link>
//           </nav>
//         </div>
//         <div className="main-content">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DriverDashboard;
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { getCurrentUser } from '../services/authService';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState('bus-details');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <h3 className="text-white text-lg font-bold">Driver Panel</h3>
          <button
            onClick={toggleSidebar}
            className="text-white lg:hidden"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <Link
              to="bus-details"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'bus-details' 
                  ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              onClick={() => {
                setActiveTab('bus-details');
                setIsSidebarOpen(false);
              }}
            >
              Bus Details
            </Link>
            
            <Link
              to="bus-routes"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'bus-routes' 
                  ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              onClick={() => {
                setActiveTab('bus-routes');
                setIsSidebarOpen(false);
              }}
            >
              Bus Routes
            </Link>
            
            <Link
              to="edit-routes"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'edit-routes' 
                  ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              onClick={() => {
                setActiveTab('edit-routes');
                setIsSidebarOpen(false);
              }}
            >
              Edit Routes
            </Link>
            
            <Link
              to="profile"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'profile' 
                  ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              onClick={() => {
                setActiveTab('profile');
                setIsSidebarOpen(false);
              }}
            >
              My Profile
            </Link>
            
            <Link
              to="help"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'help' 
                  ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`}
              onClick={() => {
                setActiveTab('help');
                setIsSidebarOpen(false);
              }}
            >
              Help
            </Link>
          </div>
        </nav>
        
        {/* Logout Button */}
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <FaBars size={20} />
              </button>
              <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
                College Bus Management - Driver
              </h1>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                Driver
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;