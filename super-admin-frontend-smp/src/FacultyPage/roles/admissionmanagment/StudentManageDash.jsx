import React, { useState } from "react";
import {
  Home,
  User,
  Files,
  LogOut,
  Menu,
  X,
  BookA,
  PackagePlus,
  FileText,
  Download,
} from "lucide-react";
import { Route, Routes, Link, useNavigate } from "react-router-dom";
import StudentList from "./StudentList";
import AdmissionForm from "./AdmissionForm";
import SummaryPage from "./SummaryPage";
import DownloadComponent from "./download";

const StudentManageDash = () => {
  // Check if current viewport is mobile on initial render
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  // Initialize sidebar as closed on mobile, open on desktop
  const [isOpen, setIsOpen] = useState(!isMobile);
  const navigate = useNavigate();

  // State for logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Menu items with icons
  const menuItems = [
    { title: "Summary", icon: <Home size={20} />, href: "/dashboard/summary" },
    {
      title: "Admission",
      icon: <FileText size={20} />,
      href: "/dashboard/admission",
    },
    {
      title: "Student List",
      icon: <PackagePlus size={20} />,
      href: "/dashboard/student-list",
    },
    {
      title: "Download",
      icon: <Download size={20} />,
      href: "/dashboard/download",
    },
  ];

  // Handle menu click (close sidebar on mobile + handle logout)
  const handleMenuClick = (item) => {
    if (window.innerWidth < 1024) toggleSidebar(); // Close sidebar on mobile

    if (item?.action === "logout") {
      // Show logout confirmation modal instead of logging out immediately
      setShowLogoutModal(true);
    }
  };

  // Handle logout confirmation
  const handleLogout = () => {
    // Clear the authentication tokens and redirect to the login page
    localStorage.removeItem("facultyToken");
    localStorage.removeItem("faculty");
    navigate("/faculty/rolelogin");
  };

  return (
    <>
      <div className="flex">
        {/* Sidebar + Content */}
        <div className="flex h-screen w-full">
          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 text-white z-20 flex items-center  justify-between px-4 shadow-md">
            <button
              onClick={toggleSidebar}
              className="p-2"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold">Student Panel</h2>
          </div>

          {/* Mobile overlay */}
          {isOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
              onClick={toggleSidebar}
            ></div>
          )}

          {/* Sidebar */}
          <div
            className={`${
              isOpen ? "translate-x-0" : "-translate-x-full"
            } fixed lg:relative lg:translate-x-0 z-10 h-full transition-transform duration-300 ease-in-out bg-gray-800 text-white shadow-lg`}
          >
            <div className="flex flex-col h-full w-64">
              {/* Sidebar Header - visible only on desktop */}
              <div className="p-5 border-b border-gray-700 hidden lg:block">
                <h2 className="text-2xl font-bold">Student Panel</h2>
              </div>

              {/* Sidebar Menu - add padding-top on mobile for the header */}
              <nav className="flex-grow p-5 lg:pt-5 pt-16 overflow-y-auto">
                <ul className="space-y-2">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        to={item.href}
                        onClick={() => handleMenuClick(item)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => handleMenuClick({ action: "logout" })}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          {/* Main Content - add padding-top on mobile for the header */}
          <div className="flex-grow p-4 pt-20 lg:pt-4 overflow-auto w-full">
            <Routes>
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/admission" element={<AdmissionForm />} />
              <Route path="/student-list" element={<StudentList />} />
  <Route path="/download" element={<DownloadComponent />} />

            </Routes>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl w-80 mx-4 transform transition-all duration-300 scale-100 animate-scaleIn">
            <div className="flex items-center mb-5">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full mr-3">
                <LogOut size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Logout
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to logout from your account?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentManageDash;