import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Sun, Moon } from "lucide-react";

function AdmissionForm() {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  
  // Theme classes based on user's specification
  const themeClasses = {
    dark: {
      bg: "bg-gradient-to-br from-neutral-900 via-gray-800 to-neutral-950",
      headerBg: "bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900",
      headerBorder: "border-b-4 border-indigo-400/30",
      cardBg: "bg-white/10 backdrop-blur-lg",
      cardBorder: "border border-indigo-400/20",
      textPrimary: "text-gray-50",
      textSecondary: "text-indigo-200",
      textAccent: "text-white",
      buttonBg: "bg-gradient-to-r from-indigo-700 to-purple-700",
      buttonHover: "hover:bg-indigo-800",
      chartBg: "bg-white/10 backdrop-blur-xl",
      glow: "bg-indigo-400/30",
      doughnutGlow: "bg-purple-400/20",
      errorBg: "bg-red-900/80 text-red-100",
      dropdownBg: "bg-gray-800",
      dropdownText: "text-gray-100",
      checkboxText: "text-gray-200",
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
      errorBg: "bg-red-50 text-red-700",
      dropdownBg: "bg-gray-50",
      dropdownText: "text-gray-700",
      checkboxText: "text-gray-700",
    },
  };
  
  const currentTheme = themeClasses[theme];
  
  const [castes, setCastes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    unicodeFatherName: "",
    motherName: "",
    unicodeMotherName: "",
    unicodeName: "",
    enrollmentNumber: "",
    mobileNumber: "",
    email: "",
    section: "",
    remark: "",
    nationality: "",
    placeOfBirth: "",
    dateOfBirth: "",
    schoolAttended: "",
    nameOfInstitute: "",
    stream: "",
    department: "",
    semester: "",
    subjects: [],
    gender: "",
    casteCategory: "",
    subCaste: "",
    admissionType: "",
    admissionThrough: "",
    address: "",
    guardianNumber: "",
    photo: null,
    abcId: "",
  });
  const [subcastes, setSubcastes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCastes, setLoadingCastes] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [combinedData, setCombinedData] = useState([]);
  const [streams, setStreams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (location?.state) {
      setFormData({
        firstName: location.state.firstName || "",
        middleName: location.state.middleName || "",
        lastName: location.state.lastName || "",
        fatherName: location.state.fatherName || "",
        unicodeFatherName: location.state.unicodeFatherName || "",
        motherName: location.state.motherName || "",
        unicodeMotherName: location.state.unicodeMotherName || "",
        unicodeName: location.state.unicodeName || "",
        enrollmentNumber: location.state.enrollmentNumber || "",
        mobileNumber: location.state.mobileNumber || "",
        email: location.state.email || "",
        section: location.state.section || "",
        remark: location.state.remark || "",
        nationality: location.state.nationality || "",
        placeOfBirth: location.state.placeOfBirth || "",
        dateOfBirth: location.state.dateOfBirth
          ? new Date(location.state.dateOfBirth).toISOString().split("T")[0]
          : "",
        schoolAttended: location.state.schoolAttended || "",
        nameOfInstitute: location.state.nameOfInstitute || "",
        stream: location.state.stream?._id || "",
        department: location.state.department?._id || "",
        semester: location.state.semester?._id || "",
        subjects: location.state.subjects?.map((sub) => sub._id) || [],
        gender: location.state.gender || "",
        casteCategory: location.state.casteCategory || "",
        subCaste: location.state.subCaste || "",
        admissionType: location.state.admissionType || "",
        admissionThrough: location.state.admissionThrough || "",
        address: location.state.address || "",
        guardianNumber: location.state.guardianNumber || "",
        photo: null,
        abcId: location.state.abcId || "",
      });
      setEditingId(location.state._id);
      setPhotoPreview(location.state.photo || null);
    }
  }, [location?.state]);

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
            axios.get("http://localhost:5000/api/superadmin/subjects", {
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
              const deptSubjects = subjectsData.filter(
                (sub) => sub.department?._id === dept._id
              );
              return { ...dept, subjects: deptSubjects };
            });
          return { ...stream, departments: streamDepartments };
        });

        setCombinedData(combined);
      } catch (err) {
        console.error("Failed to fetch academic data:", err);
        setFetchError("Failed to fetch academic data.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSemesterSubjects = async () => {
      if (formData.semester && formData.department && typeof formData.semester === "string" && typeof formData.department === "string") {
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
          const fetchedSubjects = res.data || [];
          if (fetchedSubjects.length === 0) {
            setFetchError("No subjects available for the selected semester and department.");
          }
          setCombinedData((prev) => {
            const updatedCombined = [...prev];
            const stream = updatedCombined.find((s) => s._id === formData.stream);
            if (stream) {
              const dept = stream.departments.find(
                (d) => d._id === formData.department
              );
              if (dept) dept.subjects = fetchedSubjects;
            }
            return updatedCombined;
          });
          setFormData((prev) => ({
            ...prev,
            subjects: prev.subjects.filter((subId) =>
              fetchedSubjects.some((sub) => sub._id === subId)
            ),
          }));
        } catch (err) {
          console.error("Failed to fetch subjects:", err);
          setFetchError(
            err.response?.data?.error ||
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
    const { name, value, files } = e.target;
    if (name === "photo") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, photo: file }));
      setPhotoPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "stream" ? { department: "", semester: "", subjects: [] } : {}),
        ...(name === "department" ? { semester: "", subjects: [] } : {}),
        ...(name === "semester" ? { subjects: [] } : {}),
      }));
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
      "guardianNumber",
      "abcId",
    ];
    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        alert(`Please fill out the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} field.`);
        return false;
      }
    }
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      alert("Mobile number must be a 10-digit number.");
      return false;
    }
    if (!/^\d{10}$/.test(formData.guardianNumber)) {
      alert("Guardian number must be a 10-digit number.");
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (!/^\d{12}$/.test(formData.abcId)) {
      alert("ABC ID must be a 12-digit number.");
      return false;
    }
    if (formData.photo && !["image/jpeg", "image/png"].includes(formData.photo.type)) {
      alert("Photo must be a JPEG or PNG file.");
      return false;
    }
    if (formData.photo && formData.photo.size > 2 * 1024 * 1024) {
      alert("Photo size must not exceed 2MB.");
      return false;
    }
    if (!editingId && (!formData.subjects || formData.subjects.length === 0)) {
      alert("Please select at least one subject.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "subjects") {
          value.forEach((subjectId) => formPayload.append("subjects[]", subjectId));
        } else if (key === "photo" && value) {
          formPayload.append(key, value);
        } else if (value && value !== "") {
          formPayload.append(key, value);
        }
      });

      const headers = {
        Authorization: `Bearer ${localStorage.getItem("facultyToken")}`,
      };

      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/students/${editingId}`,
          formPayload,
          { headers }
        );
        alert("Student updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/students", formPayload, {
          headers,
        });
        alert("Student saved successfully!");
      }

      navigate("/dashboard/student-list");
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "First Name", name: "firstName", required: true },
    { label: "Middle Name", name: "middleName" },
    { label: "Last Name", name: "lastName", required: true },
    { label: "Father Name", name: "fatherName" },
    { label: "Unicode Father Name", name: "unicodeFatherName" },
    { label: "Mother Name", name: "motherName" },
    { label: "Unicode Mother Name", name: "unicodeMotherName" },
    { label: "Unicode Name", name: "unicodeName" },
    { label: "Enrollment Number", name: "enrollmentNumber" },
    { label: "Mobile Number", name: "mobileNumber", required: true },
    { label: "Email", name: "email" },
    { label: "Section", name: "section" },
    { label: "Remark", name: "remark" },
    { label: "Nationality", name: "nationality", required: true },
    { label: "Place of Birth", name: "placeOfBirth", required: true },
    { label: "Date of Birth", name: "dateOfBirth", type: "date", required: true },
    { label: "School Attended", name: "schoolAttended" },
    { label: "Name of Institute", name: "nameOfInstitute" },
    { label: "Guardian Number", name: "guardianNumber", required: true },
    { label: "ABC ID", name: "abcId", required: true },
    { label: "Address", name: "address", type: "textarea" },
  ];

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} transition-colors duration-500`}>
      {/* Header with theme toggle */}
      <div className={`${currentTheme.headerBg} py-6 px-4 md:px-8 shadow-xl ${currentTheme.headerBorder}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1
  className={`
    text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight
    ${theme === 'dark'
      ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]'
      : 'text-indigo-900 drop-shadow-[0_2px_8px_rgba(99,102,241,0.12)]'
    }
    mb-6 transition-all duration-500
  `}
>
  {editingId ? "Edit Student" : "Student Admission Form"}
</h1>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-700' : 'bg-indigo-200'} shadow-lg hover:scale-110 transition-transform`}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-300" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-700" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className={`${currentTheme.cardBg} rounded-2xl shadow-2xl p-6 md:p-8 ${currentTheme.cardBorder} transition-all duration-300 animate-fade-in`}>
          {fetchError && (
            <div className={`mb-6 p-4 rounded-lg flex justify-between items-center animate-fade-in ${currentTheme.errorBg}`}>
              <span>{fetchError}</span>
              <button
                onClick={() => setFetchError(null)}
                className="px-3 py-1 bg-white/20 text-white rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(({ label, name, type = "text", required }) => (
              <div key={name} className="mb-4 animate-fade-in-up" style={{ animationDelay: `${fields.indexOf(name)*0.05}s` }}>
                <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                {type === "textarea" ? (
                  <textarea
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-white text-gray-800'}`}
                    placeholder={`Enter ${label}`}
                    rows={4}
                  />
                ) : (
                  <input
                    type={type}
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-white text-gray-800'}`}
                    placeholder={`Enter ${label}`}
                    required={required}
                  />
                )}
              </div>
            ))}

            {/* Photo Upload */}
            <div className="mb-4 animate-fade-in-up">
              <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                Photo {editingId && <span>(Leave empty to keep existing)</span>}
              </label>
              <div className="relative group">
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png"
                  onChange={handleChange}
                  className="w-full p-3 opacity-0 absolute inset-0 cursor-pointer"
                />
                <div className={`p-3 ${currentTheme.cardBorder} rounded-xl group-hover:bg-indigo-500/10 transition-all ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'}`}>
                      {formData.photo ? formData.photo.name : "Choose photo"}
                    </span>
                    <span className={`px-2 py-1 ${theme === 'dark' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-500/20 text-indigo-700'} rounded-md text-xs`}>
                      Browse
                    </span>
                  </div>
                </div>
              </div>
              {photoPreview && (
                <div className="mt-2 animate-fade-in">
                  <img
                    src={photoPreview}
                    alt="Photo Preview"
                    className="h-32 w-32 object-cover rounded-xl border-2 border-indigo-500/30 shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Stream, Department, Semester Dropdowns */}
            <DropdownGroup
              label="Stream"
              name="stream"
              options={streams}
              required
              theme={theme}
              themeClasses={currentTheme}
            />
            <DropdownGroup
              label="Department"
              name="department"
              options={
                combinedData.find((s) => s._id === formData.stream)?.departments || []
              }
              required
              theme={theme}
              themeClasses={currentTheme}
            />
            <DropdownGroup
              label="Semester"
              name="semester"
              options={semesters.map((s) => ({
                _id: s._id,
                name: `Semester ${s.number}`,
              }))}
              required
              theme={theme}
              themeClasses={currentTheme}
            />

            {/* Subjects Checkbox Group */}
            <div className="mb-4 md:col-span-2 animate-fade-in-up">
              <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                Subjects <span className="text-red-500">*</span>
              </label>
              <div className={`p-4 ${currentTheme.cardBorder} rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} max-h-[12rem] overflow-y-auto transition-all`}>
                {loading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading subjects...</span>
                  </div>
                ) : formData.stream && formData.department && formData.semester ? (
                  (
                    combinedData
                      .find((s) => s._id === formData.stream)
                      ?.departments.find((d) => d._id === formData.department)
                      ?.subjects || []
                  ).length > 0 ? (
                    combinedData
                      .find((s) => s._id === formData.stream)
                      ?.departments.find((d) => d._id === formData.department)
                      ?.subjects.map((sub) => (
                        <div key={sub._id} className="flex items-center mb-2">
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
                            className={`ml-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
                          >
                            {sub.name}
                          </label>
                        </div>
                      ))
                  ) : (
                    <div className="text-red-400 py-2">
                      No subjects available for this semester and department. Please select a different combination.
                    </div>
                  )
                ) : (
                  <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                    Please select stream, department, and semester to view subjects.
                  </div>
                )}
              </div>
            </div>

            {/* Gender, Caste, Admission Fields */}
            <div className="mb-4 animate-fade-in-up">
              <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-black' : 'bg-white text-gray-800'}`}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>

            <div className="mb-4 animate-fade-in-up">
              <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                Caste Category <span className="text-red-500">*</span>
              </label>
              <select
                name="casteCategory"
                value={formData.casteCategory || ""}
                onChange={handleCasteChange}
                disabled={loadingCastes}
                className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-black' : 'bg-white text-gray-800'}`}
                required
              >
                <option value="">Select Caste</option>
                {castes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 animate-fade-in-up">
              <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                Sub Caste
              </label>
              <select
                name="subCaste"
                value={formData.subCaste || ""}
                onChange={handleChange}
                className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-black' : 'bg-white text-gray-800'}`}
              >
                <option value="">Select Subcaste</option>
                {subcastes.map((sub, i) => (
                  <option key={i} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 animate-fade-in-up">
              <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                Admission Type <span className="text-red-500">*</span>
              </label>
              <select
                name="admissionType"
                value={formData.admissionType || ""}
                onChange={handleChange}
                className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-black' : 'bg-white text-gray-800'}`}
                required
              >
                <option value="">Select Admission Type</option>
                <option value="Regular">Regular</option>
                <option value="Direct Second Year">Direct Second Year</option>
                <option value="Lateral Entry">Lateral Entry</option>
              </select>
            </div>

            <div className="mb-4 animate-fade-in-up">
              <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
                Admission Through
              </label>
              <select
                name="admissionThrough"
                value={formData.admissionThrough || ""}
                onChange={handleChange}
                className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-black' : 'bg-white text-gray-800'}`}
              >
                <option value="">Select</option>
                <option value="Entrance Exam">Entrance Exam</option>
                <option value="Quota">Quota</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-8 py-3 ${currentTheme.buttonBg} text-white rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : editingId ? (
                "Update Student"
              ) : (
                "Submit Admission"
              )}
            </button>
            <button
              onClick={() => navigate("/dashboard/student-list")}
              className="px-8 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style>
        {`
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 6s ease infinite;
          }
          @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeInUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );

  // Updated DropdownGroup component with theme styles
  function DropdownGroup({ label, name, options, required = false, theme, themeClasses }) {
    return (
      <div className="mb-4 animate-fade-in-up">
        <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            className={`w-full p-3 ${themeClasses.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'bg-white/5 text-black' : 'bg-white text-gray-800'}`}
            required={required}
          >
            <option value="">Select {label}</option>
            {options.map((opt, i) => (
              <option key={i} value={opt._id}>
                {opt.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
            <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }
}

export default AdmissionForm;
