import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  User,
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Edit,
  Printer,
} from "lucide-react";

export default function SalaryRecords() {
  const [records, setRecords] = useState([]);
  const [employeeSalaryHistory, setEmployeeSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedHistoricalRecord, setSelectedHistoricalRecord] =
    useState(null);
  const [viewMode, setViewMode] = useState(""); // "" for list, "details" for details view, "payment" for payment view, "historicalPayment" for historical payment view
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [filterType, setFilterType] = useState("all"); // "all" or "teaching"

  // Fetch all records for the list view
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/salary");
        setRecords(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch salary records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // Fetch individual record and salary history when selectedEmployeeId changes
  useEffect(() => {
    if (selectedEmployeeId) {
      const fetchRecord = async () => {
        setDetailLoading(true);
        try {
          const response = await axios.get(
            `http://localhost:5000/api/salary/${selectedEmployeeId}`
          );
          const record = {
            ...response.data,
            leaveStartDate: response.data.leaveStartDate || "",
            leaveEndDate: response.data.leaveEndDate || "",
          };
          setSelectedRecord(record);
          setEditFormData(record);

          // Filter salary history from records
          const history = records.filter(
            (record) => record.employeeId === selectedEmployeeId
          );
          setEmployeeSalaryHistory(
            history.sort(
              (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
            )
          );
        } catch (err) {
          setDetailError(
            err.response?.data?.message || "Failed to fetch record details."
          );
        } finally {
          setDetailLoading(false);
        }
      };

      fetchRecord();
    }
  }, [selectedEmployeeId, records]);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (editFormData.leaveStartDate) {
      const start = new Date(editFormData.leaveStartDate);
      if (start < today) {
        newErrors.leaveStartDate = "Leave Start Date cannot be before today";
      }
    }

    if (editFormData.leaveStartDate && editFormData.leaveEndDate) {
      const start = new Date(editFormData.leaveStartDate);
      const end = new Date(editFormData.leaveEndDate);
      if (start >= end) {
        newErrors.date = "Leave Start Date must be before End Date";
      }
    }

    return newErrors;
  };

  const handleViewDetails = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setViewMode("details");
    setIsEditing(false);
    setUpdateError("");
    setUpdateSuccess("");
    setValidationErrors({});
  };

  const handleViewPayment = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setViewMode("payment");
    setSelectedHistoricalRecord(null);
    setIsEditing(false);
    setUpdateError("");
    setUpdateSuccess("");
    setValidationErrors({});
  };

  const handleViewHistoricalPayment = (record) => {
    setSelectedHistoricalRecord(record);
    setViewMode("historicalPayment");
  };

  const handleBackToList = () => {
    setSelectedEmployeeId("");
    setSelectedRecord(null);
    setSelectedHistoricalRecord(null);
    setEmployeeSalaryHistory([]);
    setViewMode("");
    setDetailError("");
    setIsEditing(false);
    setUpdateError("");
    setUpdateSuccess("");
    setValidationErrors({});
  };

  const handleBackToPaymentDetails = () => {
    setSelectedHistoricalRecord(null);
    setViewMode("payment");
  };

  const handleEditRecord = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setViewMode("details");
    setIsEditing(true);
    setUpdateError("");
    setUpdateSuccess("");
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(selectedRecord);
    setUpdateError("");
    setValidationErrors({});
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (
      [
        "basicSalary",
        "hra",
        "da",
        "bonus",
        "overtimePay",
        "taxDeduction",
        "pfDeduction",
        "otherDeductions",
        "workingHours",
        "leaveDeduction",
      ].includes(name)
    ) {
      processedValue = value === "" ? 0 : parseFloat(value);
    }

    setEditFormData({
      ...editFormData,
      [name]: processedValue,
    });
  };

  const handleSaveEdit = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setValidationErrors(formErrors);
      return;
    }

    try {
      setUpdateError("");
      setUpdateSuccess("");
      setValidationErrors({});

      const response = await axios.put(
        `http://localhost:5000/api/salary/${selectedEmployeeId}`,
        editFormData
      );

      setSelectedRecord(response.data.record);
      setRecords(
        records.map((record) =>
          record.employeeId === selectedEmployeeId
            ? response.data.record
            : record
        )
      );
      setEmployeeSalaryHistory(
        employeeSalaryHistory.map((record) =>
          record.employeeId === selectedEmployeeId
            ? response.data.record
            : record
        )
      );

      setIsEditing(false);
      setUpdateSuccess("Record updated successfully!");

      setTimeout(() => {
        setUpdateSuccess("");
      }, 3000);
    } catch (err) {
      setUpdateError(err.response?.data?.message || "Failed to update record");
    }
  };

  // Function to generate payment slips for all faculties
  const handleGenerateAllPayslips = async () => {
    if (records.length === 0) {
      alert("No salary records found to generate payment slips.");
      return;
    }

    // Get unique employees count for confirmation
    const uniqueEmployeesForGeneration = records.reduce((acc, record) => {
      const shouldInclude = filterType === "all" || record.type === "teaching";
      if (shouldInclude && (!acc[record.employeeId] || new Date(record.paymentDate) > new Date(acc[record.employeeId].paymentDate))) {
        acc[record.employeeId] = record;
      }
      return acc;
    }, {});

    const employeeCount = Object.keys(uniqueEmployeesForGeneration).length;

    // Confirmation dialog
    const confirmGeneration = window.confirm(
      `Are you sure you want to generate payment slips for ${employeeCount} ${filterType === "teaching" ? "teaching faculty" : "employees"}?\n\nThis will open multiple print dialogs. Make sure your printer is ready.`
    );

    if (!confirmGeneration) {
      return;
    }

    setShowGenerationModal(true);
    setIsGeneratingPayslips(true);
    setGenerationProgress(0);

    try {
      const uniqueRecords = Object.values(uniqueEmployeesForGeneration);
      const totalRecords = uniqueRecords.length;

      // Generate payment slips for each employee
      for (let i = 0; i < uniqueRecords.length; i++) {
        const record = uniqueRecords[i];
        await generateIndividualPayslip(record);
        setGenerationProgress(Math.round(((i + 1) / totalRecords) * 100));
        
        // Add a small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setTimeout(() => {
        setIsGeneratingPayslips(false);
        setShowGenerationModal(false);
        setGenerationProgress(0);
        alert(`Successfully generated payment slips for ${totalRecords} ${filterType === "teaching" ? "teaching faculty" : "employees"}!`);
      }, 500);

    } catch (error) {
      console.error("Error generating payment slips:", error);
      setIsGeneratingPayslips(false);
      setShowGenerationModal(false);
      setGenerationProgress(0);
      alert("Error generating payment slips. Please try again.");
    }
  };

  // Function to generate individual payment slip
  const generateIndividualPayslip = async (record) => {
    return new Promise((resolve) => {
      // Create a printable payment slip
      const payslipWindow = window.open("", "_blank");
      const payslipHTML = generatePayslipHTML(record);
      
      payslipWindow.document.write(payslipHTML);
      payslipWindow.document.close();
      
      // Auto-print and close
      payslipWindow.onload = () => {
        payslipWindow.print();
        setTimeout(() => {
          payslipWindow.close();
          resolve();
        }, 500);
      };
    });
  };

  // Function to generate payment slip HTML
  const generatePayslipHTML = (record) => {
    const currentDate = new Date().toLocaleDateString();
    const paymentDate = new Date(record.paymentDate).toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Slip - ${record.name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          .company-name { 
            font-size: 18px; 
            font-weight: bold; 
            color: #333;
            margin-bottom: 5px;
          }
          .payslip-title { 
            font-size: 14px; 
            color: #666;
          }
          .employee-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 10px;
            background-color: #f9f9f9;
          }
          .employee-info div { 
            flex: 1; 
          }
          .salary-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          .salary-table th, .salary-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          .salary-table th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .earnings { 
            background-color: #e8f5e8;
          }
          .deductions { 
            background-color: #ffe8e8;
          }
          .net-pay { 
            background-color: #e8f4fd; 
            font-weight: bold;
          }
          .footer { 
            margin-top: 30px; 
            border-top: 1px solid #ddd; 
            padding-top: 10px; 
            text-align: center; 
            color: #666;
            font-size: 10px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Faculty Management System</div>
          <div class="payslip-title">SALARY SLIP</div>
        </div>
        
        <div class="employee-info">
          <div>
            <strong>Employee ID:</strong> ${record.employeeId}<br>
            <strong>Name:</strong> ${record.name}<br>
            <strong>Department:</strong> ${record.department}<br>
            <strong>Designation:</strong> ${record.designation}
          </div>
          <div>
            <strong>Pay Period:</strong> ${paymentDate}<br>
            <strong>Payment Date:</strong> ${paymentDate}<br>
            <strong>Employee Type:</strong> ${record.type}<br>
            <strong>Status:</strong> ${record.status}
          </div>
        </div>
        
        <table class="salary-table">
          <thead>
            <tr>
              <th colspan="2" class="earnings">EARNINGS</th>
              <th colspan="2" class="deductions">DEDUCTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>₹${record.basicSalary?.toFixed(2) || '0.00'}</td>
              <td>Tax Deduction</td>
              <td>₹${record.taxDeduction?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr>
              <td>HRA</td>
              <td>₹${record.hra?.toFixed(2) || '0.00'}</td>
              <td>PF Deduction</td>
              <td>₹${record.pfDeduction?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr>
              <td>DA</td>
              <td>₹${record.da?.toFixed(2) || '0.00'}</td>
              <td>Other Deductions</td>
              <td>₹${record.otherDeductions?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr>
              <td>Bonus</td>
              <td>₹${record.bonus?.toFixed(2) || '0.00'}</td>
              <td>Leave Deduction</td>
              <td>₹${record.leaveDeduction?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr>
              <td>Overtime Pay</td>
              <td>₹${record.overtimePay?.toFixed(2) || '0.00'}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td><strong>Total Earnings</strong></td>
              <td><strong>₹${record.grossSalary?.toFixed(2) || '0.00'}</strong></td>
              <td><strong>Total Deductions</strong></td>
              <td><strong>₹${((record.taxDeduction || 0) + (record.pfDeduction || 0) + (record.otherDeductions || 0) + (record.leaveDeduction || 0)).toFixed(2)}</strong></td>
            </tr>
            <tr class="net-pay">
              <td colspan="3"><strong>NET PAY</strong></td>
              <td><strong>₹${record.netSalary?.toFixed(2) || '0.00'}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 20px;">
          <strong>Payment Method:</strong> ${record.paymentMethod || 'Bank Transfer'}<br>
          <strong>Bank Account:</strong> ${record.bankAccount || 'N/A'}<br>
          <strong>Working Hours:</strong> ${record.workingHours || 'N/A'}
        </div>
        
        <div class="footer">
          <p>This is a computer-generated salary slip. No signature required.</p>
          <p>Generated on: ${currentDate}</p>
        </div>
      </body>
      </html>
    `;
  };

  const filteredRecords = Array.isArray(records)
    ? records.filter(
        (record) => {
          // Apply search filter
          const matchesSearch = record.employeeId?.includes(searchTerm) ||
            record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.department?.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Apply type filter
          const matchesType = filterType === "all" || record.type === "teaching";
          
          return matchesSearch && matchesType;
        }
      )
    : [];

  // Calculate unique employees for payment slip generation and display
  const allUniqueEmployees = records.reduce((acc, record) => {
    if (!acc[record.employeeId] || new Date(record.paymentDate) > new Date(acc[record.employeeId].paymentDate)) {
      acc[record.employeeId] = record;
    }
    return acc;
  }, {});
  
  const uniqueEmployeeCount = Object.keys(allUniqueEmployees).length;

  // Calculate filtered unique employees based on filter type
  const filteredUniqueEmployeesForStats = records.filter(record => 
    filterType === "all" || record.type === "teaching"
  ).reduce((acc, record) => {
    if (!acc[record.employeeId] || new Date(record.paymentDate) > new Date(acc[record.employeeId].paymentDate)) {
      acc[record.employeeId] = record;
    }
    return acc;
  }, {});
  
  const filteredUniqueEmployeeCount = Object.keys(filteredUniqueEmployeesForStats).length;

  // Get unique employees from filtered records for display
  const filteredUniqueEmployees = filteredRecords.reduce((acc, record) => {
    if (!acc[record.employeeId] || new Date(record.paymentDate) > new Date(acc[record.employeeId].paymentDate)) {
      acc[record.employeeId] = record;
    }
    return acc;
  }, {});

  const displayRecords = Object.values(filteredUniqueEmployees);

  // Calculate salary history and next month's projection
  const lastPaymentDate =
    employeeSalaryHistory.length > 0
      ? new Date(employeeSalaryHistory[0].paymentDate)
      : null;

  const totalSalaryFromJoining = employeeSalaryHistory.reduce(
    (sum, record) => sum + (record.netSalary || 0),
    0
  );

  let nextPaymentDate = null;
  let daysRemaining = null;
  const today = new Date("2025-05-15");
  today.setHours(0, 0, 0, 0);

  if (lastPaymentDate) {
    nextPaymentDate = new Date(lastPaymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    if (nextPaymentDate.getDate() !== lastPaymentDate.getDate()) {
      nextPaymentDate.setDate(0);
    }

    const timeDiff = nextPaymentDate - today;
    daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      const newTimeDiff = nextPaymentDate - today;
      daysRemaining = Math.ceil(newTimeDiff / (1000 * 60 * 60 * 24));
    }
  }

  const nextMonthSalary = selectedRecord ? selectedRecord.netSalary : 0;

  const allSalaryRecords = [
    ...employeeSalaryHistory.map((record) => ({
      ...record,
      status: "Paid",
      paymentDate: new Date(record.paymentDate),
    })),
    ...(nextPaymentDate && selectedRecord
      ? [
          {
            _id: "projected",
            employeeId: selectedRecord.employeeId,
            netSalary: nextMonthSalary,
            paymentDate: nextPaymentDate,
            status: "Projected",
          },
        ]
      : []),
  ].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  // Generate random colors for avatars
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

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Historical Payment Details View
  const renderHistoricalPaymentDetails = () => {
    if (!selectedHistoricalRecord) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${getAvatarColor(
                      selectedHistoricalRecord.name
                    )} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {getInitials(selectedHistoricalRecord.name)}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">
                      Historical Payment Details
                    </h1>
                    <p className="text-indigo-100 text-xs">
                      Employee ID: {selectedHistoricalRecord.employeeId} |
                      Payment Date:{" "}
                      {new Date(
                        selectedHistoricalRecord.paymentDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Payment Details */}
                <div className="space-y-4">
                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleBackToPaymentDetails}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition duration-200 text-xs"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Payment Details
                    </button>
                  </div>

                  {/* Employee Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Employee Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Name
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedHistoricalRecord.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Department
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedHistoricalRecord.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Designation
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedHistoricalRecord.designation}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Employee Type
                        </p>
                        <p className="text-xs text-slate-900 capitalize">
                          {selectedHistoricalRecord.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                      Payment Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Payment Date
                        </p>
                        <p className="text-xs text-slate-900">
                          {new Date(
                            selectedHistoricalRecord.paymentDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Payment Method
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedHistoricalRecord.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Bank Account
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedHistoricalRecord.bankAccount || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Status
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedHistoricalRecord.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-500" />
                      Salary Summary
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-1 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-3 py-1 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              Amount (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Gross Salary
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedHistoricalRecord.grossSalary.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Tax Deduction
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹
                              {selectedHistoricalRecord.taxDeduction.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              PF Deduction
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedHistoricalRecord.pfDeduction.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Other Deductions
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹
                              {selectedHistoricalRecord.otherDeductions.toFixed(
                                2
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Leave Deduction
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹
                              {selectedHistoricalRecord.leaveDeduction.toFixed(
                                2
                              )}
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="px-3 py-1 text-xs font-medium text-slate-900">
                              Total Deductions
                            </td>
                            <td className="px-3 py-1 text-xs font-medium text-slate-900 text-right">
                              ₹
                              {(
                                selectedHistoricalRecord.taxDeduction +
                                selectedHistoricalRecord.pfDeduction +
                                selectedHistoricalRecord.otherDeductions +
                                selectedHistoricalRecord.leaveDeduction
                              ).toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Net Salary
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedHistoricalRecord.netSalary.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column: Summary */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                      Payment Summary
                    </h2>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-medium text-slate-500">
                          Payment Date
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">
                          {new Date(
                            selectedHistoricalRecord.paymentDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-medium text-slate-500">
                          Net Salary
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">
                          ₹{selectedHistoricalRecord.netSalary.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-medium text-slate-500">
                          Status
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">
                          {selectedHistoricalRecord.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Payment Details View
  const renderPaymentDetails = () => {
    if (detailLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-base font-semibold text-slate-700">
              Loading payment details...
            </div>
          </div>
        </div>
      );
    }

    if (detailError) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 text-red-500">
              <X className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-center text-red-600 mb-2">
              Error
            </h2>
            <div className="text-slate-600 text-xs text-center">
              {detailError}
            </div>
            <button
              className="mt-4 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-xs"
              onClick={handleBackToList}
            >
              Back to Records
            </button>
          </div>
        </div>
      );
    }

    if (!selectedRecord) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${getAvatarColor(
                      selectedRecord.name
                    )} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {getInitials(selectedRecord.name)}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">
                      Payment Details
                    </h1>
                    <p className="text-indigo-100 text-xs">
                      Employee ID: {selectedRecord.employeeId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Existing Data */}
                <div className="space-y-4">
                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleBackToList}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition duration-200 text-xs"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Records
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("details");
                        setIsEditing(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-xs"
                    >
                      <User className="h-4 w-4" />
                      View Full Details
                    </button>
                  </div>

                  {/* Employee Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Employee Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Name
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Department
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Designation
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.designation}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Employee Type
                        </p>
                        <p className="text-xs text-slate-900 capitalize">
                          {selectedRecord.type}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Payment Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                      Payment Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Payment Date
                        </p>
                        <p className="text-xs text-slate-900">
                          {new Date(
                            selectedRecord.paymentDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Payment Method
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Bank Account
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.bankAccount || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Status
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-500" />
                      Salary Summary
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-1 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-3 py-1 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              Amount (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Gross Salary
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedRecord.grossSalary.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Tax Deduction
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedRecord.taxDeduction.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              PF Deduction
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedRecord.pfDeduction.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Other Deductions
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedRecord.otherDeductions.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Leave Deduction
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedRecord.leaveDeduction.toFixed(2)}
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="px-3 py-1 text-xs font-medium text-slate-900">
                              Total Deductions
                            </td>
                            <td className="px-3 py-1 text-xs font-medium text-slate-900 text-right">
                              ₹
                              {(
                                selectedRecord.taxDeduction +
                                selectedRecord.pfDeduction +
                                selectedRecord.otherDeductions +
                                selectedRecord.leaveDeduction
                              ).toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1 text-xs text-slate-900">
                              Net Salary
                            </td>
                            <td className="px-3 py-1 text-xs text-slate-900 text-right">
                              ₹{selectedRecord.netSalary.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column: Salary History */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      Salary History
                    </h2>
                    <div className="space-y-3">
                      {/* Total Salary from Joining */}
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-medium text-slate-500">
                          Total Salary Since Joining
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">
                          ₹{totalSalaryFromJoining.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Based on all recorded payments
                        </p>
                      </div>

                      {/* Next Month's Salary Details */}
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-xs font-medium text-slate-500">
                          Next Month's Projected Salary
                        </p>
                        <p className="text-sm font-semibold text-indigo-600">
                          ₹{nextMonthSalary.toFixed(2)}
                        </p>
                        {lastPaymentDate && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            Last Salary Paid:{" "}
                            {lastPaymentDate.toLocaleDateString()}
                          </p>
                        )}
                        {daysRemaining !== null && nextPaymentDate && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            Days Remaining: {daysRemaining} (Expected on{" "}
                            {nextPaymentDate.toLocaleDateString()})
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          Based on current net salary (subject to changes)
                        </p>
                      </div>

                      {/* Monthly Salary Records */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-800 mb-2">
                          Monthly Salary Records
                        </h3>
                        {allSalaryRecords.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No salary records found for this employee.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-3 py-1 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                    Payment Date
                                  </th>
                                  <th className="px-3 py-1 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                    Net Salary (₹)
                                  </th>
                                  <th className="px-3 py-1 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-3 py-1 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                {allSalaryRecords.map((record) => (
                                  <tr
                                    key={record._id}
                                    className={
                                      record.status === "Projected"
                                        ? "bg-indigo-50"
                                        : ""
                                    }
                                  >
                                    <td className="px-3 py-1 text-xs text-slate-900">
                                      {new Date(
                                        record.paymentDate
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-1 text-xs text-slate-900 text-right">
                                      ₹{record.netSalary.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-1 text-xs text-slate-900">
                                      {record.status}
                                    </td>
                                    <td className="px-3 py-1 text-right">
                                      {record.status === "Paid" && (
                                        <button
                                          onClick={() =>
                                            handleViewHistoricalPayment(record)
                                          }
                                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-xs font-medium"
                                        >
                                          View Details
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Form View
  const renderEditForm = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${getAvatarColor(
                      editFormData.name
                    )} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {getInitials(editFormData.name)}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">
                      Edit Salary Record
                    </h1>
                    <p className="text-indigo-100 text-xs">
                      Employee ID: {editFormData.employeeId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 font-medium transition duration-200 text-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Record Details
              </button>

              {updateError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs font-semibold">Error</p>
                    <p className="text-xs">{updateError}</p>
                  </div>
                </div>
              )}

              {updateSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs font-semibold">Success</p>
                    <p className="text-xs">{updateSuccess}</p>
                  </div>
                </div>
              )}

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employee Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Employee Information
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name || ""}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={editFormData.department || ""}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Designation
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={editFormData.designation || ""}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Employee Type
                        </label>
                        <select
                          name="type"
                          value={editFormData.type || "teaching"}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        >
                          <option value="teaching">Teaching</option>
                          <option value="non-teaching">Non-Teaching</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Working Hours
                        </label>
                        <input
                          type="number"
                          name="workingHours"
                          value={editFormData.workingHours || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                      Salary Information
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Basic Salary (₹)
                        </label>
                        <input
                          type="number"
                          name="basicSalary"
                          value={editFormData.basicSalary || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          HRA (₹)
                        </label>
                        <input
                          type="number"
                          name="hra"
                          value={editFormData.hra || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          DA (₹)
                        </label>
                        <input
                          type="number"
                          name="da"
                          value={editFormData.da || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Bonus (₹)
                        </label>
                        <input
                          type="number"
                          name="bonus"
                          value={editFormData.bonus || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Overtime Pay (₹)
                        </label>
                        <input
                          type="number"
                          name="overtimePay"
                          value={editFormData.overtimePay || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-500" />
                      Deductions
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Tax Deduction (₹)
                        </label>
                        <input
                          type="number"
                          name="taxDeduction"
                          value={editFormData.taxDeduction || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          PF Deduction (₹)
                        </label>
                        <input
                          type="number"
                          name="pfDeduction"
                          value={editFormData.pfDeduction || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Other Deductions (₹)
                        </label>
                        <input
                          type="number"
                          name="otherDeductions"
                          value={editFormData.otherDeductions || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Leave Deduction (₹)
                        </label>
                        <input
                          type="number"
                          name="leaveDeduction"
                          value={editFormData.leaveDeduction || 0}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Leave Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      Leave Information
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Leave Start Date
                        </label>
                        <input
                          type="date"
                          name="leaveStartDate"
                          value={editFormData.leaveStartDate || ""}
                          onChange={handleEditFormChange}
                          className={`w-full p-2 bg-white border ${
                            validationErrors.leaveStartDate ||
                            validationErrors.date
                              ? "border-red-500"
                              : "border-slate-200"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs`}
                        />
                        {validationErrors.leaveStartDate && (
                          <p className="mt-1 text-[10px] text-red-500">
                            {validationErrors.leaveStartDate}
                          </p>
                        )}
                        {validationErrors.date && (
                          <p className="mt-1 text-[10px] text-red-500">
                            {validationErrors.date}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Leave End Date
                        </label>
                        <input
                          type="date"
                          name="leaveEndDate"
                          value={editFormData.leaveEndDate || ""}
                          onChange={handleEditFormChange}
                          className={`w-full p-2 bg-white border ${
                            validationErrors.date
                              ? "border-red-500"
                              : "border-slate-200"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                      Payment Information
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Payment Method
                        </label>
                        <select
                          name="paymentMethod"
                          value={editFormData.paymentMethod || "Bank Transfer"}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Bank Account
                        </label>
                        <input
                          type="text"
                          name="bankAccount"
                          value={editFormData.bankAccount || ""}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Status
                        </label>
                        <select
                          name="status"
                          value={editFormData.status || "Pending"}
                          onChange={handleEditFormChange}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processed">Processed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-colors font-medium text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // List View
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-base font-semibold text-slate-700">
            Loading salary records...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 max-w-md">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 text-red-500">
            <X className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-center text-red-600 mb-2">
            Error
          </h2>
          <div className="text-slate-600 text-xs text-center">{error}</div>
          <button
            className="mt-4 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-xs"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {selectedEmployeeId && viewMode === "details" && !isEditing ? (
          <div>
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 font-medium transition duration-200 text-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Records
            </button>

            {updateSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs font-semibold">Success</p>
                  <p className="text-xs">{updateSuccess}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${getAvatarColor(
                      selectedRecord.name
                    )} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {getInitials(selectedRecord.name)}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">
                      Salary Record Details
                    </h1>
                    <p className="text-indigo-100 text-xs">
                      Employee ID: {selectedRecord.employeeId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Employee and Salary Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Employee Information
                    </h2>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Full Name
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Department
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Designation
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.designation}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Employee Type
                        </p>
                        <p className="text-xs text-slate-900 capitalize">
                          {selectedRecord.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Working Hours
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.workingHours}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                      Salary Breakdown
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Basic Salary
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.basicSalary.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            HRA
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.hra.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            DA
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.da.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Bonus
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.bonus.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Overtime Pay
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.overtimePay.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Gross Salary
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.grossSalary.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Tax Deduction
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.taxDeduction.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            PF Deduction
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.pfDeduction.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Other Deductions
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.otherDeductions.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Leave Deduction
                          </p>
                          <p className="text-xs text-slate-900">
                            ₹{selectedRecord.leaveDeduction.toFixed(2)}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs font-medium text-slate-500">
                            Net Salary
                          </p>
                          <p className="text-sm font-semibold text-indigo-600">
                            ₹{selectedRecord.netSalary.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment and Metadata Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-500" />
                      Payment Information
                    </h2>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Payment Date
                        </p>
                        <p className="text-xs text-slate-900">
                          {new Date(
                            selectedRecord.paymentDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Payment Method
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Bank Account
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.bankAccount || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Status
                        </p>
                        <p className="text-xs text-slate-900">
                          {selectedRecord.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      Record Metadata
                    </h2>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Created At
                        </p>
                        <p className="text-xs text-slate-900">
                          {new Date(selectedRecord.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Updated At
                        </p>
                        <p className="text-xs text-slate-900">
                          {new Date(selectedRecord.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => handleEditRecord(selectedRecord.employeeId)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-colors flex items-center gap-2 font-medium text-xs"
                >
                  <Edit className="h-4 w-4" />
                  Edit Record
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors flex items-center gap-2 font-medium text-xs"
                  onClick={() => generateIndividualPayslip(selectedRecord)}
                >
                  <Printer className="h-4 w-4" />
                  Print Payslip
                </button>
              </div>
            </div>
          </div>
        ) : selectedEmployeeId && viewMode === "payment" ? (
          renderPaymentDetails()
        ) : selectedEmployeeId && viewMode === "historicalPayment" ? (
          renderHistoricalPaymentDetails()
        ) : isEditing ? (
          renderEditForm()
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 p-4">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 rounded-t-xl mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Faculty Salary Dashboard</h1>
                  <p className="text-indigo-100 text-xs mt-1">
                    Manage employee salaries and generate payment slips (showing latest records per employee)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateAllPayslips}
                    disabled={uniqueEmployeeCount === 0 || isGeneratingPayslips}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm text-xs font-medium ${
                      uniqueEmployeeCount === 0 || isGeneratingPayslips
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-indigo-600 hover:bg-indigo-50'
                    }`}
                    title={`Generate payment slips for ${uniqueEmployeeCount} employees`}
                  >
                    <Printer className="h-4 w-4" />
                    Generate All Payment Slips ({uniqueEmployeeCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {filterType === "teaching" ? "Teaching Faculty" : "Unique Employees"}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{filteredUniqueEmployeeCount}</p>
                    <p className="text-[10px] text-slate-400">
                      {filterType === "teaching" ? "Teaching staff only" : "Latest records shown"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total Salary Records</p>
                    <p className="text-lg font-semibold text-slate-900">{records.length}</p>
                    <p className="text-[10px] text-slate-400">All historical records</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Current Total Payroll</p>
                    <p className="text-lg font-semibold text-slate-900">
                      ₹{Object.values(filteredUniqueEmployeesForStats).reduce((sum, emp) => sum + (emp.netSalary || 0), 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">Based on latest salaries</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-medium text-slate-700">Display Information</p>
              </div>
              <p className="text-xs text-slate-600">
                Showing the latest salary record for each employee. Total records in database: {records.length}. 
                To view salary history for a specific employee, click "View Payment" on their record.
              </p>
            </div>

            <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-indigo-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by ID, name, or department..."
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      filterType === "all"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All Employees
                  </button>
                  <button
                    onClick={() => setFilterType("teaching")}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      filterType === "teaching"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Teaching Faculty
                  </button>
                </div>
              </div>
            </div>

            {displayRecords.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                <Search className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-2 text-base font-medium text-slate-900">
                  No employees found
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayRecords.map((record) => (
                  <div
                    key={record._id}
                    className="bg-white rounded-xl shadow-lg border border-indigo-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="p-4 flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 w-12 h-12 ${getAvatarColor(
                            record.name
                          )} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                        >
                          {getInitials(record.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-800">
                            {record.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <CreditCard className="h-3 w-3" />
                              {record.employeeId}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <Briefcase className="h-3 w-3" />
                              {record.department}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <User className="h-3 w-3" />
                              {record.designation}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPayment(record.employeeId)}
                          className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-md hover:shadow-lg"
                        >
                          View Payment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Slip Generation Modal */}
        {showGenerationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Printer className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Generating Payment Slips
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Please wait while we generate payment slips for all employees...
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                
                <p className="text-sm font-medium text-indigo-600">
                  {generationProgress}% Complete
                </p>
                
                {!isGeneratingPayslips && (
                  <button
                    onClick={() => setShowGenerationModal(false)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
