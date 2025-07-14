import { useState, useEffect } from "react";
import { fetchDepartments } from "../../utils/departmentUtils";
import {
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
  Users,
  X,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

const FacultyRegistrationForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    gender: "",
    designation: "",
    mobile: "",
    dateOfBirth: "",
    dateOfJoining: "",
    department: "",
    address: "",
    aadhaar: "",
    employmentStatus: "Probation Period",
    status: "Active",
    type: "non-teaching",
    teachingExperience: "",
    subjectsTaught: [],
    technicalSkills: "",
    fathersName: "",
    rfidNo: "",
    sevarthNo: "",
    personalEmail: "",
    communicationEmail: "",
    spouseName: "",
    dateOfIncrement: "",
    dateOfRetirement: "",
    relievingDate: "",
    payRevisedDate: "",
    transportAllowance: "NO",
    handicap: "NO",
    seniorCitizen: "NO",
    hra: "NO",
    quarter: "NO",
    bankName: "",
    panNumber: "",
    motherTongue: "",
    designationNature: "",
    pf: "",
    pfNumber: "",
    npsNumber: "",
    bankBranchName: "",
    uanNumber: "",
    ifscCode: "",
    esicNumber: "",
    pfApplicable: "Yes",
    imageUpload: null,
    signatureUpload: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [counterValues, setCounterValues] = useState({
    teaching: 1,
    nonTeaching: 1,
  });
  const [selectedSubject, setSelectedSubject] = useState("");
  const [dropdownStates, setDropdownStates] = useState({
    gender: false,
    designation: false,
    department: false,
    employmentStatus: false,
    subject: false,
    title: false,
    motherTongue: false,
    designationNature: false,
    transportAllowance: false,
    handicap: false,
    seniorCitizen: false,
    hra: false,
    quarter: false,
    pf: false,
  });

  const departmentSubjects = {
    "Computer Science": [
      "Data Structures and Algorithms",
      "Operating Systems",
      "Computer Networks",
      "Database Management Systems",
      "Software Engineering",
      "Theory of Computation",
      "Compiler Design",
      "Artificial Intelligence",
      "Machine Learning",
      "Computer Architecture",
      "Web Technologies",
      "Cloud Computing",
      "Cyber Security",
    ],
    "Information Technology": [
      "Data Structures",
      "Computer Networks",
      "Database Management Systems",
      "Software Engineering",
      "Information Security",
      "Web Technologies",
      "Operating Systems",
      "Object-Oriented Programming",
      "Mobile Computing",
      "E-Commerce and ERP",
      "Data Mining",
      "Cloud Computing",
    ],
    Electronics: [
      "Electronic Devices and Circuits",
      "Digital Electronics",
      "Signals and Systems",
      "Analog Circuits",
      "Microprocessors and Microcontrollers",
      "Communication Systems",
      "VLSI Design",
      "Embedded Systems",
      "Control Systems",
      "Antenna and Wave Propagation",
      "Wireless Communication",
      "Image Processing",
    ],
    Mechanical: [
      "Engineering Mechanics",
      "Thermodynamics",
      "Fluid Mechanics",
      "Strength of Materials",
      "Manufacturing Processes",
      "Machine Design",
      "Heat and Mass Transfer",
      "Theory of Machines",
      "CAD/CAM",
      "Automobile Engineering",
      "Robotics",
      "Industrial Engineering",
    ],
    Civil: [
      "Engineering Mechanics",
      "Surveying",
      "Strength of Materials",
      "Fluid Mechanics",
      "Structural Analysis",
      "Concrete Technology",
      "Soil Mechanics",
      "Transportation Engineering",
      "Environmental Engineering",
      "Construction Planning and Management",
      "Water Resources Engineering",
      "Estimation and Costing",
    ],
    Electrical: [
      "Electrical Circuits",
      "Electromagnetic Fields",
      "Electrical Machines",
      "Power Systems",
      "Control Systems",
      "Power Electronics",
      "Electrical Measurements",
      "Switchgear and Protection",
      "Renewable Energy Systems",
      "High Voltage Engineering",
      "Microprocessors and Applications",
      "Electric Drives",
    ],
    "Data Science": [
      "Statistics for Data Science",
      "Python and R Programming",
      "Data Structures",
      "Data Visualization",
      "Machine Learning",
      "Deep Learning",
      "Big Data Analytics",
      "Data Mining",
      "Artificial Intelligence",
      "Natural Language Processing",
      "Cloud Computing for Data Science",
      "Business Analytics",
      "Data Ethics and Governance",
      "Database Management Systems",
      "Time Series Analysis",
    ],
    "Account Section": [],
  };

  const generateEmployeeId = (type) => {
    const prefix = "NC";
    const departmentCode = type === "non-teaching" ? "NT" : "AT";
    const counterId = type === "non-teaching" ? "nonTeaching" : "teaching";
    const number = (1000 + counterValues[counterId]).toString().substring(1);
    return `${prefix}${departmentCode}${number}`;
  };

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      employeeId: generateEmployeeId(prevData.type),
    }));
  }, [formData.type, counterValues]);

  // Fetch departments from backend academic departments collection
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      console.log('Fetching departments from academic departments collection...');
      
      const result = await fetchDepartments();
      
      if (result.success) {
        console.log('Successfully fetched departments:', result.departments);
        setDepartments(result.departments);
      } else {
        console.error('Failed to fetch departments, using fallback:', result.error);
        setDepartments(result.departments); // This will be fallback departments
      }
      
      setLoadingDepartments(false);
    };

    loadDepartments();
  }, []);

  // Debug log to see departments state
  useEffect(() => {
    console.log('Departments state updated:', departments);
  }, [departments]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (file) {
        const validTypes = ["image/jpeg", "image/gif"];
        if (!validTypes.includes(file.type)) {
          setErrors((prev) => ({
            ...prev,
            [name]: "File must be JPG or GIF",
          }));
          return;
        }
        if (file.size > 200 * 1024) {
          setErrors((prev) => ({
            ...prev,
            [name]: "File size must not exceed 200kb",
          }));
          return;
        }
        setErrors((prev) => ({ ...prev, [name]: null }));
        setFormData({ ...formData, [name]: file });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSelectChange = (name, value) => {
    if (name === "department") {
      setFormData({
        ...formData,
        [name]: value,
        subjectsTaught: [],
      });
      setSelectedSubject("");
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    setDropdownStates({
      ...dropdownStates,
      [name]: false,
    });
  };

  const toggleDropdown = (dropdown) => {
    setDropdownStates({
      ...dropdownStates,
      [dropdown]: !dropdownStates[dropdown],
    });
  };

  const handleArrayInput = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value.split(",").map((item) => item.trim()),
    });
  };

  const handleSingleSubjectChange = (value) => {
    setSelectedSubject(value);
    setDropdownStates({
      ...dropdownStates,
      subject: false,
    });
  };

  const addSingleSubject = () => {
    if (selectedSubject && !formData.subjectsTaught.includes(selectedSubject)) {
      setFormData({
        ...formData,
        subjectsTaught: [...formData.subjectsTaught, selectedSubject],
      });
      setSelectedSubject("");
    }
  };

  const removeSubject = (subject) => {
    setFormData({
      ...formData,
      subjectsTaught: formData.subjectsTaught.filter(
        (item) => item !== subject
      ),
    });
  };

  const handleTypeChange = (type) => {
    setFormData((prevData) => ({
      ...prevData,
      type: type,
      teachingExperience:
        type === "teaching" ? prevData.teachingExperience : "",
      subjectsTaught: type === "teaching" ? prevData.subjectsTaught : [],
      designation: "",
    }));
    setSelectedSubject("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = "First Name is required";
    if (!formData.lastName) newErrors.lastName = "Last Name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }
    if (!formData.aadhaar) {
      newErrors.aadhaar = "Aadhaar number is required";
    } else if (!/^\d{12}$/.test(formData.aadhaar)) {
      newErrors.aadhaar = "Aadhaar number must be 12 digits";
    }
    if (!formData.panNumber) {
      newErrors.panNumber = "PAN number is required";
    } else if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = "Invalid PAN number format";
    }
    if (!formData.bankName) newErrors.bankName = "Bank name is required";
    if (!formData.bankBranchName)
      newErrors.bankBranchName = "Bank branch name is required";
    if (!formData.ifscCode) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      newErrors.ifscCode = "Invalid IFSC code format";
    }
    if (formData.dateOfBirth && formData.dateOfJoining) {
      const dob = new Date(formData.dateOfBirth);
      const doj = new Date(formData.dateOfJoining);
      if (dob >= doj) {
        newErrors.dateOfBirth = "Date of Birth must be before Date of Joining";
      }
    }
    const requiredFields = [
      "title",
      "gender",
      "designation",
      "dateOfBirth",
      "dateOfJoining",
      "department",
      "address",
      "employmentStatus",
      "fathersName",
      "dateOfRetirement",
      "motherTongue",
      "designationNature",
      "pf",
    ];

    if (formData.type === "teaching") {
      requiredFields.push("teachingExperience");
    }

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        } is required`;
      }
    });

    return newErrors;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const formDataToSubmit = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "subjectsTaught") {
          formDataToSubmit.append(key, JSON.stringify(value));
        } else if (key === "technicalSkills") {
          const skillsArray = Array.isArray(value)
            ? value
            : value
            ? value.split(",").map((item) => item.trim())
            : [];
          formDataToSubmit.append(key, JSON.stringify(skillsArray));
        } else if (key === "imageUpload" || key === "signatureUpload") {
          if (value) formDataToSubmit.append(key, value);
        } else if (key !== "password") {
          formDataToSubmit.append(key, value);
        }
      });

      // 1. Register Faculty
      const facultyResponse = await fetch(
        "http://localhost:5000/api/faculty/register",
        {
          method: "POST",
          body: formDataToSubmit,
        }
      );

      const facultyData = await facultyResponse.json();
      if (!facultyResponse.ok) {
        throw new Error(facultyData.message || "Faculty registration failed");
      }

      // 2. Create Salary Record
      const salaryData = {
        employeeId: formData.employeeId,
        name: `${formData.title} ${formData.firstName} ${formData.middleName} ${formData.lastName}`,
        department: formData.department,
        designation: formData.designation,
        type: formData.type,
      };

      const salaryResponse = await fetch("http://localhost:5000/api/salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(salaryData),
      });

      const salaryDataResponse = await salaryResponse.json();
      if (!salaryResponse.ok) {
        throw new Error(
          salaryDataResponse.message || "Salary record creation failed"
        );
      }

      // 3. Update Counter
      const currentType = formData.type;
      const counterId =
        currentType === "non-teaching" ? "nonTeaching" : "teaching";
      setCounterValues((prev) => ({
        ...prev,
        [counterId]: prev[counterId] + 1,
      }));

      // 4. Reset Form
      setSuccess(true);
      setFormData({
        title: "",
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        gender: "",
        designation: "",
        mobile: "",
        dateOfBirth: "",
        dateOfJoining: "",
        department: "",
        address: "",
        aadhaar: "",
        employmentStatus: "Probation Period",
        status: "Active",
        type: currentType,
        teachingExperience: "",
        subjectsTaught: [],
        technicalSkills: "",
        fathersName: "",
        rfidNo: "",
        sevarthNo: "",
        personalEmail: "",
        communicationEmail: "",
        spouseName: "",
        dateOfIncrement: "",
        dateOfRetirement: "",
        relievingDate: "",
        payRevisedDate: "",
        transportAllowance: "NO",
        handicap: "NO",
        seniorCitizen: "NO",
        hra: "NO",
        quarter: "NO",
        bankName: "",
        panNumber: "",
        motherTongue: "",
        designationNature: "",
        pf: "",
        pfNumber: "",
        npsNumber: "",
        bankBranchName: "",
        uanNumber: "",
        ifscCode: "",
        esicNumber: "",
        pfApplicable: "Yes",
        imageUpload: null,
        signatureUpload: null,
      });
      setSelectedSubject("");

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({
        server:
          error.message ||
          "An error occurred while registering. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const teachingDesignations = [
    "Associate Professor",
    "Assistant Professor",
    "Professor",
    "Head of Department",
  ];

  const nonTeachingDesignations = [
    "Student Management",
    "Account Management",
    "Document Management",
    "Notification System",
    "Library Management",
    "Bus Management",
    "Hostel Management",
    "Accountant",
  ];

  const titles = ["Mr", "Ms", "Mrs", "Dr", "Prof"];
  const motherTongues = [
    "Marathi",
    "Hindi",
    "English",
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
    "Gujarati",
    "Bengali",
    "Punjabi",
    "Other",
  ];
  const designationNatures = ["Permanent", "Temporary", "Contract", "Visiting"];
  const pfOptions = [
    "Please Select",
    "PF Option 1",
    "PF Option 2",
    "PF Option 3",
  ];

  return (
    <div className="w-full p-2">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-4 text-white">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-bold">Faculty Registration</h1>
              <p className="text-purple-100 text-xs">
                Register new teaching and non-teaching faculty members
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {success && (
            <div className="mb-4 flex items-start gap-2 bg-green-50 border-l-4 border-green-500 p-3 rounded-r-md">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-green-800 text-sm">Success!</h3>
                <p className="text-green-700 text-xs">
                  Faculty registration and salary record created successfully.
                </p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {errors.server && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 text-sm">Error</h3>
                <p className="text-red-700 text-xs">{errors.server}</p>
              </div>
              <button
                onClick={() => setErrors({ ...errors, server: null })}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="inline-flex rounded-md overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("teaching")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${
                      formData.type === "teaching"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition-colors`}
                  >
                    <BookOpen className="h-3 w-3" />
                    Teaching Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("non-teaching")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${
                      formData.type === "non-teaching"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition-colors`}
                  >
                    <Briefcase className="h-3 w-3" />
                    Non-Teaching Faculty
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg mb-6 border border-purple-100 shadow-sm">
              <div>
                <p className="text-xs font-medium text-purple-600">
                  Employee ID (Auto-generated)
                </p>
                <p className="text-lg font-bold text-purple-800">
                  {formData.employeeId}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-3 flex items-center text-gray-800 border-b pb-1">
                  <User className="mr-2 h-4 w-4 text-purple-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="title"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("title")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.title ? "border-red-500" : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.title ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {formData.title || "Select Title"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.title && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {titles.map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("title", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.title && (
                      <p className="text-xs text-red-500">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="firstName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.firstName ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="middleName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Middle Name
                    </label>
                    <input
                      id="middleName"
                      name="middleName"
                      type="text"
                      value={formData.middleName}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="lastName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.lastName ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="fathersName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Father's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fathersName"
                      name="fathersName"
                      type="text"
                      value={formData.fathersName}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.fathersName
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.fathersName && (
                      <p className="text-xs text-red-500">
                        {errors.fathersName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="spouseName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Spouse Name
                    </label>
                    <input
                      id="spouseName"
                      name="spouseName"
                      type="text"
                      value={formData.spouseName}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="motherTongue"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Mother Tongue <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("motherTongue")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.motherTongue
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.motherTongue
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.motherTongue || "Select Mother Tongue"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.motherTongue && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {motherTongues.map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("motherTongue", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.motherTongue && (
                      <p className="text-xs text-red-500">
                        {errors.motherTongue}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="email"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3 text-gray-500" />
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="personalEmail"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3 text-gray-500" />
                      Personal Email
                    </label>
                    <input
                      id="personalEmail"
                      name="personalEmail"
                      type="email"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="communicationEmail"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3 text-gray-500" />
                      Communication Email
                    </label>
                    <input
                      id="communicationEmail"
                      name="communicationEmail"
                      type="email"
                      value={formData.communicationEmail}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="gender"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Users className="h-3 w-3 text-gray-500" />
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("gender")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.gender ? "border-red-500" : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.gender ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {formData.gender || "Select Gender"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.gender && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {["Male", "Female", "Other"].map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("gender", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.gender && (
                      <p className="text-xs text-red-500">{errors.gender}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="mobile"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3 text-gray-500" />
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="text"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.mobile ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.mobile && (
                      <p className="text-xs text-red-500">{errors.mobile}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="dateOfBirth"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3 text-gray-500" />
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.dateOfBirth
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-xs text-red-500">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="aadhaar"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      Aadhaar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="aadhaar"
                      name="aadhaar"
                      type="text"
                      value={formData.aadhaar}
                      onChange={handleChange}
                      placeholder="12-digit Aadhaar number"
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.aadhaar ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.aadhaar && (
                      <p className="text-xs text-red-500">{errors.aadhaar}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="rfidNo"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      RFID No. / Biometric ID
                    </label>
                    <input
                      id="rfidNo"
                      name="rfidNo"
                      type="text"
                      value={formData.rfidNo}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="sevarthNo"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      Sevarth/Sharath No.
                    </label>
                    <input
                      id="sevarthNo"
                      name="sevarthNo"
                      type="text"
                      value={formData.sevarthNo}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="imageUpload"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <ImageIcon className="h-3 w-3 text-gray-500" />
                      Upload Image (JPG/GIF, max 200kb)
                    </label>
                    <input
                      id="imageUpload"
                      name="imageUpload"
                      type="file"
                      accept="image/jpeg,image/gif"
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                    {formData.imageUpload && (
                      <p className="text-[10px] text-gray-500">
                        Selected: {formData.imageUpload.name}
                      </p>
                    )}
                    {errors.imageUpload && (
                      <p className="text-xs text-red-500">
                        {errors.imageUpload}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="signatureUpload"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <ImageIcon className="h-3 w-3 text-gray-500" />
                      Upload Signature (JPG/GIF, max 200kb)
                    </label>
                    <input
                      id="signatureUpload"
                      name="signatureUpload"
                      type="file"
                      accept="image/jpeg,image/gif"
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                    {formData.signatureUpload && (
                      <p className="text-[10px] text-gray-500">
                        Selected: {formData.signatureUpload.name}
                      </p>
                    )}
                    {errors.signatureUpload && (
                      <p className="text-xs text-red-500">
                        {errors.signatureUpload}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 lg:col-span-3">
                    <label
                      htmlFor="address"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3 text-gray-500" />
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500">{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <h3 className="text-base font-medium mb-3 flex items-center text-gray-800 border-b pb-1">
                  <Briefcase className="mr-2 h-4 w-4 text-purple-600" />
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="designation"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("designation")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.designation
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.designation
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.designation || "Select Designation"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.designation && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {(formData.type === "teaching"
                            ? teachingDesignations
                            : nonTeachingDesignations
                          ).map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("designation", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.designation && (
                      <p className="text-xs text-red-500">
                        {errors.designation}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="designationNature"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Designation Nature <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("designationNature")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.designationNature
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.designationNature
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.designationNature ||
                            "Select Designation Nature"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.designationNature && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {designationNatures.map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("designationNature", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.designationNature && (
                      <p className="text-xs text-red-500">
                        {errors.designationNature}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="department"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("department")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.department
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.department
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {loadingDepartments 
                            ? "Loading departments..." 
                            : formData.department || "Select Department"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.department && !loadingDepartments && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {departments.length > 0 ? (
                            departments.map((option) => (
                              <div
                                key={option}
                                onClick={() =>
                                  handleSelectChange("department", option)
                                }
                                className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                              >
                                {option}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-1 text-xs text-gray-500">
                              No departments available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.department && (
                      <p className="text-xs text-red-500">
                        {errors.department}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="dateOfJoining"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3 text-gray-500" />
                      Date of Joining <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="dateOfJoining"
                      name="dateOfJoining"
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.dateOfJoining
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.dateOfJoining && (
                      <p className="text-xs text-red-500">
                        {errors.dateOfJoining}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="dateOfRetirement"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3 text-gray-500" />
                      Date of Retirement <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="dateOfRetirement"
                      name="dateOfRetirement"
                      type="date"
                      value={formData.dateOfRetirement}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.dateOfRetirement
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.dateOfRetirement && (
                      <p className="text-xs text-red-500">
                        {errors.dateOfRetirement}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="dateOfIncrement"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3 text-gray-500" />
                      Date of Increment
                    </label>
                    <input
                      id="dateOfIncrement"
                      name="dateOfIncrement"
                      type="date"
                      value={formData.dateOfIncrement}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="relievingDate"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3 text-gray-500" />
                      Relieving Date
                    </label>
                    <input
                      id="relievingDate"
                      name="relievingDate"
                      type="date"
                      value={formData.relievingDate}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="payRevisedDate"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3 text-gray-500" />
                      Pay Revised Date
                    </label>
                    <input
                      id="payRevisedDate"
                      name="payRevisedDate"
                      type="date"
                      value={formData.payRevisedDate}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="employmentStatus"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Employment Status <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("employmentStatus")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.employmentStatus
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.employmentStatus
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.employmentStatus || "Select Status"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.employmentStatus && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {[
                            "Probation Period",
                            "Permanent Employee",
                          ].map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("employmentStatus", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.employmentStatus && (
                      <p className="text-xs text-red-500">
                        {errors.employmentStatus}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="technicalSkills"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Technical Skills
                    </label>
                    <input
                      id="technicalSkills"
                      name="technicalSkills"
                      type="text"
                      value={formData.technicalSkills}
                      onChange={handleArrayInput}
                      placeholder="e.g., Python, SQL, Data Analysis"
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                    <p className="text-[10px] text-gray-500">
                      Separate skills with commas
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <h3 className="text-base font-medium mb-3 flex items-center text-gray-800 border-b pb-1">
                  <FileText className="mr-2 h-4 w-4 text-purple-600" />
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="transportAllowance"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Transport Allowance
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("transportAllowance")}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-gray-300 bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                      >
                        <span
                          className={
                            formData.transportAllowance
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.transportAllowance || "Select Option"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.transportAllowance && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {["YES", "NO"].map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("transportAllowance", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="handicap"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Handicap
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("handicap")}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-gray-300 bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                      >
                        <span
                          className={
                            formData.handicap
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.handicap || "Select Option"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.handicap && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {["YES", "NO"].map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("handicap", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="seniorCitizen"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Senior Citizen
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("seniorCitizen")}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-gray-300 bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                      >
                        <span
                          className={
                            formData.seniorCitizen
                              ? "text-gray-900"
                              : "text-gray-500"
                          }
                        >
                          {formData.seniorCitizen || "Select Option"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.seniorCitizen && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {["YES", "NO"].map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("seniorCitizen", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="hra"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      H.R.A.
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("hra")}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-gray-300 bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                      >
                        <span
                          className={
                            formData.hra ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {formData.hra || "Select Option"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.hra && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {["YES", "NO"].map((option) => (
                            <div
                              key={option}
                              onClick={() => handleSelectChange("hra", option)}
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="quarter"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Quarter
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("quarter")}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-gray-300 bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                      >
                        <span
                          className={
                            formData.quarter ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {formData.quarter || "Select Option"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.quarter && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {["YES", "NO"].map((option) => (
                            <div
                              key={option}
                              onClick={() =>
                                handleSelectChange("quarter", option)
                              }
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <h3 className="text-base font-medium mb-3 flex items-center text-gray-800 border-b pb-1">
                  <FileText className="mr-2 h-4 w-4 text-purple-600" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="bankName"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bankName"
                      name="bankName"
                      type="text"
                      value={formData.bankName}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.bankName ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.bankName && (
                      <p className="text-xs text-red-500">{errors.bankName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="bankBranchName"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      Bank Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bankBranchName"
                      name="bankBranchName"
                      type="text"
                      value={formData.bankBranchName}
                      onChange={handleChange}
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.bankBranchName
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.bankBranchName && (
                      <p className="text-xs text-red-500">
                        {errors.bankBranchName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="panNumber"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="panNumber"
                      name="panNumber"
                      type="text"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="e.g., ABCDE1234F"
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.panNumber ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.panNumber && (
                      <p className="text-xs text-red-500">{errors.panNumber}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="pf"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      PF <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDropdown("pf")}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md border ${
                          errors.pf ? "border-red-500" : "border-gray-300"
                        } bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                      >
                        <span
                          className={
                            formData.pf ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {formData.pf || "Please Select"}
                        </span>
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      </button>
                      {dropdownStates.pf && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                          {pfOptions.map((option) => (
                            <div
                              key={option}
                              onClick={() => handleSelectChange("pf", option)}
                              className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.pf && (
                      <p className="text-xs text-red-500">{errors.pf}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="pfNumber"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      PF Number
                    </label>
                    <input
                      id="pfNumber"
                      name="pfNumber"
                      type="text"
                      value={formData.pfNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="npsNumber"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      NPS Number
                    </label>
                    <input
                      id="npsNumber"
                      name="npsNumber"
                      type="text"
                      value={formData.npsNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="uanNumber"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      UAN Number
                    </label>
                    <input
                      id="uanNumber"
                      name="uanNumber"
                      type="text"
                      value={formData.uanNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="ifscCode"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="ifscCode"
                      name="ifscCode"
                      type="text"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      placeholder="e.g., SBIN0001234"
                      className={`w-full px-3 py-1.5 rounded-md border ${
                        errors.ifscCode ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                    />
                    {errors.ifscCode && (
                      <p className="text-xs text-red-500">{errors.ifscCode}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="esicNumber"
                      className="text-xs font-medium text-gray-700 flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3 text-gray-500" />
                      ESIC Number
                    </label>
                    <input
                      id="esicNumber"
                      name="esicNumber"
                      type="text"
                      value={formData.esicNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                      PF Applicable <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="radio"
                          name="pfApplicable"
                          value="Yes"
                          checked={formData.pfApplicable === "Yes"}
                          onChange={handleChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="radio"
                          name="pfApplicable"
                          value="No"
                          checked={formData.pfApplicable === "No"}
                          onChange={handleChange}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {formData.type === "teaching" && (
                <>
                  <hr className="border-gray-200" />

                  <div>
                    <h3 className="text-base font-medium mb-3 flex items-center text-gray-800 border-b pb-1">
                      <BookOpen className="mr-2 h-4 w-4 text-purple-600" />
                      Teaching Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label
                          htmlFor="teachingExperience"
                          className="text-xs font-medium text-gray-700 flex items-center gap-1"
                        >
                          Teaching Experience (Years){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="teachingExperience"
                          name="teachingExperience"
                          type="number"
                          value={formData.teachingExperience}
                          onChange={handleChange}
                          className={`w-full px-3 py-1.5 rounded-md border ${
                            errors.teachingExperience
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-xs`}
                        />
                        {errors.teachingExperience && (
                          <p className="text-xs text-red-500">
                            {errors.teachingExperience}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="subjectSelect"
                          className="block text-xs font-medium text-gray-700"
                        >
                          Add Subject
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => toggleDropdown("subject")}
                              disabled={!formData.department}
                              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-gray-300 bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              <span
                                className={
                                  selectedSubject
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }
                              >
                                {selectedSubject ||
                                  (formData.department
                                    ? "Select a subject"
                                    : "Select department first")}
                              </span>
                              <ChevronDown className="_CNTX_3 w-3 text-gray-500" />
                            </button>
                            {dropdownStates.subject && (
                              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-auto">
                                {(
                                  departmentSubjects[formData.department] || []
                                ).map((option) => (
                                  <div
                                    key={option}
                                    onClick={() =>
                                      handleSingleSubjectChange(option)
                                    }
                                    className="px-3 py-1 hover:bg-purple-50 cursor-pointer text-xs"
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={addSingleSubject}
                            disabled={!selectedSubject}
                            className="px-2 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {formData.subjectsTaught.length > 0 && (
                          <div className="mt-2 border rounded-md p-2 bg-gray-50 max-h-24 overflow-auto">
                            <p className="text-[10px] font-medium text-gray-700 mb-1">
                              Selected Subjects:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {formData.subjectsTaught.map((subject, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-1 bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md text-xs"
                                >
                                  {subject}
                                  <button
                                    type="button"
                                    onClick={() => removeSubject(subject)}
                                    className="ml-1 text-purple-600 hover:text-purple-800"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium rounded-md shadow-md hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
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
                ) : (
                  <span className="flex items-center gap-2">
                    Register Faculty <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FacultyRegistrationForm;
