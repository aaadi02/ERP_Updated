import { Link } from "react-router-dom";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-4xl">📊</span>
            Reports & Analytics
          </h1>
          <p className="text-gray-600">Generate comprehensive financial and operational reports</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Monthly Report"
            value="Current Month"
            icon="📅"
            color="from-blue-500 to-indigo-600"
          />
          <StatCard
            title="Financial Summary"
            value="₹45,00,000"
            icon="💰"
            color="from-green-500 to-emerald-600"
          />
          <StatCard
            title="Student Reports"
            value="1,250 Active"
            icon="👨‍🎓"
            color="from-purple-500 to-violet-600"
          />
          <StatCard
            title="Faculty Reports"
            value="85 Members"
            icon="👨‍🏫"
            color="from-orange-500 to-red-600"
          />
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Reports */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="text-2xl">💼</span>
              Financial Reports
            </h2>
            <div className="space-y-4">
              <ReportItem
                title="Fee Collection Report"
                description="Student fee collection summary and pending amounts"
                link="/accounting/payments"
                icon="💳"
              />
              <ReportItem
                title="Expense Analysis"
                description="Department wise expense breakdown and analysis"
                link="/accounting/expenses"
                icon="💸"
              />
              <ReportItem
                title="Faculty Salary Report"
                description="Monthly salary, tax, and compliance reports"
                link="/faculty/salary"
                icon="💰"
              />
              <ReportItem
                title="Tax Reports"
                description="Income tax, PF, and other tax-related reports"
                link="/faculty/incometax"
                icon="📋"
              />
            </div>
          </div>

          {/* Operational Reports */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              Operational Reports
            </h2>
            <div className="space-y-4">
              <ReportItem
                title="Student Summary"
                description="Student enrollment, fee status, and academic reports"
                link="/students/details"
                icon="👨‍🎓"
              />
              <ReportItem
                title="Insurance Reports"
                description="Student insurance policies and claim reports"
                link="/students/insurance"
                icon="🏥"
              />
              <ReportItem
                title="Scholarship Reports"
                description="Scholarship disbursement and eligibility reports"
                link="/students/scholarship"
                icon="🎓"
              />
              <ReportItem
                title="Audit Reports"
                description="Financial audit trails and compliance reports"
                link="/accounting/audit"
                icon="🔍"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              title="Generate Monthly Report"
              description="Create comprehensive monthly financial report"
              icon="📊"
            />
            <QuickAction
              title="Export Data"
              description="Export financial data to Excel/PDF format"
              icon="📤"
            />
            <QuickAction
              title="Schedule Reports"
              description="Set up automated report generation"
              icon="⏰"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-3xl">{icon}</div>
      </div>
      <div className="text-sm opacity-80 font-medium">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ReportItem({ title, description, link, icon }) {
  return (
    <Link
      to={link}
      className="block p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <div className="text-xs text-blue-500 mt-2 group-hover:text-blue-700">
            Generate Report →
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ title, description, icon }) {
  return (
    <div className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer group">
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}
