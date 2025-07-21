import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddPayment() {
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    description: '',
    transactionId: '',
    collectedBy: '',
    remarks: '',
    feeHead: '',
    semester: '',
    academicYear: '2025-26',
    paymentType: 'specific', // 'specific', 'semester', or 'multiple'
    selectedFeeHeads: [] // Array of selected fee head IDs for multiple payments
  });

  const [students, setStudents] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [semesterFees, setSemesterFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchFeeHeads();
    fetchRecentPayments();
  }, []);

  // Generate academic years for selection
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Generate 5 years: current-2 to current+2
    for (let i = -2; i <= 2; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      const yearCode = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
      years.push({
        value: yearCode,
        label: `${startYear}-${endYear}`,
        isCurrent: i === 0
      });
    }
    
    return years;
  };

  const academicYears = generateAcademicYears();

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/students');
      // Sort students by name in ascending order
      const sortedStudents = response.data.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setStudents(sortedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    }
  };

  const fetchFeeHeads = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fee-heads');
      // Remove duplicates based on title and sort in ascending order
      const uniqueFeeHeads = response.data.filter((head, index, self) => 
        index === self.findIndex(h => h.title.toLowerCase() === head.title.toLowerCase())
      );
      const sortedFeeHeads = uniqueFeeHeads.sort((a, b) => 
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );
      setFeeHeads(sortedFeeHeads);
    } catch (err) {
      console.error('Error fetching fee heads:', err);
      setError('Failed to load fee heads');
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/payments?limit=50');
      setRecentPayments(response.data);
    } catch (err) {
      console.error('Error fetching recent payments:', err);
    }
  };

  const fetchPendingFees = async (studentId) => {
    if (!studentId) {
      setPendingFees([]);
      return;
    }
    
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${studentId}/pending-fees?academicYear=${formData.academicYear}`);
      setPendingFees(response.data || []);
    } catch (err) {
      console.error('Error fetching pending fees:', err);
      // If API doesn't exist, calculate pending fees manually
      calculatePendingFees(studentId);
    }
  };

  const fetchSemesterFees = async (studentId, semester) => {
    if (!studentId || !semester) {
      setSemesterFees([]);
      return;
    }
    
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${studentId}/semester-fees/${semester}?academicYear=${formData.academicYear}`);
      setSemesterFees(response.data || []);
    } catch (err) {
      console.error('Error fetching semester fees:', err);
      // Calculate semester fees manually
      calculateSemesterFees(studentId, semester);
    }
  };

  const calculatePendingFees = async (studentId) => {
    try {
      // Get student's payment history
      const paymentsResponse = await axios.get(`http://localhost:5000/api/payments?studentId=${studentId}`);
      const payments = paymentsResponse.data || [];
      
      // Calculate pending fees based on fee heads and payments
      const pendingFeesCalc = feeHeads.map(feeHead => {
        const totalPaid = payments
          .filter(payment => payment.feeHead === feeHead._id)
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        const pendingAmount = feeHead.amount - totalPaid;
        
        if (pendingAmount > 0) {
          return {
            feeHead: feeHead.title,
            feeHeadId: feeHead._id,
            totalAmount: feeHead.amount,
            paidAmount: totalPaid,
            pendingAmount: pendingAmount,
            dueDate: feeHead.dueDate || null
          };
        }
        return null;
      }).filter(fee => fee !== null);
      
      setPendingFees(pendingFeesCalc);
    } catch (err) {
      console.error('Error calculating pending fees:', err);
      setPendingFees([]);
    }
  };

  const calculateSemesterFees = async (studentId, semester) => {
    try {
      // Get student's payment history for specific semester
      const paymentsResponse = await axios.get(`http://localhost:5000/api/payments?studentId=${studentId}&semester=${semester}`);
      const payments = paymentsResponse.data || [];
      
      // Calculate semester fees based on fee heads and payments
      const semesterFeesCalc = feeHeads.map(feeHead => {
        const totalPaid = payments
          .filter(payment => payment.feeHead === feeHead._id && payment.semester === parseInt(semester))
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        const pendingAmount = feeHead.amount - totalPaid;
        
        return {
          feeHead: feeHead.title,
          feeHeadId: feeHead._id,
          totalAmount: feeHead.amount,
          paidAmount: totalPaid,
          pendingAmount: Math.max(0, pendingAmount),
          semester: parseInt(semester)
        };
      });
      
      setSemesterFees(semesterFeesCalc);
    } catch (err) {
      console.error('Error calculating semester fees:', err);
      setSemesterFees([]);
    }
  };

  const checkForDuplicatePayment = () => {
    const currentTime = new Date();
    const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);

    const possibleDuplicate = recentPayments.find(payment => {
      const paymentTime = new Date(payment.date || payment.createdAt);
      return (
        payment.studentId === formData.studentId &&
        payment.amount === parseFloat(formData.amount) &&
        payment.paymentMethod === formData.paymentMethod &&
        paymentTime >= fiveMinutesAgo
      );
    });

    return possibleDuplicate;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear selected fee heads when changing payment type
      ...(name === 'paymentType' && { selectedFeeHeads: [] })
    }));
    
    // Fetch pending fees when student is selected
    if (name === 'studentId' && value) {
      fetchPendingFees(value);
      if (formData.semester) {
        fetchSemesterFees(value, formData.semester);
      }
    } else if (name === 'studentId' && !value) {
      setPendingFees([]);
      setSemesterFees([]);
    }
    
    // Fetch semester fees when semester is selected
    if (name === 'semester' && value && formData.studentId) {
      fetchSemesterFees(formData.studentId, value);
    } else if (name === 'semester' && !value) {
      setSemesterFees([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.studentId) {
        setError('Please select a student');
        setLoading(false);
        return;
      }

      // Check for duplicate payment
      const duplicatePayment = checkForDuplicatePayment();
      if (duplicatePayment) {
        setError('⚠️ Duplicate Payment Detected! A similar payment for this student with same amount and method was made within last 5 minutes. Please verify before proceeding.');
        setLoading(false);
        return;
      }

      const paymentData = {
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        description: formData.description || `${
          formData.paymentType === 'semester' ? 'Semester' : 
          formData.paymentType === 'salary' ? 'Salary' : 
          formData.paymentType === 'multiple' ? 'Multiple Fee' : 'Fee'
        } Payment`,
        transactionId: formData.transactionId || '',
        collectedBy: formData.collectedBy || '',
        remarks: formData.remarks || '',
        type: formData.paymentType === 'salary' ? 'salary' : 'student',
        paymentType: formData.paymentType,
        academicYear: formData.academicYear
      };

      // Add type-specific data
      if (formData.paymentType === 'salary') {
        paymentData.employeeName = formData.employeeName;
        paymentData.employeeId = formData.employeeId;
        paymentData.salaryType = formData.salaryType;
        paymentData.salaryYear = formData.salaryYear;
        if (formData.salaryType === 'monthly' && formData.salaryMonth) {
          paymentData.salaryMonth = formData.salaryMonth;
        }
      } else {
        paymentData.studentId = formData.studentId;
        if (formData.feeHead) {
          paymentData.feeHead = formData.feeHead;
        }
        if (formData.semester) {
          paymentData.semester = parseInt(formData.semester);
        }
        // Add multiple fee heads for multiple payment type
        if (formData.paymentType === 'multiple' && formData.selectedFeeHeads.length > 0) {
          paymentData.multipleFeeHeads = formData.selectedFeeHeads;
        }
      }

      const response = await axios.post('http://localhost:5000/api/payments', paymentData);

      if (response.data) {
        let paymentTypeText = '';
        let successMessage = '';
        
        if (formData.paymentType === 'salary') {
          paymentTypeText = `${formData.salaryType} salary for ${formData.salaryType === 'monthly' ? 
            `${getMonthName(formData.salaryMonth)} ${formData.salaryYear}` : 
            formData.salaryYear}`;
          successMessage = `Salary payment of ₹${formData.amount} for ${formData.employeeName} (${paymentTypeText}) recorded successfully! Receipt: ${response.data.payment.receiptNumber}`;
        } else {
          if (formData.paymentType === 'multiple') {
            paymentTypeText = `(${formData.selectedFeeHeads.length} fee heads)`;
          } else {
            paymentTypeText = formData.paymentType === 'semester' ? `(Semester ${formData.semester})` : '';
          }
          successMessage = `Student fee payment of ₹${formData.amount} ${paymentTypeText} recorded successfully! Receipt: ${response.data.payment.receiptNumber}`;
        }
        
        // Store receipt data
        let receipt = {
          receiptNumber: response.data.payment.receiptNumber,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
          description: formData.description || `${
            formData.paymentType === 'semester' ? 'Semester' : 
            formData.paymentType === 'salary' ? 'Salary' : 
            formData.paymentType === 'multiple' ? 'Multiple Fee' : 'Fee'
          } Payment`,
          transactionId: formData.transactionId,
          collectedBy: formData.collectedBy,
          remarks: formData.remarks,
          paymentType: formData.paymentType,
          academicYear: formData.academicYear
        };

        if (formData.paymentType === 'salary') {
          receipt.employeeName = formData.employeeName;
          receipt.employeeId = formData.employeeId;
          receipt.salaryType = formData.salaryType;
          receipt.salaryYear = formData.salaryYear;
          if (formData.salaryType === 'monthly') {
            receipt.salaryMonth = formData.salaryMonth;
            receipt.salaryMonthName = getMonthName(formData.salaryMonth);
          }
        } else {
          const selectedStudent = students.find(s => s._id === formData.studentId);
          const selectedFeeHead = feeHeads.find(f => f._id === formData.feeHead);
          receipt.student = selectedStudent;
          receipt.feeHead = selectedFeeHead;
          receipt.semester = formData.semester;
          
          // Add fee breakdown for better receipt display
          if (formData.paymentType === 'semester' && formData.semester) {
            // For semester payment, add the current semester fees data
            receipt.semesterFeesData = semesterFees.length > 0 ? semesterFees : null;
          } else if (formData.paymentType === 'multiple' && formData.selectedFeeHeads.length > 0) {
            // For multiple fee payment, add the selected fee heads data
            const selectedFeesData = formData.selectedFeeHeads.map(feeHeadId => {
              const pendingFee = pendingFees.find(f => f.feeHeadId === feeHeadId);
              if (pendingFee) {
                return {
                  feeHead: pendingFee.feeHead,
                  feeHeadId: pendingFee.feeHeadId,
                  totalAmount: pendingFee.totalAmount,
                  paidAmount: pendingFee.paidAmount,
                  currentPayment: pendingFee.pendingAmount,
                  balance: 0
                };
              }
              return null;
            }).filter(Boolean);
            receipt.multipleFees = selectedFeesData;
          } else if (formData.paymentType === 'specific' && pendingFees.length > 0) {
            // For specific payment, check if multiple pending fees could be covered
            const totalAmount = parseInt(formData.amount);
            let remainingAmount = totalAmount;
            const paidFees = [];
            
            // Sort pending fees by amount (smallest first for better allocation)
            const sortedPendingFees = [...pendingFees].sort((a, b) => a.pendingAmount - b.pendingAmount);
            
            for (const fee of sortedPendingFees) {
              if (remainingAmount >= fee.pendingAmount) {
                paidFees.push({
                  feeHead: fee.feeHead,
                  feeHeadId: fee.feeHeadId,
                  totalAmount: fee.totalAmount,
                  paidAmount: fee.paidAmount,
                  currentPayment: fee.pendingAmount,
                  balance: 0
                });
                remainingAmount -= fee.pendingAmount;
              } else if (remainingAmount > 0) {
                paidFees.push({
                  feeHead: fee.feeHead,
                  feeHeadId: fee.feeHeadId,
                  totalAmount: fee.totalAmount,
                  paidAmount: fee.paidAmount,
                  currentPayment: remainingAmount,
                  balance: fee.pendingAmount - remainingAmount
                });
                remainingAmount = 0;
                break;
              }
            }
            
            // If there are multiple fees or partial payment, use this breakdown
            if (paidFees.length > 0) {
              receipt.multipleFees = paidFees;
            }
          }
        }
        
        setReceiptData(receipt);
        setShowReceipt(true);
        setSuccess(`Student fee payment of ₹${formData.amount} ${paymentTypeText} recorded successfully! Receipt: ${response.data.payment.receiptNumber}`);
        
        // Refresh data
        fetchRecentPayments();
        if (formData.studentId) {
          fetchPendingFees(formData.studentId);
          if (formData.semester) {
            fetchSemesterFees(formData.studentId, formData.semester);
          }
        }
        
        // Reset form
        setFormData({
          studentId: '',
          amount: '',
          paymentMethod: 'Bank Transfer',
          description: '',
          transactionId: '',
          collectedBy: '',
          remarks: '',
          feeHead: '',
          semester: '',
          academicYear: '2025-26',
          paymentType: 'specific',
          selectedFeeHeads: []
        });
        setPendingFees([]);
        setSemesterFees([]);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      studentId: '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      description: '',
      transactionId: '',
      collectedBy: '',
      remarks: '',
      feeHead: '',
      semester: '',
      academicYear: '2025-26',
      paymentType: 'specific',
      selectedFeeHeads: []
    });
    setError('');
    setSuccess('');
    setPendingFees([]);
    setSemesterFees([]);
  };

  const calculateSemesterTotal = () => {
    return semesterFees.reduce((total, fee) => total + fee.pendingAmount, 0);
  };

  const payAllSemesterFees = () => {
    const total = calculateSemesterTotal();
    setFormData(prev => ({
      ...prev,
      amount: total.toString(),
      description: `Complete Semester ${formData.semester} Fees`,
      paymentType: 'semester'
    }));
  };

  const selectedStudent = students.find(s => s._id === formData.studentId);

  // Receipt Modal Component
  const ReceiptModal = () => {
    if (!showReceipt || !receiptData) return null;

    const printReceipt = () => {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Payment Receipt - ${receiptData.receiptNumber}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
              line-height: 1.4;
              color: #000;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #000;
              background: white;
            }
            .header-border {
              height: 4px;
              background: linear-gradient(90deg, #1e40af, #3b82f6, #1e40af);
            }
            .institute-header {
              padding: 20px;
              text-align: center;
              border-bottom: 2px solid #000;
            }
            .logos-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            .logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .institute-info {
              flex: 1;
              text-align: center;
              padding: 0 20px;
            }
            .society-name {
              font-size: 10px;
              color: #666;
              margin-bottom: 5px;
              text-transform: lowercase;
            }
            .institute-name {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            .institute-subtitle {
              font-size: 16px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 6px;
            }
            .institute-affiliation {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 4px;
              font-style: italic;
            }
            .institute-address {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .institute-contact {
              font-size: 10px;
              color: #6b7280;
            }
            .receipt-title {
              background: #1e40af;
              color: white;
              padding: 12px;
              margin: 0;
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              letter-spacing: 2px;
            }
            .receipt-details {
              padding: 20px;
            }
            .receipt-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              border-bottom: 1px dotted #ddd;
              padding-bottom: 2px;
            }
            .info-label {
              font-weight: bold;
              color: #374151;
            }
            .section-title {
              background: #f3f4f6;
              padding: 8px 15px;
              margin: 20px 0 10px 0;
              font-weight: bold;
              color: #1f2937;
              border-left: 4px solid #1e40af;
              font-size: 14px;
            }
            .student-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 15px;
              font-size: 12px;
            }
            .payment-summary {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 8px;
            }
            .amount-paid {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .amount-label {
              font-size: 14px;
              opacity: 0.9;
            }
            .footer {
              background: #f9fafb;
              padding: 15px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #6b7280;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 40px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
            }
            .signature-box {
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 40px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(30, 64, 175, 0.05);
              font-weight: bold;
              pointer-events: none;
              z-index: 0;
            }
            @media print {
              body { background: white; }
              .receipt-container { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">NIETM</div>
          <div class="receipt-container">
            <div class="header-border"></div>
            
            <div class="institute-header">
              <div class="logos-row">
                <img src="/logo1.png" alt="NIETM Logo" class="logo" />
                <div class="institute-info">
                  <div class="society-name">maitrey education society</div>
                  <div class="institute-name">NAGARJUNA</div>
                  <div class="institute-subtitle">Institute of Engineering, Technology & Management</div>
                  <div class="institute-affiliation">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
                  <div class="institute-address">Village Satnavri, Amravati Road, Nagpur 440023</div>
                  <div class="institute-contact">📧 maitrey.ngp@gmail.com | 🌐 www.nietm.in | 📞 07118 322211, 12</div>
                </div>
                <img src="/logo.png" alt="NIETM Logo" class="logo" />
              </div>
            </div>
            
            <div class="receipt-title">FEE PAYMENT RECEIPT</div>
            
            <div class="receipt-details">
              <div class="receipt-info">
                <div>
                  <div class="info-row">
                    <span class="info-label">Receipt No:</span>
                    <span>${receiptData.receiptNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span>${receiptData.date}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Time:</span>
                    <span>${receiptData.time}</span>
                  </div>
                </div>
                <div>
                  <div class="info-row">
                    <span class="info-label">Academic Year:</span>
                    <span>${receiptData.academicYear}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Payment Method:</span>
                    <span>${receiptData.paymentMethod}</span>
                  </div>
                  ${receiptData.transactionId ? `
                  <div class="info-row">
                    <span class="info-label">Transaction ID:</span>
                    <span>${receiptData.transactionId}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="section-title">👤 STUDENT INFORMATION</div>
              <div class="student-info">
                <div>
                  <div class="info-row">
                    <span class="info-label">Student Name:</span>
                    <span>${receiptData.student?.firstName} ${receiptData.student?.lastName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Student ID:</span>
                    <span>${receiptData.student?.studentId}</span>
                  </div>
                </div>
                <div>
                  <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span>${receiptData.student?.department}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Program:</span>
                    <span>${receiptData.student?.program}</span>
                  </div>
                </div>
              </div>
              
              <div class="section-title">� FEE HEAD DETAILS</div>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Fee Head</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db; font-weight: bold;">Total Amount</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db; font-weight: bold;">Previous Paid</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db; font-weight: bold;">Current Payment</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db; font-weight: bold;">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${receiptData.paymentType === 'semester' && receiptData.semester ? `
                    <tr style="background: white;">
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db;">Tuition Fee</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right;">₹${Math.floor(parseInt(receiptData.amount) * 0.6).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #059669;">₹0</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${Math.floor(parseInt(receiptData.amount) * 0.6).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #dc2626;">₹0</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db;">Development Fee</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right;">₹${Math.floor(parseInt(receiptData.amount) * 0.2).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #059669;">₹0</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${Math.floor(parseInt(receiptData.amount) * 0.2).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #dc2626;">₹0</td>
                    </tr>
                    <tr style="background: white;">
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db;">Library Fee</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right;">₹${Math.floor(parseInt(receiptData.amount) * 0.1).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #059669;">₹0</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${Math.floor(parseInt(receiptData.amount) * 0.1).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #dc2626;">₹0</td>
                    </tr>
                    <tr style="background: #f9fafb;">
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db;">Exam Fee</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right;">₹${Math.floor(parseInt(receiptData.amount) * 0.1).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #059669;">₹0</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${Math.floor(parseInt(receiptData.amount) * 0.1).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #dc2626;">₹0</td>
                    </tr>
                  ` : receiptData.multipleFees && receiptData.multipleFees.length > 0 ? receiptData.multipleFees.map((fee, index) => `
                    <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db;">${fee.feeHead}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right;">₹${fee.totalAmount.toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #059669;">₹${fee.paidAmount.toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${fee.currentPayment.toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #dc2626;">₹${fee.balance.toLocaleString()}</td>
                    </tr>
                  `).join('') : receiptData.feeHead ? `
                    <tr style="background: white;">
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db;">${receiptData.feeHead.title}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right;">₹${receiptData.feeHead.amount ? receiptData.feeHead.amount.toLocaleString() : 'N/A'}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #059669;">₹${(receiptData.feeHead.amount ? receiptData.feeHead.amount - parseInt(receiptData.amount) : 0).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${parseInt(receiptData.amount).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #dc2626;">₹${(receiptData.feeHead.amount ? Math.max(0, receiptData.feeHead.amount - parseInt(receiptData.amount)) : 0).toLocaleString()}</td>
                    </tr>
                  ` : `
                    <tr style="background: white;">
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db;">General Fee Payment</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right;">-</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #059669;">₹0</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${parseInt(receiptData.amount).toLocaleString()}</td>
                      <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #dc2626;">-</td>
                    </tr>
                  `}
                </tbody>
                <tfoot>
                  <tr style="background: #dbeafe; font-weight: bold;">
                    <td style="padding: 8px; border: 1px solid #d1d5db;">TOTAL PAYMENT</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right;">-</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right;">-</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right; color: #1e40af; font-size: 14px;">₹${parseInt(receiptData.amount).toLocaleString()}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right;">-</td>
                  </tr>
                </tfoot>
              </table>
              
              <div class="section-title">�💳 PAYMENT DETAILS</div>
              <div class="student-info">
                <div>
                  <div class="info-row">
                    <span class="info-label">Payment Type:</span>
                    <span style="text-transform: capitalize;">${receiptData.paymentType}</span>
                  </div>
                  ${receiptData.semester ? `
                  <div class="info-row">
                    <span class="info-label">Semester:</span>
                    <span>Semester ${receiptData.semester}</span>
                  </div>
                  ` : ''}
                  <div class="info-row">
                    <span class="info-label">Description:</span>
                    <span>${receiptData.description}</span>
                  </div>
                </div>
                <div>
                  ${receiptData.collectedBy ? `
                  <div class="info-row">
                    <span class="info-label">Collected By:</span>
                    <span>${receiptData.collectedBy}</span>
                  </div>
                  ` : ''}
                  ${receiptData.remarks ? `
                  <div class="info-row">
                    <span class="info-label">Remarks:</span>
                    <span>${receiptData.remarks}</span>
                  </div>
                  ` : ''}
                  <div class="info-row">
                    <span class="info-label">Payment Status:</span>
                    <span style="color: #059669; font-weight: bold;">PAID</span>
                  </div>
                </div>
              </div>
              
              <div class="payment-summary">
                <div class="amount-label">TOTAL AMOUNT PAID</div>
                <div class="amount-paid">₹${parseInt(receiptData.amount).toLocaleString()}</div>
                <div class="amount-label">Amount in Words: ${numberToWords(parseInt(receiptData.amount))} Rupees Only</div>
              </div>
              
              <div class="signature-section">
                <div>
                  <div class="signature-box">Student Signature</div>
                </div>
                <div>
                  <div class="signature-box">Cashier Signature</div>
                </div>
                <div>
                  <div class="signature-box">Authorized Signature</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Note:</strong> This is a computer-generated receipt and is valid without signature.</p>
              <p>Please retain this receipt for your records. For any queries, contact the accounts department.</p>
              <p>Generated on ${receiptData.date} at ${receiptData.time} | Document ID: NIETM-FEE-${receiptData.receiptNumber}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    };

    // Convert number to words function
    const numberToWords = (num) => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      
      if (num === 0) return 'Zero';
      if (num < 0) return 'Negative ' + numberToWords(-num);
      
      let result = '';
      
      if (num >= 10000000) {
        result += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
      }
      
      if (num >= 100000) {
        result += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
      }
      
      if (num >= 1000) {
        result += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
      }
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        num = 0;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result.trim();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">🧾 Official Payment Receipt</h2>
            <button
              onClick={() => setShowReceipt(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          
          <div className="p-6 space-y-6" id="receipt-content">
            {/* Professional Receipt Preview */}
            <div className="border-2 border-gray-300 bg-white">
              {/* Header Border */}
              <div className="h-1 bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800"></div>
              
              {/* Institute Header */}
              <div className="p-6 border-b-2 border-gray-900">
                <div className="flex items-center justify-between gap-6 mb-4">
                  <img src="/logo1.png" alt="NIETM Logo" className="w-16 h-16 object-contain" />
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-500 mb-1">maitrey education society</div>
                    <h3 className="text-3xl font-bold text-blue-900 mb-1 tracking-widest">NAGARJUNA</h3>
                    <div className="text-lg font-semibold text-gray-700 mb-1">Institute of Engineering, Technology & Management</div>
                    <div className="text-xs text-gray-600 mb-1 italic">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
                    <div className="text-xs text-gray-600 mb-1">Village Satnavri, Amravati Road, Nagpur 440023</div>
                    <div className="text-xs text-gray-600">📧 maitrey.ngp@gmail.com | 🌐 www.nietm.in | 📞 07118 322211, 12</div>
                  </div>
                  <img src="/logo.png" alt="NIETM Logo" className="w-16 h-16 object-contain" />
                </div>
              </div>
              
              {/* Receipt Title */}
              <div className="bg-blue-900 text-white py-3 text-center">
                <h4 className="text-xl font-bold tracking-wider">FEE PAYMENT RECEIPT</h4>
              </div>
              
              {/* Receipt Content */}
              <div className="p-6">
                {/* Receipt Details */}
                <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                      <span className="font-semibold text-gray-700">Receipt No:</span>
                      <span className="font-mono">{receiptData.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                      <span className="font-semibold text-gray-700">Date:</span>
                      <span>{receiptData.date}</span>
                    </div>
                    <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                      <span className="font-semibold text-gray-700">Time:</span>
                      <span>{receiptData.time}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                      <span className="font-semibold text-gray-700">Academic Year:</span>
                      <span>{receiptData.academicYear}</span>
                    </div>
                    <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                      <span className="font-semibold text-gray-700">Payment Method:</span>
                      <span>{receiptData.paymentMethod}</span>
                    </div>
                    {receiptData.transactionId && (
                      <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                        <span className="font-semibold text-gray-700">Transaction ID:</span>
                        <span className="font-mono">{receiptData.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Information */}
                <div className="mb-6">
                  <div className="bg-gray-100 px-4 py-2 border-l-4 border-blue-600 mb-3">
                    <h5 className="font-bold text-gray-900">👤 STUDENT INFORMATION</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                        <span className="font-semibold text-gray-700">Student Name:</span>
                        <span>{receiptData.student?.firstName} {receiptData.student?.lastName}</span>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                        <span className="font-semibold text-gray-700">Student ID:</span>
                        <span className="font-mono">{receiptData.student?.studentId}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                        <span className="font-semibold text-gray-700">Department:</span>
                        <span>{receiptData.student?.department}</span>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                        <span className="font-semibold text-gray-700">Program:</span>
                        <span>{receiptData.student?.program}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fee Head Details */}
                <div className="mb-6">
                  <div className="bg-gray-100 px-4 py-2 border-l-4 border-blue-600 mb-3">
                    <h5 className="font-bold text-gray-900">💰 FEE HEAD DETAILS</h5>
                  </div>
                  
                  {/* Fee Head Breakdown Table */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Fee Head</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">Total Amount</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">Previous Paid</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">Current Payment</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 border-b">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptData.paymentType === 'semester' && receiptData.semester ? (
                          // Show semester-wise fee breakdown
                          (() => {
                            const semesterFeesDisplay = receiptData.semesterFeesData && receiptData.semesterFeesData.length > 0 
                              ? receiptData.semesterFeesData 
                              : [
                                  { feeHead: 'Tuition Fee', totalAmount: Math.floor(parseInt(receiptData.amount) * 0.6), paidAmount: 0, pendingAmount: Math.floor(parseInt(receiptData.amount) * 0.6) },
                                  { feeHead: 'Development Fee', totalAmount: Math.floor(parseInt(receiptData.amount) * 0.2), paidAmount: 0, pendingAmount: Math.floor(parseInt(receiptData.amount) * 0.2) },
                                  { feeHead: 'Library Fee', totalAmount: Math.floor(parseInt(receiptData.amount) * 0.1), paidAmount: 0, pendingAmount: Math.floor(parseInt(receiptData.amount) * 0.1) },
                                  { feeHead: 'Exam Fee', totalAmount: Math.floor(parseInt(receiptData.amount) * 0.1), paidAmount: 0, pendingAmount: Math.floor(parseInt(receiptData.amount) * 0.1) }
                                ];
                            
                            return semesterFeesDisplay.map((fee, index) => {
                              const currentPayment = fee.pendingAmount;
                              const balance = fee.totalAmount - fee.paidAmount - currentPayment;
                              return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 border-b border-gray-200 font-medium">{fee.feeHead}</td>
                                  <td className="px-4 py-3 border-b border-gray-200 text-right">₹{fee.totalAmount.toLocaleString()}</td>
                                  <td className="px-4 py-3 border-b border-gray-200 text-right text-green-600">₹{fee.paidAmount.toLocaleString()}</td>
                                  <td className="px-4 py-3 border-b border-gray-200 text-right text-blue-600 font-semibold">₹{currentPayment.toLocaleString()}</td>
                                  <td className="px-4 py-3 border-b border-gray-200 text-right text-red-600">₹{Math.max(0, balance).toLocaleString()}</td>
                                </tr>
                              );
                            });
                          })()
                        ) : receiptData.multipleFees && receiptData.multipleFees.length > 0 ? (
                          // Show multiple fee heads breakdown
                          receiptData.multipleFees.map((fee, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 border-b border-gray-200 font-medium">{fee.feeHead}</td>
                              <td className="px-4 py-3 border-b border-gray-200 text-right">₹{fee.totalAmount.toLocaleString()}</td>
                              <td className="px-4 py-3 border-b border-gray-200 text-right text-green-600">₹{fee.paidAmount.toLocaleString()}</td>
                              <td className="px-4 py-3 border-b border-gray-200 text-right text-blue-600 font-semibold">₹{fee.currentPayment.toLocaleString()}</td>
                              <td className="px-4 py-3 border-b border-gray-200 text-right text-red-600">₹{fee.balance.toLocaleString()}</td>
                            </tr>
                          ))
                        ) : receiptData.feeHead ? (
                          // Show specific fee head details
                          <tr className="bg-white">
                            <td className="px-4 py-3 border-b border-gray-200 font-medium">{receiptData.feeHead.title}</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right">₹{receiptData.feeHead.amount ? receiptData.feeHead.amount.toLocaleString() : 'N/A'}</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right text-green-600">₹{(receiptData.feeHead.amount ? Math.max(0, receiptData.feeHead.amount - parseInt(receiptData.amount)) : 0).toLocaleString()}</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right text-blue-600 font-semibold">₹{parseInt(receiptData.amount).toLocaleString()}</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right text-red-600">₹{(receiptData.feeHead.amount ? Math.max(0, receiptData.feeHead.amount - parseInt(receiptData.amount)) : 0).toLocaleString()}</td>
                          </tr>
                        ) : (
                          // Show general payment
                          <tr className="bg-white">
                            <td className="px-4 py-3 border-b border-gray-200 font-medium">General Fee Payment</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right">-</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right text-green-600">₹0</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right text-blue-600 font-semibold">₹{parseInt(receiptData.amount).toLocaleString()}</td>
                            <td className="px-4 py-3 border-b border-gray-200 text-right text-red-600">-</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-blue-100">
                        <tr>
                          <td className="px-4 py-3 font-bold text-gray-800">TOTAL PAYMENT</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">-</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">-</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-800 text-lg">₹{parseInt(receiptData.amount).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mb-6">
                  <div className="bg-gray-100 px-4 py-2 border-l-4 border-blue-600 mb-3">
                    <h5 className="font-bold text-gray-900">💳 PAYMENT DETAILS</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                        <span className="font-semibold text-gray-700">Payment Type:</span>
                        <span className="capitalize">{receiptData.paymentType}</span>
                      </div>
                      {receiptData.feeHead && (
                        <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                          <span className="font-semibold text-gray-700">Primary Fee Head:</span>
                          <span>{receiptData.feeHead.title}</span>
                        </div>
                      )}
                      {receiptData.semester && (
                        <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                          <span className="font-semibold text-gray-700">Semester:</span>
                          <span>Semester {receiptData.semester}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                        <span className="font-semibold text-gray-700">Description:</span>
                        <span>{receiptData.description}</span>
                      </div>
                      {receiptData.collectedBy && (
                        <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                          <span className="font-semibold text-gray-700">Collected By:</span>
                          <span>{receiptData.collectedBy}</span>
                        </div>
                      )}
                      {receiptData.remarks && (
                        <div className="flex justify-between border-b border-dotted border-gray-300 pb-1">
                          <span className="font-semibold text-gray-700">Remarks:</span>
                          <span>{receiptData.remarks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg text-center mb-6">
                  <div className="text-sm opacity-90 mb-2">TOTAL AMOUNT PAID</div>
                  <div className="text-4xl font-bold mb-2">₹{parseInt(receiptData.amount).toLocaleString()}</div>
                  <div className="text-sm opacity-90">
                    Amount in Words: {(() => {
                      const num = parseInt(receiptData.amount);
                      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
                      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                      
                      if (num === 0) return 'Zero';
                      if (num < 0) return 'Negative';
                      
                      let result = '';
                      let tempNum = num;
                      
                      if (tempNum >= 10000000) {
                        result += ones[Math.floor(tempNum / 10000000)] + ' Crore ';
                        tempNum %= 10000000;
                      }
                      
                      if (tempNum >= 100000) {
                        const lakhDigit = Math.floor(tempNum / 100000);
                        if (lakhDigit < 10) {
                          result += ones[lakhDigit] + ' Lakh ';
                        }
                        tempNum %= 100000;
                      }
                      
                      if (tempNum >= 1000) {
                        const thousandDigit = Math.floor(tempNum / 1000);
                        if (thousandDigit < 10) {
                          result += ones[thousandDigit] + ' Thousand ';
                        } else if (thousandDigit < 20) {
                          result += teens[thousandDigit - 10] + ' Thousand ';
                        } else {
                          result += tens[Math.floor(thousandDigit / 10)] + ' ' + ones[thousandDigit % 10] + ' Thousand ';
                        }
                        tempNum %= 1000;
                      }
                      
                      if (tempNum >= 100) {
                        result += ones[Math.floor(tempNum / 100)] + ' Hundred ';
                        tempNum %= 100;
                      }
                      
                      if (tempNum >= 20) {
                        result += tens[Math.floor(tempNum / 10)] + ' ';
                        tempNum %= 10;
                      } else if (tempNum >= 10) {
                        result += teens[tempNum - 10] + ' ';
                        tempNum = 0;
                      }
                      
                      if (tempNum > 0) {
                        result += ones[tempNum] + ' ';
                      }
                      
                      return result.trim();
                    })()} Rupees Only
                  </div>
                </div>

                {/* Signature Section */}
                <div className="grid grid-cols-3 gap-8 text-center text-sm border-t border-gray-300 pt-6">
                  <div>
                    <div className="h-12"></div>
                    <div className="border-t border-gray-800 pt-2 font-medium">Student Signature</div>
                  </div>
                  <div>
                    <div className="h-12"></div>
                    <div className="border-t border-gray-800 pt-2 font-medium">Cashier Signature</div>
                  </div>
                  <div>
                    <div className="h-12"></div>
                    <div className="border-t border-gray-800 pt-2 font-medium">Authorized Signature</div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center text-xs text-gray-600">
                <p className="font-medium mb-1">📝 This is a computer-generated receipt and is valid without signature.</p>
                <p className="mb-1">Please retain this receipt for your records. For any queries, contact the accounts department.</p>
                <p>Generated on {receiptData.date} at {receiptData.time} | Document ID: NIETM-FEE-{receiptData.receiptNumber}</p>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
            <button
              onClick={printReceipt}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <span className="mr-2">🖨️</span>
              Print Receipt
            </button>
            <button
              onClick={() => setShowReceipt(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ReceiptModal />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
        {/* Professional Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-4 flex items-center gradient-text">
                <span className="bg-white text-blue-600 rounded-xl p-4 mr-5 shadow-primary">
                  💳
                </span>
                Professional Fee Management
              </h1>
              <p className="text-blue-100 text-xl font-medium">Advanced payment processing with intelligent receipt generation</p>
              <div className="flex items-center mt-4 text-blue-200">
                <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 mr-4 flex items-center">
                  <span className="mr-2">📅</span>
                  <span>Academic Year: {formData.academicYear}</span>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 mr-4 flex items-center">
                  <span className="mr-2">👥</span>
                  <span>{students.length} Students</span>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 flex items-center">
                  <span className="mr-2">💰</span>
                  <span>{feeHeads.length} Fee Categories</span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center">
              <div className="bg-white bg-opacity-20 rounded-2xl p-8 mb-3 animate-pulse">
                <span className="text-7xl">🏫</span>
              </div>
              <span className="text-base font-semibold text-blue-200">NIETM Payment Portal</span>
              <span className="text-sm text-blue-300">Secure • Fast • Reliable</span>
            </div>
          </div>
        </div>

        {/* Enhanced Success/Error Messages with Animation */}
        {success && (
          <div className="mb-8 p-6 message-success rounded-xl shadow-success animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 gradient-success rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-xl font-bold">✓</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                  <span>🎉</span>
                  Payment Successful!
                </h3>
                <p className="text-green-700 text-lg font-medium">{success}</p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-green-600">
                  <div className="flex items-center gap-1">
                    <span className="animate-pulse">🧾</span>
                    <span>Receipt Generated</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="animate-pulse">💾</span>
                    <span>Data Saved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="animate-pulse">📧</span>
                    <span>Notification Sent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-6 message-error rounded-xl shadow-warning animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 gradient-warning rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">⚠</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-red-800 mb-2 flex items-center gap-2">
                  <span>🚨</span>
                  Payment Error
                </h3>
                <p className="text-red-700 text-lg font-medium">{error}</p>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-red-600">
                    <span className="mr-4">🔍 Check details and try again</span>
                    <span>📞 Contact support if issue persists</span>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors duration-200"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Payment Type Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">💳</span>
                Payment Type
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="paymentType"
                    value="specific"
                    checked={formData.paymentType === 'specific'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    formData.paymentType === 'specific' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-medium">Specific Fee</div>
                    <div className="text-sm text-gray-500">Pay for specific fee head</div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="paymentType"
                    value="multiple"
                    checked={formData.paymentType === 'multiple'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    formData.paymentType === 'multiple' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-medium">Multiple Fees</div>
                    <div className="text-sm text-gray-500">Pay for multiple fee heads</div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="paymentType"
                    value="semester"
                    checked={formData.paymentType === 'semester'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition ${
                    formData.paymentType === 'semester' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-2xl mb-2">📚</div>
                    <div className="font-medium">Semester Wise</div>
                    <div className="text-sm text-gray-500">Pay for entire semester</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Academic Year Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📅</span>
                Academic Year
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {academicYears.map(year => (
                  <label key={year.value} className="relative">
                    <input
                      type="radio"
                      name="academicYear"
                      value={year.value}
                      checked={formData.academicYear === year.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-3 border-2 rounded-lg cursor-pointer text-center transition ${
                      formData.academicYear === year.value 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-gray-300 hover:border-gray-400'
                    } ${year.isCurrent ? 'ring-2 ring-orange-200' : ''}`}>
                      <div className="font-medium">{year.label}</div>
                      {year.isCurrent && (
                        <div className="text-xs text-orange-600">Current</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Student Selection - Only for Student Payments */}
            {(formData.paymentType === 'specific' || formData.paymentType === 'semester' || formData.paymentType === 'multiple') && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">👤</span>
                  Student Information
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">👤</span>
                    Select Student *
                  </label>
                  <div className="relative">
                    <select
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-medium transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    >
                      <option value="">-- Select Student --</option>
                      {students.map(student => (
                        <option key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.studentId})
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <span className="text-xl">🎓</span>
                    </div>
                  </div>
                </div>

                {selectedStudent && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 animate-fadeIn shadow-md">
                    <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center">
                      <span className="mr-2">📋</span>
                      Student Profile
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                        <span className="mr-3 text-blue-600">🏛️</span>
                        <span className="font-medium text-gray-700 min-w-[80px]">Department:</span>
                        <span className="text-blue-800 font-semibold">{selectedStudent.department}</span>
                      </div>
                      <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                        <span className="mr-3 text-green-600">📚</span>
                        <span className="font-medium text-gray-700 min-w-[80px]">Program:</span>
                        <span className="text-green-800 font-semibold">{selectedStudent.program}</span>
                      </div>
                      <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                        <span className="mr-3 text-purple-600">📈</span>
                        <span className="font-medium text-gray-700 min-w-[80px]">Semester:</span>
                        <span className="text-purple-800 font-semibold">{selectedStudent.currentSemester}</span>
                      </div>
                      {selectedStudent.email && (
                        <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className="mr-3 text-red-600">📧</span>
                          <span className="font-medium text-gray-700 min-w-[80px]">Email:</span>
                          <span className="text-red-800 font-semibold">{selectedStudent.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Fees Section - Only for Specific Payment */}
              {selectedStudent && formData.paymentType === 'specific' && pendingFees.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">⏰</span>
                    Pending Fees
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingFees.map((fee, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-yellow-300">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{fee.feeHead}</p>
                            <p className="text-red-600 font-semibold">Pending: ₹{fee.pendingAmount}</p>
                            <p className="text-gray-600">Total: ₹{fee.totalAmount}</p>
                            {fee.paidAmount > 0 && (
                              <p className="text-green-600">Paid: ₹{fee.paidAmount}</p>
                            )}
                            {fee.dueDate && (
                              <p className="text-orange-600 text-xs">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                feeHead: fee.feeHeadId,
                                amount: fee.pendingAmount.toString(),
                                paymentType: 'specific'
                              }));
                            }}
                            className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                          >
                            Quick Fill
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                      <span className="font-medium">💡 Tip:</span> Click "Quick Fill" to automatically set the fee head and pending amount in the payment form.
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple Fee Heads Selection - Only for Multiple Payment */}
              {selectedStudent && formData.paymentType === 'multiple' && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">📊</span>
                    Select Multiple Fee Heads
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    {pendingFees.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {pendingFees.map((fee, index) => (
                            <label key={index} className="relative">
                              <input
                                type="checkbox"
                                checked={formData.selectedFeeHeads.includes(fee.feeHeadId)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const updatedFeeHeads = checked
                                    ? [...formData.selectedFeeHeads, fee.feeHeadId]
                                    : formData.selectedFeeHeads.filter(id => id !== fee.feeHeadId);
                                  
                                  // Show visual feedback for selection
                                  if (checked) {
                                    setSuccess(`✅ Added ${fee.feeHead} (₹${fee.pendingAmount.toLocaleString()}) to payment`);
                                    setTimeout(() => setSuccess(''), 2000);
                                  } else {
                                    setSuccess(`❌ Removed ${fee.feeHead} from payment`);
                                    setTimeout(() => setSuccess(''), 1500);
                                  }

                                  // Auto-calculate total and adjust payment type
                                  const totalAmount = updatedFeeHeads.reduce((sum, id) => {
                                    const pendingFee = pendingFees.find(f => f.feeHeadId === id);
                                    return sum + (pendingFee ? pendingFee.pendingAmount : 0);
                                  }, 0);
                                  
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedFeeHeads: updatedFeeHeads,
                                    paymentType: updatedFeeHeads.length > 1 ? 'multiple' : 
                                               updatedFeeHeads.length === 1 ? 'specific' : prev.paymentType,
                                    amount: updatedFeeHeads.length > 0 ? totalAmount.toString() : prev.amount,
                                    feeHead: updatedFeeHeads.length === 1 ? updatedFeeHeads[0] : ''
                                  }));
                                }}
                                className="sr-only"
                              />
                              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                                formData.selectedFeeHeads.includes(fee.feeHeadId)
                                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg shadow-green-200/50'
                                  : 'border-gray-300 hover:border-green-400 bg-white hover:shadow-md'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className="text-sm flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="font-semibold text-gray-900">{fee.feeHead}</p>
                                      {formData.selectedFeeHeads.includes(fee.feeHeadId) && (
                                        <span className="animate-bounce">
                                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-red-600 font-bold text-base">₹{fee.pendingAmount.toLocaleString()}</p>
                                    <p className="text-gray-600">Total: ₹{fee.totalAmount}</p>
                                    {fee.paidAmount > 0 && (
                                      <p className="text-green-600">Paid: ₹{fee.paidAmount}</p>
                                    )}
                                    {fee.dueDate && (
                                      <p className="text-orange-600 text-xs">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ml-2 ${
                                    formData.selectedFeeHeads.includes(fee.feeHeadId)
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {formData.selectedFeeHeads.includes(fee.feeHeadId) && (
                                      <span className="text-white text-xs">✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                        
                        {/* Enhanced Multiple Fee Summary with Animation */}
                        {formData.selectedFeeHeads.length > 0 && (
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6 animate-fadeIn shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                              <h5 className="font-bold text-green-900 text-lg flex items-center gap-2">
                                <span className="animate-pulse">💰</span>
                                Payment Summary
                              </h5>
                              <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {formData.selectedFeeHeads.length} fee head{formData.selectedFeeHeads.length > 1 ? 's' : ''} selected
                              </span>
                            </div>
                            <div className="space-y-3 mb-4">
                              {formData.selectedFeeHeads.map((feeHeadId, index) => {
                                const fee = pendingFees.find(f => f.feeHeadId === feeHeadId);
                                return fee ? (
                                  <div key={feeHeadId} className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm border border-green-200 animate-slideIn" style={{animationDelay: `${index * 100}ms`}}>
                                    <div className="flex items-center gap-3">
                                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                      </span>
                                      <span className="font-medium text-gray-800">{fee.feeHead}</span>
                                    </div>
                                    <span className="font-bold text-green-700 text-lg">₹{fee.pendingAmount.toLocaleString()}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                            <div className="border-t-2 border-green-400 pt-4 bg-green-200 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-green-900 text-xl flex items-center gap-2">
                                  <span>💳</span>
                                  Total Payment:
                                </span>
                                <span className="font-bold text-green-900 text-2xl animate-pulse">
                                  ₹{formData.selectedFeeHeads.reduce((total, feeHeadId) => {
                                    const fee = pendingFees.find(f => f.feeHeadId === feeHeadId);
                                    return total + (fee ? fee.pendingAmount : 0);
                                  }, 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedFeeHeads: pendingFees.map(f => f.feeHeadId)
                                  }));
                                }}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const totalAmount = formData.selectedFeeHeads.reduce((total, feeHeadId) => {
                                    const fee = pendingFees.find(f => f.feeHeadId === feeHeadId);
                                    return total + (fee ? fee.pendingAmount : 0);
                                  }, 0);
                                  setFormData(prev => ({
                                    ...prev,
                                    amount: totalAmount.toString(),
                                    description: `Multiple Fee Payment - ${formData.selectedFeeHeads.length} fee heads`
                                  }));
                                }}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                              >
                                Auto-Fill Amount
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedFeeHeads: []
                                  }));
                                }}
                                className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition"
                              >
                                Clear Selection
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <span className="text-xl mr-2">✅</span>
                        <p className="font-medium text-green-700">No pending fees found for this student!</p>
                      </div>
                    )}
                    
                    <div className="mt-3 text-sm text-green-700 bg-green-100 p-2 rounded">
                      <span className="font-medium">💡 Tip:</span> Select multiple fee heads to pay in a single transaction. Use "Auto-Fill Amount" to automatically calculate the total amount for selected fees.
                    </div>
                  </div>
                </div>
              )}

              {/* No Pending Fees Message - Only for Specific Payment */}
              {selectedStudent && formData.paymentType === 'specific' && pendingFees.length === 0 && (
                <div className="mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center text-green-700">
                      <span className="text-xl mr-2">✅</span>
                      <p className="font-medium">No pending fees found for this student!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Semester Selection - Only for Semester Payment */}
            {formData.paymentType === 'semester' && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">📚</span>
                  Semester Selection
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <label key={sem} className="relative">
                      <input
                        type="radio"
                        name="semester"
                        value={sem}
                        checked={formData.semester === sem.toString()}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg cursor-pointer text-center transition ${
                        formData.semester === sem.toString() 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="font-medium">Semester {sem}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Semester Fees Display */}
                {formData.semester && semesterFees.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">📊</span>
                      Semester {formData.semester} Fees
                    </h4>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {semesterFees.map((fee, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg border border-purple-300">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{fee.feeHead}</p>
                              <p className="text-red-600 font-semibold">Pending: ₹{fee.pendingAmount}</p>
                              <p className="text-gray-600">Total: ₹{fee.totalAmount}</p>
                              {fee.paidAmount > 0 && (
                                <p className="text-green-600">Paid: ₹{fee.paidAmount}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-between items-center bg-purple-100 p-3 rounded">
                        <div>
                          <p className="text-lg font-semibold text-purple-900">
                            Total Semester Fees: ₹{calculateSemesterTotal()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={payAllSemesterFees}
                          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                        >
                          Pay All Semester Fees
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fee Information - Only for Specific Payment */}
            {formData.paymentType === 'specific' && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">💰</span>
                  Fee Information
                </h3>
                <div className="space-y-6">
                  {/* Multiple Fee Head Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Fee Heads (Multiple Selection Allowed)
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {feeHeads.map(head => (
                          <label key={head._id} className="relative">
                            <input
                              type="checkbox"
                              checked={formData.selectedFeeHeads.includes(head._id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const updatedFeeHeads = checked
                                  ? [...formData.selectedFeeHeads, head._id]
                                  : formData.selectedFeeHeads.filter(id => id !== head._id);
                                
                                setFormData(prev => ({
                                  ...prev,
                                  selectedFeeHeads: updatedFeeHeads,
                                  // Set the primary fee head for single selection compatibility
                                  feeHead: updatedFeeHeads.length === 1 ? updatedFeeHeads[0] : ''
                                }));
                              }}
                              className="sr-only"
                            />
                            <div className={`p-3 border-2 rounded-lg cursor-pointer transition ${
                              formData.selectedFeeHeads.includes(head._id)
                                ? 'border-blue-500 bg-blue-100 text-blue-700'
                                : 'border-gray-300 hover:border-blue-400 bg-white'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{head.title}</p>
                                  <p className="text-xs text-gray-600">₹{head.amount?.toLocaleString()}</p>
                                </div>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ml-2 ${
                                  formData.selectedFeeHeads.includes(head._id)
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}>
                                  {formData.selectedFeeHeads.includes(head._id) && (
                                    <span className="text-white text-xs">✓</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      {/* Selected Fee Heads Summary */}
                      {formData.selectedFeeHeads.length > 0 && (
                        <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-blue-900">
                              Selected Fee Heads ({formData.selectedFeeHeads.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedFeeHeads: [],
                                  feeHead: ''
                                }));
                              }}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-1">
                            {formData.selectedFeeHeads.map(feeHeadId => {
                              const head = feeHeads.find(h => h._id === feeHeadId);
                              return head ? (
                                <div key={feeHeadId} className="flex justify-between text-sm">
                                  <span>{head.title}</span>
                                  <span className="font-semibold">₹{head.amount?.toLocaleString()}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                          <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between items-center">
                            <span className="font-bold text-blue-900">Total Amount:</span>
                            <span className="font-bold text-blue-900 text-lg">
                              ₹{formData.selectedFeeHeads.reduce((total, feeHeadId) => {
                                const head = feeHeads.find(h => h._id === feeHeadId);
                                return total + (head?.amount || 0);
                              }, 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedFeeHeads: feeHeads.map(h => h._id)
                                }));
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                            >
                              Select All Fee Heads
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const totalAmount = formData.selectedFeeHeads.reduce((total, feeHeadId) => {
                                  const head = feeHeads.find(h => h._id === feeHeadId);
                                  return total + (head?.amount || 0);
                                }, 0);
                                setFormData(prev => ({
                                  ...prev,
                                  amount: totalAmount.toString(),
                                  description: `Payment for ${formData.selectedFeeHeads.length} fee head(s)`,
                                  paymentType: formData.selectedFeeHeads.length > 1 ? 'multiple' : 'specific'
                                }));
                              }}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                            >
                              Auto-Fill Amount & Switch Type
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm text-blue-700 bg-blue-100 p-2 rounded">
                        <span className="font-medium">💡 Tip:</span> Select multiple fee heads for combined payment. The system will automatically switch to "Multiple Fees" payment type when more than one fee head is selected.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Fee Head (Auto-filled)
                      </label>
                      <select
                        name="feeHead"
                        value={formData.feeHead}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        disabled
                      >
                        <option value="">-- Auto-filled from selection --</option>
                        {feeHeads.map(head => (
                          <option key={head._id} value={head._id}>
                            {head.title} - ₹{head.amount}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">This field is auto-filled when you select fee heads above</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester (Optional)
                      </label>
                      <input
                        type="number"
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        min="1"
                        max="8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter semester number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">💳</span>
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="Card">💳 Card</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Cheque">📄 Cheque</option>
                    <option value="Online">💻 Online</option>
                    <option value="UPI">📱 UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter transaction ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collected By (Optional)
                  </label>
                  <input
                    type="text"
                    name="collectedBy"
                    value={formData.collectedBy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Staff name who collected payment"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Payment description (e.g., Tuition Fee, Exam Fee, etc.)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional remarks or notes"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={clearForm}
                className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition flex items-center"
              >
                <span className="mr-2">🔄</span>
                Clear Form
              </button>
              <button
                type="submit"
                disabled={loading || !formData.studentId || !formData.amount || 
                  (formData.paymentType === 'multiple' && formData.selectedFeeHeads.length === 0)}
                className={`px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform flex items-center justify-center ${
                  loading || !formData.studentId || !formData.amount || 
                  (formData.paymentType === 'multiple' && formData.selectedFeeHeads.length === 0)
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'gradient-primary text-white hover:scale-105 shadow-primary hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Processing Payment...</span>
                      <div className="ml-3 flex space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="mr-3 text-2xl">�</span>
                    <span>
                      Process {formData.paymentType === 'semester' ? 'Semester' : 
                              formData.paymentType === 'multiple' ? 'Multiple Fee' : 'Student'} Payment
                    </span>
                    <span className="ml-3 text-xl">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Fee Heads</p>
                <p className="text-2xl font-bold text-gray-900">{feeHeads.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <span className="text-xl mr-2">💡</span>
            Quick Guide
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><span className="font-medium">1.</span> Choose payment type (Specific Fee, Multiple Fees, or Semester Wise)</p>
            <p><span className="font-medium">2.</span> Select the student from the dropdown list</p>
            <p><span className="font-medium">3.</span> For semester payment: select semester and use "Pay All" button</p>
            <p><span className="font-medium">4.</span> For multiple fees: select multiple fee heads using checkboxes and use "Auto-Fill Amount"</p>
            <p><span className="font-medium">5.</span> For specific payment: review pending fees and use Quick Fill</p>
            <p><span className="font-medium">6.</span> Enter payment details and click "Record Payment"</p>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
