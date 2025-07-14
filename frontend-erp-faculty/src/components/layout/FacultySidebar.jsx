import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  CreditCard,
  FileText,
  BookOpen,
  LogOut,
  ChevronRight,
  Users,
  GraduationCap,
  Calendar,
} from "lucide-react";
import { rolePermissionsAndRoutes } from "./rolePermissionsAndRoutes";

const globalStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const FacultySidebar = ({ isOpen, handleMenuClick, userData }) => {
  const location = useLocation();

  const menuItems = React.useMemo(() => [
    // Dashboard Section
    {
      title: "Dashboard",
      icon: <Home size={20} />,
      href: userData?.role === "cc" ? "/cc-dashboard" : "/dashboard",
      routeName: userData?.role === "cc" ? "cc_dashboard" : "dashboard",
      isSection: true,
      sectionTitle: "Main"
    },

    // Faculty Management Section
    {
      title: "Add Faculty",
      icon: <BookOpen size={20} />,
      href: "/dashboard/add-faculty",
      routeName: "add_faculty",
      isSection: true,
      sectionTitle: "Faculty Management"
    },
    {
      title: "View Faculties",
      icon: <Users size={20} />,
      href: "/dashboard/view-faculties",
      routeName: "view_faculties",
    },

    // Student Management Section
    {
      title: "Department Students",
      icon: <GraduationCap size={20} />,
      href: "/dashboard/department-students",
      routeName: "department_students",
      isSection: true,
      sectionTitle: "Student Management"
    },

    // Administrative Section
    {
      title: "Profile",
      icon: <User size={20} />,
      href: "/dashboard/faculty-profile",
      routeName: "faculty_profile",
      isSection: true,
      sectionTitle: "Personal"
    },
    {
      title: "Pay Slip",
      icon: <CreditCard size={20} />,
      href: "/dashboard/payslip",
      routeName: "payslip",
    },

    // Leave Management Section
    {
      title: "Apply Leave",
      icon: <FileText size={20} />,
      href: "/dashboard/applyleave",
      routeName: "apply_leave",
      isSection: true,
      sectionTitle: "Leave Management"
    },

    // Financial Section
    {
      title: "Payment",
      icon: <CreditCard size={20} />,
      href: "/dashboard/payment",
      routeName: "payment",
      isSection: true,
      sectionTitle: "Financial"
    },

    // Academic Section
    {
      title: "Academic Calendar",
      icon: <Calendar size={20} />,
      href: "/dashboard/academic-calendar",
      routeName: "academic_calendar",
      isSection: true,
      sectionTitle: "Academic"
    },

    // Communication Section
    {
      title: "Announcements",
      icon: <FileText size={20} />,
      href: "/dashboard/announcement",
      routeName: "announcement",
      isSection: true,
      sectionTitle: "Communication"
    },
  ], [userData?.role]);

  const rolePermissions = React.useMemo(() => {
    return rolePermissionsAndRoutes.reduce((acc, role) => {
      acc[role.role] = role.permissions;
      return acc;
    }, {});
  }, []);

  // Debug: Log the user role and available permissions (only in development and when userData changes)
  React.useEffect(() => {
    if (userData?.role && process.env.NODE_ENV === 'development') {
      console.log('User role:', userData?.role);
      console.log('Available permissions for user:', rolePermissions[userData?.role]);
      console.log('All role permissions:', rolePermissions);
    }
  }, [userData?.role, rolePermissions]);

  const filteredMenuItems = React.useMemo(() => {
    return menuItems.filter((item) => {
      // Make role checking case-insensitive
      const userRole = userData?.role?.toUpperCase();
      const permissions = rolePermissions[userRole] || rolePermissions[userData?.role] || [];
      return permissions.includes(item.routeName);
    });
  }, [userData?.role, rolePermissions, menuItems]);

  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed lg:relative lg:translate-x-0 z-50 h-full transition-transform duration-300 ease-in-out bg-gradient-to-br from-slate-700 via-gray-600 to-slate-600 shadow-2xl text-white`}
    >
      <style>{globalStyles}</style>
      <div className="flex flex-col h-full w-80 relative">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-emerald-600/10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -translate-y-16 translate-x-16 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full translate-y-20 -translate-x-20 blur-2xl pointer-events-none"></div>
        
        <div className="relative p-6 border-b border-slate-500/30 bg-gradient-to-r from-slate-600/90 to-gray-600/90 backdrop-blur-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl p-3 shadow-lg transition-all duration-300 hover:scale-110 bg-gradient-to-br from-blue-500 to-emerald-500 shadow-blue-400/30 hover:shadow-blue-400/50">
                <BookOpen className="text-white drop-shadow-sm" size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white transition-colors duration-300 drop-shadow-sm">
                  Faculty Management
                </h2>
                <p className="text-blue-200 text-sm font-medium">
                  Administrative Portal
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="relative flex-grow p-5 overflow-y-auto scrollbar-hide">
          <ul className="space-y-2">
            {filteredMenuItems.map((item, index) => (
              <li key={index}>
                {/* Section Header */}
                {item.isSection && item.sectionTitle && (
                  <div className="mt-6 mb-3 first:mt-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider px-3 text-blue-300 transition-colors duration-300 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-emerald-400 rounded-full"></div>
                      {item.sectionTitle}
                    </h3>
                    <hr className="mt-2 border-slate-500/40 transition-colors duration-300" />
                  </div>
                )}
                <Link
                  to={item.href}
                  onClick={() => handleMenuClick(item)}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] border ${
                    location.pathname === item.href
                      ? "bg-gradient-to-r from-blue-600/40 to-emerald-600/40 text-white shadow-lg shadow-blue-500/20 border-blue-400/30 backdrop-blur-sm"
                      : "border-transparent hover:bg-gradient-to-r hover:from-slate-600/60 hover:to-gray-600/60 hover:border-slate-500/30 hover:shadow-md hover:shadow-slate-400/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                      location.pathname === item.href
                        ? "bg-gradient-to-br from-blue-500/50 to-emerald-500/50 text-white shadow-md shadow-blue-400/30"
                        : "bg-gradient-to-br from-slate-500/50 to-gray-500/50 text-white group-hover:from-blue-500/50 group-hover:to-emerald-500/50 group-hover:shadow-md group-hover:shadow-blue-400/20"
                    }`}>
                      {item.icon}
                    </div>
                    <span className="font-medium text-base text-gray-100">{item.title}</span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="opacity-60 group-hover:opacity-90 group-hover:translate-x-1 transition-all duration-300 text-gray-300"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t border-slate-500/40 pt-6 transition-colors duration-300">
            <button
              onClick={() => handleMenuClick({ action: "logout" })}
              className="w-full text-left flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-red-600/30 hover:to-pink-600/30 transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-red-400/30"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/40 to-pink-500/40 text-white group-hover:from-red-500/60 group-hover:to-pink-500/60 transition-all duration-300 shadow-md shadow-red-400/30">
                <LogOut size={20} />
              </div>
              <span className="font-medium text-base text-gray-100">Logout</span>
            </button>
          </div>
        </nav>
        <div className="relative p-5 border-t border-slate-500/40 transition-colors duration-300">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-600/70 to-gray-600/70 border border-slate-500/30 transition-all duration-300 shadow-md hover:shadow-lg">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-500 transition-all duration-300 shadow-md shadow-blue-400/30">
              <User size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-white truncate">{userData?.email}</p>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
                  FM
                </span>
              </div>
              <p className="text-xs text-gray-300 transition-colors duration-300 font-medium">
                Faculty Management
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FacultySidebar);
