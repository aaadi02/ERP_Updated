import { useState, useEffect } from "react";
import {
  Route,
  Routes,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  Calendar,
  ClipboardList,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Palette,
  ChevronRight,
} from "lucide-react";

// Import components
import CasteManager from "./CasteManager";
import DepartmentManager from "./DepartmentManager";
import SubjectManager from "./SubjectManager";
import EventCalendar from "./EventCalendar";
import RoleAssignmentManager from "./RoleAssignmentManager";
import SemesterManager from "./SemesterManager";
import StreamManager from "./StreamManager";
import Dashboard from "./Dashboard";

const SuperAdminDashboard = () => {
  // Check if current viewport is mobile on initial render
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  // Initialize sidebar as closed on mobile, open on desktop
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove(
      "theme-light",
      "theme-dark",
      "theme-blue"
    );
    document.documentElement.classList.add(`theme-${theme}`);

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          "/api/superadmin",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user data");
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/");
        }
      }
    };

    fetchUser();

    // Add event listener to close sidebar on resize
    const handleResize = () => {
      if (window.innerWidth < 1024 && isOpen) {
        setIsOpen(false);
      } else if (window.innerWidth >= 1024 && !isOpen) {
        setIsOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [navigate, theme, isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Menu items with icons
  const menuItems = [
    {
      title: "Dashboard",
      icon: <Users size={20} />,
      href: "/super-admin/dashboard",
    },
    {
      title: "Manage Castes",
      icon: <Users size={20} />,
      href: "/super-admin/caste",
    },
    {
      title: "Manage Streams",
      icon: <Settings size={20} />,
      href: "/super-admin/stream",
    },

    {
      title: "Manage Departments",
      icon: <Briefcase size={20} />,
      href: "/super-admin/department",
    },
    {
      title: "Manage Subjects",
      icon: <BookOpen size={20} />,
      href: "/super-admin/subject",
    },
    {
      title: "Manage Semesters",
      icon: <GraduationCap size={20} />,
      href: "/super-admin/semester",
    },

    {
      title: "Academic Calendar",
      icon: <Calendar size={20} />,
      href: "/super-admin/calendar",
    },
    {
      title: "Assign Faculty Roles",
      icon: <ClipboardList size={20} />,
      href: "/super-admin/faculty-roles",
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
    // Clear the authentication token and redirect to the super admin login page
    localStorage.removeItem("token");
    localStorage.removeItem("theme");
    navigate("/super-admin-ved/login"); // Redirect to the super admin login page
  };

  // Check if menu item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Theme selector component
  const ThemeSelector = () => (
    <div className="px-4 py-3 border-b border-gray-700">
      <p className="text-sm font-medium mb-2 text-white">Select Theme</p>
      <div className="flex space-x-2">
        <button
          onClick={() => handleThemeChange("light")}
          className={`p-2 rounded-full ${
            theme === "light" ? "bg-gray-600" : ""
          }`}
          aria-label="Light theme"
        >
          <Sun className="w-5 h-5 text-yellow-500" />
        </button>
        <button
          onClick={() => handleThemeChange("dark")}
          className={`p-2 rounded-full ${
            theme === "dark" ? "bg-gray-600" : ""
          }`}
          aria-label="Dark theme"
        >
          <Moon className="w-5 h-5 text-gray-300" />
        </button>
        <button
          onClick={() => handleThemeChange("blue")}
          className={`p-2 rounded-full ${
            theme === "blue" ? "bg-gray-600" : ""
          }`}
          aria-label="Blue theme"
        >
          <Palette className="w-5 h-5 text-blue-500" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex">
        {/* Sidebar + Content */}
        <div className="flex h-screen w-full">
          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 text-white z-20 flex items-center justify-between px-4 shadow-md">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              aria-label="Toggle sidebar"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold">Super Admin Dashboard</h2>

            {/* User avatar in header for mobile */}
            {user && (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Semi-transparent overlay for mobile */}
          {isOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10"
              onClick={toggleSidebar}
            />
          )}

          {/* Sidebar - improved for mobile */}
          <div
            className={`${
              isOpen ? "translate-x-0" : "-translate-x-full"
            } fixed lg:relative lg:translate-x-0 z-20 h-full transition-transform duration-300 ease-in-out bg-gray-800 text-white shadow-lg lg:w-64 w-3/4 max-w-xs`}
          >
            <div className="flex flex-col h-full">
              {/* Small brand header for mobile */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="font-bold text-lg">Admin Panel</h2>
                <button
                  onClick={toggleSidebar}
                  className="p-1 rounded hover:bg-gray-700"
                  aria-label="Close sidebar"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* User info at top for mobile */}
              {user && (
                <div className="lg:hidden p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">
                        {user.username}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-green-400"></div>
                        <span className="text-xs text-gray-300">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Theme Selector */}
              <ThemeSelector />

              {/* Sidebar Menu */}
              <nav className="flex-grow p-4 overflow-y-auto">
                <ul className="space-y-3">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        to={item.href}
                        onClick={() => handleMenuClick(item)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                          isActive(item.href)
                            ? "bg-blue-600 text-white font-medium"
                            : "hover:bg-gray-700"
                        }`}
                        aria-current={isActive(item.href) ? "page" : undefined}
                      >
                        {item.icon}
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="mt-6">
                    <button
                      onClick={() => handleMenuClick({ action: "logout" })}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600/80 transition-colors duration-200 text-sm"
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
            {/* User info - visible only on desktop */}
            {user && (
              <div className="hidden lg:block mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 theme-blue:from-blue-600 theme-blue:to-indigo-700 rounded-xl shadow-lg overflow-hidden">
                  <div className="flex items-stretch">
                    {/* Left gradient section with avatar */}
                    <div className="py-6 px-8 flex items-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl shadow-inner border-4 border-white">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-400 border-2 border-white"></div>
                      </div>
                    </div>

                    {/* Right content section */}
                    <div className="flex-grow bg-white dark:bg-gray-800 theme-blue:bg-blue-50 pl-4 flex justify-between items-center">
                      <div className="flex flex-col">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 theme-blue:text-blue-500 font-medium mb-1">
                          Super Admin Dashboard
                        </div>
                        <div className="text-lg font-bold text-gray-800 dark:text-white theme-blue:text-blue-900">
                          Welcome back, {user.username}!
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 theme-blue:bg-blue-200 theme-blue:text-blue-800 rounded-full">
                            {user.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-100 theme-blue:bg-red-50 theme-blue:text-red-800">
                <p>{error}</p>
              </div>
            )}

            {/* Routes */}
            <div className="bg-white dark:bg-gray-800 theme-blue:bg-blue-50 rounded-lg shadow-md p-6">
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/caste" element={<CasteManager />} />
                <Route path="/stream" element={<StreamManager />} />

                <Route path="/department" element={<DepartmentManager />} />
                <Route path="/subject" element={<SubjectManager />} />
                <Route path="/semester" element={<SemesterManager />} />

                <Route path="/calendar" element={<EventCalendar />} />
                <Route
                  path="/faculty-roles"
                  element={<RoleAssignmentManager />}
                />
              </Routes>
            </div>
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

export default SuperAdminDashboard;
