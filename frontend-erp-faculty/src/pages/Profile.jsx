import { useState, useEffect } from "react";
import { User, Mail, Phone, Calendar, FileText, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserProfile = ({ userData }) => {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    employeeId: userData?.employeeId || "",
    title: userData?.title || "",
    firstName: userData?.firstName || "",
    middleName: userData?.middleName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    gender: userData?.gender || "",
    designation: userData?.designation || "",
    mobile: userData?.mobile || "",
    dateOfBirth: userData?.dateOfBirth || "",
    dateOfJoining: userData?.dateOfJoining || "",
    department: userData?.department || "",
    address: userData?.address || "",
    aadhaar: userData?.aadhaar || "",
    employmentStatus: userData?.employmentStatus || "Probation Period",
    type: userData?.type || "",
    teachingExperience: userData?.teachingExperience || 0,
    subjectsTaught: userData?.subjectsTaught || [],
    technicalSkills: userData?.technicalSkills || [],
    fathersName: userData?.fathersName || "",
    rfidNo: userData?.rfidNo || "",
    sevarthNo: userData?.sevarthNo || "",
    personalEmail: userData?.personalEmail || "",
  });

  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userData?.token) {
        setNotification("Please log in again");
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData?.token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const updatedProfile = {
            employeeId: data.employeeId || "",
            title: data.title || "",
            firstName: data.firstName || "",
            middleName: data.middleName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            gender: data.gender || "",
            designation: data.designation || "",
            mobile: data.mobile || "",
            dateOfBirth: data.dateOfBirth || "",
            dateOfJoining: data.dateOfJoining || "",
            department: data.department || "",
            address: data.address || "",
            aadhaar: data.aadhaar || "",
            employmentStatus: data.employmentStatus || "Probation Period",
            type: data.type || "",
            teachingExperience: data.teachingExperience || 0,
            subjectsTaught: data.subjectsTaught || [],
            technicalSkills: data.technicalSkills || [],
            fathersName: data.fathersName || "",
            rfidNo: data.rfidNo || "",
            sevarthNo: data.sevarthNo || "",
            personalEmail: data.personalEmail || "",
          };
          setProfileData(updatedProfile);
          const updatedUser = {
            ...JSON.parse(localStorage.getItem("user") || "{}"),
            ...updatedProfile,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          const errorData = await response.json();
          setError(
            `Failed to fetch profile: ${
              errorData.message || response.statusText
            }`
          );
          setNotification(
            `Failed to fetch profile: ${
              errorData.message || response.statusText
            }`
          );
          if (response.status === 401) {
            setNotification("Session expired. Please log in again.");
            localStorage.removeItem("user");
            localStorage.removeItem("authToken");
            navigate("/login");
          }
        }
      } catch (err) {
        setError(
          "Failed to connect to the server. Please check your network or server status."
        );
        setNotification("Failed to connect to the server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userData?.token, navigate]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const profileSections = [
    {
      id: "personal",
      title: "Personal Details",
      icon: <User size={20} className="text-white" />,
      fields: [
        {
          id: "employeeId",
          label: "Employee ID",
          icon: <Shield size={16} className="text-indigo-500" />,
        },
        {
          id: "title",
          label: "Title",
          icon: <User size={16} className="text-emerald-500" />,
        },
        {
          id: "firstName",
          label: "First Name",
          icon: <User size={16} className="text-emerald-500" />,
        },
        {
          id: "middleName",
          label: "Middle Name",
          icon: <User size={16} className="text-emerald-500" />,
        },
        {
          id: "lastName",
          label: "Last Name",
          icon: <User size={16} className="text-emerald-500" />,
        },
        {
          id: "gender",
          label: "Gender",
          icon: <User size={16} className="text-purple-500" />,
        },
        {
          id: "dateOfBirth",
          label: "Date of Birth",
          icon: <Calendar size={16} className="text-rose-500" />,
        },
        {
          id: "fathersName",
          label: "Father's Name",
          icon: <User size={16} className="text-slate-500" />,
        },
        {
          id: "aadhaar",
          label: "Aadhaar Number",
          icon: <FileText size={16} className="text-slate-500" />,
        },
        {
          id: "address",
          label: "Address",
          icon: <FileText size={16} className="text-slate-500" />,
        },
      ],
    },
    {
      id: "professional",
      title: "Professional Details",
      icon: <FileText size={20} className="text-white" />,
      fields: [
        {
          id: "designation",
          label: "Designation",
          icon: <FileText size={16} className="text-blue-500" />,
        },
        {
          id: "department",
          label: "Department",
          icon: <FileText size={16} className="text-blue-500" />,
        },
        {
          id: "dateOfJoining",
          label: "Date of Joining",
          icon: <Calendar size={16} className="text-purple-500" />,
        },
        {
          id: "employmentStatus",
          label: "Employment Type",
          icon: <FileText size={16} className="text-slate-500" />,
        },
        {
          id: "type",
          label: "Type",
          icon: <FileText size={16} className="text-slate-500" />,
        },
        {
          id: "teachingExperience",
          label: "Teaching Experience (Years)",
          icon: <FileText size={16} className="text-amber-500" />,
        },
        {
          id: "subjectsTaught",
          label: "Subjects Taught",
          icon: <FileText size={16} className="text-cyan-500" />,
        },
        {
          id: "technicalSkills",
          label: "Technical Skills",
          icon: <FileText size={16} className="text-emerald-500" />,
        },
      ],
    },
    {
      id: "identification",
      title: "Identification Details",
      icon: <Shield size={20} className="text-white" />,
      fields: [
        {
          id: "rfidNo",
          label: "RFID Number",
          icon: <Shield size={16} className="text-blue-500" />,
        },
        {
          id: "sevarthNo",
          label: "Sevarth Number",
          icon: <FileText size={16} className="text-slate-500" />,
        },
      ],
    },
    {
      id: "contact",
      title: "Contact Information",
      icon: <Phone size={20} className="text-white" />,
      fields: [
        {
          id: "email",
          label: "Work Email Address",
          icon: <Mail size={16} className="text-rose-500" />,
        },
        {
          id: "personalEmail",
          label: "Personal Email Address",
          icon: <Mail size={16} className="text-rose-500" />,
        },
        {
          id: "mobile",
          label: "Mobile Number",
          icon: <Phone size={16} className="text-blue-500" />,
        },
      ],
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="glass-effect-strong p-8 rounded-3xl shadow-2xl text-red-600 max-w-md w-full border border-red-200/30 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Access Error</h3>
            <p className="text-center text-sm font-medium text-slate-600 mb-6">{error}</p>
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderFieldValue = (value, fieldId) => {
    if (fieldId === "subjectsTaught") {
      return Array.isArray(value) && value.length > 0
        ? value.map((subject) => subject.name).join(", ")
        : "Not set";
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "Not set";
    }

    return value || "Not set";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.2); }
            50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.3); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
          .animate-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
          }
          .animate-slide-in {
            animation: slideIn 0.6s ease-out forwards;
          }
          .animate-glow {
            animation: glow 3s ease-in-out infinite;
          }
          .animate-pulse-soft {
            animation: pulse 4s ease-in-out infinite;
          }
          .glass-effect {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          .glass-effect-strong {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.4);
          }
          .gradient-border {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
            border: 1px solid rgba(99, 102, 241, 0.3);
          }
          .shimmer-effect {
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            background-size: 200px 100%;
            animation: shimmer 2s infinite;
          }
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-lift:hover {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        `}
      </style>

      {notification && (
        <div className="fixed top-4 right-4 glass-effect-strong border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-xl shadow-2xl flex items-center max-w-sm w-full z-50 animate-fade-in animate-glow">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="glass-effect-strong p-8 rounded-3xl shadow-2xl flex items-center space-x-4 animate-pulse-soft">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
            </div>
            <p className="text-slate-700 text-base font-semibold">
              Loading Profile...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="glass-effect-strong rounded-3xl shadow-2xl border border-white/30 mb-8 animate-fade-in hover-lift overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 shimmer-effect"></div>
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-glow">
                      <User size={36} className="text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      {`${profileData.title || ""} ${
                        profileData.firstName || ""
                      } ${profileData.middleName || ""} ${
                        profileData.lastName || ""
                      }`.trim() || "User Profile"}
                    </h1>
                    <p className="text-slate-600 text-base mt-2 font-medium">
                      {profileData.designation || "Not set"} • {profileData.department || "Not set"}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-slate-500">
                      <Calendar size={14} className="mr-1" />
                      Joined: {profileData.dateOfJoining ? new Date(profileData.dateOfJoining).toLocaleDateString() : "Not set"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="glass-effect rounded-xl px-4 py-3 flex items-center min-w-0">
                    <Mail size={18} className="text-indigo-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700 text-sm font-medium truncate">
                      {profileData.email || "Not set"}
                    </span>
                  </div>
                  <div className="glass-effect rounded-xl px-4 py-3 flex items-center min-w-0">
                    <Phone size={18} className="text-emerald-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700 text-sm font-medium truncate">
                      {profileData.mobile || "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-slate-50/90 via-indigo-50/90 to-purple-50/90 p-4 flex flex-wrap gap-4 border-t border-slate-200/50">
            <div className="flex items-center bg-white/80 rounded-lg px-3 py-2 shadow-sm">
              <Shield size={16} className="text-indigo-500 mr-2" />
              <span className="text-sm font-semibold text-slate-700">
                ID: {profileData.employeeId || "Not set"}
              </span>
            </div>
            <div className="flex items-center bg-white/80 rounded-lg px-3 py-2 shadow-sm">
              <FileText size={16} className="text-purple-500 mr-2" />
              <span className="text-sm font-semibold text-slate-700">
                Experience: {profileData.teachingExperience || 0} years
              </span>
            </div>
            <div className="flex items-center bg-white/80 rounded-lg px-3 py-2 shadow-sm">
              <User size={16} className="text-emerald-500 mr-2" />
              <span className="text-sm font-semibold text-slate-700">
                Status: {profileData.employmentStatus || "Not set"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-8">
          {profileSections.map((section, index) => (
            <div
              key={section.id}
              className="glass-effect-strong rounded-3xl shadow-xl border border-white/30 p-6 sm:p-8 transition-all duration-500 hover-lift animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/3 via-purple-500/3 to-pink-500/3 shimmer-effect"></div>
                <div className="relative">
                  <div className="flex items-center mb-6 pb-4 border-b border-slate-200/50">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {section.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {section.fields.length} field{section.fields.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {section.fields.map((field, fieldIndex) => (
                      <div 
                        key={field.id} 
                        className="group animate-slide-in"
                        style={{ animationDelay: `${(index * 150) + (fieldIndex * 50)}ms` }}
                      >
                        <div className="flex items-center mb-3 text-slate-600">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mr-3 group-hover:from-indigo-100 group-hover:to-purple-100 transition-all duration-300 shadow-sm">
                            {field.icon}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors duration-300">
                            {field.label}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="glass-effect rounded-xl p-4 border border-slate-200/50 transition-all duration-300 group-hover:border-indigo-300/50 group-hover:shadow-lg group-hover:bg-white/40 shadow-sm">
                            <p className="text-sm font-semibold text-slate-800 break-words leading-relaxed">
                              {field.id === "subjectsTaught"
                                ? Array.isArray(profileData.subjectsTaught) &&
                                  profileData.subjectsTaught.length > 0
                                  ? profileData.subjectsTaught
                                      .map((s) => s.name)
                                      .join(", ")
                                  : "Not set"
                                : renderFieldValue(profileData[field.id]) || "Not set"}
                            </p>
                          </div>
                          {/* Hover effect overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
