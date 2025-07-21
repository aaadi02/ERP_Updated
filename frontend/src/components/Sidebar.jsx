
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Icon set for new look
const icons = {
  dashboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v6m4-6v6m5 2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2h14z" /></svg>
  ),
  students: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a7.5 7.5 0 0113 0" /></svg>
  ),
  accounting: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="4" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  faculty: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
  ),
  systems: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10v10H7z" /></svg>
  ),
};

export default function Sidebar() {
  const location = useLocation();
  const { faculty, logout, hasPermission, getUserRole } = useAuth();
  const [openSections, setOpenSections] = useState({
    students: true,
    accounting: false,
    faculty: false,
    systems: false,
  });
  const [collapsed, setCollapsed] = useState(false);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  const isActive = (to) => location.pathname === to;

  const handleLogout = () => {
    logout();
    window.location.href = "/"; // Redirect to login
  };

  // Updated color palette to match Dashboard
  const palette = {
    // Main Sidebar background matches Dashboard main bg
    bg: "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
    // Glass effect for depth
    glass: "bg-white/80 backdrop-blur-xl",
    // Border and shadow
    border: "border-indigo-100",
    // Accent and active states use Dashboard's blue/indigo
    accent: "text-indigo-600",
    hover: "hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-indigo-100/60 hover:text-indigo-800",
    active: "bg-gradient-to-r from-blue-200/80 to-indigo-200/80 text-indigo-900 ring-2 ring-indigo-300",
    section: "text-indigo-400",
    icon: "text-blue-400",
  };

  // Navigation structure with role-based filtering
  const nav = [
    {
      key: "dashboard",
      label: "Dashboard",
      to: "/",
      icon: icons.dashboard,
      roles: ["all"], // All roles can access dashboard
    },
    {
      key: "students",
      label: "Students",
      icon: icons.students,
      roles: ["Student Management", "Scholarship Management"],
      children: [
        { to: "/students/details", label: "Student Details", roles: ["Student Management"] },
        { to: "/students/insurance", label: "Insurance", roles: ["Student Management"] },
        { to: "/fee/heads", label: "Fee Heads", roles: ["Student Management"] },
        { to: "/students/scholarship", label: "Scholarship", roles: ["Student Management", "Scholarship Management"] },
      ],
    },
    {
      key: "accounting",
      label: "Accounting",
      icon: icons.accounting,
      roles: ["Account Section Management"],
      children: [
        { to: "/accounting/add-payment", label: "Add Payment", roles: ["Account Section Management"] },
        { to: "/accounting/expenses", label: "Expenses", roles: ["Account Section Management"] },
        { to: "/accounting/payments", label: "Payment History", roles: ["Account Section Management"] },
        { to: "/accounting/receipts", label: "Receipts", roles: ["Account Section Management"] },
        { to: "/accounting/audit", label: "Audit", roles: ["Account Section Management"] },
        { to: "/accounting/ledger", label: "Ledger", roles: ["Account Section Management"] },
      ],
    },
    {
      key: "faculty",
      label: "Faculty",
      icon: icons.faculty,
      roles: ["Account Section Management"], // For faculty salary management
      children: [
        { to: "/faculty/dashboard", label: "Faculty Dashboard", roles: ["Account Section Management"] },
        { to: "/faculty/salary", label: "Salary", roles: ["Account Section Management"] },
        { to: "/faculty/salary-slip", label: "Salary Slip", roles: ["Account Section Management"] },
        { to: "/faculty/incometax", label: "Income Tax", roles: ["Account Section Management"] },
        { to: "/faculty/pfproftax", label: "PF / Professional Tax", roles: ["Account Section Management"] },
        { to: "/faculty/gratuitytax", label: "Gratuity Tax", roles: ["Account Section Management"] },
        { to: "/faculty/compliance", label: "Compliance", roles: ["Account Section Management"] },
      ],
    },
    {
      key: "systems",
      label: "Management Systems",
      icon: icons.systems,
      roles: ["all"], // All roles can access these
      children: [
        { to: "/purchase", label: "SmartProcure", roles: ["all"] },
        { to: "/store", label: "StoreVault", roles: ["all"] },
        { to: "/maintenance", label: "MaintenancePro", roles: ["all"] },
      ],
    },
  ];

  // Filter navigation based on user role
  const userRole = getUserRole();
  const filteredNav = nav.filter(section => {
    if (section.roles.includes("all")) return true;
    if (section.roles.includes(userRole)) return true;
    return false;
  }).map(section => ({
    ...section,
    children: section.children?.filter(child => {
      if (child.roles.includes("all")) return true;
      if (child.roles.includes(userRole)) return true;
      return false;
    })
  }));

  return (
    <aside
      className={`z-40 h-screen ${palette.bg} ${palette.glass} ${palette.border} border-r shadow-2xl flex flex-col fixed top-0 left-0 transition-all duration-300 ${collapsed ? "w-16" : "w-64"} next-level-sidebar`}
      style={{ minWidth: collapsed ? 64 : 256 }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-7 py-7 border-b border-indigo-100 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-xl relative">
        <div className="absolute inset-0 bg-black opacity-10 rounded-t-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-t-3xl" />
        <div className="relative flex items-center gap-4 z-10">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-100 to-indigo-100 shadow-lg">
            <svg className="w-8 h-8 text-blue-400 drop-shadow-xl" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2" fill="none" /><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </span>
          {!collapsed && (
            <div>
              <span className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent tracking-wide drop-shadow-xl">AccDep</span>
              <div className="text-xs text-blue-100 tracking-widest mt-1">Accounting Portal</div>
            </div>
          )}
        </div>
        <button
          className="ml-2 p-2 rounded-full hover:bg-blue-100/60 text-blue-100 focus:outline-none border border-blue-200 shadow relative z-10"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Collapse sidebar"
        >
          <svg className={`w-6 h-6 transition-transform ${collapsed ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <ul className="space-y-3">
          {/* Dashboard */}
          <li>
            <Link
              to={filteredNav[0]?.to || "/"}
              className={`flex items-center gap-5 px-7 py-4 rounded-2xl font-bold text-xl transition-all duration-200 group relative bg-gradient-to-r ${isActive(filteredNav[0]?.to || "/") ? "from-blue-600 via-purple-600 to-indigo-700 text-white shadow-2xl ring-2 ring-indigo-300" : "from-white/5 to-white/0 text-indigo-700 hover:from-blue-100/40 hover:to-indigo-100/20 hover:text-indigo-900"}`}
            >
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 via-blue-100 to-indigo-100 group-hover:bg-blue-200/80 shadow transition-all">
                {filteredNav[0]?.icon || icons.dashboard}
              </span>
              {!collapsed && (filteredNav[0]?.label || "Dashboard")}
              {isActive(filteredNav[0]?.to || "/") && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
            </Link>
          </li>
          {/* Sections */}
          {filteredNav.slice(1).map((section) => (
            <li key={section.key} className="next-section">
              <button
                onClick={() => toggleSection(section.key)}
                className={`flex items-center w-full gap-4 px-7 py-3 mt-2 rounded-xl font-bold uppercase text-sm tracking-wider ${palette.section} hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-indigo-100/60 hover:text-indigo-800 focus:outline-none group transition-all shadow`}
                aria-expanded={openSections[section.key]}
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 via-blue-100 to-indigo-100 group-hover:bg-blue-200/80 shadow transition-all">
                  {section.icon}
                </span>
                {!collapsed && section.label}
                <svg className={`w-5 h-5 ml-auto transition-transform duration-200 ${openSections[section.key] ? "rotate-90" : "rotate-0"} ${collapsed ? "hidden" : "inline"}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Section links */}
              <div className={`overflow-hidden transition-all duration-300 ${openSections[section.key] && !collapsed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <ul className="pl-6 pr-2 py-2 space-y-2">
                  {section.children?.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`flex items-center gap-4 px-6 py-3 rounded-xl font-medium transition-all duration-200 group relative ${isActive(item.to) ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-lg ring-2 ring-indigo-300" : "bg-white/70 text-indigo-700 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-indigo-100/60 hover:text-indigo-900"}`}
                      >
                        <span className="inline-block w-2 h-2 rounded-full mr-2 bg-indigo-300/60 group-hover:bg-indigo-400/80 transition-all" />
                        {item.label}
                        {isActive(item.to) && <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Footer */}
      <div className="px-4 py-3 border-t border-indigo-100 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-inner relative">
        <div className="absolute inset-0 bg-black opacity-10 rounded-b-3xl" />
        
        {/* User Info */}
        {!collapsed && faculty && (
          <div className="relative z-10 mb-3 p-3 bg-white/10 rounded-lg backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {faculty.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {faculty.firstName} {faculty.lastName}
                </p>
                <p className="text-blue-200 text-xs truncate">
                  {faculty.designation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && "Logout"}
          </button>
          
          {!collapsed && (
            <div className="flex-1 text-right">
              <span className="text-xs text-blue-200">© {new Date().getFullYear()} AccDep</span>
            </div>
          )}
        </div>
      </div>

      {/* Animations & Custom Scrollbar */}
      <style>{`
        .next-level-sidebar {
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25), 0 1.5px 8px 0 rgba(0,255,255,0.08);
          border-top-right-radius: 2.5rem;
          border-bottom-right-radius: 2.5rem;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </aside>
  );
}

