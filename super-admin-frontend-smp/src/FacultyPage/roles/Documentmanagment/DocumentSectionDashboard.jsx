import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { jsPDF } from "jspdf";

// Update these paths as needed
const LOGO_URL = "/logo.png";
const LOGO1_URL = "/logo1.png";

// Utility to load images for jsPDF
const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });

const numberToWords = (num) => {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const thousands = ["", "Thousand"];
  if (num === 0) return "Zero";
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100)
    return `${tens[Math.floor(num / 10)]} ${units[num % 10]}`.trim();
  if (num < 1000)
    return `${units[Math.floor(num / 100)]} Hundred ${
      num % 100 === 0 ? "" : numberToWords(num % 100)
    }`.trim();
  if (num < 10000)
    return `${numberToWords(Math.floor(num / 1000))} ${
      thousands[1]
    } ${num % 1000 === 0 ? "" : numberToWords(num % 1000)}`.trim();
  return num.toString();
};

const dateToWords = (dateStr) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Not Provided";
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${numberToWords(day)} ${month} ${numberToWords(year)}`;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Not Provided";
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .split("/")
    .join("/");
};

const DocumentManagementDashboard = () => {
  const navigate = useNavigate(); 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [errors, setErrors] = useState({});
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    username: "Faculty User",
    role: "Document Section",
  });
  const [authError, setAuthError] = useState(null);
  const [token, setToken] = useState("demo-token-12345");
  const [certificatePreview, setCertificatePreview] = useState(null);

  useEffect(() => {
    if (!token) {
      setAuthError("No authentication token found");
      return;
    }
    setTimeout(() => {
      setUser({ username: "Faculty User", role: "Document Section" });
    }, 1000);
  }, [token]);

  const validateForm = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First Name is required";
    if (!lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!enrollmentNumber.trim())
      newErrors.enrollmentNumber = "Enrollment Number is required";
    else if (!/^[0-9]+$/.test(enrollmentNumber))
      newErrors.enrollmentNumber = "Enrollment Number must be numeric";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchStudentData = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const res = await axios.get("http://localhost:5000/api/students", {
        params: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          enrollmentNumber: enrollmentNumber.trim(),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.length > 0) {
        setStudentData(res.data[0]);
      } else {
        setErrors({ api: "No student found with the provided details" });
        setStudentData(null);
      }
    } catch (err) {
      setStudentData(null);
      if (err.response) {
        setErrors({
          api: err.response.data.error || "Failed to fetch student data",
        });
      } else if (err.request) {
        setErrors({ api: "Network error: Unable to connect to the server" });
      } else {
        setErrors({ api: "An unexpected error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) fetchStudentData();
  };

  const handleReset = () => {
    setFirstName("");
    setLastName("");
    setEnrollmentNumber("");
    setStudentData(null);
    setErrors({});
    setCertificatePreview(null);
  };

  const handlePreviewCertificate = async () => {
    if (!studentData) {
      alert("Please select a student first.");
      return;
    }
    try {
      const studentRes = await axios.get(
        `http://localhost:5000/api/students/${studentData._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const student = studentRes.data;
      const certificateData = {
        studentName: `${student.firstName} ${
          student.middleName || ""
        } ${student.lastName}`.trim(),
        course: `${student.stream?.name || "B.Tech"} in ${
          student.department?.name || "Engineering"
        }`,
        semesterNumber: student.semester?.number || "",
        year: student.semester?.number
          ? Math.ceil(student.semester.number / 2)
          : "",
        session: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth).toLocaleDateString("en-GB")
          : "",
        dateOfBirthWords: student.dateOfBirth
          ? dateToWords(student.dateOfBirth)
          : "",
        conduct: "good moral character",
        dateOfIssue: new Date().toLocaleDateString("en-GB"),
      };
      setCertificatePreview(certificateData);
    } catch (err) {
      setErrors({
        api: `Failed to generate preview: ${
          err.response?.data?.error || err.message
        }`,
      });
    }
  };

  const handleDownloadCertificate = async () => {
    if (!studentData) {
      alert("Please select a student first.");
      return;
    }
    if (!studentData._id || !/^[0-9a-fA-F]{24}$/.test(studentData._id)) {
      alert("Invalid student ID. Please fetch student data again.");
      return;
    }
    let certificateData;
    try {
      certificateData = {
        studentName: `${studentData.firstName} ${
          studentData.middleName || ""
        } ${studentData.lastName}`.trim(),
        course: `${studentData.stream?.name || "B.Tech"} in ${
          studentData.department?.name || "Engineering"
        }`,
        semesterNumber: studentData.semester?.number || "",
        year: studentData.semester?.number
          ? Math.ceil(studentData.semester.number / 2)
          : "",
        session: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        dateOfBirth: studentData.dateOfBirth
          ? new Date(studentData.dateOfBirth).toLocaleDateString("en-GB")
          : "",
        dateOfBirthWords: studentData.dateOfBirth
          ? dateToWords(studentData.dateOfBirth)
          : "",
        conduct: "good moral character",
        dateOfIssue: new Date().toLocaleDateString("en-GB"),
      };
      await axios.post(
        `http://localhost:5000/api/students/generate-certificate/${studentData._id}`,
        {
          type: "BC",
          data: certificateData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      setErrors({
        api: `Failed to generate BC certificate: ${
          err.response?.data?.error || err.message
        }`,
      });
    }
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const marginLeft = 20;
      const marginRight = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - marginLeft - marginRight;
      let y = 10;

      try {
        const logoImg = await loadImage(LOGO_URL);
        if (logoImg.width > 0) {
          doc.addImage(logoImg, "PNG", marginLeft, y, 25, 25);
        }
      } catch {}
      try {
        const logo1Img = await loadImage(LOGO1_URL);
        if (logo1Img.width > 0) {
          doc.addImage(logo1Img, "PNG", pageWidth - marginRight - 25, y, 23, 23);
        }
      } catch {}

      doc.setFontSize(8).setFont("Helvetica", "normal");
      doc.text("maitrey education society", pageWidth / 2, y + 3, { align: "center" });
      doc.setFontSize(25).setFont("Helvetica", "bold");
      doc.text("NAGARJUNA", pageWidth / 2, y + 12, { align: "center" });
      y += 23;
      doc.setFontSize(14).setFont("Helvetica", "normal");
      doc.text("Institute of Engineering, Technology & Management", pageWidth / 2, y - 3, { align: "center" });
      y += 6;
      doc.setFontSize(12).setFont("Helvetica", "normal");
      const affiliation = "(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)";
      const affiliationLines = doc.splitTextToSize(affiliation, contentWidth - 20);
      doc.text(affiliationLines, pageWidth / 2, y - 2, { align: "center" });
      y += affiliationLines.length * 4;
      doc.text("Village Satnavri, Amravati Road, Nagpur 440023", pageWidth / 2, y - 2, { align: "center" });
      y += 4;
      doc.text("Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12", pageWidth / 2, y - 2, { align: "center" });
      y += 8;
      doc.setLineWidth(0.5);
      doc.line(marginLeft + 5, y, pageWidth - marginRight - 5, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Ref No.: NIETM / 2025-26`, marginLeft, y);
      doc.text(`Date: ${certificateData.dateOfIssue}`, pageWidth - marginRight - 50, y);
      y += 15;
      const titleWidth = 70;
      const titleX = (pageWidth - titleWidth) / 2;
      doc.setLineWidth(0.2);
      doc.roundedRect(titleX, y, titleWidth, 10, 2, 2, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("BONAFIDE CERTIFICATE", pageWidth / 2, y + 7, { align: "center" });
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const gender = studentData?.gender || "Male";
      const isFemalePronoun = gender.toLowerCase() === "female";
      const heShe = isFemalePronoun ? "she" : "he";
      const hisHer = isFemalePronoun ? "her" : "his";
      const studentTitle = isFemalePronoun ? "Ku." : "Shri";
      const paragraphText = `Certified that ${studentTitle} ${
        certificateData.studentName
      } is a bonafide student of this college studying in ${
        certificateData.course
      } ${certificateData.year} Year in ${
        certificateData.semesterNumber
      } Sem in the session ${certificateData.session}. According to our college record ${hisHer} date of birth is ${
        certificateData.dateOfBirth
      }. As far as known to me ${heShe} bears ${certificateData.conduct}.`;
      const splitText = doc.splitTextToSize(paragraphText, contentWidth);
      doc.text(splitText, marginLeft, y, {
        align: "justify",
        maxWidth: contentWidth,
        lineHeightFactor: 1.3,
      });
      y += splitText.length * 5;
      const currentDate = formatDate(new Date());
      doc.text(`Date: ${currentDate}`, marginLeft, y + 30);
      doc.text("Checked by", pageWidth / 2 - 10, y + 30);
      doc.text("Principal/Vice-Principal", pageWidth - marginRight - 2, y + 30, { align: "right" });
      doc.save(`BC_${studentData._id}_${Date.now()}.pdf`);
      alert("Bonafide Certificate downloaded successfully!");
    } catch (err) {
      setErrors({
        api: `Failed to generate BC certificate: ${err.message}`,
      });
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;
  
    setToken(null);
    setUser(null);
    setFirstName("");
    setLastName("");
    setEnrollmentNumber("");
    setStudentData(null);
    setErrors({});
    setCertificatePreview(null);
    navigate("/");
  };
  

  if (!user && !authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-white mx-auto mb-4"></div>
        <p className="text-gray-200 ml-4 text-sm sm:text-base">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-100 flex flex-col p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white/80 backdrop-blur-lg p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto mt-4 sm:mt-6 md:mt-8">
        {/* Header */}
        {user && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-lg ring-2 ring-indigo-200">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-base sm:text-lg">
                  Welcome, {user.username}
                </p>
                <p className="text-sm text-indigo-700">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-full font-semibold shadow bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm sm:text-base w-full sm:w-auto"
            >
              Logout
            </button>
          </div>
        )}

        {authError && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm sm:text-base">
            <p>{authError}</p>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-6 sm:mb-8 text-center tracking-tight text-indigo-900 drop-shadow">
          Document Management Dashboard
        </h1>

        {/* Form */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
            <div>
              <label className="block mb-1 sm:mb-2 font-semibold text-indigo-700 text-sm sm:text-base" htmlFor="firstName">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 focus:outline-none focus:ring-4 transition-all duration-300 ${
                  errors.firstName ? "border-red-400 ring-red-100" : "border-indigo-300 focus:ring-indigo-200"
                } bg-white/80 text-sm sm:text-base`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 sm:mb-2 font-semibold text-indigo-700 text-sm sm:text-base" htmlFor="lastName">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 focus:outline-none focus:ring-4 transition-all duration-300 ${
                  errors.lastName ? "border-red-400 ring-red-100" : "border-indigo-300 focus:ring-indigo-200"
                } bg-white/80 text-sm sm:text-base`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 sm:mb-2 font-semibold text-indigo-700 text-sm sm:text-base" htmlFor="enrollment">
              Enrollment Number *
            </label>
            <input
              type="text"
              id="enrollment"
              value={enrollmentNumber}
              onChange={(e) => setEnrollmentNumber(e.target.value)}
              className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 focus:outline-none focus:ring-4 transition-all duration-300 ${
                errors.enrollmentNumber ? "border-red-400 ring-red-100" : "border-indigo-300 focus:ring-indigo-200"
              } bg-white/80 text-sm sm:text-base`}
              placeholder="Enter enrollment number"
            />
            {errors.enrollmentNumber && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.enrollmentNumber}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl font-semibold shadow-md transition-all duration-300 ${
                isLoading
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              } text-white text-sm sm:text-base`}
            >
              {isLoading ? "Fetching..." : "Fetch Student Data"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl font-semibold shadow-md bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white text-sm sm:text-base"
            >
              Reset
            </button>
          </div>
        </div>

        {errors.api && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm sm:text-base">
            <p>{errors.api}</p>
          </div>
        )}

        {/* Student Details */}
        {studentData && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-green-50 via-white to-green-100 border border-green-200 rounded-lg sm:rounded-2xl shadow-lg">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-green-800 tracking-wide">
              Student Details Found
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              <p className="text-sm sm:text-base"><strong>First Name:</strong> {studentData.firstName || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Middle Name:</strong> {studentData.middleName || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Last Name:</strong> {studentData.lastName || "N/A"}</p>
              <p className="text-sm sm:text-base">
                <strong>Full Name:</strong>{" "}
                {`${studentData.firstName || ""} ${studentData.middleName || ""} ${studentData.lastName || ""}`.replace(/\s+/g, " ").trim() || "N/A"}
              </p>
              <p className="text-sm sm:text-base"><strong>Father Name:</strong> {studentData.fatherName || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Unicode Father Name:</strong> {studentData.unicodeFatherName || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Mother Name:</strong> {studentData.motherName || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Unicode Mother Name:</strong> {studentData.unicodeMotherName || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Unicode Name:</strong> {studentData.unicodeName || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Enrollment Number:</strong> {studentData.enrollmentNumber || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Gender:</strong> {studentData.gender || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Mobile Number:</strong> {studentData.mobileNumber || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Caste Category:</strong> {studentData.casteCategory || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Sub Caste:</strong> {studentData.subCaste || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Email:</strong> {studentData.email || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Section:</strong> {studentData.section || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Admission Type:</strong> {studentData.admissionType || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Admission Through:</strong> {studentData.admissionThrough || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Remark:</strong> {studentData.remark || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Semester:</strong> {studentData.semester?.number || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Stream:</strong> {studentData.stream?.name || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Department:</strong> {studentData.department?.name || "N/A"}</p>
              <p className="text-sm sm:text-base">
                <strong>Admission Date:</strong>{" "}
                {studentData.admissionDate ? formatDate(studentData.admissionDate) : "N/A"}
              </p>
              <p className="text-sm sm:text-base"><strong>Student ID:</strong> {studentData.studentId || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Nationality:</strong> {studentData.nationality || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Place of Birth:</strong> {studentData.placeOfBirth || "N/A"}</p>
              <p className="text-sm sm:text-base">
                <strong>Date of Birth:</strong>{" "}
                {studentData.dateOfBirth ? formatDate(studentData.dateOfBirth) : "N/A"}
              </p>
              <p className="text-sm sm:text-base">
                <strong>Date of Birth (Words):</strong>{" "}
                {studentData.dateOfBirth ? dateToWords(studentData.dateOfBirth) : "N/A"}
              </p>
              <p className="text-sm sm:text-base"><strong>School Attended:</strong> {studentData.schoolAttended || "N/A"}</p>
              <p className="text-sm sm:text-base"><strong>Name of Institute:</strong> {studentData.nameOfInstitute || "N/A"}</p>
              <p className="text-sm sm:text-base">
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-1 rounded text-xs sm:text-sm ${
                  studentData.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {studentData.status || "Active"}
                </span>
              </p>
              <div className="col-span-1 md:col-span-2">
                <p className="text-sm sm:text-base"><strong>Semester Records:</strong></p>
                {studentData.semesterRecords && studentData.semesterRecords.length > 0 ? (
                  <ul className="list-disc pl-4 sm:pl-5 text-sm sm:text-base">
                    {studentData.semesterRecords.map((record, index) => (
                      <li key={index}>
                        Semester: {record.semester?.number || record.semester || "N/A"}, Is Backlog: {record.isBacklog ? "Yes" : "No"}
                        <ul className="list-circle pl-4 sm:pl-5">
                          {record.subjects && record.subjects.map((sub, subIndex) => (
                            <li key={subIndex}>
                              Subject: {sub.subject?.name || sub.subject || "N/A"}, Status: {sub.status || "N/A"}, Marks: {sub.marks || "N/A"}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm sm:text-base">N/A</p>
                )}
              </div>
              <div className="col-span-1 md:col-span-2">
                <p className="text-sm sm:text-base"><strong>Backlogs:</strong></p>
                {studentData?.backlogs && studentData.backlogs.length > 0 ? (
                  <ul className="list-disc pl-4 sm:pl-5 text-sm sm:text-base">
                    {studentData.backlogs.map((backlog, index) => (
                      <li key={index}>
                        Subject: {backlog.subject?.name || backlog.subject || "Not Provided"}, Semester: {backlog.semester?.number || "Not Provided"}, Status: {backlog.status || "Not Provided"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm sm:text-base">Not Provided</p>
                )}
              </div>
              <div className="col-span-1 md:col-span-2">
                <p className="text-sm sm:text-base"><strong>Subjects:</strong></p>
                {studentData?.subjects && studentData.subjects.length > 0 ? (
                  <ul className="list-disc pl-4 sm:pl-5 text-sm sm:text-base">
                    {studentData.subjects.map((subject, index) => (
                      <li key={index}>
                        {subject?.name || subject || "Not Provided"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm sm:text-base">Not Provided</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Certificate Actions */}
        {studentData && (
          <div className="flex flex-col sm:flex-row justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <button
              onClick={handlePreviewCertificate}
              className="flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl font-semibold shadow-md bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm sm:text-base"
            >
              Preview Bonafide Certificate
            </button>
            <button
              onClick={handleDownloadCertificate}
              className="flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl font-semibold shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm sm:text-base"
            >
              Download Bonafide Certificate
            </button>
          </div>
        )}

        {/* Certificate Preview */}
        {certificatePreview && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-600">
              Bonafide Certificate Preview
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:gap-3 text-sm sm:text-base">
              <p><strong>Student Name:</strong> {certificatePreview.studentName}</p>
              <p><strong>Course:</strong> {certificatePreview.course}</p>
              <p><strong>Semester Number:</strong> {certificatePreview.semesterNumber}</p>
              <p><strong>Year:</strong> {certificatePreview.year}</p>
              <p><strong>Session:</strong> {certificatePreview.session}</p>
              <p><strong>Date of Birth:</strong> {certificatePreview.dateOfBirth}</p>
              <p><strong>Date of Birth (Words):</strong> {certificatePreview.dateOfBirthWords}</p>
              <p><strong>Conduct:</strong> {certificatePreview.conduct}</p>
              <p><strong>Date of Issue:</strong> {certificatePreview.dateOfIssue}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManagementDashboard;