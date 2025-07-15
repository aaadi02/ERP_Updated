"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const BookActions = () => {
  const location = useLocation();
  const [activeForm, setActiveForm] = useState("issue")
  const [message, setMessage] = useState("")
  const [selectedDays, setSelectedDays] = useState("")
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    ACCNO: "",
    bookTitle: "",
    author: "",
    publisher: "",
    isbn: "",
    borrowerType: "student",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    returnDate: new Date().toISOString().split("T")[0],
    btNumber: "",
    studentName: "",
    rollNumber: "",
    studentId: "",
    semester: "",
    course: "",
    employeeId: "",
    firstName: "",
    designation: "",
    dateOfJoining: "",
    department: "",
    email: "",
    phone: "",
    lostDate: new Date().toISOString().split("T")[0],
    lostReason: "",
    replacementCost: "",
    lostRemarks: "",
  })

  const [issuedBooks, setIssuedBooks] = useState([])
  const [selectedBookId, setSelectedBookId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [history, setHistory] = useState([])
  const [filters, setFilters] = useState({
    ACCNO: "",
    btNumber: "",
    transactionType: "all",
    borrowerType: "all",
    studentId: "",
    employeeId: "",
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
  })

  // Handle auto-refresh after new book issue
  useEffect(() => {
    if (location.state?.refresh && location.state?.borrowerId && location.state?.borrowerType) {
      // Clear existing data
      setIssuedBooks([]);
      setHistory([]);
      
      // Fetch new data
      fetchIssuedBooks(location.state.borrowerId, location.state.borrowerType);
      const lastIssuedBook = localStorage.getItem('lastIssuedBook');
      if (lastIssuedBook) {
        try {
          const book = JSON.parse(lastIssuedBook);
          setHistory(prev => [book, ...prev]);
        } catch (err) {
          console.error('Error parsing last issued book:', err);
        }
      }
      
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load pre-filled data from location state or localStorage when component mounts
  useEffect(() => {
    // First check if we have borrower data in location state
    if (location.state?.borrower) {
      const borrowerData = location.state.borrower;
      console.log('Loading borrower data from location state:', borrowerData);
      
      if (borrowerData.type === 'student') {
        setFormData(prev => ({
          ...prev,
          borrowerType: 'student',
          btNumber: borrowerData.studentId || '',
          studentId: borrowerData.studentId || '',
          studentName: borrowerData.name || '',
          department: borrowerData.department || '',
          semester: borrowerData.semester || '',
          course: borrowerData.course || borrowerData.stream || '',
          email: borrowerData.email || '',
          phone: borrowerData.phone || '',
        }));

        // Fetch issued books for this student
        if (borrowerData.studentId) {
          fetchIssuedBooks(borrowerData.studentId, 'student');
        }
      } else if (borrowerData.type === 'faculty') {
        setFormData(prev => ({
          ...prev,
          borrowerType: 'faculty',
          employeeId: borrowerData.employeeId || '',
          firstName: borrowerData.name || '',
          department: borrowerData.department || '',
          designation: borrowerData.designation || '',
          email: borrowerData.email || '',
          phone: borrowerData.phone || '',
        }));

        // Fetch issued books for this faculty
        if (borrowerData.employeeId) {
          fetchIssuedBooks(borrowerData.employeeId, 'faculty');
        }
      }
      
      // Clear the location state to avoid issues on refresh
      window.history.replaceState({}, document.title);
    } 
    // Fallback to localStorage if no data in location state
    else {
      const selectedBorrower = localStorage.getItem('selectedBorrower');
      if (selectedBorrower) {
        try {
          const borrowerData = JSON.parse(selectedBorrower);
          console.log('Loading borrower data from localStorage:', borrowerData);

          if (borrowerData.type === 'student') {
            setFormData(prev => ({
              ...prev,
              borrowerType: 'student',
              btNumber: borrowerData.studentId || '',
              studentId: borrowerData.studentId || '',
              studentName: borrowerData.name || '',
              department: borrowerData.department || '',
              semester: borrowerData.semester || '',
              course: borrowerData.course || borrowerData.stream || '',
              email: borrowerData.email || '',
              phone: borrowerData.phone || '',
            }));

            // Fetch issued books for this student
            if (borrowerData.studentId) {
              fetchIssuedBooks(borrowerData.studentId, 'student');
            }
          } else if (borrowerData.type === 'faculty') {
            setFormData(prev => ({
              ...prev,
              borrowerType: 'faculty',
              employeeId: borrowerData.employeeId || '',
              firstName: borrowerData.name || '',
              department: borrowerData.department || '',
              designation: borrowerData.designation || '',
              email: borrowerData.email || '',
              phone: borrowerData.phone || '',
            }));

            // Fetch issued books for this faculty
            if (borrowerData.employeeId) {
              fetchIssuedBooks(borrowerData.employeeId, 'faculty');
            }
          }

          // Clear the localStorage after using it
          localStorage.removeItem('selectedBorrower');
        } catch (err) {
          console.error('Error parsing selectedBorrower data:', err);
        }
      }
    }
  }, [location.state]);

  const handleDaysChange = (e) => {
    const days = e.target.value
    setSelectedDays(days)
    if (days) {
      const issueDate = new Date()
      const dueDate = new Date(issueDate.getTime() + Number.parseInt(days) * 24 * 60 * 60 * 1000)
      setFormData((prev) => ({
        ...prev,
        dueDate: dueDate.toISOString().split("T")[0],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        dueDate: "",
      }))
    }
  }

  const fetchBorrowerDetails = async (id, type) => {
    try {
      setLoading(true)
      setError("")

      if (!id) {
        setError("Please enter a valid ID")
        setLoading(false)
        return
      }

      if (type === "faculty") {
        const response = await axios.get("https://backend-erp-faculty.vercel.app/api/faculty/faculties")
        const facultyMember = response.data.find((f) => f.employeeId === id)

        if (facultyMember) {
          setFormData((prev) => ({
            ...prev,
            firstName: facultyMember.name || facultyMember.NAME || "",
            department: facultyMember.department || "",
            designation: facultyMember.designation || "",
            email: facultyMember.email || "",
            phone: facultyMember.mobile || "",
            employmentStatus: facultyMember.employmentStatus || "",
            dateOfJoining: facultyMember.dateOfJoining || "",
          }))
        } else {
          setError("Faculty member not found")
          setFormData((prev) => ({
            ...prev,
            firstName: "",
            department: "",
            designation: "",
            email: "",
            phone: "",
            employmentStatus: "",
            dateOfJoining: "",
          }))
        }
      } else {
        try {
          console.log("Fetching student with ID:", id)

          if (!id || typeof id !== "string" || id.trim().length === 0) {
            throw new Error("Please enter a valid student ID")
          }

          const studentId = id.trim()

          try {
            const response = await axios.get(`http://localhost:5000/api/students/enrollment/${encodeURIComponent(studentId)}`)
            console.log("Student data response:", response.data)

            if (response.data) {
              const studentData = response.data
              console.log("Processing student data:", studentData)

              if (!studentData.studentId || !studentData._id) {
                throw new Error("Student ID not found in response")
              }

              const fullName = [studentData.firstName, studentData.middleName, studentData.lastName]
                .filter(Boolean)
                .join(" ")

              const departmentName = studentData.department?.name || ""
              const streamName = studentData.stream?.name || ""
              const semesterNumber = studentData.semester?.number || ""
              const formattedAdmissionDate = studentData.admissionDate
                ? new Date(studentData.admissionDate).toLocaleDateString()
                : ""

              const updatedFormData = {
                ...formData,
                studentName: fullName || "",
                rollNumber: studentData.enrollmentNumber || "",
                studentId: studentData.studentId || "",
                department: departmentName,
                semester: semesterNumber,
                course: streamName,
                email: studentData.email || "",
                phone: studentData.mobileNumber || "",
                gender: studentData.gender || "",
                admissionType: studentData.admissionType || "",
                admissionDate: formattedAdmissionDate,
                section: studentData.section || "",
                casteCategory: studentData.casteCategory || "",
                subCaste: studentData.subCaste || "",
                fatherName: studentData.fatherName || "",
                motherName: studentData.motherName || "",
                admissionThrough: studentData.admissionThrough || "",
                remark: studentData.remark || "",
                unicodeName: studentData.unicodeName || "",
                unicodeFatherName: studentData.unicodeFatherName || "",
                unicodeMotherName: studentData.unicodeMotherName || "",
                isActive: studentData.isActive || false,
                backlogs: studentData.backlogs || [],
                subjects: studentData.subjects || [],
                semesterRecords: studentData.semesterRecords || [],
              }

              console.log("Updated form data:", updatedFormData)
              setFormData(updatedFormData)

              if (studentData.studentId) {
                fetchIssuedBooks(studentData.studentId, "student")
              }
            }
          } catch (err) {
            if (err.response && err.response.status === 404) {
              console.error("Student not found:", studentId)
              setError(`Student with ID "${studentId}" not found. Please check the ID and try again.`)
            } else {
              console.error("Error fetching student details:", err)
              setError("Error fetching student details. Please try again.")
            }

            setFormData((prev) => ({
              ...prev,
              studentName: "",
              rollNumber: "",
              studentId: "",
              department: "",
              semester: "",
              course: "",
              email: "",
              phone: "",
              gender: "",
              admissionType: "",
              admissionDate: "",
              section: "",
              casteCategory: "",
              subCaste: "",
              fatherName: "",
              motherName: "",
              admissionThrough: "",
              remark: "",
              unicodeName: "",
              unicodeFatherName: "",
              unicodeMotherName: "",
              isActive: false,
              backlogs: [],
              subjects: [],
              semesterRecords: [],
            }))
          }
        } catch (err) {
          console.error("Error in student fetch process:", err)
          setError(err.message || "Error fetching student details. Please try again.")
        }
      }
      setLoading(false)
    } catch (err) {
      console.error("Error fetching borrower details:", err)
      setError("Error fetching borrower details")
      setLoading(false)
    }
  }

  const fetchBookDetails = async (accno) => {
    try {
      if (!accno || accno.trim() === "") {
        setError("Please enter a valid ACCNO")
        return
      }

      setLoading(true)
      console.log("Fetching book details for ACCNO:", accno)

      // Try multiple possible endpoints for fetching book details
      let bookData = null;
      
      try {
        // First try the by-accno endpoint
        const response = await axios.get(`http://localhost:5000/api/books/by-accno/${accno}`);
        bookData = response.data;
        console.log("Book found via by-accno endpoint:", bookData);
        
        // Verify the ACCNO matches exactly
        if (bookData && bookData.ACCNO !== accno) {
          console.log("ACCNO mismatch in by-accno endpoint, ignoring result");
          bookData = null;
        }
      } catch (err) {
        console.log("First endpoint failed, trying alternative...");
        try {
          // Try alternative endpoint
          const response = await axios.get(`http://localhost:5000/api/books/${accno}`);
          bookData = response.data;
          console.log("Book found via id endpoint:", bookData);
          
          // Verify the ACCNO matches exactly
          if (bookData && bookData.ACCNO !== accno) {
            console.log("ACCNO mismatch in id endpoint, ignoring result");
            bookData = null;
          }
        } catch (err2) {
          console.log("Second endpoint failed, trying search endpoint...");
          try {
            // Try search endpoint
            const response = await axios.get(`http://localhost:5000/api/books?search=${accno}`);
            const books = response.data.data || response.data.books || response.data;
            if (Array.isArray(books) && books.length > 0) {
              // Find exact ACCNO match only
              bookData = books.find(book => book.ACCNO === accno);
              if (bookData) {
                console.log("Book found via search endpoint:", bookData);
              } else {
                console.log("No exact ACCNO match found in search results");
              }
            } else {
              throw new Error("No books found");
            }
          } catch (err3) {
            console.log("All endpoints failed, trying general books endpoint...");
            try {
              // Last attempt - get all books and filter
              const response = await axios.get(`http://localhost:5000/api/books`);
              const allBooks = response.data.data || response.data.books || response.data;
              if (Array.isArray(allBooks)) {
                bookData = allBooks.find(book => book.ACCNO === accno);
                if (bookData) {
                  console.log("Book found via all books endpoint:", bookData);
                } else {
                  console.log("No exact ACCNO match found in all books");
                }
              }
            } catch (err4) {
              console.log("All endpoints failed completely");
            }
          }
        }
      }

      // Only proceed if we have book data with matching ACCNO
      if (bookData && bookData.ACCNO === accno) {
        console.log("Book data received:", bookData)

        const issueDate = new Date().toISOString().split("T")[0]

        setFormData((prev) => ({
          ...prev,
          ACCNO: bookData.ACCNO || accno,
          isbn: bookData.ACCNO || accno,
          bookTitle: bookData.TITLENAME || bookData.title || "",
          author: bookData.AUTHOR || bookData.author || "",
          publisher: bookData["PUBLISHER NAME"] || bookData.publisher || "",
          SERIESCODE: bookData.SERIESCODE || "",
          CLASSNO: bookData.CLASSNO || "",
          "PUB.YEAR": bookData["PUB.YEAR"] || "",
          PAGES: bookData.PAGES || "",
          PRINTPRICE: bookData.PRINTPRICE || "",
          PURPRICE: bookData.PURPRICE || "",
          shelf: bookData.shelf || "",
          category: bookData.category || "",
          status: bookData.STATUS || bookData.status || "available",
          ACCDATE: bookData.ACCDATE || "",
          CITY: bookData.CITY || "",
          "VENDER CITY": bookData["VENDER CITY"] || "",
          INVOICENO: bookData.INVOICENO || "",
          INVOICE_DATE: bookData.INVOICE_DATE || "",
          "SUBJECT NAME": bookData["SUBJECT NAME"] || "",
          REFCIR: bookData.REFCIR || "",
          materialType: bookData.materialType || "book",
          QUANTITY: bookData.QUANTITY || 1,
          section: bookData.section || "",
          vendor: bookData.vendor || "",
          purchaseDate: bookData.purchaseDate || "",
          invoiceNumber: bookData.invoiceNumber || "",
          price: bookData.price || bookData.PRINTPRICE || "",
          paymentMethod: bookData.paymentMethod || "",
          paymentStatus: bookData.paymentStatus || "",
          issueDate,
          replacementCost: bookData.PURPRICE || bookData.PRINTPRICE || "",
        }))

        const formFields = document.querySelectorAll('input:not([name="ACCNO"])')
        formFields.forEach((field) => {
          field.setAttribute("readonly", true)
        })

        setError("")
        setSuccess("Book details loaded successfully!")
      } else {
        // Book not found after all attempts
        const issueDate = new Date().toISOString().split("T")[0]

        setFormData((prev) => ({
          ...prev,
          ACCNO: accno,
          isbn: accno,
          bookTitle: "",
          author: "",
          publisher: "",
          shelf: "",
          category: "",
          SERIESCODE: "",
          CLASSNO: "",
          "PUB.YEAR": "",
          PAGES: "",
          PRINTPRICE: "",
          PURPRICE: "",
          ACCDATE: "",
          CITY: "",
          "VENDER CITY": "",
          INVOICENO: "",
          INVOICE_DATE: "",
          "SUBJECT NAME": "",
          REFCIR: "",
          materialType: "book",
          QUANTITY: 1,
          section: "",
          vendor: "",
          purchaseDate: "",
          invoiceNumber: "",
          price: "",
          paymentMethod: "",
          paymentStatus: "",
          issueDate,
          replacementCost: "",
        }))

        setError(`Book with ACCNO ${accno} not found in database. Please fill in the book details to add it.`)

        const formFields = document.querySelectorAll("input[readonly]")
        formFields.forEach((field) => {
          field.removeAttribute("readonly")
        })
      }
    } catch (err) {
      console.error("Error in fetchBookDetails:", err)
      setError("Failed to connect to the server. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const saveNewBook = async () => {
    try {
      setLoading(true)
      setError("")

      if (!formData.ACCNO || !formData.bookTitle) {
        setError("ACCNO and Title are required")
        setLoading(false)
        return
      }

      const bookData = {
        ACCNO: formData.ACCNO,
        TITLENAME: formData.bookTitle,
        AUTHOR: formData.author,
        "PUBLISHER NAME": formData.publisher,
        SERIESCODE: formData.SERIESCODE,
        CLASSNO: formData.CLASSNO,
        "PUB.YEAR": formData["PUB.YEAR"],
        PAGES: formData.PAGES,
        PRINTPRICE: formData.PRINTPRICE,
        PURPRICE: formData.PURPRICE,
        ACCDATE: formData.ACCDATE,
        CITY: formData.CITY,
        "VENDER CITY": formData["VENDER CITY"],
        INVOICENO: formData.INVOICENO,
        INVOICE_DATE: formData.INVOICE_DATE,
        "SUBJECT NAME": formData["SUBJECT NAME"],
        REFCIR: formData.REFCIR,
        status: "available",
        QUANTITY: 1,
        materialType: "book",
      }

      console.log("Saving new book with data:", bookData)

      const response = await axios.post("http://localhost:5000/api/books", bookData)

      if (response.data) {
        // Immediately update status and quantity in backend if not set
        try {
          await axios.patch(`http://localhost:5000/api/books/accno/${formData.ACCNO}`, {
            status: "available",
            QUANTITY: 1
          });
        } catch (patchErr) {
          console.warn("Could not patch book status/quantity after creation", patchErr);
        }
        setSuccess("Book added successfully!")
        const formFields = document.querySelectorAll('input:not([name="ACCNO"])')
        formFields.forEach((field) => {
          field.setAttribute("readonly", true)
        })

        setFormData((prev) => ({
          ...prev,
          ...bookData,
        }))
      }
    } catch (err) {
      console.error("Error saving book:", err)
      if (err.response?.data?.message?.includes("duplicate key")) {
        setError("A book with this ACCNO already exists. Please use a different ACCNO.")
      } else {
        setError(err.response?.data?.message || "Failed to save book. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLostBookSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      if (!formData.ACCNO || !formData.bookTitle) {
        setError("Book details (ACCNO and Title) are required")
        setLoading(false)
        return
      }

      if (!formData.lostDate) {
        setError("Lost date is required")
        setLoading(false)
        return
      }

      if (!formData.lostReason) {
        setError("Lost reason is required")
        setLoading(false)
        return
      }

      // Removed borrower validation for lost book

      const lostBookData = {
        bookId: formData.ACCNO,
        bookTitle: formData.bookTitle,
        author: formData.author,
        publisher: formData.publisher,
        SERIESCODE: formData.SERIESCODE,
        lostDate: formData.lostDate,
        lostReason: formData.lostReason,
        replacementCost: formData.replacementCost || "0",
        lostRemarks: formData.lostRemarks || "",
        status: 'lost',
        transactionType: 'lost',
        dueDate: new Date(), // Setting current date as due date for lost books
      }

      console.log("Recording lost book with data:", lostBookData)

      const response = await axios.post("http://localhost:5000/api/issues/lost", lostBookData)
      console.log("Lost book response:", response.data)

      if (response.data.success) {
        setSuccess("Lost book entry recorded successfully!")
        setFormData((prev) => ({
          ...prev,
          ACCNO: "",
          bookTitle: "",
          author: "",
          publisher: "",
          isbn: "",
          SERIESCODE: "",
          lostDate: new Date().toISOString().split("T")[0],
          lostReason: "",
          replacementCost: "",
          lostRemarks: "",
        }))
        // Refresh history to show the new lost record
        fetchHistory();
      } else {
        setError(response.data.message || "Failed to record lost book entry")
      }
    } catch (err) {
      console.error("Error recording lost book:", err)
      if (err.response) {
        console.error("Error response:", err.response.data)
        setError(err.response.data.message || "Failed to record lost book entry")
      } else {
        setError("Failed to record lost book entry. Please check your connection.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleIssueSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const borrowerId = formData.borrowerType === "student" ? formData.studentId : formData.employeeId

      // Check how many books are already issued to this borrower (use correct endpoint)
      try {
        const borrowerResponse = await axios.get(
          `http://localhost:5000/api/issues/borrowed-books?borrowerId=${borrowerId}&borrowerType=${formData.borrowerType}`
        );
        console.log("Borrower books response:", borrowerResponse.data);

        // The backend should return an array of issued books in .data or .borrowedBooks
        const issuedBooks = borrowerResponse.data.data || borrowerResponse.data.borrowedBooks || [];
        if (issuedBooks.length >= 2) {
          setError(
            `${formData.borrowerType === "student" ? "Student" : "Faculty"} already has 2 books issued. Please return a book before issuing a new one.`
          );
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error checking issued books:", err);
        // Only ignore 404 (no books issued), treat other errors as real
        if (err.response && err.response.status !== 404) {
          setError(err.response?.data?.message || "Error checking issued books");
          setLoading(false);
          return;
        }
      }

      if (!formData.ACCNO || !formData.bookTitle) {
        setError("Book details (ACCNO and Title) are required")
        setLoading(false)
        return
      }

      if (formData.borrowerType === "student" && !formData.studentId) {
        setError("Student ID is required")
        setLoading(false)
        return
      }

      if (formData.borrowerType === "faculty" && !formData.employeeId) {
        setError("Employee ID is required")
        setLoading(false)
        return
      }

      if (!formData.dueDate) {
        setError("Please select the number of days to set the due date")
        setLoading(false)
        return
      }

      // Prepare issueData based on borrower type
      let issueData;
      
      if (formData.borrowerType === "student") {
        issueData = {
          ACCNO: formData.ACCNO,
          bookTitle: formData.bookTitle,
          author: formData.author,
          publisher: formData.publisher,
          isbn: formData.isbn,
          borrowerType: "student",
          studentId: formData.studentId,
          studentName: formData.studentName,
          department: formData.department,
          course: formData.course,
          semester: formData.semester,
          email: formData.email,
          phone: formData.phone,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          borrowerId: formData.studentId // Add explicit borrowerId for student
        };
      } else {
        // Faculty issue data
        issueData = {
          ACCNO: formData.ACCNO,
          bookTitle: formData.bookTitle,
          author: formData.author,
          publisher: formData.publisher,
          isbn: formData.isbn,
          borrowerType: "faculty",
          employeeId: formData.employeeId,
          facultyName: formData.firstName,
          department: formData.department,
          designation: formData.designation,
          email: formData.email,
          phone: formData.phone,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          borrowerId: formData.employeeId // Add explicit borrowerId for faculty
        };
      }

      console.log("Issuing book with data:", issueData)

      // Use the issues endpoint instead of books endpoint
      const issueResponse = await axios.post("http://localhost:5000/api/issues/issue", issueData);
      console.log("Issue response:", issueResponse.data)

      if (issueResponse.data.success) {
        setSuccess("Book issued successfully!")
        
        // Clear form data based on borrower type
        if (formData.borrowerType === "student") {
          setFormData((prev) => ({
            ...prev,
            ACCNO: "",
            bookTitle: "",
            author: "",
            publisher: "",
            isbn: "",
            studentId: "",
            studentName: "",
            rollNumber: "",
            department: "",
            course: "",
            semester: "",
            email: "",
            phone: "",
            issueDate: new Date().toISOString().split("T")[0],
            dueDate: "",
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            ACCNO: "",
            bookTitle: "",
            author: "",
            publisher: "",
            isbn: "",
            employeeId: "",
            firstName: "",
            department: "",
            designation: "",
            email: "",
            phone: "",
            issueDate: new Date().toISOString().split("T")[0],
            dueDate: "",
          }))
        }
        setSelectedDays("")
      } else {
        setError(issueResponse.data.message || "Failed to issue book")
      }
    } catch (err) {
      console.error("Error issuing book:", err)
      if (err.response) {
        console.error("Error response:", err.response.data)
        console.error("Error status:", err.response.status)
        console.error("Error headers:", err.response.headers)
        if (err.response.status === 404) {
          setError("Book issue service not found. Please check the server configuration.")
        } else if (err.response.status === 400) {
          setError(err.response.data.message || "Invalid request data. Please check all required fields.")
        } else {
          setError(err.response.data.message || "Failed to issue book")
        }
      } else if (err.request) {
        console.error("Error request:", err.request)
        setError("No response received from server. Please check your connection.")
      } else if (err.message) {
        console.error("Error message:", err.message)
        setError(err.message)
      } else {
        setError("Failed to issue book. Please check your connection.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRenewSubmit = async () => {
    try {
      const borrowerId = formData.borrowerType === "student" ? formData.studentId : formData.employeeId

      if (!selectedBookId) {
        setError("Please select a book to renew")
        return
      }

      if (!borrowerId) {
        setError(`Please enter ${formData.borrowerType === "student" ? "Student ID" : "Employee ID"}`)
        return
      }

      if (!formData.newDueDate) {
        setError("Please select a new due date")
        return
      }

      setLoading(true)
      setError("")
      setSuccess("")

      const response = await axios.post("http://localhost:5000/api/issues/renew", {
        bookId: selectedBookId,
        borrowerId,
        borrowerType: formData.borrowerType,
        newReturnDate: formData.newDueDate,
      })

      if (response.data.success) {
        setSuccess("Book renewed successfully!")
        await fetchIssuedBooks(borrowerId, formData.borrowerType)
        setSelectedBookId("")
        setFormData((prev) => ({
          ...prev,
          newDueDate: "",
        }))
      } else {
        setError(response.data.message || "Failed to renew book")
      }
    } catch (err) {
      console.error("Error renewing book:", err)
      if (err.response) {
        console.error("Error response:", err.response.data)
        setError(err.response.data.message || "Failed to renew book")
      } else {
        setError("Failed to renew book. Please check your connection.")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchIssuedBooks = async (borrowerId, borrowerType) => {
    if (!borrowerId || !borrowerType) {
      console.log("Missing borrowerId or borrowerType, skipping fetch");
      return;
    }
    
    try {
      console.log(`Fetching issued books for ${borrowerType} ${borrowerId}`);
      
      let res;
      try {
        // Try first endpoint
        res = await axios.get(`http://localhost:5000/api/issues/borrowed-books?borrowerId=${borrowerId}&borrowerType=${borrowerType}`);
        console.log("Issued Books API response from issues/borrowed-books:", res.data);
      } catch (endpointErr) {
        // If first endpoint fails, try the second endpoint
        console.log("First endpoint failed, trying alternative endpoint...");
        res = await axios.get(`http://localhost:5000/api/borrowed-books?borrowerId=${borrowerId}&borrowerType=${borrowerType}`);
        console.log("Issued Books API response from borrowed-books:", res.data);
      }
      
      // Handle various response formats
      let books = [];
      if (res.data.borrowedBooks) {
        books = res.data.borrowedBooks;
      } else if (res.data.data) {
        books = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      } else if (Array.isArray(res.data)) {
        books = res.data;
      }
      
      // Filter out any null or undefined entries
      books = books.filter(book => book && book.ACCNO);
      
      console.log(`Found ${books.length} issued books:`, books);
      
      // Update state
      setIssuedBooks(books);
      
      // Update history if books found
      if (books.length > 0) {
        setHistory(prev => {
          const existingIds = new Set(prev.map(h => h.ACCNO));
          const newBooks = books.filter(b => !existingIds.has(b.ACCNO));
          return [...newBooks, ...prev];
        });
      }
      
      // Clear any previous errors if successful
      setError("");
      
    } catch (err) {
      console.error("Error fetching issued books:", err);
      
      // Handle 404 (no books) as a non-error case
      if (err.response?.status === 404) {
        console.log("No active issues found - this is normal for new borrowers");
        setIssuedBooks([]);
        setError("");
      } else {
        setIssuedBooks([]);
        setError(err.response?.data?.message || "Failed to fetch issued books. Please try again.");
      }
    }
  };

  // ✅ Then, loop over students
  useEffect(() => {
    students.forEach((student) => {
      if (student.studentId) {
        fetchIssuedBooks(student.studentId);
      }
    });
  }, [students]);

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })

      if (filters.ACCNO) {
        params.append("bookId", filters.ACCNO)
      }

      if (filters.borrowerType === "student" && filters.studentId) {
        params.append("studentId", filters.studentId)
      } else if (filters.borrowerType === "faculty" && filters.employeeId) {
        params.append("employeeId", filters.employeeId)
      }

      if (filters.borrowerType && filters.borrowerType !== "all") {
        params.append("borrowerType", filters.borrowerType)
      }

      if (filters.transactionType !== "all") {
        params.append("transactionType", filters.transactionType)
      }

      const response = await axios.get(`http://localhost:5000/api/issues/history?${params}`)
      console.log("Backend history response:", response.data)

      if (response.data.data.records.length === 0) {
        let specificError = "No transaction history found"
        if (filters.studentId && filters.borrowerType === "student") {
          try {
            await axios.get(`http://localhost:5000/api/students/enrollment/${encodeURIComponent(filters.studentId)}`)
          } catch (err) {
            if (err.response?.status === 404) {
              specificError = `Student with ID ${filters.studentId} not found.`
            }
          }
        }
        if (filters.employeeId && filters.borrowerType === "faculty") {
          try {
            const response = await axios.get("https://backend-erp-faculty.vercel.app/api/faculty/faculties")
            const facultyMember = response.data.find((f) => f.employeeId === filters.employeeId)
            if (!facultyMember) {
              specificError = `Faculty member with ID ${filters.employeeId} not found.`
            }
          } catch (err) {
            if (err.response?.status === 404) {
              specificError = `Faculty member with ID ${filters.employeeId} not found.`
            }
          }
        }
        if (filters.ACCNO) {
          try {
            await axios.get(`http://localhost:5000/api/books/accno/${filters.ACCNO}`)
          } catch (err) {
            if (err.response?.status === 404) {
              specificError = `Book with ACCNO ${filters.ACCNO} not found.`
            }
          }
        }
        setError(specificError)
      } else {
        setError("")
      }

      const mappedHistory = response.data.data.records.map((record) => ({
        ...record,
        ACCNO: record.bookId || record.ACCNO || "N/A",
      }))

      // Debug: Log all transaction types received
      console.log("Transaction types in fetched history:", mappedHistory.map(r => r.transactionType));

      setHistory(mappedHistory)
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.data.pagination.totalPages,
        currentPage: response.data.data.pagination.currentPage,
      }))
    } catch (err) {
      console.error("Error fetching history:", err)
      setError(err.response?.data?.message || "Failed to fetch history. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = async (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "ACCNO" && value.length > 0) {
      fetchBookDetails(value)
    }

    if (name === "studentId" && value.length > 0) {
      try {
        setLoading(true)
        setError("")

        if (!value || typeof value !== "string" || value.trim().length === 0) {
          throw new Error("Please enter a valid student ID")
        }

        const studentId = value.trim()

        const response = await axios.get(`http://localhost:5000/api/students/enrollment/${encodeURIComponent(studentId)}`)
        console.log("Student data response:", response.data)

        if (response.data) {
          const studentData = response.data

          const fullName = [studentData.firstName, studentData.middleName, studentData.lastName]
            .filter(Boolean)
            .join(" ")

          const departmentName = studentData.department?.name || ""
          const streamName = studentData.stream?.name || ""
          const semesterNumber = studentData.semester?.number || ""

          setFormData((prev) => ({
            ...prev,
            studentName: fullName || "",
            rollNumber: studentData.enrollmentNumber || "",
            department: departmentName,
            semester: semesterNumber,
            course: streamName,
            email: studentData.email || "",
            phone: studentData.mobileNumber || "",
          }))

          if (studentData.studentId) {
            fetchIssuedBooks(studentData.studentId, "student")
          }
        }
      } catch (err) {
        console.error("Error fetching student details:", err)
        if (err.response && err.response.status === 404) {
          setError(`Student with ID "${value}" not found. Please check the ID and try again.`)
        } else {
          setError("Error fetching student details. Please try again.")
        }

        setFormData((prev) => ({
          ...prev,
          studentName: "",
          rollNumber: "",
          department: "",
          semester: "",
          course: "",
          email: "",
          phone: "",
        }))
      } finally {
        setLoading(false)
      }
    }

    if (name === "employeeId" && value.length > 0) {
      try {
        setLoading(true)
        setError("")

        if (!value || typeof value !== "string" || value.trim().length === 0) {
          throw new Error("Please enter a valid employee ID")
        }

        const employeeId = value.trim()
        console.log("Fetching faculty with Employee ID:", employeeId)

        const response = await axios.get("https://backend-erp-faculty.vercel.app/api/faculty/faculties")
        console.log("Faculty API response:", response.data)

        // Check if response.data is an array or contains an array
        let facultyList = []
        if (Array.isArray(response.data)) {
          facultyList = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          facultyList = response.data.data
        } else {
          throw new Error("Invalid faculty data structure")
        }

        console.log("Faculty list:", facultyList)
        console.log("Searching for employee ID:", employeeId)

        const facultyMember = facultyList.find((f) => {
          console.log("Checking faculty member:", f)
          return f.employeeId === employeeId || f.empId === employeeId || f.id === employeeId
        })

        console.log("Found faculty member:", facultyMember)

        if (facultyMember) {
          setFormData((prev) => ({
            ...prev,
            firstName: facultyMember.name || facultyMember.firstName || facultyMember.NAME || "",
            department: facultyMember.department || "",
            designation: facultyMember.designation || facultyMember.position || "",
            email: facultyMember.email || "",
            phone: facultyMember.mobile || facultyMember.phone || facultyMember.phoneNumber || "",
            employmentStatus: facultyMember.employmentStatus || facultyMember.status || "",
            dateOfJoining: facultyMember.dateOfJoining || facultyMember.joiningDate || "",
          }))

          if (facultyMember.employeeId || facultyMember.empId || facultyMember.id) {
            fetchIssuedBooks(employeeId, "faculty")
          }

          setError("")
          setSuccess("Faculty details loaded successfully!")
        } else {
          setError(`Faculty member with ID "${employeeId}" not found. Please check the ID and try again.`)
          setFormData((prev) => ({
            ...prev,
            firstName: "",
            department: "",
            designation: "",
            email: "",
            phone: "",
            employmentStatus: "",
            dateOfJoining: "",
          }))
        }
      } catch (err) {
        console.error("Error fetching faculty details:", err)
        if (err.response) {
          setError(err.response.data.message || "Error fetching faculty details. Please try again.")
        } else {
          setError("Error fetching faculty details. Please try again.")
        }

        setFormData((prev) => ({
          ...prev,
          firstName: "",
          department: "",
          designation: "",
          email: "",
          phone: "",
          employmentStatus: "",
          dateOfJoining: "",
        }))
      } finally {
        setLoading(false)
      }
    }
  }

  const handleReturnSubmit = async () => {
    const borrowerId = formData.borrowerType === "student" ? formData.studentId : formData.employeeId

    if (!borrowerId || !selectedBookId) {
      setError(`${formData.borrowerType === "student" ? "Student ID" : "Employee ID"} and Book selection are required`)
      return
    }

    try {
      setError("")
      setSuccess("")
      setLoading(true)
      
      // Check if the selected book exists in the issued books list
      const isBookIssued = issuedBooks.some(book => book.ACCNO === selectedBookId);
      
      if (!isBookIssued && issuedBooks.length > 0) {
        console.warn("Selected book not found in issued books list");
      }

      // Create comprehensive return data with all possible field names
      const returnData = {
        ACCNO: selectedBookId,
        bookId: selectedBookId,
        accessionNumber: selectedBookId,
        borrowerId: borrowerId,
        studentId: formData.borrowerType === "student" ? borrowerId : undefined,
        employeeId: formData.borrowerType === "faculty" ? borrowerId : undefined,
        borrowerType: formData.borrowerType,
        returnDate: formData.returnDate || new Date().toISOString().split("T")[0],
        status: "returned"
      }

      console.log("Returning book with data:", returnData)

      // Instead of trying different endpoints, use the same endpoint as the issue functionality
      let res;
      try {
        // Use the same base endpoint as issue functionality
        res = await axios.post("http://localhost:5000/api/issues/return", returnData);
        console.log("Return book API response:", res.data);
      } catch (endpointErr) {
        console.log("Return endpoint failed:", endpointErr.message);
        
        // If there's an error, let's check if the book exists in the issued books array
        const matchingBook = issuedBooks.find(book => book.ACCNO === selectedBookId);
        
        if (matchingBook) {
          console.log("Found matching book in issued books:", matchingBook);
          // Try with the exact structure from the matched book
          returnData.issueId = matchingBook._id || matchingBook.id;
          returnData.transactionId = matchingBook.transactionId;
          returnData.issueRecordId = matchingBook.issueRecordId;
          
          // Try again with the enhanced data
          res = await axios.post("http://localhost:5000/api/issues/return", returnData);
          console.log("Return book API response (second attempt):", res.data);
        } else {
          throw endpointErr; // Re-throw if we can't enhance the data
        }
      }

      const { success, message, data } = res.data

      if (success) {
        if (data.fineAmount > 0 && data.fineStatus === "pending") {
          const confirmReturn = window.confirm(
            `Fine of Rs. ${data.fineAmount} is due. Has the student paid the fine? Click OK to confirm and complete return.`,
          )

          if (!confirmReturn) {
            setSuccess("")
            setError("Return cancelled until fine is paid.")
            setLoading(false)
            return
          }

          try {
            // Use the same endpoint pattern as the successful return call
            await axios.post("http://localhost:5000/api/issues/return/confirm-payment", {
              issueId: data._id,
              ACCNO: selectedBookId,
              bookId: selectedBookId,
              borrowerId: borrowerId,
              borrowerType: formData.borrowerType,
              returnDate: formData.returnDate || new Date().toISOString().split("T")[0],
              fineAmount: data.fineAmount,
              paymentStatus: 'paid'
            });
          } catch (confirmErr) {
            console.error("Payment confirmation failed:", confirmErr);
            // Show the error but still mark as successful since the book was returned
            console.warn("Book return succeeded but fine payment recording failed");
          }

          setSuccess(`Book returned and fine of Rs. ${data.fineAmount} marked as paid.`)
        } else {
          setSuccess(message || "Book returned successfully.")
        }

        setFormData((prev) => ({
          ...prev,
          studentId: "",
          employeeId: "",
          returnDate: new Date().toISOString().split("T")[0],
        }))
        setIssuedBooks([])
        setSelectedBookId("")
        // Refresh history after successful return
        fetchHistory();
      } else {
        setError(message || "Error while returning book.")
      }
    } catch (err) {
      console.error("Error returning book:", err)
      if (err.response) {
        console.error("Error response:", err.response.data)
        
        // Specific error handling for "No active issue" errors
        if (err.response.data?.message?.includes("No active issue found")) {
          setError("This book is not currently issued to this borrower. Please verify the book ID and borrower ID are correct.");
          
          // Show available books that can be returned for this borrower
          if (issuedBooks.length > 0) {
            const bookList = issuedBooks.map(book => `${book.bookTitle} (${book.ACCNO})`).join(", ");
            setError(prev => `${prev}\n\nBooks currently issued to this borrower: ${bookList}`);
          } else {
            setError(prev => `${prev}\n\nThis borrower has no active books.`);
          }
          
          // Refresh the issued books list to ensure we have the latest data
          fetchIssuedBooks(borrowerId, formData.borrowerType);
        } else {
          // General error handling
          setError(err.response.data.message || "Error while returning book.");
        }
      } else {
        setError("Error while returning book. Please check your connection.");
      }
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      console.log("History data for report generation:", history)

      if (!Array.isArray(history) || history.length === 0) {
        setError("No transaction history available to generate a report.")
        return
      }

      const sanitizedHistory = history.map((record) => ({
        ...record,
        ACCNO: record.bookId || record.ACCNO || "N/A",
        bookTitle: record.bookTitle || "Unknown Title",
        borrowerType: record.borrowerType || "Unknown",
        studentId: record.studentId || "",
        employeeId: record.employeeId || "",
        transactionType: record.transactionType || "unknown",
        issueDate: record.issueDate || new Date(),
        dueDate: record.dueDate || new Date(),
        actualReturnDate: record.actualReturnDate || null,
        returnDate: record.returnDate || null,
        status: record.status || "unknown",
      }))

      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = src
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js")

      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

      let imgData
      try {
        const response = await fetch("/nga.png")
        if (!response.ok) {
          throw new Error("Failed to load the image")
        }
        const blob = await response.blob()
        imgData = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
      } catch (imgError) {
        console.error("Error loading image:", imgError)
        setError("Failed to load logo image for the PDF. Generating PDF without the logo.")
        imgData = null
      }

      const pageWidth = doc.internal.pageSize.getWidth()
      let headerHeight = 10

      if (imgData) {
        const imgWidth = 30
        const imgHeight = 30
        const imgX = 10
        const imgY = headerHeight
        doc.addImage(imgData, "PNG", imgX, imgY, imgWidth, imgHeight)
        headerHeight += imgHeight + 5
      }

      if (imgData) {
        const collegeName = "NAGARJUNA INSTITUTE OF ENGINEERING TECHNOLOGY AND MANAGEMENT"
        doc.setFont("Helvetica", "bold")
        doc.setFontSize(18)
        doc.setTextColor(0, 102, 204)
        const textX = 45
        const textY = headerHeight
        doc.text(collegeName, textX, textY, { maxWidth: 220 })
        headerHeight += 10
      } else {
        const collegeName = "NAGARJUNA INSTITUTE OF ENGINEERING TECHNOLOGY AND MANAGEMENT"
        doc.setFont("Helvetica", "bold")
        doc.setFontSize(18)
        doc.setTextColor(0, 102, 204)
        doc.text(collegeName, pageWidth / 2, headerHeight + 5, { align: "center", maxWidth: 240 })
        headerHeight += 15
      }

      doc.setLineWidth(0.5)
      doc.setDrawColor(0, 102, 204)
      doc.line(10, headerHeight + 2, pageWidth - 10, headerHeight + 2)
      headerHeight += 8

      doc.setFont("Helvetica", "normal")
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text("Satnavri, Amravati Road, Nagpur, Maharashtra 440023, India", pageWidth / 2, headerHeight + 2, {
        align: "center",
      })
      headerHeight += 10

      doc.setFont("Helvetica", "bold")
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("Library Transaction Report", pageWidth / 2, headerHeight + 2, { align: "center" })
      headerHeight += 10

      doc.setFont("Helvetica", "normal")
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, headerHeight + 2, {
        align: "center",
      })
      headerHeight += 10

      const tableData = sanitizedHistory.map((record) => {
        const borrowerId = record.borrowerType === "student" ? record.studentId : record.employeeId
        const displayStatus =
          record.status === "active"
            ? "ACTIVE"
            : record.status === "returned"
              ? "COMPLETED"
              : record.status.toUpperCase() || "UNKNOWN"

        return [
          record.ACCNO,
          record.bookTitle,
          record.borrowerType === "student" ? "Student" : record.borrowerType === "faculty" ? "Faculty" : "Unknown",
          borrowerId || "N/A",
          (record.transactionType || "unknown").toUpperCase(),
          new Date(record.issueDate).toLocaleDateString(),
          new Date(record.dueDate).toLocaleDateString(),
          record.actualReturnDate
            ? new Date(record.actualReturnDate).toLocaleDateString()
            : record.status === "returned" && record.returnDate
              ? new Date(record.returnDate).toLocaleDateString()
              : "-",
          displayStatus,
        ]
      })

      const columns = [
        { header: "ACCNO", dataKey: "accno" },
        { header: "Book Title", dataKey: "bookTitle" },
        { header: "Borrower Type", dataKey: "borrowerType" },
        { header: "ID", dataKey: "id" },
        { header: "Type", dataKey: "type" },
        { header: "Issued", dataKey: "issued" },
        { header: "Due", dataKey: "due" },
        { header: "Returned", dataKey: "returned" },
        { header: "Status", dataKey: "status" },
      ]

      const rows = tableData.map((row) => ({
        accno: row[0],
        bookTitle: row[1],
        borrowerType: row[2],
        id: row[3],
        type: row[4],
        issued: row[5],
        due: row[6],
        returned: row[7],
        status: row[8],
      }))

      const totalColumnWidth = columns.reduce((sum, col) => sum + (col.cellWidth || 30), 0)
      const availableWidth = pageWidth - 20
      const scaleFactor = availableWidth / totalColumnWidth

      doc.autoTable({
        columns: columns.map((col) => ({
          ...col,
          cellWidth: col.cellWidth ? col.cellWidth * scaleFactor : 30 * scaleFactor,
        })),
        body: rows,
        startY: headerHeight,
        theme: "striped",
        headStyles: {
          fillColor: [0, 102, 204],
          textColor: [255, 255, 255],
          halign: "center",
        },
        styles: {
          fontSize: 10,
          cellPadding: 2,
          halign: "center",
          valign: "middle",
        },
        columnStyles: {
          accno: { cellWidth: 20 * scaleFactor },
          bookTitle: { cellWidth: 40 * scaleFactor },
          borrowerType: { cellWidth: 20 * scaleFactor },
          id: { cellWidth: 20 * scaleFactor },
          type: { cellWidth: 20 * scaleFactor },
          issued: { cellWidth: 20 * scaleFactor },
          due: { cellWidth: 20 * scaleFactor },
          returned: { cellWidth: 20 * scaleFactor },
          status: { cellWidth: 20 * scaleFactor },
        },
        margin: { top: headerHeight, left: 10, right: 10 },
        pageBreak: "auto",
      })

      doc.save(`library_history_report_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (err) {
      console.error("Error generating PDF report:", err)
      setError("Failed to generate PDF report: " + err.message)
    }
  }

  const getAllBooks = async () => {
    const response = await fetch("http://localhost:5000/api/books")
    const books = await response.json()
    return books
  }

  const searchBooksByACCNO = async (accno) => {
    const response = await fetch(`http://localhost:5000/api/books?accno=${accno}`)
    const books = await response.json()
    return books
  }

  const getBookByACCNO = async (accno) => {
    const response = await fetch(`http://localhost:5000/api/books/accno/${accno}`)
    const book = await response.json()
    return book
  }

  const handleReturn = async (ACCNO) => {
    try {
      console.log(`Returning book ${ACCNO}`);
      const borrowerData = JSON.parse(localStorage.getItem('borrowerData'));
      if (!borrowerData?.borrowerId || !borrowerData?.borrowerType) {
        throw new Error("Missing borrower information. Please try again.");
      }

      const response = await axios.post(`http://localhost:5000/api/issues/return`, {
        ACCNO,
        borrowerId: borrowerData.borrowerId,
        borrowerType: borrowerData.borrowerType
      });

      console.log("Return response:", response.data);

      // Update UI immediately
      setIssuedBooks(prev => prev.filter(book => book.ACCNO !== ACCNO));
      
      // Add the returned book to history if it's not already there
      setHistory(prev => {
        const returnedBook = issuedBooks.find(book => book.ACCNO === ACCNO);
        if (returnedBook) {
          const existingIndex = prev.findIndex(h => h.ACCNO === ACCNO);
          if (existingIndex >= 0) {
            // Update existing history entry
            const updated = [...prev];
            updated[existingIndex] = { ...returnedBook, returnDate: new Date().toISOString() };
            return updated;
          } else {
            // Add new history entry
            return [{ ...returnedBook, returnDate: new Date().toISOString() }, ...prev];
          }
        }
        return prev;
      });

      toast.success("Book returned successfully!");
      
      // Refresh the issued books list to ensure UI is in sync
      await fetchIssuedBooks(borrowerData.borrowerId, borrowerData.borrowerType);

    } catch (err) {
      console.error("Error returning book:", err);
      toast.error(err.response?.data?.message || "Failed to return book. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow fixed inset-0 min-h-screen bg-gradient-to-br flex flex-col py-12 px-2 md:px-8 z-0 overflow-y-auto overflow-x-hidden">
      <div className="flex space-x-4 mb-6">
        <button
          type="button"
          className={`px-4 py-2 rounded font-semibold ${activeForm === "issue" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveForm("issue")}
        >
          Issue Book
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded font-semibold ${activeForm === "return" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveForm("return")}
        >
          Return Book
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded font-semibold ${activeForm === "renew" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveForm("renew")}
        >
          Renew Book
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded font-semibold ${activeForm === "lost" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveForm("lost")}
        >
          Lost Book Entry
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded font-semibold ${activeForm === "history" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveForm("history")}
        >
          History
        </button>
      </div>

      {activeForm === "issue" && (
        <>
          <h2 className="text-2xl font-bold mb-6">Issue Book</h2>
          {loading && <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">Loading details...</div>}
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Select Borrower Type</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="borrowerType"
                    value="student"
                    checked={formData.borrowerType === "student"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Student
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="borrowerType"
                    value="faculty"
                    checked={formData.borrowerType === "faculty"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Faculty
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {formData.borrowerType === "student" ? "Student Information" : "Faculty Information"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.borrowerType === "student" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Student ID</label>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        placeholder="Enter Student ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Student Name</label>
                      <input
                        type="text"
                        name="studentName"
                        value={formData.studentName}
                        className="w-full p-2 border rounded bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Roll Number</label>
                      <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        className="w-full p-2 border rounded bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Semester</label>
                      <input
                        type="text"
                        name="semester"
                        value={formData.semester}
                        className="w-full p-2 border rounded bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Course</label>
                      <input
                        type="text"
                        name="course"
                        value={formData.course}
                        className="w-full p-2 border rounded bg-gray-50"
                        readOnly
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee ID</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        placeholder="Enter Employee ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Faculty Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        className="w-full p-2 border rounded bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        className="w-full p-2 border rounded bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Joining</label>
                      <input
                        type="text"
                        name="dateOfJoining"
                        value={formData.dateOfJoining}
                        className="w-full p-2 border rounded bg-gray-50"
                        readOnly
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    className="w-full p-2 border rounded bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    className="w-full p-2 border rounded bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    className="w-full p-2 border rounded bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Book Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scan Book Barcode</label>
                  <input
                    type="text"
                    name="ACCNO"
                    value={formData.ACCNO}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Scan or enter book barcode"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Book Title</label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Publisher</label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Shelf</label>
                  <input
                    type="text"
                    name="shelf"
                    value={formData.shelf}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Series Code</label>
                  <input
                    type="text"
                    name="SERIESCODE"
                    value={formData.SERIESCODE}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Class No</label>
                  <input
                    type="text"
                    name="CLASSNO"
                    value={formData.CLASSNO}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Publication Year</label>
                  <input
                    type="text"
                    name="PUB.YEAR"
                    value={formData["PUB.YEAR"]}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pages</label>
                  <input
                    type="text"
                    name="PAGES"
                    value={formData.PAGES}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Print Price</label>
                  <input
                    type="text"
                    name="PRINTPRICE"
                    value={formData.PRINTPRICE}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Price</label>
                  <input
                    type="text"
                    name="PURPRICE"
                    value={formData.PURPRICE}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>
              </div>

              {error?.includes("not found") && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={saveNewBook}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save New Book
                  </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Issue Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Issue Date</label>
                  <input
                    type="text"
                    name="issueDate"
                    value={formData.issueDate}
                    className="w-full p-2 border rounded bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Borrowing Duration (Days)</label>
                  <select
                    value={selectedDays}
                    onChange={handleDaysChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select days</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="text"
                    name="dueDate"
                    value={formData.dueDate}
                    className="w-full p-2 border rounded bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Issue Book
              </button>
            </div>
          </form>
        </>
      )}

      {activeForm === "return" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Return Book</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.borrowerType === "student" ? "Student ID" : "Employee ID"}
              </label>
              <input
                type="text"
                name={formData.borrowerType === "student" ? "studentId" : "employeeId"}
                value={formData.borrowerType === "student" ? formData.studentId : formData.employeeId}
                onChange={handleInputChange}
                onBlur={() => {
                  const id = formData.borrowerType === "student" ? formData.studentId : formData.employeeId
                  if (id.length > 2) {
                    fetchIssuedBooks(id, formData.borrowerType)
                  }
                }}
                className="w-full p-2 border rounded"
                placeholder={formData.borrowerType === "student" ? "Enter Student ID" : "Enter Employee ID"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Select Book to Return</label>
              {issuedBooks.length > 0 ? (
                <div>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select a book</option>
                    {issuedBooks.map((book) => (
                      <option key={book.ACCNO} value={book.ACCNO}>
                        {book.bookTitle || 'Unknown'} - {book.ACCNO}
                      </option>
                    ))}
                  </select>
                  <div className="text-green-600 text-sm mt-1">
                    {issuedBooks.length} active book(s) found for this {formData.borrowerType}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      name="ACCNO"
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Scan or enter book barcode"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="ml-2 px-3 py-2 bg-blue-600 text-white rounded"
                      onClick={() => {
                        const id = formData.borrowerType === "student" ? formData.studentId : formData.employeeId;
                        if (id) {
                          fetchIssuedBooks(id, formData.borrowerType);
                        }
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                  {(formData.borrowerType === "student" ? formData.studentId : formData.employeeId) && (
                    <div className="text-orange-600 text-sm mt-1">
                      No active books found for this {formData.borrowerType}. Please check the ID or try refreshing.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Return Date</label>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate || new Date().toISOString().split("T")[0]}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={handleReturnSubmit}
            >
              Return Book
            </button>
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}
        </div>
      )}

      {activeForm === "renew" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Renew Book</h2>

          {loading && <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">Loading details...</div>}
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.borrowerType === "student" ? "Student ID" : "Employee ID"}
              </label>
              <input
                type="text"
                name={formData.borrowerType === "student" ? "studentId" : "employeeId"}
                value={formData.borrowerType === "student" ? formData.studentId : formData.employeeId}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
              <button
                onClick={() => {
                  const id = formData.borrowerType === "student" ? formData.studentId : formData.employeeId
                  fetchIssuedBooks(id, formData.borrowerType)
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Fetch Issued Books
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Select Book to Renew</label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a book</option>
                {issuedBooks.map((book) => (
                  <option key={book.ACCNO} value={book.ACCNO}>
                    {book.bookTitle || 'Unknown'} - {book.ACCNO}
                  </option>
                ))}
              </select>
            </div>

            {selectedBookId && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Due Date</label>
                  <input
                    type="date"
                    name="newDueDate"
                    value={formData.newDueDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleRenewSubmit}
                    disabled={loading || !formData.newDueDate}
                    className={`px-4 py-2 text-white rounded ${loading || !formData.newDueDate
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                      }`}
                  >
                    {loading ? "Renewing..." : "Renew Book"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeForm === "lost" && (
        <>
          <h2 className="text-2xl font-bold mb-6">Lost Book Entry</h2>
          {loading && <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">Loading details...</div>}
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

          <form onSubmit={handleLostBookSubmit} className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Book Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scan Book Barcode</label>
                  <input
                    type="text"
                    name="ACCNO"
                    value={formData.ACCNO}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Scan or enter book barcode"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Book Title</label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Series Code</label>
                  <input
                    type="text"
                    name="SERIESCODE"
                    value={formData.SERIESCODE}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Class No</label>
                  <input
                    type="text"
                    name="CLASSNO"
                    value={formData.CLASSNO}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Publication Year</label>
                  <input
                    type="text"
                    name="PUB.YEAR"
                    value={formData["PUB.YEAR"]}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pages</label>
                  <input
                    type="text"
                    name="PAGES"
                    value={formData.PAGES}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Print Price</label>
                  <input
                    type="text"
                    name="PRINTPRICE"
                    value={formData.PRINTPRICE}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Price</label>
                  <input
                    type="text"
                    name="PURPRICE"
                    value={formData.PURPRICE}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    readOnly={!error?.includes("not found")}
                  />
                </div>
              </div>

              {error?.includes("not found") && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={saveNewBook}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save New Book
                  </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Lost Book Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Lost Date</label>
                  <input
                    type="date"
                    name="lostDate"
                    value={formData.lostDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lost Reason</label>
                  <select
                    name="lostReason"
                    value={formData.lostReason}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select reason</option>
                    <option value="misplaced">Misplaced</option>
                    <option value="damaged">Damaged</option>
                    <option value="stolen">Stolen</option>
                    <option value="torn">Torn/Destroyed</option>
                    <option value="water_damage">Water Damage</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Replacement Cost (₹)</label>
                  <input
                    type="number"
                    name="replacementCost"
                    value={formData.replacementCost}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Enter replacement cost"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea
                    name="lostRemarks"
                    value={formData.lostRemarks}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Additional remarks about the lost book"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Record Lost Book
              </button>
            </div>
          </form>
        </>
      )}

      {activeForm === "history" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6">Transaction History</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Borrower Type</label>
              <select
                value={filters.borrowerType || "all"}
                onChange={(e) => setFilters({ ...filters, borrowerType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="all">All</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {filters.borrowerType === "student" && (
              <div>
                <label className="block text-sm font-medium mb-1">Student ID</label>
                <input
                  type="text"
                  value={filters.studentId || ""}
                  onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter Student ID"
                />
              </div>
            )}

            {filters.borrowerType === "faculty" && (
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID</label>
                <input
                  type="text"
                  value={filters.employeeId || ""}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter Employee ID"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Search by ACCNO</label>
              <input
                type="text"
                value={filters.ACCNO}
                onChange={(e) => setFilters({ ...filters, ACCNO: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Book ACCNO"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Transaction Type</label>
              <select
                value={filters.transactionType || "all"}
                onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="all">All</option>
                <option value="issue">Issued</option>
                <option value="return">Returned</option>
                <option value="renew">Renewed</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between mb-6">
            <button onClick={fetchHistory} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Apply Filters
            </button>

            <button
              onClick={generateReport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={history.length === 0}
            >
              Generate PDF Report
            </button>
          </div>

          {loading && <div className="text-center p-4">Loading history...</div>}

          {!loading && history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">ACCNO</th>
                    <th className="py-2 px-4 border">Book Title</th>
                    <th className="py-2 px-4 border">Borrower Type</th>
                    <th className="py-2 px-4 border">ID</th>
                    <th className="py-2 px-4 border">Type</th>
                    <th className="py-2 px-4 border">Issued Date</th>
                    <th className="py-2 px-4 border">Due Date</th>
                    <th className="py-2 px-4 border">Return Date</th>
                    <th className="py-2 px-4 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border">{record.ACCNO || record.bookId || "N/A"}</td>
                      <td className="py-2 px-4 border">{record.bookTitle || "Unknown Title"}</td>
                      <td className="py-2 px-4 border">
                        {record.borrowerType === "student"
                          ? "Student"
                          : record.borrowerType === "faculty"
                            ? "Faculty"
                            : "Unknown"}
                      </td>
                      <td className="py-2 px-4 border">
                        {record.borrowerType === "student" ? record.studentId : record.employeeId || "N/A"}
                      </td>
                      <td className="py-2 px-4 border">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${record.transactionType === "issue"
                              ? "bg-blue-100 text-blue-800"
                              : record.transactionType === "return"
                                ? "bg-green-100 text-green-800"
                                : record.transactionType === "renew"
                                  ? "bg-purple-100 text-purple-800"
                                  : record.transactionType === "lost"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {(record.transactionType || "unknown").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-4 border">
                        {record.issueDate ? new Date(record.issueDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-2 px-4 border">
                        {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-2 px-4 border">
                        {record.actualReturnDate
                          ? new Date(record.actualReturnDate).toLocaleDateString()
                          : record.status === "returned" && record.returnDate
                            ? new Date(record.returnDate).toLocaleDateString()
                            : record.transactionType === "lost"
                              ? new Date(record.lostDate || record.createdAt).toLocaleDateString()
                              : "-"}
                      </td>
                      <td className="py-2 px-4 border">
                        {record.status === "active" ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">ACTIVE</span>
                        ) : record.status === "returned" ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">COMPLETED</span>
                        ) : record.transactionType === "lost" ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">LOST</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">UNKNOWN</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="text-center p-8 text-gray-500">{error || "No transaction history found"}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default BookActions
