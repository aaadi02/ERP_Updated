import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  CreditCard,
  FileText,
  BookOpen,
  LogOut,
  ChevronRight,
  BookMarked,
  Calendar,
  Award,
  Users,
  MessageSquare,
  MessageCircle,
  ClipboardList,
  FolderOpen,
  Clock,
  Crown,
  TrendingUp,
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

const StaffSidebar = ({ isOpen, handleMenuClick, userData, onClose }) => {
  const location = useLocation();
  const [isCC, setIsCC] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Check CC status for teaching faculty
  useEffect(() => {
    const checkCCStatus = async () => {
      if (userData?.role !== "teaching") {
        setIsCC(false);
        return;
      }

      try {
        const department = userData.department
          ? userData.department
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : "";
        const facultyId = userData._id;

        if (!facultyId || !department) {
          console.warn("[SidebarCCStatus] Missing facultyId or department");
          return;
        }

        console.log("[SidebarCCStatus] Fetching for:", {
          facultyId,
          department,
        });
        const response = await fetch(
          `http://localhost:5000/api/faculty/cc-assignments?department=${encodeURIComponent(
            department
          )}`,
          {
            headers: {
              Authorization: `Bearer ${userData.token}`,
            },
          }
        );
        if (!response.ok) {
          console.warn("[SidebarCCStatus] API error:", response.status);
          return;
        }

        const data = await response.json();
        console.log("[SidebarCCStatus] API response:", data);
        const assignments = Array.isArray(data.data)
          ? data.data.filter((cc) => cc.facultyId === facultyId)
          : [];
        setIsCC(assignments.length > 0);
        console.log("[SidebarCCStatus] Is CC:", assignments.length > 0);
      } catch (err) {
        console.error("[SidebarCCStatus] Error:", err);
      }
    };

    checkCCStatus();
  }, [userData]);

  const roleDisplayNames = {
    director: "Director",
    principal: "Principal",
    HOD: "Head of Department",
    teaching: "Teacher",
    nonteaching: "Non-Teaching Staff",
    "non-teaching": "Non-Teaching Staff",
    facultymanagement: "Faculty Management",
  };

  const getAnnouncementRoute = (role) => {
    if (role === "HOD") return "/dashboard/compose-hod-announcement";
    if (role === "principal")
      return "/dashboard/compose-principal-announcement";
    if (role === "nonteaching" || role === "non-teaching")
      return "/dashboard/announcementnonteaching";
    return "/dashboard/announcement";
  };

  const getApproveLeaveRoute = (role) => {
    if (role === "principal") return "/dashboard/approveleavebyprincipal";
    return "/dashboard/approveleave";
  };

  const getAnnouncementTitle = (role) => {
    if (role === "HOD" || role === "principal") return "Compose Announcement";
    return "Announcements";
  };

  const getDashboardRoute = (role) => {
    if (role === "HOD") return "/hod-dashboard";
    if (role === "principal") return "/principal-dashboard";
    if (role === "cc") return "/cc-dashboard";
    return "/dashboard";
  };

  const getAllStaffRoute = (role) => {
    if (role === "HOD") return "/dashboard/departmentfaculty";
    return "/dashboard/allstaff";
  };

  const menuItems = [
    // Dashboard Section
    {
      title: "Dashboard",
      icon: <Home size={20} />,
      href: getDashboardRoute(userData?.role),
      routeName: userData?.role === "cc" ? "cc_dashboard" : "dashboard",
      isSection: true,
      sectionTitle: "Main",
    },

    // Personal Section
    {
      title: "Profile",
      icon: <User size={20} />,
      href: "/dashboard/profile",
      routeName: "profile",
      isSection: true,
      sectionTitle: "Personal",
    },
    {
      title: "Pay Slip",
      icon: <CreditCard size={20} />,
      href: "/dashboard/payslip",
      routeName: "payslip",
    },
    // Staff Management Section
    ...(userData?.role === "HOD"
      ? [
          {
            title: "Department Faculty",
            icon: <Users size={20} />,
            href: "/dashboard/departmentfaculty",
            routeName: "all_staff",
            isSection: true,
            sectionTitle: "Staff Management",
          },
          {
            title: "Department Students",
            icon: <Users size={20} />,
            href: "/dashboard/department-students",
            routeName: "department_students",
          },
          {
            title: "Academic Calendar",
            icon: <Calendar size={20} />,
            href: "/dashboard/academic-calendar",
            routeName: "academic_calendar",
          },
        ]
      : [
          {
            title: "All Staff",
            icon: <BookOpen size={20} />,
            href: getAllStaffRoute(userData?.role),
            routeName: "all_staff",
            isSection: true,
            sectionTitle: "Staff Management",
          },
          {
            title: "Department Students",
            icon: <Users size={20} />,
            href: "/dashboard/department-students",
            routeName: "department_students",
          },
        ]),
    // Communication Section
    {
      title: getAnnouncementTitle(userData?.role),
      icon: <MessageSquare size={20} />,
      href: getAnnouncementRoute(userData?.role),
      routeName:
        userData?.role === "HOD"
          ? "compose_hod_announcement"
          : userData?.role === "principal"
          ? "compose_principal_announcement"
          : userData?.role === "nonteaching" ||
            userData?.role === "non-teaching"
          ? "announcement_nonteaching"
          : "announcement",
      isSection: true,
      sectionTitle: "Communication",
    },
    // Student Feedback for HOD
    ...(userData?.role === "HOD"
      ? [
          {
            title: "Student Feedback",
            icon: <MessageCircle size={20} />,
            href: "/dashboard/student-feedback",
            routeName: "student_feedback",
          },
        ]
      : []),
    // Academic Management Section
    {
      title: "Fetched Timetable",
      icon: <Calendar size={20} />,
      href: "/dashboard/fetched-timetable",
      routeName: "fetched_timetable",
      isSection: true,
      sectionTitle: "Academic Management",
    },
    {
      title: "Timetable",
      icon: <BookMarked size={20} />,
      href: "/dashboard/timetable",
      routeName: "timetable",
    },
    {
      title: "Mark Attendance",
      icon: <User size={20} />,
      href: "/dashboard/markattendance",
      routeName: "mark_attendance",
    },
    // Leave Management Section
    {
      title: "Apply Leave",
      icon: <FileText size={20} />,
      href: "/dashboard/applyleave",
      routeName: "apply_leave",
      isSection: true,
      sectionTitle: "Leave Management",
    },
    // Approve Leave for Principal and HOD
    ...(userData?.role === "principal"
      ? [
          {
            title: "Approve Leave",
            icon: <ClipboardList size={20} />,
            href: "/dashboard/approveleavebyprincipal",
            routeName: "approve_leave",
          },
          {
            title: "Approve OD Leave",
            icon: <ClipboardList size={20} />,
            href: "/dashboard/approveodleave",
            routeName: "approve_od_leave",
          },
        ]
      : []),
    ...(userData?.role === "HOD"
      ? [
          {
            title: "Approve Leave",
            icon: <ClipboardList size={20} />,
            href: "/dashboard/approveleave",
            routeName: "approve_leave",
          },
        ]
      : []),
    {
      title: "Apply OD Leave",
      icon: <FileText size={20} />,
      href: "/dashboard/applyodleave",
      routeName: "apply_od_leave",
    },
    ...(userData?.role === "HOD"
      ? [
          {
            title: "Approve OD Leave",
            icon: <ClipboardList size={20} />,
            href: "/dashboard/approveodleave",
            routeName: "approve_od_leave",
          },
        ]
      : []),
    // Handover Management Section
    {
      title: "Apply Charge Handover",
      icon: <FolderOpen size={20} />,
      href: "/dashboard/applyChargeHandover",
      routeName: "apply_charge_handover",
      isSection: true,
      sectionTitle: "Handover Management",
    },
    ...(userData?.role === "HOD"
      ? [
          {
            title: "Approve Charge Handover",
            icon: <ClipboardList size={20} />,
            href: "/dashboard/approveChargeHandover",
            routeName: "approve_charge_handover",
          },
        ]
      : []),
    {
      title: "Sent Charge Handover",
      icon: <Clock size={20} />,
      href: "/dashboard/sentChargeHandover",
      routeName: "sent_charge_handover",
    },

    // Documents Section
    {
      title: "Notes & Documents",
      icon: <FileText size={20} />,
      href: "/dashboard/files",
      routeName: "files",
      isSection: true,
      sectionTitle: "Documents",
    },

    // Additional CC functionality for teaching staff with CC assignments
    ...(isCC && userData?.role === "teaching"
      ? [
          {
            title: "CC Functions",
            icon: <Award size={20} />,
            href: `/cc-dashboard/${userData._id}`,
            routeName: "cc_dashboard",
            isSection: true,
            sectionTitle: "Additional Functions",
          },
        ]
      : []),

    // CC-specific functionality for users with CC role
    ...(userData?.role === "cc"
      ? [
          {
            title: "Class Students",
            icon: <Users size={20} />,
            href: "/cc-class-students",
            routeName: "cc_class_students",
            isSection: true,
            sectionTitle: "Class Management",
          },
        ]
      : []),
  ];

  const rolePermissions = rolePermissionsAndRoutes.reduce((acc, role) => {
    acc[role.role] = role.permissions;
    return acc;
  }, {});

  const filteredMenuItems = menuItems.filter(
    (item) =>
      rolePermissions[userData?.role]?.includes(item.routeName) &&
      (!item.onlyTeaching || userData?.role === "teaching")
  );

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
                {userData?.role === "HOD" ? (
                  <Crown className="text-white drop-shadow-sm" size={26} />
                ) : userData?.role === "cc" ? (
                  <Award className="text-white drop-shadow-sm" size={26} />
                ) : (
                  <BookOpen className="text-white" size={26} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white transition-colors duration-300 drop-shadow-sm">
                  {userData?.role === "HOD"
                    ? "HOD Portal"
                    : userData?.role === "principal"
                    ? "Principal Portal"
                    : userData?.role === "cc"
                    ? "CC Portal"
                    : ["teaching", "nonteaching", "non-teaching"].includes(
                        userData?.role
                      )
                    ? "Staff Portal"
                    : "Admin Portal"}
                </h2>
                {userData?.role === "HOD" && (
                  <p className="text-blue-200 text-sm font-medium">
                    {userData?.department} Department
                  </p>
                )}
                {userData?.role === "cc" && (
                  <p className="text-blue-200 text-sm font-medium">
                    Course Coordinator
                    {userData?.department ? ` - ${userData?.department}` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <nav className="relative flex-grow p-5 overflow-y-auto scrollbar-hide">
          <ul className="space-y-2">
            {filteredMenuItems.map((item, index) => (
              <li key={index}>
                {/* Section Header for HOD */}
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
                    <div
                      className={`p-2.5 rounded-xl transition-all duration-300 ${
                        location.pathname === item.href
                          ? "bg-gradient-to-br from-blue-500/50 to-emerald-500/50 text-white shadow-md shadow-blue-400/30"
                          : "bg-gradient-to-br from-slate-500/50 to-gray-500/50 text-white group-hover:from-blue-500/50 group-hover:to-emerald-500/50 group-hover:shadow-md group-hover:shadow-blue-400/20"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className="font-medium text-base text-gray-100">
                      {item.title}
                    </span>
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
              <span className="font-medium text-base text-gray-100">
                Logout
              </span>
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
                <p className="text-sm font-semibold text-white truncate">
                  {userData?.email}
                </p>
                {userData?.role === "HOD" && (
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
                    HOD
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 transition-colors duration-300 font-medium">
                {roleDisplayNames[userData?.role]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSidebar;
