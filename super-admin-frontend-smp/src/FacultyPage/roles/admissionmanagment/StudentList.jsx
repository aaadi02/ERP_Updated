import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";

// Corrected logo paths for public folder access
const logo = "/logo.png"; // Maps to public/logo.png
const logo1 = "/logo1.png"; // Maps to public/logo1.png

function LeavingCertificate({
  student,
  type,
  reason,
  leavingDate,
  isCleared,
  progress,
  conduct,
  remarks,
  numberToWords,
  months,
  standard,
  theme
}) {
  const dateOfBirth = student.dateOfBirth ? new Date(student.dateOfBirth) : null;
  let dateOfBirthInWords = "N/A";
  if (dateOfBirth) {
    const day = dateOfBirth.getDate();
    const month = months[dateOfBirth.getMonth()];
    const year = dateOfBirth.getFullYear();
    dateOfBirthInWords = `${numberToWords(day)} ${month} ${numberToWords(year)}`;
  }

  const fullRemarks = remarks && standard
    ? `${remarks} in ${standard} examination conducted by RTMNU, Nagpur`
    : remarks || "No dues cleared";

  const fields = [
    {
      label: "1.",
      subLabel: "Name of the Institute:",
      value: "Nagarjuna Institute of Engineering, Technology & Management",
    },
    {
      label: "2.",
      subLabel: "Name of the Pupil in Full:",
      value: `${student.firstName} ${student.lastName || ""}`,
    },
    { label: "3.", subLabel: "Mother's Name:", value: student.motherName || "N/A" },
    {
      label: "4.",
      subLabel: "Race & Caste:",
      value: `Category: ${student.casteCategory || "-----"} Caste: ${student.subCaste || "N/A"}`,
      isSplit: true,
    },
    { label: "5.", subLabel: "Nationality:", value: student.nationality || "N/A" },
    { label: "6.", subLabel: "Place of Birth:", value: student.placeOfBirth || "N/A" },
    {
      label: "7.",
      subLabel: "Date of Birth:",
      value: `a) In Figures: ${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-GB") : "N/A"}`,
    },
    {
      label: "",
      subLabel: "",
      value: `b) In Words: ${dateOfBirthInWords}`,
    },
    {
      label: "8.",
      subLabel: "Last School/College Attended:",
      value: student.schoolAttended || "N/A",
    },
    {
      label: "9.",
      subLabel: "Date of Admission:",
      value: student.createdAt ? new Date(student.createdAt).toLocaleDateString("en-GB") : "N/A",
    },
    {
      label: "10.",
      subLabel: "Progress:",
      value: progress,
    },
    { label: "11.", subLabel: "Conduct:", value: conduct },
    {
      label: "12.",
      subLabel: "Date of Leaving Institution:",
      value: new Date(leavingDate).toLocaleDateString("en-GB"),
    },
    {
      label: "13.",
      subLabel: "Standard in which Studying & Since When:",
      value: standard,
    },
    {
      label: "14.",
      subLabel: "Reason for Leaving Institution:",
      value: `${reason}${type === "LC" ? " Course Completion" : ""}`,
    },
    { label: "15.", subLabel: "Remarks:", value: fullRemarks },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${theme.cardBg} ${theme.cardBorder} max-w-4xl mx-auto p-6 rounded-2xl shadow-2xl`}
    >
      <div className={`${theme.headerBg} ${theme.headerBorder} p-6 rounded-t-lg`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.img
            src={logo}
            alt="Institute Logo"
            className="w-20 h-20 object-contain"
            onError={(e) => (e.target.src = "https://via.placeholder.com/100")}
            whileHover={{ scale: 1.1 }}
          />
          <div className="text-center">
            <p className={`${theme.textSecondary} text-sm uppercase font-semibold`}>Maitrey Education Society</p>
            <h1 className={`${theme.textAccent} text-3xl font-extrabold uppercase`}>NAGARJUNA</h1>
            <h2 className={`${theme.textPrimary} text-lg font-semibold`}>Institute of Engineering, Technology & Management</h2>
            <p className={`${theme.textSecondary} text-sm`}>AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur</p>
            <p className={`${theme.textSecondary} text-sm mt-2`}>Village Satnavri, Amravati Road, Nagpur 440023</p>
            <p className={`${theme.textSecondary} text-sm`}>Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12</p>
          </div>
          <motion.img
            src={logo1}
            alt="Second Logo"
            className="w-20 h-20 object-contain"
            onError={(e) => (e.target.src = "https://via.placeholder.com/100")}
            whileHover={{ scale: 1.1 }}
          />
        </div>
      </div>
      <div className="p-6">
        <motion.div
          className="text-center py-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className={`${theme.textAccent} text-2xl font-bold uppercase`}>{type === "TC" ? "TRANSFER CERTIFICATE" : "LEAVING CERTIFICATE"}</h3>
        </motion.div>
        <p className={`${theme.textSecondary} text-xs italic text-center mb-4`}>
          (See rule 17 & 32 in chapter II section 1)
          <br />
          (No change of any entry in this certificate shall be made except by the authority issuing it...)
        </p>
        <div className="text-right text-sm font-medium mb-4">
          <p className={theme.textPrimary}>Register No. 1: 06</p>
          <p className={theme.textPrimary}>ABC ID: {student.abcId || "N/A"}</p>
        </div>
        <div className="space-y-2 text-sm">
          {fields.map(({ label, subLabel, value, isSplit }, index) => (
            <motion.div
              key={index}
              className="flex items-start"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className={`${theme.textAccent} w-6 font-bold`}>{label}</span>
              <span className={`${theme.textAccent} w-64 font-bold`} style={{ whiteSpace: "pre-wrap" }}>
                {subLabel}
              </span>
              {isSplit ? (
                <>
                  <span className={`${theme.textAccent} w-28 font-bold`}>Category:</span>
                  <span className={`${theme.textPrimary} w-24`}>{student.casteCategory || "-----"}</span>
                  <span className={`${theme.textAccent} w-20 font-bold`}>Caste:</span>
                  <span className={`${theme.textPrimary} flex-1`}>{student.subCaste || "N/A"}</span>
                </>
              ) : (
                <span className={`${theme.textPrimary} flex-1`}>{value}</span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-8 space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className={`${theme.textPrimary} font-medium`}>Seal No.: _______</span>
            <span className={`${theme.textPrimary} font-medium`}>Enrollment No.: {student.enrollmentNumber || "N/A"}</span>
          </div>
          <p className={`${theme.textSecondary} text-xs italic text-center mt-4`}>
            Certified that the above information is in accordance with the Institute Register.
          </p>
          <div className="flex justify-between mt-8">
            <p className={`${theme.textPrimary} text-sm font-medium`}>Date: {new Date().toLocaleDateString("en-GB")}</p>
            <p className={`${theme.textPrimary} text-sm font-medium text-center`}>Clerk</p>
            <p className={`${theme.textPrimary} text-sm font-medium text-center`}>Principal</p>
          </div>
          {isCleared ? null : (
            <p className={`${theme.textSecondary} text-sm italic text-center`}>He is not approved. - G</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StudentList() {
  const themeClasses = {
    dark: {
      bg: "bg-gradient-to-br from-neutral-900 via-gray-800 to-neutral-950",
      headerBg: "bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900",
      headerBorder: "border-b-4 border-indigo-400/30",
      cardBg: "bg-neutral-800/80 backdrop-blur-lg",

      cardBorder: "border border-indigo-400/20",
      textPrimary: "text-white !important",
      textSecondary: "text-indigo-200 !important",
      textAccent: "text-white !important",
      buttonBg: "bg-gradient-to-r from-indigo-700 to-purple-700",
      buttonHover: "hover:bg-indigo-800",
      chartBg: "bg-white/10 backdrop-blur-xl",
      glow: "bg-indigo-400/30",
      doughnutGlow: "bg-purple-400/20",
    },
    light: {
      bg: "bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-100",
      headerBg: "bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400",
      headerBorder: "border-b-4 border-indigo-200",
      cardBg: "bg-white/80 backdrop-blur-lg",
      cardBorder: "border border-indigo-200",
      textPrimary: "text-gray-800",
      textSecondary: "text-indigo-700",
      textAccent: "text-indigo-900",
      buttonBg: "bg-gradient-to-r from-indigo-500 to-purple-500",
      buttonHover: "hover:bg-indigo-600",
      chartBg: "bg-white/80 backdrop-blur-xl",
      glow: "bg-indigo-300/30",
      doughnutGlow: "bg-purple-300/20",
    },
  };

  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const currentTheme = themeClasses[theme];

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const numberToWords = (num) => {
    const ones = [
      "",
      "FIRST",
      "SECOND",
      "THIRD",
      "FOURTH",
      "FIFTH",
      "SIXTH",
      "SEVENTH",
      "EIGHTH",
      "NINTH",
      "TENTH",
      "ELEVENTH",
      "TWELFTH",
      "THIRTEENTH",
      "FOURTEENTH",
      "FIFTEENTH",
      "SIXTEENTH",
      "SEVENTEENTH",
      "EIGHTEENTH",
      "NINETEENTH",
    ];
    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
    const thousands = ["", "THOUSAND", "MILLION", "BILLION"];
    if (num === 0) return "ZERO";

    let words = "";
    let thousandIndex = 0;

    while (num > 0) {
      let part = num % 1000;
      if (part > 0) {
        let partWords = "";
        if (part >= 100) {
          partWords += ones[Math.floor(part / 100)] + " HUNDRED ";
          part %= 100;
        }
        if (part >= 20) {
          partWords += tens[Math.floor(part / 10)];
          part %= 10;
          if (part > 0) partWords += "-" + ones[part];
        } else if (part > 0) {
          partWords += ones[part];
        }
        if (partWords) {
          words =
            partWords +
            (thousands[thousandIndex] ? " " + thousands[thousandIndex] : "") +
            (words ? " " + words : "");
        }
      }
      num = Math.floor(num / 1000);
      thousandIndex++;
    }
    return words.trim();
  };

  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [admissionTypeFilter, setAdmissionTypeFilter] = useState("");
  const [backlogModal, setBacklogModal] = useState({
    open: false,
    studentId: null,
    student: null,
    streamId: "",
    departmentId: "",
    semesterId: "",
    semesterSubjects: [],
  });
  const [modalError, setModalError] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [refreshCounter, setRefreshCounter] = useState(0); // Add refresh counter for modal updates
  const [certificateModal, setCertificateModal] = useState({
    open: false,
    studentId: null,
    type: "",
    reason: "",
    leavingDate: new Date().toISOString().split("T")[0],
    isCleared: true,
    progress: "Satisfactory",
    conduct: "Good",
    remarks: "",
    remarkSemester: "",
    remarkSession: "",
    remarkYear: "",
    completionStatus: "",
    standard: "",
    error: null,
    isGenerating: false,
    showPreview: false,
    studentData: null,
  });
  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Use 'token' instead of 'facultyToken'
    if (!token) {
      localStorage.removeItem('token');
      navigate('/');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios(url, options);
        return response;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const fetchStudents = useCallback(
    async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const query = admissionTypeFilter ? `?admissionType=${admissionTypeFilter}` : "";
        const res = await fetchWithRetry(`/api/superadmin/students${query}`, {
          headers,
        });
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        
        setStudents(res.data);
        setFetchError(null);
      } catch (err) {
        // Handle authentication errors
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        setFetchError(err.response?.data?.error || "Failed to fetch students.");
      } finally {
        setLoading(false);
      }
    },
    [admissionTypeFilter]
  );

  useEffect(() => {
    fetchStudents();
    const fetchSemesters = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const res = await fetchWithRetry("/api/superadmin/semesters", {
          headers,
        });
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        
        setSemesters(res.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        console.error("Failed to fetch semesters:", err);
      }
    };
    fetchSemesters();
  }, [fetchStudents]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleAdmissionTypeFilterChange = (e) => setAdmissionTypeFilter(e.target.value);

  const handleEdit = (student) => {
    navigate("/dashboard/admission", {
      state: {
        ...student,
        nationality: student.nationality || "",
        placeOfBirth: student.placeOfBirth || "",
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "",
        schoolAttended: student.schoolAttended || "",
        nameOfInstitute: student.nameOfInstitute || "",
        address: student.address || "",
        guardianNumber: student.guardianNumber || "",
        abcId: student.abcId || "",
      },
    });
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.enrollmentNumber?.toLowerCase().includes(searchLower) ||
      student.nationality?.toLowerCase().includes(searchLower) ||
      student.placeOfBirth?.toLowerCase().includes(searchLower) ||
      student.schoolAttended?.toLowerCase().includes(searchLower) ||
      student.nameOfInstitute?.toLowerCase().includes(searchLower) ||
      student.address?.toLowerCase().includes(searchLower) ||
      student.guardianNumber?.toLowerCase().includes(searchLower) ||
      student.abcId?.toLowerCase().includes(searchLower) ||
      student.mobileNumber?.toLowerCase().includes(searchLower) ||
      student.casteCategory?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        await fetchWithRetry(`/api/superadmin/students/${id}`, {
          method: "DELETE",
          headers,
        });
        fetchStudents();
        alert("Student deleted successfully!");
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        alert("Error deleting student: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handlePromote = async (id) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetchWithRetry(`/api/superadmin/students/promote/${id}`, {
        method: "PUT",
        headers,
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      
      alert(response.data.message || "Student promoted successfully");
      fetchStudents();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      alert("Error promoting student: " + (err.response?.data?.error || err.message));
    }
  };

  const openCertificateModal = async (studentId, type) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetchWithRetry(`/api/superadmin/students/${studentId}`, {
        headers,
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      setCertificateModal({
        open: true,
        studentId,
        type,
        reason: "",
        leavingDate: new Date().toISOString().split("T")[0],
        isCleared: true,
        completionStatus: type === "LC" ? "Completed" : "",
        standard: res.data.department?.name || "",
        error: null,
        isGenerating: false,
        showPreview: false,
        studentData: res.data,
        progress: "Satisfactory",
        conduct: "Good",
        remarks: "",
        remarkSemester: "",
        remarkSession: "",
        remarkYear: "",
      });
    } catch (err) {
      alert("Error fetching student data: " + (err.response?.data?.error || err.message));
    }
  };

  const closeCertificateModal = () => {
    setCertificateModal({
      open: false,
      studentId: null,
      type: "",
      reason: "",
      leavingDate: new Date().toISOString().split("T")[0],
      isCleared: true,
      completionStatus: "",
      standard: "",
      error: null,
      isGenerating: false,
      showPreview: false,
      studentData: null,
      progress: "Satisfactory",
      conduct: "Good",
      remarks: "",
      remarkSemester: "",
      remarkSession: "",
      remarkYear: "",
    });
  };

  const handleCertificateInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCertificateModal((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      error: null,
    }));
  };

  const handleShowPreview = () => {
    setCertificateModal((prev) => ({ ...prev, showPreview: true }));
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        resolve(new Image());
      };
    });
  };

  const handleGenerateCertificate = async () => {
    const { studentId, type, reason, leavingDate, isCleared, completionStatus, progress, conduct, remarks, remarkSemester, remarkSession, remarkYear, standard } =
      certificateModal;

    if (!reason.trim()) {
      setCertificateModal((prev) => ({ ...prev, error: "Reason is required" }));
      return;
    }
    if (!leavingDate || isNaN(new Date(leavingDate).getTime())) {
      setCertificateModal((prev) => ({ ...prev, error: "Valid leaving date is required" }));
      return;
    }
    if (type === "LC" && !completionStatus) {
      setCertificateModal((prev) => ({ ...prev, error: "Completion status is required for Leaving Certificate" }));
      return;
    }
    if (!progress) {
      setCertificateModal((prev) => ({ ...prev, error: "Progress is required" }));
      return;
    }
    if (!conduct) {
      setCertificateModal((prev) => ({ ...prev, error: "Conduct is required" }));
      return;
    }
    if (!standard) {
      setCertificateModal((prev) => ({ ...prev, error: "Standard is required" }));
      return;
    }

    setCertificateModal((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const student = certificateModal.studentData;
      if (!student) throw new Error("Student data is missing");

      const headers = getAuthHeaders();
      if (!headers) return;

      await fetchWithRetry(`/api/superadmin/students/generate-certificate/${studentId}`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        data: { type, reason, leavingDate, isCleared, completionStatus, progress, conduct, remarks, standard },
      });

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 15;
      const marginRight = 15;
      const contentWidth = pageWidth - marginLeft - marginRight;

      doc.setFont("Helvetica");

      let y = 15;
      doc.setLineWidth(0.5);
      doc.rect(marginLeft, y, contentWidth, pageHeight - 30);
      y += 10;

      const logoImg = await loadImage(logo);
      if (logoImg.width > 0) {
        doc.addImage(logoImg, "PNG", marginLeft, y, 25, 25);
      }

      const logo1Img = await loadImage(logo1);
      if (logo1Img.width > 0) {
        doc.addImage(logo1Img, "PNG", pageWidth - marginRight - 25, y, 23, 23);
      }

      doc.setFontSize(8).setFont("Helvetica", "normal");
      doc.text("maitrey education society", pageWidth / 2, y + 3, { align: "center" });
      doc.setFontSize(25).setFont("Helvetica", "bold");
      doc.text("NAGARJUNA", pageWidth / 2, y + 12, { align: "center" });
      y += 23;

      doc.setFontSize(14).setFont("Helvetica", "normal");
      const instituteName = "Institute of Engineering, Technology & Management";
      doc.text(instituteName, pageWidth / 2, y - 3, { align: "center" });
      y += 6;

      doc.setFontSize(12).setFont("Helvetica", "normal");
      const affiliation = "(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)";
      const affiliationLines = doc.splitTextToSize(affiliation, contentWidth - 20);
      doc.text(affiliationLines, pageWidth / 2, y - 2, { align: "center" });
      y += affiliationLines.length * 4;

      doc.setFontSize(12).setFont("Helvetica", "normal");
      const address = "Village Satnavri, Amravati Road, Nagpur 440023";
      doc.text(address, pageWidth / 2, y - 2, { align: "center" });
      y += 4;

      const contact = "Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12";
      doc.text(contact, pageWidth / 2, y - 2, { align: "center" });
      y += 8;

      doc.setLineWidth(0.5);
      doc.line(marginLeft + 5, y, pageWidth - marginRight - 5, y);
      y += 8;

      doc.setFontSize(18).setFont("Helvetica", "bold");
      doc.text(type === "TC" ? "TRANSFER CERTIFICATE" : "LEAVING CERTIFICATE", pageWidth / 2, y, {
        align: "center",
      });
      y += 3;

      doc.line(marginLeft + 5, y, pageWidth - marginRight - 5, y);
      y += 6;

      doc.setFontSize(10).setFont("Helvetica", "italic");
      const ruleText1 = "(See rule 17 & 32 in chapter II section 1)";
      doc.text(ruleText1, pageWidth / 2, y, { align: "center" });
      y += 4;

      const ruleText2 =
        "(No change of any entry in this certificate shall be made except by the authority issuing it and any infringement of this requirement is liable to involve the imposition of penalty such as that of rustication)";
      const ruleTextLines = doc.splitTextToSize(ruleText2, contentWidth - 10);
      doc.text(ruleTextLines, pageWidth / 2, y, { align: "center" });
      y += ruleTextLines.length * 4;

      doc.setFontSize(12).setFont("Helvetica", "normal");
      doc.text("Register No. 1: 06", pageWidth / 2 + contentWidth / 4, y);
      y += 8;

      doc.setFontSize(12);
      const lineHeightPerLine = 6;

      // Create detailed remark based on selected values
      let fullRemarks = "";
      if (remarks && remarkSemester && remarkSession && remarkYear) {
        const semesterWord = remarkSemester === "1" ? "1st" : remarkSemester === "2" ? "2nd" : remarkSemester === "3" ? "3rd" : `${remarkSemester}th`;
        const departmentName = student.department?.name || "Engineering";
        fullRemarks = `${remarks} in ${standard} ${semesterWord} semester ${departmentName} examination conducted by RTMNU, Nagpur held in ${remarkSession}-${remarkYear}`;
      } else if (remarks && standard) {
        fullRemarks = `${remarks} in ${standard} examination conducted by RTMNU, Nagpur`;
      } else if (remarks) {
        fullRemarks = remarks;
      } else {
        fullRemarks = "No dues cleared";
      }

      const fields = [
        {
          label: "1.",
          subLabel: "Name of the Institute:",
          value: "Nagarjuna Institute of Engineering, Technology & Management",
        },
        {
          label: "2.",
          subLabel: "Name of the Pupil in Full:",
          value: `${student.firstName} ${student.lastName || ""}`,
        },
        { label: "3.", subLabel: "Mother's Name:", value: student.motherName || "N/A" },
        {
          label: "4.",
          subLabel: "Race & Caste:",
          value: `Category: ${student.casteCategory || "-----"} Caste: ${student.subCaste || "N/A"}`,
          isSplit: true,
        },
        { label: "5.", subLabel: "Nationality:", value: student.nationality || "N/A" },
        { label: "6.", subLabel: "Place of Birth:", value: student.placeOfBirth || "N/A" },
        {
          label: "7.",
          subLabel: "Date of Birth:",
          value: `a) In Figures: ${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-GB") : "N/A"}`,
        },
        {
          label: "",
          subLabel: "",
          value: `b) In Words: ${student.dateOfBirth ? `${numberToWords(new Date(student.dateOfBirth).getDate())} ${months[new Date(student.dateOfBirth).getMonth()]} ${numberToWords(new Date(student.dateOfBirth).getFullYear())}` : "N/A"}`,
        },
        {
          label: "8.",
          subLabel: "Last School/College Attended:",
          value: student.schoolAttended || "N/A",
        },
        {
          label: "9.",
          subLabel: "Date of Admission:",
          value: student.createdAt ? new Date(student.createdAt).toLocaleDateString("en-GB") : "N/A",
        },
        { label: "10.", subLabel: "Progress:", value: progress },
        { label: "11.", subLabel: "Conduct:", value: conduct },
        {
          label: "12.",
          subLabel: "Date of Leaving Institution:",
          value: new Date(leavingDate).toLocaleDateString("en-GB"),
        },
        {
          label: "13.",
          subLabel: "Standard in which Studying & \nSince When:",
          value: standard,
        },
        {
          label: "14.",
          subLabel: "Reason for Leaving Institution:",
          value: `${reason}${type === "LC" ? " Course Completion" : ""}`,
        },
        { label: "15.", subLabel: "Remarks:", value: fullRemarks },
      ];

      fields.forEach(({ label, subLabel, value, isSplit }) => {
        doc.setFont("Helvetica", "bold");
        doc.text(label, marginLeft + 5, y);
        if (subLabel) {
          const subLabelLines = doc.splitTextToSize(subLabel, contentWidth - 90);
          doc.setFont("Helvetica", "bold");
          doc.text(subLabelLines, marginLeft + 15, y);
          y += (subLabelLines.length - 1) * lineHeightPerLine;
        }
        if (isSplit) {
          doc.setFont("Helvetica", "bold");
          doc.text("Category:", marginLeft + 85, y);
          doc.setFont("Helvetica", "normal");
          const categoryValue = student.casteCategory || "-----";
          doc.text(categoryValue, marginLeft + 105, y);
          doc.setFont("Helvetica", "bold");
          doc.text("Caste:", marginLeft + 130, y);
          doc.setFont("Helvetica", "normal");
          const casteValue = student.subCaste || "N/A";
          doc.text(casteValue, marginLeft + 145, y);
        } else {
          doc.setFont("Helvetica", "normal");
          const valueLines = doc.splitTextToSize(value, contentWidth - 90);
          doc.text(valueLines, marginLeft + 85, y);
          y += (valueLines.length - 1) * lineHeightPerLine;
        }
        y += lineHeightPerLine;
      });

      y += 1;
      doc.setFontSize(12).setFont("Helvetica", "normal");
      doc.text("Seal No.: _______", marginLeft + 5, y);
      doc.text(`Enrollment No.: ${student.enrollmentNumber || "N/A"}`, marginLeft + 110, y);
      y += 8;

      y += 1;
      doc.setFontSize(10).setFont("Helvetica", "italic");
      const certText = "Certified that the above information is in accordance with the Institute Register.";
      const certLines = doc.splitTextToSize(certText, contentWidth - 10);
      doc.text(certLines, pageWidth / 2, y, { align: "center" });
      y += certLines.length * 4 + 20;

      doc.setFontSize(12).setFont("Helvetica", "normal");
      doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, marginLeft + 5, y);
      doc.text("Clerk", pageWidth / 2, y, { align: "center" });
      doc.text("Principal", pageWidth - marginRight - 5, y, { align: "right" });
      y += 3;

      if (!isCleared) {
        doc.setFontSize(12).setFont("Helvetica", "italic");
        doc.text("He is not approved. - G", pageWidth / 2, y, { align: "center" });
      }

      const fileName = `${type}_${student.firstName}_${student.lastName || ""}.pdf`
        .replace(/\s+/g, "_")
        .toLowerCase();
      doc.save(fileName);

      alert(`${type} generated and downloaded successfully!`);
      closeCertificateModal();
    } catch (err) {
      console.error(`${type} generation error:`, err);
      setCertificateModal((prev) => ({
        ...prev,
        error: `Failed to generate ${type}. ${err.response?.data?.error || "Please try again."}`,
        isGenerating: false,
      }));
    }
  };

  const openBacklogModal = async (studentId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetchWithRetry(`/api/superadmin/students/${studentId}`, {
        headers,
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      
      const student = res.data;
      const semesterId = student.semester?._id || "";
      let semesterSubjects = [];
      if (semesterId && student.department?._id) {
        try {
          const headers = getAuthHeaders();
          if (!headers) return;

          const subjectsRes = await fetchWithRetry(
            `/api/superadmin/students/subjects/${semesterId}/${student.department._id}`,
            { headers }
          );
          
          if (subjectsRes.status === 401) {
            localStorage.removeItem('token');
            navigate('/');
            return;
          }
          
          semesterSubjects = subjectsRes.data;
        } catch (err) {
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            navigate('/');
            return;
          }
          console.error("Failed to fetch subjects:", err);
          setModalError("Failed to fetch subjects for the selected semester.");
        }
      }
      setBacklogModal({
        open: true,
        studentId,
        student,
        streamId: student.stream?._id || "",
        departmentId: student.department?._id || "",
        semesterId,
        semesterSubjects,
      });
      setModalError(semesterSubjects.length === 0 && semesterId ? "No subjects available for this semester." : null);
    } catch (err) {
      alert("Error fetching student data: " + (err.response?.data?.error || err.message));
    }
  };

  const closeBacklogModal = () => {
    setBacklogModal({
      open: false,
      studentId: null,
      student: null,
      streamId: "",
      departmentId: "",
      semesterId: "",
      semesterSubjects: [],
    });
    setModalError(null);
    setLoadingSubjects(false);
  };

  const handleBacklogSemesterChange = async (e) => {
    const semesterId = e.target.value;
    setBacklogModal((prev) => ({ ...prev, semesterId, semesterSubjects: [] }));
    setModalError(null);
    setLoadingSubjects(true);

    if (semesterId && backlogModal.departmentId) {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const res = await fetchWithRetry(
          `/api/superadmin/students/subjects/${semesterId}/${backlogModal.departmentId}`,
          { headers }
        );
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        
        if (res.data.length === 0) {
          setModalError("No subjects available for this semester and department.");
        }
        setBacklogModal((prev) => ({ ...prev, semesterSubjects: res.data }));
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        setModalError("Failed to fetch subjects: " + (err.response?.data?.error || err.message));
      } finally {
        setLoadingSubjects(false);
      }
    } else {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectStatusUpdate = async (subjectId, status) => {
    const { studentId, student, semesterId } = backlogModal;
    
    if (!semesterId) {
      setModalError("Please select a semester.");
      return;
    }

    const isValidSubject = backlogModal.semesterSubjects.some((sub) => sub._id === subjectId);
    if (!isValidSubject) {
      setModalError("Invalid subject selected for this semester.");
      return;
    }

    try {
      let updatedStudent = null;
      
      if (status === "Failed") {
        // Add backlog for failed subjects
        const headers = getAuthHeaders();
        if (!headers) return;

        const response = await fetchWithRetry(`/api/superadmin/students/${studentId}/add-backlog`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          data: { subjectIds: [subjectId], semesterId },
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        
        updatedStudent = response.data.student;
      } else if (status === "Passed") {
        // For passed subjects, check if there's an existing backlog to clear
        const backlog = student.backlogs?.find(
          (backlog) => {
            const backlogSubjectId = backlog.subject?._id || backlog.subject;
            const backlogSemesterId = backlog.semester?._id || backlog.semester;
            return String(backlogSubjectId) === subjectId && String(backlogSemesterId) === semesterId;
          }
        );
        
        if (backlog) {
          const headers = getAuthHeaders();
          if (!headers) return;

          const response = await fetchWithRetry(`/api/superadmin/students/${studentId}/update-backlog/${backlog._id}`, {
            method: "PUT",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            data: { status: "Cleared" },
          });
          
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/');
            return;
          }
          updatedStudent = response.data.student;
        } else {
          // If no backlog exists, create or update semester record with Passed status
          const semesterRecords = [...(student.semesterRecords || [])];
          let existingRecord = semesterRecords.find(
            record => {
              const recordSemesterId = record.semester?._id || record.semester;
              return String(recordSemesterId) === semesterId;
            }
          );
          
          if (existingRecord) {
            // Update existing semester record
            const subjectIndex = existingRecord.subjects.findIndex(
              sub => {
                const subjectObjId = sub.subject?._id || sub.subject;
                return String(subjectObjId) === subjectId;
              }
            );
            if (subjectIndex >= 0) {
              existingRecord.subjects[subjectIndex].status = "Passed";
              existingRecord.subjects[subjectIndex].marks = 50;
            } else {
              existingRecord.subjects.push({
                subject: subjectId,
                status: "Passed",
                marks: 50
              });
            }
          } else {
            // Create new semester record
            semesterRecords.push({
              semester: semesterId,
              subjects: [{
                subject: subjectId,
                status: "Passed",
                marks: 50
              }],
              isBacklog: false
            });
          }
          
          const headers = getAuthHeaders();
          if (!headers) return;

          const response = await fetchWithRetry(`/api/superadmin/students/${studentId}`, {
            method: "PUT",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            data: { semesterRecords },
          });
          
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/');
            return;
          }
          
          updatedStudent = response.data;
        }
      }

      alert(`Subject status updated to ${status}!`);
      
      // Use the updated student data from the API response
      if (updatedStudent) {
        setBacklogModal((prev) => ({ 
          ...prev, 
          student: updatedStudent
        }));
      }
      
      // Force re-render by updating refresh counter
      setRefreshCounter(prev => prev + 1);
      
      // Also refresh the main student list
      fetchStudents();
      
    } catch (err) {
      console.error('Error in handleSubjectStatusUpdate:', err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      
      setModalError(err.response?.data?.error || "Failed to update subject status.");
    }
  };

  const getSubjectStatus = (subjectId, semesterId) => {
    const { student } = backlogModal;
    if (!student || !semesterId) return "Pending";
    
    // First check if there's a backlog record for this subject (even without populate)
    const backlog = student.backlogs?.find(
      (backlog) => {
        // Handle both populated and non-populated backlogs
        const backlogSubjectId = backlog.subject?._id || backlog.subject;
        const backlogSemesterId = backlog.semester?._id || backlog.semester;
        return String(backlogSubjectId) === subjectId && String(backlogSemesterId) === semesterId;
      }
    );
    
    if (backlog) {
      // If backlog exists, its status takes precedence
      if (backlog.status === "Cleared") {
        return "Passed";
      } else if (backlog.status === "Pending") {
        return "Failed";
      }
    }
    
    // If no backlog, check semester records for passed subjects
    const semesterRecord = student.semesterRecords?.find(
      (record) => {
        const recordSemesterId = record.semester?._id || record.semester;
        return String(recordSemesterId) === semesterId;
      }
    );
    
    if (semesterRecord) {
      const subject = semesterRecord.subjects?.find(
        (sub) => {
          const subjectObjId = sub.subject?._id || sub.subject;
          return String(subjectObjId) === subjectId;
        }
      );
      if (subject) {
        return subject.status;
      }
    }
    
    return "Pending";
  };

  return (
    <motion.div
      className={`${currentTheme.bg} min-h-screen py-8 px-4 sm:px-6 lg:px-8`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <style>
        {`
          ${theme === 'dark' ? `
            input, select, option {
              color: white !important;
              background-color: #1e293b !important;
            }
            select::-ms-expand {
              background-color: #1e293b !important;
              color: white !important;
            }
          ` : `
            input, select, option {
              color: black !important;
              background-color: white !important;
            }
            select::-ms-expand {
              background-color: white !important;
              color: black !important;
            }
          `}
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className={`${currentTheme.cardBg} ${currentTheme.cardBorder} rounded-2xl p-6 shadow-xl`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`${currentTheme.textAccent} text-2xl sm:text-3xl font-extrabold`}>Student Management</h2>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} px-4 py-2 rounded-lg text-sm font-medium ${currentTheme.textAccent}`}
            >
              Toggle {theme === 'dark' ? 'Light' : 'Dark'} Theme
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <motion.div
              className="flex-1"
              whileHover={{ scale: 1.02 }}
            >
              <label htmlFor="searchInput" className="sr-only">Search students</label>
              <input
                id="searchInput"
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={`${currentTheme.cardBg} ${currentTheme.cardBorder} w-full p-3 rounded-lg ${currentTheme.textPrimary} focus:ring-2 focus:ring-indigo-400`}
                aria-label="Search students"
              />
            </motion.div>
            <motion.div
              className="w-full sm:w-64"
              whileHover={{ scale: 1.02 }}
            >
              <label htmlFor="admissionTypeFilter" className="sr-only">Filter by admission type</label>
              <select
                id="admissionType"
                value={admissionTypeFilter}
                onChange={handleAdmissionTypeFilterChange}
                className={`${currentTheme.cardBg} ${currentTheme.cardBorder} w-full p-3 rounded-lg ${currentTheme.textPrimary} focus:ring-2 focus:ring-indigo-400`}
                aria-label="Select admission type"
              >
                <option value="">All Admission Types</option>
                <option value="Regular">Regular</option>
                <option value="Direct Second Year">Direct Second Year</option>
                <option value="Lateral Entry">Lateral Entry</option>
              </select>
            </motion.div>
          </div>

          <AnimatePresence>
            {fetchError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-300 rounded-lg flex items-center justify-between"
              >
                <span role="alert">{fetchError}</span>
                <button
                  onClick={fetchStudents}
                  className="px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  aria-label="Retry fetching students"
                >
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <motion.div
                className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className={`${currentTheme.textSecondary} ml-3`}>Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <p className={`${currentTheme.textSecondary} text-lg`}>No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className={`${currentTheme.headerBg} ${currentTheme.textSecondary}`}>
                    {["Name", "Enrollment", "Stream", "department", "Semester", "Mobile", "Student ID", "DOB", "Caste", "Photo", "Actions"].map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left text-xs font-semibold uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student._id}
                      className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-all"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>
                        <span className={`${currentTheme.textPrimary} font-medium`}>{student.firstName} {student.lastName || ""}</span>
                      </td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>{student.enrollmentNumber || "N/A"}</td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>{student.stream?.name || "N/A"}</td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>{student.department?.name || "N/A"}</td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>{student.semester?.number || "N/A"}</td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>{student.mobileNumber || "N/A"}</td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>{student.studentId || "N/A"}</td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>
                        {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-GB") : "N/A"}
                      </td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>{student.casteCategory || "N/A"}</td>
                      <td className={`px-4 py-3 ${currentTheme.textPrimary}`}>
                        <motion.img
                          src={student.photo || "https://via.placeholder.com/50"}
                          alt={`${student.firstName}'s photo`}
                          className="h-12 w-12 object-cover rounded-full"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        />
                      </td>
                      <td className="px-4 py-3 flex flex-wrap gap-2">
                        {[
                          { label: "Edit", onClick: () => handleEdit(student), color: "bg-blue-600", hover: "hover:bg-blue-700" },
                          { label: "Delete", onClick: () => handleDelete(student._id), color: "bg-red-600", hover: "hover:bg-red-700" },
                          { label: "Promote", onClick: () => handlePromote(student._id), color: "bg-green-600", hover: "hover:bg-green-700" },
                          { label: "TC", onClick: () => openCertificateModal(student._id, "TC"), color: "bg-indigo-600", hover: "hover:bg-indigo-700" },
                          { label: "LC", onClick: () => openCertificateModal(student._id, "LC"), color: "bg-indigo-600", hover: "hover:bg-indigo-700" },
                          { label: "Backlogs", onClick: () => openBacklogModal(student._id), color: "bg-yellow-600", hover: "hover:bg-yellow-700" },
                        ].map((action, idx) => (
                          <motion.button
                            key={idx}
                            onClick={action.onClick}
                            className={`${action.color} ${action.hover} px-3 py-1 rounded-lg text-sm font-medium ${currentTheme.textAccent} transition-colors`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {action.label}
                          </motion.button>
                        ))}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AnimatePresence>
            {backlogModal.open && (
             <motion.div className="fixed inset-0 bg-black/30 dark:bg-neutral-900/70 backdrop-blur-sm overflow-y-auto pt-8 z-50 flex justify-center"
                role="dialog"
                aria-modal="label"
                aria-labelledby="backlogModalLabel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
className={`${currentTheme.cardBg} ${currentTheme.cardBorder} rounded-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl`}
initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 id="backlogModalLabel" className={`${currentTheme.textAccent} text-xl font-bold mb-4`}>Manage Backlogs for {backlogModal.student?.firstName} {backlogModal.student?.lastName}</h3>
                  {modalError && (
                    <motion.div
                      className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {modalError}
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`${currentTheme.textSecondary} block text-sm font-medium mb-1`}>Stream</label>
                      <div className={`${currentTheme.cardBg} ${currentTheme.cardBorder} p-3 rounded-lg ${currentTheme.textPrimary}`}>
                        {backlogModal.student?.stream?.name || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className={`${currentTheme.textSecondary} block text-sm font-medium mb-1`}>department</label>
                      <div className={`${currentTheme.cardBg} ${currentTheme.cardBorder} p-3 rounded-lg ${currentTheme.textPrimary}`}>
                        {backlogModal.student?.department?.name || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="semesterLabel" className={`${currentTheme.textSecondary} block text-sm font-medium mb-1`}>Semester</label>
                    <select
                      id="semesterLabel"
                      value={backlogModal.semesterId}
                      onChange={handleBacklogSemesterChange}
                      className={`${currentTheme.cardBg} ${currentTheme.cardBorder} p-3 rounded-lg w-full ${currentTheme.textPrimary} focus:ring-2 focus:ring-indigo-400`}
                      aria-label="Select semester"
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((semester) => (
                        <option key={semester._id} value={semester._id}>
                          Semester {semester.number}
                        </option>
                      ))}
                    </select>
                  </div>
                  {backlogModal.semesterId && (
                    <div className="mb-4">
                      <h4 className={`${currentTheme.textSecondary} text-sm font-medium mb-2`}>Subjects</h4>
                      <div className={`${currentTheme.cardBorder} rounded-lg divide-y divide-gray-700/20`}>
                        {loadingSubjects ? (
                          <div className="flex items-center justify-center h-20">
                            <motion.div
                              className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1 }}
                            />
                            <span className={`${currentTheme.textSecondary} ml-2`}>Loading subjects...</span>
                          </div>
                        ) : backlogModal.semesterSubjects.length === 0 ? (
                          <div className={`${currentTheme.textSecondary} p-4 text-center`}>No subjects available.</div>
                        ) : (
                          backlogModal.semesterSubjects.map((subject) => {
                            const status = getSubjectStatus(subject._id, backlogModal.semesterId);
                            return (
                              <motion.div
                                key={`${subject._id}-${refreshCounter}`}
                                className="p-4 hover:bg-gray-200/10 transition-all"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                              >
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`${currentTheme.textPrimary} font-medium`}>{subject.name}</span>
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        status === "Passed"
                                          ? "bg-green-600/20 text-green-400"
                                          : status === "Failed"
                                          ? "bg-red-600/20 text-red-500"
                                          : "bg-gray-600/20 text-gray-400"
                                      }`}
                                    >
                                      {status}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <motion.button
                                      onClick={() => handleSubjectStatusUpdate(subject._id, "Passed")}
                                      disabled={status === "Passed"}
                                      className={`px-3 py-1 rounded-lg text-sm font-medium ${status === "Passed" ? "bg-gray-600/20 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      aria-label={`Mark ${subject.name} as passed`}
                                    >
                                      Pass
                                    </motion.button>
                                    <motion.button
                                      onClick={() => handleSubjectStatusUpdate(subject._id, "Failed")}
                                      disabled={status === "Failed"}
                                      className={`px-3 py-1 rounded-lg text-sm font-medium ${status === "Failed" ? "bg-gray-600/20 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      aria-label={`Mark ${subject.name} as failed`}
                                    >
                                      Fail
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-6">
                    <motion.button
                      onClick={closeBacklogModal}
                      className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} px-6 py-2 rounded-lg ${currentTheme.textAccent} font-medium`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Close backlog modal"
                    >
                      Close
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {certificateModal.open && (
              <motion.div
 className="fixed inset-0 bg-black/30 backdrop-blur-sm overflow-y-auto pt-8 z-50 flex justify-center"
                role="dialog"
                aria-modal="label"
                aria-labelledby="certificateModalLabel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
className={`${currentTheme.cardBg} ${currentTheme.cardBorder} rounded-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl`}
initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 id="certificateModalLabel" className={`${currentTheme.textAccent} text-xl font-bold mb-6`}>
                    Generate {certificateModal.type === "TC" ? "Transfer Certificate" : "Leaving Certificate"}
                  </h3>
                  {certificateModal.error && (
                    <motion.div
                      className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {certificateModal.error}
                    </motion.div>
                  )}
                  {!certificateModal.showPreview ? (
                    <div className="space-y-4">
                      {[
                        {
                          label: "Reason for Leaving",
                          id: "reason",
                          type: "select",
                          name: "reason",
                          value: certificateModal.reason,
                          options: [
                            { value: "", label: "Select Reason" },
                            { value: "term completion", label: "Term Completion" },
                            { value: "own request", label: "Own Request" },
                          ],
                        },
                        {
                          label: "Leaving Date",
                          id: "leaving",
                          type: "date",
                          name: "leavingDate",
                          value: certificateModal.leavingDate,
                        },
                        {
                          label: "Progress",
                          id: "progress",
                          type: "select",
                          name: "progress",
                          value: certificateModal.progress,
                          options: [
                            { value: "Satisfactory", label: "Satisfactory" },
                            { value: "Not Satisfactory", label: "Not Satisfied" },
                          ],
                        },
                        {
                          label: "Conduct",
                          id: "conduct",
                          type: "select",
                          name: "conduct",
                          value: certificateModal.conduct,
                          options: [
                            { value: "Good", label: "Good Conduct" },
                            { value: "Bad", label: "Bad Conduct" },
                          ],
                        },
                        {
                          label: "Remarks",
                          id: "remarks",
                          type: "select",
                          name: "remarks",
                          value: certificateModal.remarks,
                          options: [
                            { value: "", label: "Select Remark" },
                            { value: "He has failed", label: "He has failed" },
                            { value: "She has failed", label: "She has failed" },
                            { value: "He has completed", label: "He has completed" },
                            { value: "She has completed", label: "She has completed" },
                            { value: "He has not appeared", label: "He has not appeared" },
                            { value: "She has not appeared", label: "She has not appeared" },
                          ],
                        },
                        {
                          label: "Semester",
                          id: "remarkSemester",
                          type: "select",
                          name: "remarkSemester",
                          value: certificateModal.remarkSemester,
                          options: [
                            { value: "", label: "Select Semester" },
                            { value: "1", label: "1st Semester" },
                            { value: "2", label: "2nd Semester" },
                            { value: "3", label: "3rd Semester" },
                            { value: "4", label: "4th Semester" },
                            { value: "5", label: "5th Semester" },
                            { value: "6", label: "6th Semester" },
                            { value: "7", label: "7th Semester" },
                            { value: "8", label: "8th Semester" },
                          ],
                        },
                        {
                          label: "Examination Session",
                          id: "remarkSession",
                          type: "select",
                          name: "remarkSession",
                          value: certificateModal.remarkSession,
                          options: [
                            { value: "", label: "Select Session" },
                            { value: "Winter", label: "Winter" },
                            { value: "Summer", label: "Summer" },
                          ],
                        },
                        {
                          label: "Examination Year",
                          id: "remarkYear",
                          type: "select",
                          name: "remarkYear",
                          value: certificateModal.remarkYear,
                          options: [
                            { value: "", label: "Select Year" },
                            { value: "2020", label: "2020" },
                            { value: "2021", label: "2021" },
                            { value: "2022", label: "2022" },
                            { value: "2023", label: "2023" },
                            { value: "2024", label: "2024" },
                            { value: "2025", label: "2025" },
                            { value: "2026", label: "2026" },
                            { value: "2027", label: "2027" },
                            { value: "2028", label: "2028" },
                            { value: "2029", label: "2029" },
                            { value: "2030", label: "2030" },
                          ],
                        },
                        {
                          label: "Standard in which Studying",
                          id: "standard",
                          type: "select",
                          name: "standard",
                          value: certificateModal.standard,
                          options: [
                            { value: "", label: "Select Standard" },
                            { value: "Bachelor of Engineering", label: "Bachelor of Engineering" },
                            { value: "B.Tech", label: "B.Tech" },
                            { value: "MCA", label: "MCA" },
                          ],
                        },
                      ].map((field) => (
                        <motion.div key={field.id} whileHover={{ scale: 1.02 }}>
                          <label htmlFor={field.id} className={`${currentTheme.textSecondary} block text-sm font-medium mb-1`}>
                            {field.label}
                          </label>
                          {field.type === "select" ? (
                            <select
                              id={field.id}
                              name={field.name}
                              value={field.value}
                              onChange={handleCertificateInputChange}
                              className={`${currentTheme.cardBg} ${currentTheme.cardBorder} p-3 rounded-lg w-full ${currentTheme.textPrimary} focus:ring-2 focus:ring-indigo-400`}
                              aria-label={`Select ${field.label.toLowerCase()}`}
                            >
                              {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={field.id}
                              type={field.type}
                              name={field.name}
                              value={field.value}
                              onChange={handleCertificateInputChange}
                              placeholder={field.placeholder}
                              className={`${currentTheme.cardBg} ${currentTheme.cardBorder} p-3 rounded-lg w-full ${currentTheme.textPrimary} focus:ring-2 focus:ring-indigo-400`}
                              aria-label={field.label}
                            />
                          )}
                        </motion.div>
                      ))}
                      <motion.div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isCleared"
                          name="isCleared"
                          checked={certificateModal.isCleared}
                          onChange={handleCertificateInputChange}
                          className="h-4 w-4 text-indigo-400 focus:ring-indigo-400 border-gray-700 rounded"
                          aria-label="No dues cleared"
                        />
                        <label htmlFor="isCleared" className={`${currentTheme.textSecondary} text-sm font-medium`}>No Dues (Cleared)</label>
                      </motion.div>
                      {certificateModal.type === "LC" && (
                        <motion.div whileHover={{ scale: 1.02 }}>
                          <label htmlFor="completionStatus" className={`${currentTheme.textSecondary} block text-sm font-medium mb-1`}>
                            Completion Status
                          </label>
                          <select
                            id="completionStatus"
                            name="completionStatus"
                            value={certificateModal.completionStatus}
                            onChange={handleCertificateInputChange}
                            className={`${currentTheme.cardBg} ${currentTheme.cardBorder} p-3 rounded-lg w-full ${currentTheme.textPrimary} focus:ring-2 focus:ring-indigo-400`}
                            aria-label="Select completion status"
                          >
                            <option value="">Select option</option>
                            <option value="Completed">Completed</option>
                            <option value="Incomplete">Incomplete</option>
                            <option value="Withdrawn">Withdrawn</option>
                          </select>
                        </motion.div>
                      )}
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={closeCertificateModal}
                          className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} px-6 py-2 rounded-lg ${currentTheme.textAccent} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={certificateModal.isGenerating}
                          aria-label="Cancel certificate generation"
                        >
                          Cancel
                        </button>
                        <motion.button
                          onClick={handleShowPreview}
                          className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} px-6 py-2 rounded-lg ${currentTheme.textAccent} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={certificateModal.isGenerating}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Show certificate preview"
                        >
                          Preview
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <LeavingCertificate
                        student={certificateModal.studentData}
                        type={certificateModal.type}
                        reason={certificateModal.reason}
                        leavingDate={certificateModal.leavingDate}
                        isCleared={certificateModal.isCleared}
                        progress={certificateModal.progress}
                        conduct={certificateModal.conduct}
                        remarks={certificateModal.remarks}
                        numberToWords={numberToWords}
                        months={months}
                        standard={certificateModal.standard}
                        theme={currentTheme}
                      />
                      <div className="flex justify-end gap-3 mt-6">
                        <motion.button
                          onClick={() => setCertificateModal((prev) => ({ ...prev, showPreview: false }))}
                          className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} px-6 py-2 rounded-lg ${currentTheme.textAccent} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={certificateModal.isGenerating}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Back to certificate form"
                        >
                          Back to Form
                        </motion.button>
                        <motion.button
                          onClick={handleGenerateCertificate}
                          className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} px-6 py-2 rounded-lg ${currentTheme.textAccent} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={certificateModal.isGenerating}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Generate certificate PDF"
                        >
                          {certificateModal.isGenerating ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Generating...
                            </span>
                          ) : (
                            "Generate PDF"
                          )}
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default StudentList;