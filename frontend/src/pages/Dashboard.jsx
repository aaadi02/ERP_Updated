import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SystemStatus from "../components/SystemStatus";
import UnifiedAnalytics from "../components/UnifiedAnalytics";

export default function Dashboard() {
  const [data, setData] = useState({
    totalFeePaid: "Loading...",
    pendingFees: "Loading...",
    totalExpenses: "Loading...",
    facultySalary: "Loading...",
    storeItems: "Loading...",
    maintenanceRequests: "Loading...",
    departmentPurchases: "Loading...",
    taxStatus: "Loading...",
    facultyIncomeTax: "Loading...",
    facultyPF: "Loading...",
    facultyGratuity: "Loading...",
    facultyCompliance: "Loading...",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    
    // Faculty status fetch
    fetch("http://localhost:5000/api/faculty/status",{headers:{"Authorization": `Bearer ${localStorage.getItem("token")}`}})
      .then((res) => res.json())
      .then((res) => {
        // Format all faculty data to prevent object rendering errors
        const formatFacultyData = (data) => {
          if (typeof data === 'string' || typeof data === 'number') {
            return data;
          } else if (typeof data === 'object' && data !== null) {
            if (data.totalLiability !== undefined) {
              return `₹${Number(data.totalLiability).toLocaleString()} liability`;
            } else if (data.totalEmployeePF !== undefined) {
              return `₹${Number(data.totalEmployeePF).toLocaleString()} PF`;
            } else if (data.pfCompliant !== undefined) {
              return `${data.pfCompliant}/${data.totalEmployees} compliant`;
            } else {
              return JSON.stringify(data);
            }
          } else {
            return 'Loading...';
          }
        };

        setData((prev) => ({
          ...prev,
          facultySalary: `₹${Number(res.totalPaid || 0).toLocaleString()}`,
          facultyIncomeTax: formatFacultyData(res.incomeTax) || "No data",
          facultyPF: formatFacultyData(res.pf) || "No data",
          facultyGratuity: res.gratuity || 0,
          facultyCompliance: formatFacultyData(res.compliance) || "No data",
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          facultySalary: "Error",
          facultyIncomeTax: "Error",
          facultyPF: "Error",
          facultyGratuity: "Error",
          facultyCompliance: "Error",
        }));
      });

    // Student fees status fetch
    fetch("http://localhost:5000/api/students/fees/status",{headers:{"Authorization": `Bearer ${localStorage.getItem("token")}`}})
      .then((res) => res.json())
      .then((res) => {
                setData((prev) => ({
          ...prev,
          totalFeePaid: `₹${Number(res.totalFeePaid ?? 0).toLocaleString()}`,
          pendingFees: `₹${Number(res.pendingFees ?? 0).toLocaleString()}`,
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          totalFeePaid: "Error",
          pendingFees: "Error",
        }));
      });

    // Approved expenses total fetch
    fetch("http://localhost:5000/api/expenses/total/approved",{headers:{"Authorization": `Bearer ${localStorage.getItem("token")}`}})
      .then((res) => res.json())
      .then((res) => {
        setData((prev) => ({
          ...prev,
          totalExpenses: `₹${Number(res.total ?? 0).toLocaleString()}`,
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          totalExpenses: "Error",
        }));
      });

    // Store items fetch
    fetch("http://localhost:5000/api/store/items/count",{headers:{"Authorization": `Bearer ${localStorage.getItem("token")}`}})
      .then((res) => res.json())
      .then((res) => {
        setData((prev) => ({
          ...prev,
          storeItems: res.count || 0,
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          storeItems: "Error",
        }));
      });

    // Maintenance requests fetch
    fetch("http://localhost:5000/api/maintenance/requests/pending",{headers:{"Authorization": `Bearer ${localStorage.getItem("token")}`}})
      .then((res) => res.json())
      .then((res) => {
        setData((prev) => ({
          ...prev,
          maintenanceRequests: res.count || 0,
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          maintenanceRequests: "Error",
        }));
      });

    // Department purchases fetch
    fetch("http://localhost:5000/api/purchase/total",{headers:{"Authorization": `Bearer ${localStorage.getItem("token")}`}})
      .then((res) => res.json())
      .then((res) => {
        setData((prev) => ({
          ...prev,
          departmentPurchases: `₹${Number(res.total ?? 0).toLocaleString()}`,
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          departmentPurchases: "Error",
        }));
      });

    // Tax status fetch
    fetch("http://localhost:5000/api/compliance/tax-status",{headers:{"Authorization": `Bearer ${localStorage.getItem("token")}`}})
      .then((res) => res.json())
      .then((res) => {
        setData((prev) => ({
          ...prev,
          taxStatus: res.status || "Status unavailable",
        }));
      })
      .catch(() => {
        setData((prev) => ({
          ...prev,
          taxStatus: "Error",
        }));
      });
      
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return <DashboardLoader />;
  }
  console.log(data);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-ping"></div>
        </div>

        <div className="relative z-10 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2 tracking-tight">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Accounts
                  </span>
                  <span className="text-white"> Dashboard</span>
                </h1>
                <p className="text-xl text-blue-100 font-medium">
                  Complete Financial Management System
                </p>
                <p className="text-sm text-blue-200 mt-2">
                  📅 {formatTime(currentTime)}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <QuickActionButton 
                  icon="📊" 
                  label="Generate Report" 
                  color="bg-green-500 hover:bg-green-600"
                />
                <QuickActionButton 
                  icon="💰" 
                  label="New Payment" 
                  color="bg-purple-500 hover:bg-purple-600"
                />
                <QuickActionButton 
                  icon="🔄" 
                  label="Sync Data" 
                  color="bg-orange-500 hover:bg-orange-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* System Status with Modern Design */}
        {/* <div className="mb-8">
          <SystemStatus />
        </div> */}

        {/* Key Metrics Dashboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">📈</span>
            Key Performance Metrics
          </h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <ModernStatCard
              title="Total Fee Collected"
              value={data.totalFeePaid}
              icon="💵"
              trend="+12.5%"
              trendDirection="up"
              color="from-emerald-500 to-teal-600"
              delay="0"
            />
            <ModernStatCard
              title="Pending Fees"
              value={data.pendingFees}
              icon="⏳"
              trend="-8.2%"
              trendDirection="down"
              color="from-amber-500 to-orange-600"
              delay="100"
            />
            <ModernStatCard
              title="Total Expenses"
              value={data.totalExpenses}
              icon="💸"
              trend="+3.1%"
              trendDirection="up"
              color="from-red-500 to-pink-600"
              delay="200"
            />
            {/* <ModernStatCard
              title="Faculty Salary"
              value={data.facultySalary}
              icon="👥"
              trend="+5.7%"
              trendDirection="up"
              color="from-indigo-500 to-purple-600"
              delay="300"
            /> */}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <UnifiedAnalytics />
        </div>

        {/* Secondary Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            Operational Overview
          </h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <OperationalCard
              title="Store Inventory"
              value={data.storeItems}
              unit="items"
              icon="📦"
              color="bg-blue-500"
            />
            <OperationalCard
              title="Maintenance"
              value={data.maintenanceRequests}
              unit="tickets"
              icon="🔧"
              color="bg-yellow-500"
            />
            <OperationalCard
              title="Purchases"
              value={data.departmentPurchases}
              unit=""
              icon="🛒"
              color="bg-green-500"
            />
            <OperationalCard
              title="Tax Status"
              value="Current"
              unit=""
              icon="📋"
              color="bg-purple-500"
              subtitle={data.taxStatus}
            />
          </div>
        </div>

        {/* Faculty Management Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">👨‍🏫</span>
            Faculty Management
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ModernFacultyCard
              title="Salary Management"
              status={data.facultySalary}
              link="/faculty/salary"
              icon="💰"
              description="Monthly salary processing and records"
              color="from-green-400 to-emerald-600"
            />
            <ModernFacultyCard
              title="Income Tax"
              status={data.facultyIncomeTax}
              link="/faculty/incometax"
              icon="📊"
              description="Tax calculations and TDS management"
              color="from-blue-400 to-indigo-600"
            />
            <ModernFacultyCard
              title="PF & Professional Tax"
              status={data.facultyPF}
              link="/faculty/pfproftax"
              icon="🏦"
              description="Provident fund and tax deductions"
              color="from-purple-400 to-violet-600"
            />
            <ModernFacultyCard
              title="Gratuity Management"
              status={data.facultyGratuity}
              link="/faculty/gratuitytax"
              icon="🎁"
              description="Gratuity calculations and processing"
              color="from-orange-400 to-red-600"
            />
            <ModernFacultyCard
              title="Compliance Status"
              status={data.facultyCompliance}
              link="/faculty/compliance"
              icon="✅"
              description="Regulatory compliance tracking"
              color="from-teal-400 to-cyan-600"
            />
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            Quick Access
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <QuickLinkCard icon="👨‍🎓" label="Students" link="/students" color="bg-blue-500" />
            <QuickLinkCard icon="💳" label="Payments" link="/payments" color="bg-green-500" />
            <QuickLinkCard icon="📊" label="Reports" link="/reports" color="bg-purple-500" />
            <QuickLinkCard icon="🏪" label="Store" link="/store" color="bg-orange-500" />
            <QuickLinkCard icon="🔧" label="Maintenance" link="/maintenance" color="bg-red-500" />
            <QuickLinkCard icon="📈" label="Analytics" link="/analytics" color="bg-indigo-500" />
          </div>
        </div>

      </div>
    </div>
  );
}

// Loading Component
function DashboardLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <div className="text-2xl font-bold text-gray-700 mb-2">Loading Dashboard</div>
        <div className="text-gray-500">Preparing your financial overview...</div>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon, label, color = "bg-blue-500 hover:bg-blue-600" }) {
  return (
    <button className={`${color} text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-3 group`}>
      <span className="text-lg group-hover:animate-bounce">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Modern Stat Card Component
function ModernStatCard({ title, value, icon, trend, trendDirection, color, delay = "0" }) {
  return (
    <div 
      className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl opacity-80">{icon}</div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          trendDirection === 'up' ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
        }`}>
          {trendDirection === 'up' ? '📈' : '📉'} {trend}
        </div>
      </div>
      <div className="mb-2">
        <div className="text-sm opacity-80 font-medium">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div className="bg-white/60 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
      </div>
    </div>
  );
}

// Operational Card Component
function OperationalCard({ title, value, unit, icon, color, subtitle }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          <div className="text-sm text-gray-500">{unit}</div>
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-700 mb-1">{title}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

// Modern Faculty Card Component
function ModernFacultyCard({ title, status, link, icon, description, color }) {
  return (
    <Link
      to={link}
      className="block bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:border-blue-200 transform hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-all duration-300 shadow-lg`}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</div>
          <div className="text-sm font-bold text-blue-600 mt-1">{status}</div>
        </div>
      </div>
      
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-500 font-semibold group-hover:text-blue-700 transition-colors">
          View Details →
        </span>
        <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full group-hover:w-12 transition-all duration-300"></div>
      </div>
    </Link>
  );
}

// Quick Link Card Component
function QuickLinkCard({ icon, label, link, color }) {
  return (
    <Link
      to={link}
      className={`${color} text-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105 group`}
    >
      <div className="text-2xl mb-2 group-hover:animate-bounce">{icon}</div>
      <div className="text-sm font-semibold">{label}</div>
    </Link>
  );
}
