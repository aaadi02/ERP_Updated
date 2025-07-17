"use client"

import { useState, useEffect, useCallback } from "react"
import { User, BookOpen, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import debounce from "lodash/debounce"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const BorrowerEntry = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    borrowerType: "",
    employeeId: "",
    firstName: "",
    lastName: "",
    gender: "",
    branchFaculty: "",
    designation: "",
    btStatus: "",
    btValidDate: "",
    librarian: "",
    admissionBatchSem: "",
    academicYear: "2024-25",
    duration: "",
    noOfRenewal: "",
    issueBBBook: "",
    bookBankDuration: "",
    bookBankValidDate: "",
    bookId: "",
    bookTitle: "",
    borrowDate: "",
    dueDate: "",
  })
  const [books, setBooks] = useState([])
  const [allFaculties, setAllFaculties] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [loadingEmployee, setLoadingEmployee] = useState(false)
  const [loadingAllData, setLoadingAllData] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Helper function to determine if a field is required based on borrower type
  const isFieldRequired = (fieldName) => {
    if (!formData.borrowerType) return false;
    
    const baseRequiredFields = [
      "borrowerType",
      "employeeId", 
      "firstName",
      "lastName",
      "gender",
      "librarian",
      "academicYear",
      "duration",
      "noOfRenewal",
      "issueBBBook",
      "borrowDate",
      "dueDate",
    ];

    if (baseRequiredFields.includes(fieldName)) return true;

    if (formData.borrowerType === "Student") {
      // For students: all conditional fields are optional (admissionBatchSem, designation, btStatus, btValidDate)
      return false;
    } else if (formData.borrowerType === "Employee") {
      // For employees: designation is required, admissionBatchSem, btStatus, and btValidDate are optional
      return fieldName === "designation";
    } else {
      // For "Other" type, all fields are required including btStatus and btValidDate
      return ["branchFaculty", "designation", "admissionBatchSem", "btStatus", "btValidDate"].includes(fieldName);
    }
  };

  // Helper function to get field label with required indicator
  const getFieldLabel = (fieldName, displayName) => {
    const required = isFieldRequired(fieldName);
    return required ? `${displayName} *` : `${displayName} (Optional)`;
  };


  // Fetch all faculties
  const fetchAllFaculties = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/faculty/faculties")
      if (!response.ok) throw new Error(`Failed to fetch faculties: ${response.status}`)
      const data = await response.json()
      // Handle the specific response structure: {"success": true, "data": {"faculties": [...]}}
      let facultiesArray = []
      if (data.success && data.data && Array.isArray(data.data.faculties)) {
        facultiesArray = data.data.faculties
      } else if (Array.isArray(data)) {
        facultiesArray = data
      } else if (data.faculties && Array.isArray(data.faculties)) {
        facultiesArray = data.faculties
      } else if (data.data && Array.isArray(data.data)) {
        facultiesArray = data.data
      }
      setAllFaculties(facultiesArray)
      console.log('Faculties loaded:', facultiesArray.length)
    } catch (err) {
      console.error('Faculty fetch error:', err)
      setError(`Failed to fetch faculties: ${err.message}`)
    }
  }

  // Fetch all students
  const fetchAllStudents = async () => {
    try {
      // Try the main students endpoint first
      let response = await fetch("http://localhost:5000/api/students", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      
      // If that fails, try the /all endpoint
      if (!response.ok) {
        response = await fetch("http://localhost:5000/api/students/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
      }
      
      if (!response.ok) throw new Error(`Failed to fetch students: ${response.status}`)
      
      const data = await response.json()
      let studentsArray = []
      if (data.students && Array.isArray(data.students)) {
        studentsArray = data.students
      } else if (data.data && Array.isArray(data.data)) {
        studentsArray = data.data
      } else if (Array.isArray(data)) {
        studentsArray = data
      }
      setAllStudents(studentsArray)
      console.log('Students loaded:', studentsArray.length)
    } catch (err) {
      console.error('Students fetch error:', err)
      setError(`Failed to fetch students: ${err.message}`)
    }
  }

  useEffect(() => {
    const fetchBooks = async () => {
      setLoadingBooks(true)
      try {
        const response = await fetch("http://localhost:5000/api/books")
        if (!response.ok) throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`)
        const data = await response.json()
        if (data && Array.isArray(data.books)) {
          setBooks(data.books)
        } else if (Array.isArray(data)) {
          setBooks(data)
        } else {
          throw new Error("Invalid books data format")
        }
      } catch (err) {
        setBooks([])
      } finally {
        setLoadingBooks(false)
      }
    }

    const fetchAllData = async () => {
      setLoadingAllData(true)
      await Promise.all([fetchAllFaculties(), fetchAllStudents()])
      setLoadingAllData(false)
    }

    fetchBooks()
    fetchAllData().then(() => {
      console.log("All students loaded:", allStudents);
    });
  }, [])

  // Search for specific faculty by ID from the loaded list
  const findFacultyById = (id) => {
    if (!id) return null;
    const faculty = allFaculties.find(
      (f) => f.employeeId === id || f.id === id || f.facultyId === id || f.employee_id === id,
    );
    if (faculty) {
      return {
        employeeId: id,
        firstName: faculty.firstName || faculty.firstname || faculty.first_name || "",
        lastName: faculty.lastName || faculty.lastname || faculty.last_name || "",
        gender: faculty.gender || faculty.sex || "",
        branchFaculty: faculty.department || faculty.branchFaculty || faculty.branch || faculty.faculty || "",
        designation: faculty.designation || faculty.role || faculty.position || "",
        btStatus: faculty.status || faculty.employmentStatus || "Active",
      }
    }
    return null
  }

  // Search for specific student by ID from the loaded list
  const findStudentById = (id) => {
    if (!id) return null;
    const student = allStudents.find(
      (s) =>
        s.studentId === id ||
        s.student_id === id ||
        s.id === id ||
        s.admissionNo === id ||
        s.admission_no === id
    );
    if (student) {
      return {
        studentId: student.studentId || student.sid || id,
        firstName: student.firstName || student.firstname || student.first_name || "",
        lastName: student.lastName || student.lastname || student.last_name || "",
        gender: student.gender || student.sex || "",
        branchFaculty: student.branchFaculty || student.department || student.branch || student.course || "",
        designation: "",
        btStatus: student.status || student.active || "Active",
        admissionBatchSem: student.admissionBatchSem || student.batch || student.semester || student.year || "",
      }
    }
    return null
  }

  // Fetch individual faculty details (fallback if not found in loaded data)
  const fetchFacultyDetails = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/faculty/faculties?employeeId=${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      )
      if (!response.ok) throw new Error(`Failed to fetch faculty details: ${response.status}`)
      const data = await response.json()
      let facultyData = null
      if (data.faculty) {
        facultyData = data.faculty
      } else if (data.data) {
        facultyData = Array.isArray(data.data) ? data.data[0] : data.data
      } else if (Array.isArray(data) && data.length > 0) {
        facultyData = data[0]
      } else if (data.employeeId || data.firstName) {
        facultyData = data
      }
      if (!facultyData) throw new Error(`No faculty data found for ID ${id}`)
      return {
        employeeId: id,
        firstName: facultyData.firstName || facultyData.firstname || facultyData.first_name || "",
        lastName: facultyData.lastName || facultyData.lastname || facultyData.last_name || "",
        gender: facultyData.gender || facultyData.sex || "",
        branchFaculty:
          facultyData.department || facultyData.branchFaculty || facultyData.branch || facultyData.faculty || "",
        designation: facultyData.designation || facultyData.role || facultyData.position || "",
        btStatus: facultyData.status || facultyData.employmentStatus || "Active",
      }
    } catch (err) {
      throw err
    }
  }

  // Fetch individual student details (fallback if not found in loaded data)
  const fetchStudentDetails = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/students/students?studentId=${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      if (!response.ok) throw new Error(`Failed to fetch student details: ${response.status}`)
      const data = await response.json()
      let studentData = null
      if (data.student) {
        studentData = data.student
      } else if (data.data) {
        studentData = Array.isArray(data.data) ? data.data[0] : data.data
      } else if (Array.isArray(data) && data.length > 0) {
        studentData = data[0]
      } else if (data.studentId || data.firstName) {
        studentData = data
      }
      if (!studentData) throw new Error(`No student data found for ID ${id}`)
      return {
        studentId: id,
        firstName: studentData.firstName || studentData.firstname || studentData.first_name || "",
        lastName: studentData.lastName || studentData.lastname || student.last_name || "",
        gender: studentData.gender || studentData.sex || "",
        branchFaculty:
          studentData.branchFaculty || studentData.department || studentData.branch || studentData.course || "",
        designation: "",
        btStatus: studentData.status || studentData.active || "Active",
        admissionBatchSem:
          studentData.admissionBatchSem || studentData.batch || studentData.semester || studentData.year || "",
      }
    } catch (err) {
      throw err
    }
  }

  const fetchEmployeeDetails = async (id) => {
    let employeeData = null;
    if (formData.borrowerType === "Student") {
      employeeData = findStudentById(id);
      if (!employeeData) {
        employeeData = await fetchStudentDetails(id);
      }
    } else if (formData.borrowerType === "Employee") {
      employeeData = findFacultyById(id);
      if (!employeeData) {
        employeeData = await fetchFacultyDetails(id);
      }
    }
    return employeeData;
  };

  const debouncedFetchEmployeeDetails = useCallback(
    debounce(async (id) => {
      if (!id || id.length < 3) return;
      setLoadingEmployee(true);
      setError(null);
      try {
        const employeeData = await fetchEmployeeDetails(id);
        if (employeeData) {
          setFormData((prev) => ({
            ...prev,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            gender: employeeData.gender,
            branchFaculty: employeeData.branchFaculty,
            designation: employeeData.designation,
            btStatus: employeeData.btStatus,
            admissionBatchSem: employeeData.admissionBatchSem || prev.admissionBatchSem,
          }));
          setSuccess(`Successfully loaded details for ${employeeData.firstName} ${employeeData.lastName}`);
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingEmployee(false);
      }
    }, 500),
    [allFaculties, allStudents],
  );

  const handleEmployeeSelect = (employee) => {
    const isStudent = employee.studentId || employee.admissionBatchSem;
    const borrowerType = isStudent ? "Student" : "Employee";

    setFormData((prev) => ({
      ...prev,
      borrowerType,
      employeeId: employee.employeeId || employee.studentId || "",
      firstName: employee.firstName || employee.firstname || "",
      lastName: employee.lastName || employee.lastname || "",
      gender: employee.gender || "",
      branchFaculty: employee.department || employee.branchFaculty || employee.branch || "",
      designation: employee.designation || employee.role || "",
      btStatus: employee.status || "Active",
      admissionBatchSem: employee.admissionBatchSem || employee.batch || "",
    }));

    // Store borrower info for BookActions page
    const borrowerInfo = {
      type: isStudent ? 'student' : 'faculty',
      ...(isStudent ? {
        studentId: employee.studentId || employee.id,
      } : {
        employeeId: employee.employeeId || employee.id,
      }),
      name: `${employee.firstName || employee.firstname} ${employee.lastName || employee.lastname}`,
      department: employee.department || employee.branchFaculty || employee.branch || "",
      ...(isStudent ? {
        semester: employee.semester || employee.admissionBatchSem || "",
        course: employee.course || employee.branch || "",
      } : {
        designation: employee.designation || employee.role || "",
      }),
      email: employee.email || "",
      phone: employee.phone || employee.mobileNumber || ""
    };
    
    localStorage.setItem('selectedBorrower', JSON.stringify(borrowerInfo));
    setSuccess(`Selected ${employee.firstName || employee.firstname} ${employee.lastName || employee.lastname}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'employeeId' && value.length >= 3) {
      let type = '';
      if (formData.borrowerType === 'Student') type = 'student';
      else if (formData.borrowerType === 'Employee') type = 'faculty'; // 👈 MAP 'Employee' to 'faculty'

      if (type && value.length >= 3) {
        fetchBorrowerDetails(value, type);
      }

      if (type === 'student' || type === 'employee') {
        fetchBorrowerDetails(value, type);
      }
    }

    if (name === 'borrowerType') {
      setFormData((prev) => ({
        ...prev,
        employeeId: '',
        firstName: '',
        lastName: '',
        branchFaculty: '',
        designation: '',
        admissionBatchSem: '',
        gender: '',
      }));
    }

    // Auto-calculate dates when Book Bank fields change
    if (name === 'bookBankValidDate' && value) {
      // When Book Bank Valid Date is set, automatically set Borrow Date to the same date
      setFormData((prev) => ({
        ...prev,
        borrowDate: value,
        // Also recalculate due date if duration is already set
        dueDate: prev.bookBankDuration ? calculateDueDate(value, prev.bookBankDuration) : prev.dueDate
      }));
    }

    if (name === 'bookBankDuration' && value) {
      // When Book Bank Duration is set, calculate Due Date based on Borrow Date (or Book Bank Valid Date)
      const borrowDate = formData.borrowDate || formData.bookBankValidDate;
      if (borrowDate) {
        const calculatedDueDate = calculateDueDate(borrowDate, value);
        setFormData((prev) => ({
          ...prev,
          dueDate: calculatedDueDate
        }));
      }
    }

    // If Borrow Date is manually changed and duration exists, recalculate due date
    if (name === 'borrowDate' && value && formData.bookBankDuration) {
      const calculatedDueDate = calculateDueDate(value, formData.bookBankDuration);
      setFormData((prev) => ({
        ...prev,
        dueDate: calculatedDueDate
      }));
    }

    // Jab ID field change ho, auto-fill details
    if (name === "employeeId") {
      setError(null);
      setSuccess(null);
      if (value && value.length >= 3) {
        debouncedFetchEmployeeDetails(value);
      }
    }

    if (name === "issueBBBook" && value === "No") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        bookBankDuration: "",
        bookBankValidDate: "",
        bookTitle: "",
        bookId: "",
      }))
      return
    }

    if (name === "bookTitle") {
      const selectedBook = books.find((book) => book.TITLENAME === value)
      if (selectedBook) {
        setFormData((prev) => ({
          ...prev,
          bookId: selectedBook.ACCNO || "",
        }))
      }
    }
  }

  // Helper function to calculate due date
  const calculateDueDate = (startDate, durationInDays) => {
    if (!startDate || !durationInDays) return '';
    
    const start = new Date(startDate);
    const duration = parseInt(durationInDays);
    
    if (isNaN(duration)) return '';
    
    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + duration);
    
    // Format as YYYY-MM-DD for HTML date input
    return dueDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation - conditional required fields based on borrower type
    let requiredFields = [
      "borrowerType",
      "employeeId",
      "firstName",
      "lastName",
      "gender",
      "librarian",
      "academicYear",
      "duration",
      "noOfRenewal",
      "issueBBBook",
      "borrowDate",
      "dueDate",
    ];

    // Add conditional required fields based on borrower type
    if (formData.borrowerType === "Student") {
      // For students: all conditional fields are optional (admissionBatchSem, designation, btStatus, btValidDate)
      // No additional required fields
    } else if (formData.borrowerType === "Employee") {
      // For employees: designation is required, admissionBatchSem, btStatus, and btValidDate are optional
      requiredFields.push("designation");
    } else {
      // For other types: include all fields including btStatus and btValidDate
      requiredFields.push("branchFaculty");
      requiredFields.push("designation");
      requiredFields.push("admissionBatchSem");
      requiredFields.push("btStatus");
      requiredFields.push("btValidDate");
    }

    const allFilled = requiredFields.every((key) => formData[key]?.trim() !== "");

    if (!allFilled) {
      const missingFields = requiredFields.filter((key) => !formData[key]?.trim());
      setError(`Please fill all required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (
      formData.issueBBBook === "Yes" &&
      (!formData.bookBankDuration || !formData.bookBankValidDate || !formData.bookId || !formData.bookTitle)
    ) {
      setError("Book bank fields are required when Issue BB Book is set to Yes.")
      return
    }

    try {
      // First create the borrower entry
      const res = await axios.post("http://localhost:5000/api/borrower-entry", formData);
      
      if (res.data.success) {
        // If BB book is being issued, create an issue record
        if (formData.issueBBBook === "Yes" && formData.bookId && formData.bookTitle) {
          let issuePayload;
          const isStudent = formData.borrowerType.toLowerCase() === 'student';
          
          if (isStudent) {
            issuePayload = {
              ACCNO: formData.bookId,
              bookTitle: formData.bookTitle,
              borrowerType: 'student',
              studentId: formData.employeeId,
              studentName: `${formData.firstName} ${formData.lastName}`,
              semester: formData.admissionBatchSem,
              department: formData.branchFaculty,
              course: formData.branchFaculty,
              email: '',
              phone: '',
              borrowerId: formData.employeeId,
              issueDate: formData.borrowDate,
              dueDate: formData.dueDate,
              isBookBank: true,
              bookBankDuration: formData.bookBankDuration,
              bookBankValidDate: formData.bookBankValidDate
            };
          } else {
            issuePayload = {
              ACCNO: formData.bookId,
              bookTitle: formData.bookTitle,
              borrowerType: 'faculty',
              employeeId: formData.employeeId,
              facultyName: `${formData.firstName} ${formData.lastName}`,
              department: formData.branchFaculty,
              designation: formData.designation,
              email: '',
              phone: '',
              borrowerId: formData.employeeId,
              issueDate: formData.borrowDate,
              dueDate: formData.dueDate,
              isBookBank: true,
              bookBankDuration: formData.bookBankDuration,
              bookBankValidDate: formData.bookBankValidDate
            };
          }

          // Store borrower info for history
          const borrowerInfo = {
            type: isStudent ? 'student' : 'faculty',
            ...(isStudent ? {
              studentId: formData.employeeId,
              name: `${formData.firstName} ${formData.lastName}`,
              semester: formData.admissionBatchSem,
              department: formData.branchFaculty,
              course: formData.branchFaculty,
              email: '',
              phone: ''
            } : {
              employeeId: formData.employeeId,
              name: `${formData.firstName} ${formData.lastName}`,
              department: formData.branchFaculty,
              designation: formData.designation,
              email: '',
              phone: ''
            })
          };

          // Store in localStorage and also update history in state
          localStorage.setItem('selectedBorrower', JSON.stringify(borrowerInfo));
          localStorage.setItem('lastIssuedBook', JSON.stringify({
            ACCNO: formData.bookId,
            bookTitle: formData.bookTitle,
            issueDate: formData.borrowDate,
            dueDate: formData.dueDate,
            isBookBank: true,
            borrowerType: isStudent ? 'student' : 'faculty',
            borrowerId: formData.employeeId
          }));

          // Create issue record
          const issueResponse = await axios.post("http://localhost:5000/api/issues/issue", issuePayload);
          
          if (issueResponse.data.success) {
            setSuccess("Borrower entry and book issue completed successfully!");
            // Redirect to book actions page immediately
            navigate('/book-actions', { 
              state: { 
                borrowerId: formData.employeeId,
                borrowerType: isStudent ? 'student' : 'faculty',
                refresh: true 
              } 
            });
          } else {
            throw new Error("Failed to issue book");
          }
        } else {
          setSuccess("Borrower entry submitted successfully!");
        }
        setFormData({
          borrowerType: "",
          employeeId: "",
          firstName: "",
          lastName: "",
          gender: "",
          branchFaculty: "",
          designation: "",
          btValidDate: "",
          librarian: "",
          admissionBatchSem: "",
          academicYear: "2024-25",
          duration: "",
          noOfRenewal: "",
          issueBBBook: "",
          bookBankDuration: "",
          bookBankValidDate: "",
          bookId: "",
          bookTitle: "",
          borrowDate: "",
          dueDate: "",
        });
      } else {
        setError("Failed to submit borrower entry.")
      }
    } catch (err) {
      setError("Failed to submit borrower entry.")
    }
  }

  const fetchBorrowerDetails = async (id, type) => {
    try {
      setLoadingEmployee(true);
      const response = await axios.get(
        `http://localhost:5000/api/borrower-entry?id=${id}&type=${type}`
      );

      if (response.data.success) {
        const result = response.data.result;

        let firstName = '';
        let lastName = '';

        if (result.name) {
          const nameParts = result.name.split(" ");
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(" ") || '';
        }

        setFormData((prev) => ({
          ...prev,
          firstName,
          lastName,
          gender: result.gender || '',
          branchFaculty: result.department || '',
          designation: result.designation || '',
          admissionBatchSem: result.admissionBatch || '',
        }));
      } else {
        setError("Borrower not found");
      }
    } catch (err) {
      console.error("Error fetching borrower:", err);
      setError("Error fetching borrower");
    } finally {
      setLoadingEmployee(false);
    }
  };




  if (loadingBooks || loadingAllData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 ">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-indigo-400 mb-6"></div>
          <div className="h-8 w-64 bg-indigo-300 rounded mb-4"></div>
          <div className="h-4 w-48 bg-indigo-200 rounded"></div>
          <p className="text-indigo-600 mt-4">Loading all faculty and student data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br flex flex-col py-12 px-2 md:px-8 z-0 ml-72 overflow-y-auto overflow-x-hidden from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            Borrower Entry
          </h1>
          <p className="text-gray-600 max-w-xl">Add a new borrower entry for library book borrowing</p>
          <div className="h-1 w-full bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full"></div>
        </header>

      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8" >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <User size={24} className="mr-2 text-indigo-500" />
          Enter Borrower Details
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-center">
            <AlertCircle size={24} className="text-red-500 mr-3" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl flex items-center">
            <CheckCircle size={24} className="text-green-500 mr-3" />
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {loadingEmployee && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mr-3"></div>
            <p className="text-blue-600">Fetching employee details...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="borrowerType" className="block text-sm font-medium text-gray-700 mb-1">
              Borrower Type
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="borrowerType"
                name="borrowerType"
                value={formData.borrowerType}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="">Select Borrower Type</option>
                <option value="Employee">Employee</option>
                <option value="Student">Student</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
              Employee/Student ID
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter ID or select from above list"
                aria-label="Employee or Student ID"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Auto-filled from ID"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Auto-filled from ID"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="branchFaculty" className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel("branchFaculty", "Branch/Faculty")}
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="branchFaculty"
                name="branchFaculty"
                value={formData.branchFaculty}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Auto-filled from ID"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel("designation", "Designation")}
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Auto-filled from ID"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="btStatus" className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel("btStatus", "BT Status")}
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="btStatus"
                name="btStatus"
                value={formData.btStatus}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="btValidDate" className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel("btValidDate", "BT Valid Date")}
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                id="btValidDate"
                name="btValidDate"
                value={formData.btValidDate}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="librarian" className="block text-sm font-medium text-gray-700 mb-1">
              Librarian
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="librarian"
                name="librarian"
                value={formData.librarian}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter librarian name"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="admissionBatchSem" className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel("admissionBatchSem", "Admission Batch/Sem")}
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="admissionBatchSem"
                name="admissionBatchSem"
                value={formData.admissionBatchSem}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Auto-filled for students"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="academicYear"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter academic year"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (in days)
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter duration in days"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="noOfRenewal" className="block text-sm font-medium text-gray-700 mb-1">
              No. of Renewal
            </label>
            <div className="relative">
              <BookOpen size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                id="noOfRenewal"
                name="noOfRenewal"
                value={formData.noOfRenewal}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter number of renewals"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="issueBBBook" className="block text-sm font-medium text-gray-700 mb-1">
              Issue BB Book?
            </label>
            <div className="relative">
              <BookOpen size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="issueBBBook"
                name="issueBBBook"
                value={formData.issueBBBook}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="bookBankDuration" className="block text-sm font-medium text-gray-700 mb-1">
              Book Bank Duration
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                id="bookBankDuration"
                name="bookBankDuration"
                value={formData.bookBankDuration}
                onChange={handleChange}
                disabled={formData.issueBBBook === "No"}
                className={`pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${formData.issueBBBook === "No" ? "bg-gray-100 cursor-not-allowed opacity-50" : ""}`}
                placeholder="Enter book bank duration"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="bookBankValidDate" className="block text-sm font-medium text-gray-700 mb-1">
              Book Bank Valid Date
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                id="bookBankValidDate"
                name="bookBankValidDate"
                value={formData.bookBankValidDate}
                onChange={handleChange}
                disabled={formData.issueBBBook === "No"}
                className={`pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${formData.issueBBBook === "No" ? "bg-gray-100 cursor-not-allowed opacity-50" : ""}`}
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="bookTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Book Title
            </label>
            <div className="relative">
              <BookOpen size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="bookTitle"
                name="bookTitle"
                value={formData.bookTitle}
                onChange={handleChange}
                disabled={formData.issueBBBook === "No"}
                className={`pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none ${formData.issueBBBook === "No" ? "bg-gray-100 cursor-not-allowed opacity-50" : ""}`}
              >
                <option value="">Select a book</option>
                {books.map((book) => (
                  <option key={book.ACCNO} value={book.TITLENAME}>
                    {book.TITLENAME}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="bookId" className="block text-sm font-medium text-gray-700 mb-1">
              Book ID
            </label>
            <div className="relative">
              <BookOpen size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="bookId"
                name="bookId"
                value={formData.bookId}
                readOnly
                className={`pl-10 w-full p-3 border border-gray-300 rounded-lg cursor-not-allowed ${formData.issueBBBook === "No" ? "bg-gray-100 opacity-50" : "bg-gray-100"}`}
                placeholder="Auto-filled from book title"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="borrowDate" className="block text-sm font-medium text-gray-700 mb-1">
              Borrow Date
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                id="borrowDate"
                name="borrowDate"
                value={formData.borrowDate}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 px-2 mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="w-full px-2 mt-4">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingEmployee}
            >
              Submit Borrower Entry
            </button>
          </div>
        </form>
      </div>
    </div>

  )
}

export default BorrowerEntry
