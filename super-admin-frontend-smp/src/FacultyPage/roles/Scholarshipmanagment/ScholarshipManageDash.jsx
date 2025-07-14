

import React, { useState, useEffect } from "react";
import {
  User,
  Users,
  FileText,
  CheckSquare,
  MessageSquare,
  LogOut,
  Menu,
  X,
  LayoutDashboard, // Added icon for Dashboard
} from "lucide-react";
import { Route, Routes, Link, useNavigate, Navigate, useLocation } from "react-router-dom";

// Import components
import StudentPursuing from "./StudentPursuing";
import StudentRecords from "./StudentRecords";
import ActionSection from "./ActionSection";
import RemarkSection from "./RemarkSection";
import StudentPage from "./StudentPage";
import DashboardScholarship from "./DashboardScholarship"; // Added import

const ScholarshipManageDash = () => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const [isOpen, setIsOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Redirect to dashboard if user is at the root scholarship path
  useEffect(() => {
    if (location.pathname === '/faculty/scholarship' || location.pathname === '/faculty/scholarship/') {
      navigate('/faculty/scholarship/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { title: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/faculty/scholarship/dashboard" }, // Added menu item
    { title: "Student Pursuing", icon: <User size={20} />, href: "/faculty/scholarship/student-pursuing" },
    { title: "Student Records", icon: <FileText size={20} />, href: "/faculty/scholarship/student-records" },
    { title: "Student Page", icon: <Users size={20} />, href: "/faculty/scholarship/student-page" },
    { title: "Action", icon: <CheckSquare size={20} />, href: "/faculty/scholarship/action" },
    { title: "Remark Section", icon: <MessageSquare size={20} />, href: "/faculty/scholarship/remark" },
  ];

  const handleMenuClick = (item) => {
    if (window.innerWidth < 1024) toggleSidebar();
    if (item?.action === "logout") {
      setShowLogoutModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("faculty");
    navigate("/");
  };

  return (
    <>
      <div className="flex">
        <div className="flex h-screen w-full">
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 text-white z-20 flex items-center justify-between px-4 shadow-md">
            <button
              onClick={toggleSidebar}
              className="p-2"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold">Scholarship Panel</h2>
          </div>

          {isOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
              onClick={toggleSidebar}
            ></div>
          )}

          <div
            className={`${isOpen ? "translate-x-0" : "-translate-x-full"} fixed lg:relative lg:translate-x-0 z-10 h-full transition-transform duration-300 ease-in-out bg-gray-800 text-white shadow-lg`}
          >
            <div className="flex flex-col h-full w-64">
              <div className="p-5 border-b border-gray-700 hidden lg:block">
                <h2 className="text-2xl font-bold">Scholarship Panel</h2>
              </div>

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

          <div className="flex-grow p-4 pt-20 lg:pt-4 overflow-auto w-full">
            <Routes>
              <Route path="/" element={<Navigate to="/faculty/scholarship/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardScholarship />} /> {/* Added route */}
              <Route path="/student-pursuing" element={<StudentPursuing />} />
              <Route path="/student-records" element={<StudentRecords />} />
              <Route path="/student-page" element={<StudentPage />} />
              <Route path="/action" element={<ActionSection />} />
              <Route path="/remark" element={<RemarkSection />} />
            </Routes>
          </div>
        </div>
      </div>

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

export default ScholarshipManageDash;