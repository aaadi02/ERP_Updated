import { useEffect, useState, useCallback, Component } from "react";
import axios from "axios";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Something went wrong.
          </h2>
          <p className="mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const StudentManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("admission");
  const [formData, setFormData] = useState({
    photo: null,
    abcId: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [subcastes, setSubcastes] = useState([]);
  const [students, setStudents] = useState([]);
  const [castes, setCastes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCastes, setLoadingCastes] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [combinedData, setCombinedData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [admissionTypeFilter, setAdmissionTypeFilter] = useState("");
  const [streams, setStreams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
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
  const [fetchError, setFetchError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const query = admissionTypeFilter
        ? `?admissionType=${admissionTypeFilter}`
        : "";
      const res = await axios.get(
        `http://localhost:5000/api/students${query}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
          },
        }
      );
      setStudents(res.data);
      setFetchError(null);
    } catch (err) {
      console.error("Error fetching students:", err);
      setFetchError(err.response?.data?.error || "Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  }, [admissionTypeFilter]);

  useEffect(() => {
    const fetchCastes = async () => {
      setLoadingCastes(true);
      try {
        const res = await axios.get(
          "http://localhost:5000/api/superadmin/castes",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
            },
          }
        );
        setCastes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load castes:", err);
        setFetchError("Failed to load castes.");
      } finally {
        setLoadingCastes(false);
      }
    };
    fetchCastes();
  }, []);

  useEffect(() => {
    if (activeTab === "studentList") fetchStudents();
  }, [activeTab, fetchStudents]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streamRes, departmentRes, semesterRes, subjectRes] =
          await Promise.all([
            axios.get("http://localhost:5000/api/streams", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }),
            axios.get("http://localhost:5000/api/superadmin/departments", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }),
            axios.get("http://localhost:5000/api/superadmin/semesters", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }),
            axios.get("http://localhost:5000/superadmin/api/subjects", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }),
          ]);

        const streamsData = streamRes.data || [];
        const departmentsData = departmentRes.data || [];
        const semestersData = semesterRes.data || [];
        const subjectsData = subjectRes.data || [];

        setStreams(streamsData);
        setDepartments(departmentsData);
        setSemesters(semestersData);
        setSubjects(subjectsData);

        const combined = streamsData.map((stream) => {
          const streamDepartments = departmentsData
            .filter((dept) => dept?.stream?._id === stream._id)
            .map((dept) => {
              const deptSubjects = deptsubjectsData.filter(
                (sub) => sub.department?._id === dept._id
              );
              return { ...dept, subjects: deptSubjects};
            });
          return { ...stream, departments: streamDepartments};
        });

        setCombinedData(combined);
      } catch (err) {
        console.error("❌ Failed to fetch academic data:", err);
        setFetchError("Failed to fetch academic data.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSemesterSubjects = async () => {
      if (formData.semester && formData.department) {
        setLoading(true);
        try {
          const res = await axios.get(
            `http://localhost:5000/api/students/subjects/${formData.semester}/${formData.department}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }
          );
          setCombinedData((prev) => {
            const stream = prev.find((s) => s._id === formData.stream);
            if (stream) {
              const dept = stream.departments.find(
                (d) => d._id === formData.department
              );
              if (dept) dept.subjects = res.data;
            }
            return [...prev];
          });
          setFormData((prev) => ({ ...prev, subjects: [] }));
        } catch (err) {
          console.error("Failed to fetch subjects:", err);
          setFetchError(
            "Failed to fetch subjects for the selected semester and department."
          );
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSemesterSubjects();
  }, [formData.semester, formData.department]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (file && !["image/jpeg", "image/png"].includes(file.type)) {
        setFormError("Only JPEG or PNG images are allowed");
        setFormData((prev) => ({ ...prev, photo: null }));
        return;
      }
      if (file && file.size > 5 * 1024 * 1024) {
        setFormError("File size must be less than 5MB");
        setFormData((prev) => ({ ...prev, photo: null }));
        return;
      }
      setFormError("");
      setFormData((prev) => ({ ...prev, photo: file }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const currentSubjects = Array.isArray(prev.subjects) ? prev.subjects : [];
      const selectedSubjects = checked
        ? [...currentSubjects, value]
        : currentSubjects.filter((subject) => subject !== value);
      return { ...prev, subjects: selectedSubjects };
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAdmissionTypeFilterChange = (e) => {
    setAdmissionTypeFilter(e.target.value);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCasteChange = (e) => {
    const casteName = e.target.value;
    const selectedCaste = castes.find((c) => c.name === casteName);
    setFormData((prev) => ({
      ...prev,
      casteCategory: casteName,
      subCaste: "",
    }));
    setSubcastes(selectedCaste?.subcastes || []);
  };

  const validateForm = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "mobileNumber",
      "gender",
      "casteCategory",
      "stream",
      "department",
      "semester",
      "admissionType",
      "nationality",
      "placeOfBirth",
      "dateOfBirth",
      "schoolAttended",
    ];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        setFormError(`Please fill out the ${field} field.`);
        return false;
      }
    }
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setFormError("Mobile Number must be a valid 10-digit number.");
      return false;
    }
    if (formData.guardianNumber && !/^\d{10}$/.test(formData.guardianNumber)) {
      setFormError("Guardian Number must be a valid 10-digit number.");
      return false;
    }
    if (formData.abcId && !/^\d{12}$/.test(formData.abcId)) {
      setFormError("ABC ID must be a 12-digit number.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const data = new FormData();
      for (const key in formData) {
        if (key === "subjects") {
          formData.subjects.forEach((subject) => data.append("subjects[]", subject));
        } else if (key === "photo" && formData.photo) {
          data.append("photo", formData.photo);
        } else if (formData[key]) {
          data.append(key, formData[key]);
        }
      }

      if (editingId) {
        await axios.put(`http://localhost:5000/api/students/${editingId}`, data, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Student updated successfully!");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/api/students", data, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Student saved successfully!");
      }
      setFormData({ photo: null, abcId: "" });
      setSubcastes([]);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save student.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setFormData({ ...student, photo: null });
    setActiveTab("admission");
    const selectedCaste = castes.find((c) => c.name === student.casteCategory);
    setSubcastes(selectedCaste?.subcastes || []);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await axios.delete(`http://localhost:5000/api/students/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
          },
        });
        fetchStudents();
        alert("Student deleted successfully!");
      } catch (err) {
        alert("Error deleting student: " + err.message);
      }
    }
  };

  const handlePromote = async (id) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/students/promote/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
          },
        }
      );
      alert(response.data.message || "Student promoted successfully");
      fetchStudents();
    } catch (err) {
      alert(
        "Error promoting student: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const openBacklogModal = async (studentId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
        },
      });
      const student = res.data;
      const semesterId = student.semester?._id || "";
      let semesterSubjects = [];
      if (semesterId && student.department?._id) {
        try {
          const subjectsRes = await axios.get(
            `http://localhost:5000/api/students/subjects/${semesterId}/${student.department._id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }
          );
          semesterSubjects = subjectsRes.data;
        } catch (err) {
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
      setModalError(
        semesterSubjects.length === 0 && semesterId
          ? "No subjects available for this semester."
          : null
      );
    } catch (err) {
      alert(
        "Error fetching student data: " +
          (err.response?.data?.error || err.message)
      );
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
        const res = await axios.get(
          `http://localhost:5000/api/students/subjects/${semesterId}/${backlogModal.departmentId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
            },
          }
        );
        if (res.data.length === 0) {
          setModalError(
            "No subjects available for this semester and department."
          );
        }
        setBacklogModal((prev) => ({ ...prev, semesterSubjects: res.data }));
      } catch (err) {
        setModalError(
          "Failed to fetch subjects: " +
            (err.response?.data?.error || err.message)
        );
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

    const isValidSubject = backlogModal.semesterSubjects.some(
      (sub) => sub._id === subjectId
    );
    if (!isValidSubject) {
      setModalError("Invalid subject selected for this semester.");
      return;
    }

    try {
      const semesterRecord = student.semesterRecords.find(
        (record) =>
          record.semester?._id && String(record.semester._id) === semesterId
      );

      const updatedSemesterRecords = [...student.semesterRecords];
      if (semesterRecord) {
        const subjectIndex = semesterRecord.subjects.findIndex(
          (sub) => sub.subject?._id && String(sub.subject._id) === subjectId
        );
        if (subjectIndex >= 0) {
          semesterRecord.subjects[subjectIndex].status = status;
          semesterRecord.subjects[subjectIndex].marks =
            status === "Passed" ? 50 : 0;
        } else {
          semesterRecord.subjects.push({
            subject: subjectId,
            status,
            marks: status === "Passed" ? 50 : 0,
          });
        }
      } else {
        updatedSemesterRecords.push({
          semester: semesterId,
          subjects: [
            { subject: subjectId, status, marks: status === "Passed" ? 50 : 0 },
          ],
          isBacklog: status === "Pending",
        });
      }

      if (status === "Pending") {
        const existingBacklog = student.backlogs.find(
          (backlog) =>
            backlog.subject?._id &&
            backlog.semester?._id &&
            String(backlog.subject._id) === subjectId &&
            String(backlog.semester._id) === semesterId
        );
        if (!existingBacklog) {
          await axios.post(
            `http://localhost:5000/api/students/${studentId}/add-backlog`,
            { subjectIds: [subjectId], semesterId },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }
          );
        }
      } else if (status === "Passed") {
        const backlog = student.backlogs.find(
          (backlog) =>
            backlog.subject?._id &&
            backlog.semester?._id &&
            String(backlog.subject._id) === subjectId &&
            String(backlog.semester._id) === semesterId
        );
        if (backlog) {
          await axios.put(
            `http://localhost:5000/api/students/${studentId}/update-backlog/${backlog._id}`,
            { status: "Completed" },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
              },
            }
          );
        }
      }

      await axios.put(
        `http://localhost:5000/api/students/${studentId}`,
        { semesterRecords: updatedSemesterRecords },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
          },
        }
      );

      alert(`Subject status updated to ${status}!`);
      fetchStudents();
      const res = await axios.get(
        `http://localhost:5000/api/students/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
          },
        }
      );
      setBacklogModal((prev) => ({ ...prev, student: res.data }));
    } catch (err) {
      setModalError(
        err.response?.data?.error || "Failed to update subject status."
      );
    }
  };

  const getSubjectStatus = (subjectId, semesterId) => {
    const { student } = backlogModal;
    if (!student || !semesterId) return "Pending";
    const semesterRecord = student.semesterRecords.find(
      (record) =>
        record.semester?._id && String(record.semester._id) === semesterId
    );
    if (semesterRecord) {
      const subject = semesterRecord.subjects.find(
        (sub) => sub.subject?._id && String(sub.subject._id) === subjectId
      );
      return subject ? subject.status : "Pending";
    }
    return "Pending";
  };

  const logout = () => {
    localStorage.removeItem("faculty");
    localStorage.removeItem("facultyToken");
    window.location.href = "/";
  };

  const DropdownGroup = ({ label, name, options }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">-- Select {label} --</option>
        {options.map((opt, i) => (
          <option key={i} value={opt._id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );

  const fields = [
    { label: "First Name", name: "firstName" },
    { label: "Middle Name", name: "middleName" },
    { label: "Last Name", name: "lastName" },
    { label: "Father Name", name: "fatherName" },
    { label: "Unicode Father Name", name: "unicodeFatherName" },
    { label: "Mother Name", name: "motherName" },
    { label: "Unicode Mother Name", name: "unicodeMotherName" },
    { label: "Unicode Name", name: "unicodeName" },
    { label: "Enrollment Number", name: "enrollmentNumber" },
    { label: "Mobile Number", name: "mobileNumber" },
    { label: "Guardian Number", name: "guardianNumber" },
    { label: "Address", name: "address" },
    { label: "Email", name: "email" },
    { label: "Section", name: "section" },
    { label: "Remark", name: "remark" },
    { label: "Nationality", name: "nationality" },
    { label: "Place of Birth", name: "placeOfBirth" },
    { label: "Date of Birth", name: "dateOfBirth", type: "date" },
    { label: "School Attended", name: "schoolAttended" },
    { label: "Name of Institute", name: "nameOfInstitute" },
    { label: "ABC ID", name: "abcId" },
  ];

  // Sample Download Section (replace with actual Download component if available)
  const DownloadSection = () => {
    const handleDownload = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/students/export", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
          },
          responseType: "blob", // For downloading files
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "students_data.csv"); // Adjust filename as needed
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        alert("Error downloading data: " + (err.response?.data?.error || err.message));
      }
    };

    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Download Student Data</h2>
        <p className="mb-4 text-gray-600">Click the button below to download a CSV file containing all student data.</p>
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Download CSV
        </button>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="md:hidden bg-gradient-to-r from-gray-600 to-gray-800 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Student Panel</h1>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md hover:bg-blue-700 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          <div
            className={`
              fixed md:static inset-y-0 left-0 z-30 
              w-64 bg-gradient-to-b from-gray-600 to-gray-800 text-white
              transition-transform duration-300 ease-in-out
              md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <div className="md:hidden flex justify-end p-4">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md hover:bg-blue-700 transition-colors"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Student Panel</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      setActiveTab("admission");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                      activeTab === "admission"
                        ? "bg-white text-blue-700 font-medium"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    Admission
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab("studentList");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                      activeTab === "studentList"
                        ? "bg-white text-blue-700 font-medium"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    Student List
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab("download");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                      activeTab === "download"
                        ? "bg-white text-blue-700 font-medium"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    Download
                  </button>
                </li>
                <li>
                  <button
                    onClick={logout}
                    className="w-full text-left py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={toggleMobileMenu}
              aria-hidden="true"
            ></div>
          )}

          <div className="flex-1 p-6">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {activeTab === "admission"
                  ? editingId
                    ? "Edit Student"
                    : "Student Admission Form"
                  : activeTab === "studentList"
                  ? "Student List"
                  : "Download Student Data"}
              </h2>

              {fetchError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
                  <span>{fetchError}</span>
                  <button
                    onClick={fetchStudents}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {formError}
                </div>
              )}

              {activeTab === "admission" && (
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fields.map(({ label, name, type }) => (
                      <div key={name} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {label}
                        </label>
                        {name === "photo" ? (
                          <input
                            type="file"
                            name="photo"
                            accept="image/jpeg,image/png"
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        ) : (
                          <input
                            type={type || "text"}
                            name={name}
                            value={formData[name] || ""}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    ))}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stream
                      </label>
                      <select
                        name="stream"
                        value={formData.stream || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Stream</option>
                        {combinedData.map((stream) => (
                          <option key={stream._id} value={stream._id}>
                            {stream.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        name="department"
                        value={formData.department || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        {(
                          combinedData.find((s) => s._id === formData.stream)
                            ?.departments || []
                        ).map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <DropdownGroup
                      label="Semester"
                      name="semester"
                      options={semesters.map((s) => ({
                        _id: s._id,
                        name: s.number,
                      }))}
                    />

                    <div className="mb-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subjects
                      </label>
                      <div className="p-3 border border-gray-300 rounded-md bg-gray-50 max-h-48 overflow-y-auto">
                        {loading ? (
                          <div className="flex items-center justify-center h-20">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">
                              Loading subjects...
                            </span>
                          </div>
                        ) : (
                          (formData.stream &&
                          formData.department &&
                          formData.semester
                            ? combinedData
                                .find((s) => s._id === formData.stream)
                                ?.departments.find(
                                  (dept) => dept._id === formData.department
                                )?.subjects
                            : []
                          )?.map((sub) => (
                            <div
                              key={sub._id}
                              className="flex items-center mb-2"
                            >
                              <input
                                type="checkbox"
                                id={`subject-${sub._id}`}
                                name="subjects"
                                value={sub._id}
                                checked={
                                  Array.isArray(formData.subjects) &&
                                  formData.subjects.includes(sub._id)
                                }
                                onChange={handleCheckboxChange}
                                disabled={loading}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`subject-${sub._id}`}
                                className="ml-2 text-gray-700"
                              >
                                {sub.name}
                              </label>
                            </div>
                          )) || (
                            <div className="text-gray-500 py-2">
                              No subjects available for this semester and
                              department.
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Gender --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caste Category
                      </label>
                      <select
                        name="casteCategory"
                        value={formData.casteCategory || ""}
                        onChange={handleCasteChange}
                        disabled={loadingCastes}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Caste --</option>
                        {castes.map((c) => (
                          <option key={c._id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub Caste
                      </label>
                      <select
                        name="subCaste"
                        value={formData.subCaste || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Subcaste --</option>
                        {subcastes.map((sub, i) => (
                          <option key={i} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admission Type
                      </label>
                      <select
                        name="admissionType"
                        value={formData.admissionType || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Admission Type --</option>
                        <option value="Regular">Regular</option>
                        <option value="Direct Second Year">
                          Direct Second Year
                        </option>
                        <option value="Lateral Entry">Lateral Entry</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admission Through
                      </label>
                      <select
                        name="admissionThrough"
                        value={formData.admissionThrough || ""}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select --</option>
                        <option value="Entrance Exam">Entrance Exam</option>
                        <option value="Quota">Quota</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
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
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </span>
                      ) : editingId ? (
                        "Update Student"
                      ) : (
                        "Submit Admission"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "studentList" && (
                <div className="max-w-full mx-auto">
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search by name or enrollment number..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="w-full md:w-64">
                      <select
                        value={admissionTypeFilter}
                        onChange={handleAdmissionTypeFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Admission Types</option>
                        <option value="Regular">Regular</option>
                        <option value="Direct Second Year">
                          Direct Second Year
                        </option>
                        <option value="Lateral Entry">Lateral Entry</option>
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">
                        Loading students...
                      </span>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No students found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Photo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              First Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Enrollment Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ABC ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nationality
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Place of Birth
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date of Birth
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              School Attended
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Institute
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Caste
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subcaste
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admission Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admission Through
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stream
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Guardian Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredStudents.map((student) => (
                            <tr key={student._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <img
                                  src={
                                    student.photo ||
                                    "https://via.placeholder.com/50"
                                  }
                                  alt={`${student.firstName} ${student.lastName}`}
                                  className="w-12 h-12 object-cover rounded-full"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.firstName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.lastName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.enrollmentNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.abcId || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.nationality || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.placeOfBirth || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.dateOfBirth
                                  ? new Date(student.dateOfBirth).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.schoolAttended || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.nameOfInstitute || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.casteCategory}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.subCaste}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.admissionType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.admissionThrough}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.stream ? student.stream.name : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.department
                                  ? student.department.name
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.address || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.guardianNumber || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleEdit(student)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(student._id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => handlePromote(student._id)}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                  >
                                    Promote
                                  </button>
                                  <button
                                    onClick={() =>
                                      openBacklogModal(student._id)
                                    }
                                    className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                                  >
                                    Backlog
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "download" && <DownloadSection />}

              {backlogModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">
                        Manage Backlogs for {backlogModal.student?.firstName}{" "}
                        {backlogModal.student?.lastName}
                      </h3>

                      {modalError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                          {modalError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stream
                          </label>
                          <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                            {backlogModal.student?.stream?.name || "N/A"}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Department
                          </label>
                          <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                            {backlogModal.student?.department?.name || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Semester
                        </label>
                        <select
                          value={backlogModal.semesterId}
                          onChange={handleBacklogSemesterChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subjects
                          </label>
                          <div className="border border-gray-200 rounded-lg divide-y">
                            {loadingSubjects ? (
                              <div className="flex items-center justify-center h-20">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">
                                  Loading subjects...
                                </span>
                              </div>
                            ) : backlogModal.semesterSubjects.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No subjects available for this semester
                              </div>
                            ) : (
                              backlogModal.semesterSubjects.map((subject) => {
                                const status = getSubjectStatus(
                                  subject._id,
                                  backlogModal.semesterId
                                );
                                return (
                                  <div
                                    key={subject._id}
                                    className="p-3 hover:bg-gray-50"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <span className="font-medium">
                                          {subject.name}
                                        </span>
                                        <span
                                          className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                            status === "Passed"
                                              ? "bg-green-100 text-green-800"
                                              : status === "Failed"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {status}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            handleSubjectStatusUpdate(
                                              subject._id,
                                              "Passed"
                                            )
                                          }
                                          disabled={status === "Passed"}
                                          className={`px-3 py-1 rounded text-sm font-medium ${
                                            status === "Passed"
                                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                              : "bg-green-100 text-green-700 hover:bg-green-200"
                                          }`}
                                        >
                                          Pass
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleSubjectStatusUpdate(
                                              subject._id,
                                              "Failed"
                                            )
                                          }
                                          disabled={status === "Failed"}
                                          className={`px-3 py-1 rounded text-sm font-medium ${
                                            status === "Failed"
                                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                              : "bg-red-100 text-red-700 hover:bg-red-200"
                                          }`}
                                        >
                                          Fail
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end mt-6">
                        <button
                          onClick={closeBacklogModal}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </ErrorBoundary>
    );
};

export default StudentManagementDashboard;