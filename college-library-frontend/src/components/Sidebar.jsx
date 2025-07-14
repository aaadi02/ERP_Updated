import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import {
  BookOpen,
  Users,
  BarChart2,
  PlusCircle,
  Activity,
  FileText,
  Menu,
  X,
  Book,
  ChevronRight,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import './Sidebar.css';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const getCurrentSection = () => {
    const path = location.pathname;
    if (path.includes('analytics')) return 'reports';
    if (path.includes('book')) return 'books';
    if (path.includes('student')) return 'students';
    if (path.includes('dues') || path.includes('actions')) return 'actions';
    if (path.includes('circulation')) return 'circulation';
    if (path.includes('management')) return 'management';
    return null;
  };

  const [activeSection, setActiveSection] = useState(getCurrentSection);

  useEffect(() => {
    setActiveSection(getCurrentSection());
  }, [location]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navItems = [
    { path: '/analytics', name: 'Analytics', icon: <BarChart2 size={20} />, section: 'reports' },
    { path: '/books', name: 'OPAC', icon: <BookOpen size={20} />, section: 'books' },
    { path: '/add-book', name: 'Accessioning & Catalogue', icon: <PlusCircle size={20} />, section: 'books' },
    { path: '/students', name: 'Students', icon: <Users size={20} />, section: 'students' },
    { path: '/faculty', name: 'Faculty', icon: <GraduationCap size={20} />, section: 'faculty' },
    { path: '/book-actions', name: 'Book Actions', icon: <Activity size={20} />, section: 'actions' },
    { path: '/borrower-entry', name: 'Borrower Entry', icon: <BookOpen size={20} />, section: 'actions' },
    { path: '/dues', name: 'Dues', icon: <FileText size={20} />, section: 'actions' },
    { path: '/payment-history', name: 'Payment History', icon: <FileText size={20} />, section: 'actions' },
  ];

  const sections = {
    reports: { name: 'Reports & Analytics', items: [] },
    books: { name: 'Acquisition and Catalogue', items: [] },
    students: { name: 'Student Management', items: [] },
    faculty: { name: 'Faculty Management', items: [] },
    actions: { name: 'Circullations', items: [] },
  };

  navItems.forEach(item => {
    if (sections[item.section]) {
      sections[item.section].items.push(item);
    }
  });

  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-72';
  const sidebarMobileClass = isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0';

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-full bg-blue-600 text-white shadow-lg focus:outline-none hover:bg-blue-700 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm"
          onClick={closeSidebar}
        ></div>
      )}

      <div
        className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl z-40 transition-all duration-300 ease-in-out
                    ${sidebarMobileClass} ${isMobile ? 'w-72' : sidebarWidthClass} flex flex-col`}
      >
        <button
          onClick={closeSidebar}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none p-1 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <div className={`p-4 flex ${isCollapsed ? 'justify-center' : 'items-center'} space-x-3 border-b border-gray-700/50`}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg shadow-glow">
            <Book size={24} />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Library System</h1>
              <p className="text-xs text-gray-400">Knowledge Management</p>
            </div>
          )}
        </div>

        <nav className={`mt-2 ${isCollapsed ? 'px-2' : 'px-4'} flex-1 overflow-hidden hover:overflow-y-auto scrollbar-hide`}>
          <div className="h-full pb-6">
            {Object.entries(sections).map(([key, section]) => (
              <div key={key} className="mb-4">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(key)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800/50"
                  >
                    <span>{section.name}</span>
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-200 ${activeSection === key ? 'rotate-90' : ''}`}
                    />
                  </button>
                )}

                <div className={`mt-1 space-y-1 ${isCollapsed
                    ? 'block'
                    : activeSection === key
                      ? 'block'
                      : 'hidden lg:block'}`}>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex ${isCollapsed ? 'justify-center' : 'items-center'} ${isCollapsed ? 'flex-col py-3' : 'px-4 py-2.5'} rounded-lg ${isCollapsed ? 'text-xs' : 'text-sm'} transition-all duration-200
                        ${isActive
                          ? `${isCollapsed ? 'bg-blue-600/20 border-l-4 border-blue-600' : 'bg-blue-600'} text-white font-medium ${isCollapsed ? '' : 'shadow-md shadow-blue-500/20'}`
                          : `text-gray-300 hover:bg-gray-700/50 hover:text-white ${isCollapsed ? 'hover:border-l-4 hover:border-blue-400' : ''}`}`
                      }
                    >
                      <span className={isCollapsed ? "mb-1" : "mr-3"}>{item.icon}</span>
                      <span className={isCollapsed ? 'text-[10px]' : ''}>{isCollapsed ? item.name.split(' ')[0] : item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-auto border-t border-gray-700/50 pt-2">
              <button
                onClick={handleLogout}
                className={`flex ${isCollapsed ? 'justify-center' : 'items-center'} ${isCollapsed ? 'flex-col py-3' : 'px-4 py-2.5'} rounded-lg ${isCollapsed ? 'text-xs' : 'text-sm'} transition-all duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white w-full`}
              >
                <span className={isCollapsed ? 'mb-1' : 'mr-3'}>
                  <LogOut size={20} />
                </span>
                <span className={isCollapsed ? 'text-[10px]' : ''}>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;