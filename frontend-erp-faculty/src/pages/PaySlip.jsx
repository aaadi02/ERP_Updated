import { useState, useEffect } from "react";
import axios from "axios";
import { User, CreditCard, DollarSign, Printer, X } from "lucide-react";

export default function SalarySlipPage({ userData }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Get employee ID from userData or use default
  const employeeId = userData?.employeeId || "NCNT003";

  // Fetch salary records for the specific employee
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/salary?employeeId=${employeeId}`
        );

        const data = Array.isArray(response.data) ? response.data : [];
        setRecords(data);

        // Automatically select the latest month
        if (data.length > 0) {
          const grouped = {};
          data.forEach((record) => {
            const date = new Date(record.paymentDate);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`;
            if (!grouped[monthYear]) {
              grouped[monthYear] = record;
            }
          });

          const latestMonth = Object.keys(grouped).sort((a, b) =>
            b.localeCompare(a)
          )[0];

          if (latestMonth) {
            setSelectedMonth(latestMonth);
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch salary records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [employeeId]);

  // Group records by month and year
  const getMonthlyRecords = () => {
    const grouped = {};
    records.forEach((record) => {
      const date = new Date(record.paymentDate);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      if (!grouped[monthYear]) {
        grouped[monthYear] = record;
      }
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // Get available months for dropdown
  const availableMonths = getMonthlyRecords().map(([monthYear]) => monthYear);

  // Get selected record for the salary slip
  const selectedRecord =
    getMonthlyRecords().find(
      ([monthYear]) => monthYear === selectedMonth
    )?.[1] || null;

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get avatar color
  const getAvatarColor = (name) => {
    const colors = [
      "bg-gradient-to-br from-purple-500 to-indigo-600",
      "bg-gradient-to-br from-blue-500 to-cyan-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-amber-600",
      "bg-gradient-to-br from-pink-500 to-rose-600",
    ];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render salary slip
  const renderSalarySlip = () => {
    if (!selectedRecord || !selectedMonth) {
      return (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <CreditCard className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-900">
            No salary slip available
          </h3>
          <p className="mt-1 text-slate-500">
            No salary slip found for the selected month.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 p-8 print:shadow-none print:border-none">
        <div className="flex justify-between items-center mb-8 print:mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 ${getAvatarColor(
                selectedRecord.name
              )} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md print:bg-gray-200 print:text-black`}
            >
              {getInitials(selectedRecord.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-600 print:text-black">
                Salary Slip
              </h2>
              <p className="text-sm text-slate-600">
                {selectedRecord.name} | {selectedMonth}
              </p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors print:hidden"
          >
            <Printer className="h-5 w-5" />
            Print Slip
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Information */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500 print:text-black" />
              Employee Details
            </h3>
            <div className="space-y-3">
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Employee ID:
                </span>{" "}
                {selectedRecord.employeeId}
              </p>
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Department:
                </span>{" "}
                {selectedRecord.department}
              </p>
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Designation:
                </span>{" "}
                {selectedRecord.designation}
              </p>
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Employee Type:
                </span>{" "}
                {selectedRecord.type}
              </p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-500 print:text-black" />
              Payment Details
            </h3>
            <div className="space-y-3">
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Payment Date:
                </span>{" "}
                {new Date(selectedRecord.paymentDate).toLocaleDateString()}
              </p>
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Payment Method:
                </span>{" "}
                {selectedRecord.paymentMethod}
              </p>
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Bank Account:
                </span>{" "}
                {selectedRecord.bankAccount || "N/A"}
              </p>
              <p>
                <span className="text-sm font-medium text-slate-500">
                  Status:
                </span>{" "}
                {selectedRecord.status}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500 print:text-black" />
              Earnings
            </h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Basic Salary</td>
                  <td className="py-2 text-sm text-slate-900 text-right">
                    ₹{selectedRecord.basicSalary?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">HRA</td>
                  <td className="py-2 text-sm text-slate-900 text-right">
                    ₹{selectedRecord.hra?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">DA</td>
                  <td className="py-2 text-sm text-slate-900 text-right">
                    ₹{selectedRecord.da?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Bonus</td>
                  <td className="py-2 text-sm text-slate-900 text-right">
                    ₹{selectedRecord.bonus?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-2 text-sm font-medium text-slate-800">
                    Gross Salary
                  </td>
                  <td className="py-2 text-sm font-medium text-slate-900 text-right">
                    ₹{selectedRecord.grossSalary?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500 print:text-black" />
              Deductions
            </h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Tax Deduction</td>
                  <td className="py-2 text-sm text-slate-900 text-right">
                    ₹{selectedRecord.taxDeduction?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">PF Deduction</td>
                  <td className="py-2 text-sm text-slate-900 text-right">
                    ₹{selectedRecord.pfDeduction?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600">
                    Other Deductions
                  </td>
                  <td className="py-2 text-sm text-slate-900 text-right">
                    ₹{selectedRecord.otherDeductions?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-2 text-sm font-medium text-slate-800">
                    Total Deductions
                  </td>
                  <td className="py-2 text-sm font-medium text-slate-900 text-right">
                    ₹
                    {(
                      (selectedRecord.taxDeduction || 0) +
                      (selectedRecord.pfDeduction || 0) +
                      (selectedRecord.otherDeductions || 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-500 print:text-black" />
            Net Salary
          </h3>
          <p className="text-2xl font-bold text-indigo-600 print:text-black">
            ₹{selectedRecord.netSalary?.toFixed(2) || "0.00"}
          </p>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-semibold text-slate-700">
            Loading salary records...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-red-500">
            <X className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600">{error}</p>
          <button
            className="mt-6 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-8">
          Salary Slip
        </h1>

        {/* Month Selection */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-indigo-50 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-48 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={availableMonths.length === 0}
            >
              <option value="">Select Month</option>
              {availableMonths.map((monthYear) => (
                <option key={monthYear} value={monthYear}>
                  {new Date(monthYear + "-01").toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary Slip */}
        {renderSalarySlip()}
      </div>
    </div>
  );
}
