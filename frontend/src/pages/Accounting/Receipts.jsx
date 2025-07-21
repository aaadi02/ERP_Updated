import React, { useState, useEffect } from 'react';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [receiptsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalReceipts: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchReceipts();
  }, [currentPage]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('page', currentPage);
      params.append('limit', receiptsPerPage);

      console.log('Fetching receipts with params:', params.toString());
      const response = await fetch(`http://localhost:5000/api/receipts?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      // Ensure receipts is an array and has proper structure
      const receiptsArray = Array.isArray(data.receipts) ? data.receipts : [];
      setReceipts(receiptsArray);
      setPagination(data.pagination || {
        totalPages: 0,
        totalReceipts: 0,
        hasNext: false,
        hasPrev: false
      });
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error fetching receipts: ' + err.message);
      setReceipts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchReceipts();
  };

  const handleViewReceipt = async (receipt) => {
    try {
      setError(''); // Clear any previous errors
      
      if (receipt.type === 'student') {
        // Fetch full payment details with student info
        const paymentResponse = await fetch(`http://localhost:5000/api/receipts/student/${receipt._id}`);
        if (!paymentResponse.ok) {
          throw new Error('Failed to fetch payment details');
        }
        const paymentData = await paymentResponse.json();
        
        // Use the AddPayment style receipt instead of ReceiptSlip component
        printStudentReceipt(paymentData);
      } else if (receipt.type === 'salary') {
        // For salary receipts, fetch salary details and generate salary slip
        await handleViewSalarySlip(receipt);
      } else {
        throw new Error('Unknown receipt type');
      }
    } catch (err) {
      console.error('Error in handleViewReceipt:', err);
      setError('Error fetching receipt details: ' + err.message);
    }
  };

  const printStudentReceipt = (paymentData) => {
    // Create receipt data in the same format as AddPayment
    const receiptData = {
      receiptNumber: paymentData.receiptNumber || `RCP-${paymentData._id.slice(-8)}`,
      date: new Date(paymentData.paymentDate).toLocaleDateString(),
      time: new Date(paymentData.paymentDate).toLocaleTimeString(),
      academicYear: paymentData.academicYear || '2025-26',
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      student: {
        firstName: paymentData.studentId?.firstName || 'N/A',
        lastName: paymentData.studentId?.lastName || '',
        studentId: paymentData.studentId?.studentId || 'N/A',
        department: paymentData.studentId?.department || 'N/A',
        program: paymentData.studentId?.program || 'N/A'
      },
      feeHead: paymentData.feeHead?.title || 'General Fee',
      paymentType: 'specific',
      collectedBy: paymentData.collectedBy || 'System',
      remarks: paymentData.remarks || ''
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Payment Receipt - ${receiptData.receiptNumber}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 10px; 
            background: white;
            line-height: 1.2;
            color: #000;
          }
          .receipt-container {
            width: 190mm;
            height: 270mm;
            max-width: none;
            margin: 0 auto 10mm auto;
            border: 1px solid #000;
            background: white;
            page-break-inside: avoid;
            transform: scale(0.9);
            transform-origin: top left;
          }
          .header-border {
            height: 2px;
            background: linear-gradient(90deg, #1e40af, #3b82f6, #1e40af);
          }
          .institute-header {
            padding: 8px;
            text-align: center;
            border-bottom: 1px solid #000;
          }
          .logos-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          .institute-info {
            flex: 1;
            text-align: center;
            padding: 0 10px;
          }
          .society-name {
            font-size: 12px;
            color: #666;
            margin-bottom: 2px;
            text-transform: lowercase;
          }
          .institute-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 1px;
            margin-bottom: 3px;
          }
          .institute-subtitle {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 2px;
          }
          .institute-affiliation {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 2px;
            font-style: italic;
          }
          .institute-address {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 2px;
          }
          .institute-contact {
            font-size: 10px;
            color: #6b7280;
          }
          .receipt-title {
            background: #1e40af;
            color: white;
            padding: 8px;
            margin: 0;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .receipt-details {
            padding: 16px;
          }
          .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 16px;
            font-size: 12px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            border-bottom: 1px dotted #ddd;
            padding-bottom: 1px;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
          }
          .section-title {
            background: #f3f4f6;
            padding: 6px 12px;
            margin: 16px 0 8px 0;
            font-weight: bold;
            color: #1f2937;
            border-left: 4px solid #1e40af;
            font-size: 14px;
          }
          .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 12px;
            font-size: 12px;
          }
          .payment-summary {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 12px;
            text-align: center;
            margin: 12px 0;
            border-radius: 6px;
          }
          .amount-paid {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .amount-label {
            font-size: 14px;
            opacity: 0.9;
          }
          .footer {
            background: #f9fafb;
            padding: 8px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #6b7280;
          }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
          }
          .signature-box {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: 30px;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 60px;
            color: rgba(30, 64, 175, 0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
          }
          @media print {
            body { background: white; margin: 0; padding: 5mm; }
            .receipt-container { border: 1px solid #000; margin-bottom: 5mm; }
            @page { size: A4; margin: 5mm; }
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
                  <span>${receiptData.student.firstName} ${receiptData.student.lastName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Student ID:</span>
                  <span>${receiptData.student.studentId}</span>
                </div>
              </div>
              <div>
                <div class="info-row">
                  <span class="info-label">Department:</span>
                  <span>${receiptData.student.department}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Program:</span>
                  <span>${receiptData.student.program}</span>
                </div>
              </div>
            </div>
            
            <div class="section-title">📄 FEE HEAD DETAILS</div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 6px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 3px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Fee Head</th>
                  <th style="padding: 3px; text-align: right; border: 1px solid #d1d5db; font-weight: bold;">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: white;">
                  <td style="padding: 2px 3px; border: 1px solid #d1d5db;">${receiptData.feeHead}</td>
                  <td style="padding: 2px 3px; border: 1px solid #d1d5db; text-align: right; color: #2563eb; font-weight: bold;">₹${parseInt(receiptData.amount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="payment-summary">
              <div class="amount-paid">₹${parseInt(receiptData.amount).toLocaleString()}</div>
              <div class="amount-label">Total Amount Paid</div>
            </div>
            
            ${receiptData.remarks ? `
            <div class="section-title">📝 REMARKS</div>
            <div style="padding: 3px; background: #f9fafb; border-left: 2px solid #3b82f6; margin-bottom: 6px; font-size: 6px;">
              ${receiptData.remarks}
            </div>
            ` : ''}
            
            <div class="signature-section">
              <div>
                <div style="font-weight: bold; margin-bottom: 5px;">Student Signature</div>
                <div class="signature-box">_________________</div>
              </div>
              <div>
                <div style="font-weight: bold; margin-bottom: 5px;">Collected By</div>
                <div class="signature-box">${receiptData.collectedBy}</div>
              </div>
              <div>
                <div style="font-weight: bold; margin-bottom: 5px;">Authorized Signature</div>
                <div class="signature-box">_________________</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <strong>Thank you for your payment!</strong><br>
            Keep this receipt for your records. For any queries, contact the accounts department.<br>
            Generated on ${new Date().toLocaleString()} | This is a computer-generated receipt.
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleViewSalarySlip = async (receipt) => {
    try {
      setLoading(true);
      console.log('Viewing salary slip for receipt:', receipt);

      // Extract employee name from receipt
      const employeeName = receipt.recipientName;
      if (!employeeName) {
        throw new Error('Employee name not found in receipt');
      }

      // Fetch faculty data to get complete employee information
      const facultyRes = await fetch('http://localhost:5000/api/faculty');
      if (!facultyRes.ok) {
        throw new Error('Failed to fetch faculty data');
      }
      const facultyData = await facultyRes.json();
      
      // Find faculty member by name
      let facultyMember = facultyData.find(f => 
        f.personalInfo?.fullName === employeeName ||
        f.fullName === employeeName ||
        `${f.personalInfo?.firstName || f.firstName || ''} ${f.personalInfo?.lastName || f.lastName || ''}`.trim() === employeeName
      );

      if (!facultyMember) {
        throw new Error(`Faculty member "${employeeName}" not found`);
      }

      // Fetch salary record details
      const salaryRes = await fetch(`http://localhost:5000/api/faculty/salary`);
      if (!salaryRes.ok) {
        throw new Error('Failed to fetch salary records');
      }
      const salaryRecords = await salaryRes.json();
      
      // Find the salary record that matches this receipt
      // We can match by employee name and amount, or use the receipt ID if it's stored
      const salaryRecord = salaryRecords.find(record => 
        (record.employeeName === employeeName || record.name === employeeName) &&
        Math.abs(parseFloat(record.grossSalary || record.amount || 0) - parseFloat(receipt.amount || 0)) < 1
      );

      if (!salaryRecord) {
        throw new Error(`No salary record found for ${employeeName} with amount ₹${receipt.amount}`);
      }

      // Create salary slip object similar to the one in IncomeTax.jsx
      const slip = {
        faculty: facultyMember,
        month: getMonthFromReceipt(receipt),
        year: getYearFromReceipt(receipt),
        basicSalary: parseFloat(salaryRecord.basicSalary || 0),
        allowances: {
          hra: parseFloat(salaryRecord.allowances?.hra || 0),
          da: parseFloat(salaryRecord.allowances?.da || 0),
          medical: parseFloat(salaryRecord.allowances?.medicalAllowance || 0),
          transport: parseFloat(salaryRecord.allowances?.transportAllowance || 0),
          cla: parseFloat(salaryRecord.allowances?.claAllowance || 0),
          others: parseFloat(salaryRecord.allowances?.otherAllowances || 0)
        },
        deductions: {
          pf: parseFloat(salaryRecord.deductions?.epf || salaryRecord.deductions?.pf || 0),
          esi: parseFloat(salaryRecord.deductions?.esi || 0),
          professionalTax: parseFloat(salaryRecord.deductions?.professionalTax || 0),
          tds: parseFloat(salaryRecord.deductions?.tds || 0),
          incomeTax: parseFloat(salaryRecord.deductions?.incomeTax || 0),
          others: parseFloat(salaryRecord.deductions?.otherDeductions || 0)
        },
        grossSalary: parseFloat(salaryRecord.grossSalary || salaryRecord.amount || 0),
        totalDeductions: parseFloat(salaryRecord.totalDeductions || 0),
        netSalary: parseFloat(salaryRecord.netSalary || 0),
        salaryStatus: salaryRecord.status || 'Calculated',
        paymentId: salaryRecord._id,
        paymentDate: salaryRecord.paymentDate || receipt.paymentDate,
        generatedOn: new Date().toLocaleDateString(),
        salaryType: salaryRecord.salaryType || 'Calculated Salary',
        hraRate: salaryRecord.hraRate || '15%',
        city: salaryRecord.city || 'N/A'
      };

      // Generate and display the salary slip
      printSalarySlipAuto(slip);
      
    } catch (err) {
      console.error('Error viewing salary slip:', err);
      setError('Error viewing salary slip: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to extract month/year from receipt
  const getMonthFromReceipt = (receipt) => {
    // Try to extract month from receipt date or description
    if (receipt.paymentDate) {
      const date = new Date(receipt.paymentDate);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return monthNames[date.getMonth()];
    }
    return 'Unknown';
  };

  const getYearFromReceipt = (receipt) => {
    // Try to extract year from receipt date
    if (receipt.paymentDate) {
      const date = new Date(receipt.paymentDate);
      return date.getFullYear();
    }
    return new Date().getFullYear();
  };

  // Import the salary slip function from IncomeTax.jsx
  const printSalarySlipAuto = (slip) => {
    if (!slip) return;

    // Get faculty name safely
    let facultyName = 'Unknown Employee';
    if (slip.faculty) {
      if (slip.faculty.personalInfo?.fullName) {
        facultyName = slip.faculty.personalInfo.fullName;
      } else if (slip.faculty.firstName || slip.faculty.lastName) {
        const firstName = slip.faculty.firstName || '';
        const lastName = slip.faculty.lastName || '';
        facultyName = `${firstName} ${lastName}`.trim();
      } else if (slip.faculty.fullName) {
        facultyName = slip.faculty.fullName;
      }
    }

    // Get employee details safely
    const employeeId = slip.faculty?.personalInfo?.employeeId || slip.faculty?.employeeId || 'N/A';
    const department = slip.faculty?.personalInfo?.department || slip.faculty?.department || 'N/A';
    const designation = slip.faculty?.personalInfo?.designation || slip.faculty?.employmentInfo?.designation || 'N/A';
    const joiningDate = slip.faculty?.personalInfo?.joiningDate || slip.faculty?.employmentInfo?.joiningDate || 'N/A';

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Slip - ${facultyName}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 0; 
              padding: 10px; 
              background: white;
              line-height: 1.2;
              color: #000;
            }
            .slip-container {
              width: 190mm;
              height: 270mm;
              max-width: none;
              margin: 0 auto 10mm auto;
              border: 1px solid #000;
              background: white;
              page-break-inside: avoid;
              transform: scale(0.9);
              transform-origin: top left;
            }
            .header-border {
              height: 2px;
              background: linear-gradient(90deg, #1e40af, #3b82f6, #1e40af);
            }
            .institute-header {
              padding: 8px;
              text-align: center;
              border-bottom: 1px solid #000;
            }
            .logos-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .logo {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }
            .institute-info {
              flex: 1;
              text-align: center;
              padding: 0 10px;
            }
            .society-name {
              font-size: 12px;
              color: #666;
              margin-bottom: 2px;
              text-transform: lowercase;
            }
            .institute-name {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              letter-spacing: 1px;
              margin-bottom: 3px;
            }
            .institute-subtitle {
              font-size: 16px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 2px;
            }
            .institute-affiliation {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 2px;
              font-style: italic;
            }
            .institute-address {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 2px;
            }
            .institute-contact {
              font-size: 10px;
              color: #6b7280;
            }
            .slip-title {
              background: #1e40af;
              color: white;
              padding: 8px;
              margin: 0;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .slip-details {
              padding: 16px;
            }
            .slip-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 16px;
              font-size: 12px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              border-bottom: 1px dotted #ddd;
              padding-bottom: 1px;
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
              font-size: 16px;
            }
            .emp-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 12px;
              font-size: 12px;
            }
            .salary-table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
              font-size: 12px;
            }
            .salary-table th,
            .salary-table td {
              border: 1px solid #d1d5db;
              padding: 6px;
              text-align: left;
            }
            .salary-table th {
              background: #f3f4f6;
              font-weight: bold;
            }
            .total-row {
              background: #e5f3ff;
              font-weight: bold;
            }
            .net-salary {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 8px;
            }
            .net-amount {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .amount-label {
              font-size: 14px;
              opacity: 0.9;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 30px;
              margin-top: 16px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .signature-box {
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 8px;
              margin-top: 40px;
            }
            .footer {
              background: #f9fafb;
              padding: 15px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
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
              body { background: white; margin: 0; padding: 5mm; }
              .slip-container { border: 1px solid #000; margin-bottom: 5mm; }
              @page { size: A4; margin: 5mm; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">NIETM</div>
          <div class="slip-container">
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
            
            <div class="slip-title">EMPLOYEE SALARY SLIP</div>
            
            <div class="slip-details">
              <div class="slip-info">
                <div>
                  <div class="info-row">
                    <span class="info-label">Slip No:</span>
                    <span>SAL-${slip._id?.slice(-8) || new Date().getTime().toString().slice(-8)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Pay Period:</span>
                    <span>${slip.month} ${slip.year}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Generated:</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                <div>
                  <div class="info-row">
                    <span class="info-label">Pay Date:</span>
                    <span>${slip.generatedOn || new Date().toLocaleDateString()}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Academic Year:</span>
                    <span>2025-26</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span>${slip.salaryStatus}</span>
                  </div>
                </div>
              </div>
              
              <div class="section-title">👤 EMPLOYEE INFORMATION</div>
              <div class="emp-info">
                <div>
                  <div class="info-row">
                    <span class="info-label">Employee Name:</span>
                    <span>${facultyName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Employee ID:</span>
                    <span>${employeeId}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span>${department}</span>
                  </div>
                </div>
                <div>
                  <div class="info-row">
                    <span class="info-label">Designation:</span>
                    <span>${designation}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Joining Date:</span>
                    <span>${joiningDate !== 'N/A' ? new Date(joiningDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Payment ID:</span>
                    <span>${slip.paymentId || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div class="section-title">💰 SALARY BREAKDOWN</div>
              <table class="salary-table">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th>Earnings</th>
                    <th style="text-align: right;">Amount (₹)</th>
                    <th>Deductions</th>
                    <th style="text-align: right;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background: white;">
                    <td>Basic Salary</td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">₹${(slip.basicSalary || 0).toLocaleString()}</td>
                    <td>Provident Fund</td>
                    <td style="text-align: right; color: #dc2626; font-weight: bold;">₹${(slip.deductions?.pf || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td>HRA</td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">₹${(slip.allowances?.hra || 0).toLocaleString()}</td>
                    <td>ESI</td>
                    <td style="text-align: right; color: #dc2626; font-weight: bold;">₹${(slip.deductions?.esi || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="background: white;">
                    <td>DA</td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">₹${(slip.allowances?.da || 0).toLocaleString()}</td>
                    <td>Professional Tax</td>
                    <td style="text-align: right; color: #dc2626; font-weight: bold;">₹${(slip.deductions?.professionalTax || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td>Medical Allowance</td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">₹${(slip.allowances?.medical || 0).toLocaleString()}</td>
                    <td>TDS</td>
                    <td style="text-align: right; color: #dc2626; font-weight: bold;">₹${(slip.deductions?.tds || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="background: white;">
                    <td>Transport Allowance</td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">₹${(slip.allowances?.transport || 0).toLocaleString()}</td>
                    <td>Income Tax</td>
                    <td style="text-align: right; color: #dc2626; font-weight: bold;">₹${(slip.deductions?.incomeTax || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td>CLA</td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">₹${(slip.allowances?.cla || 0).toLocaleString()}</td>
                    <td>Other Deductions</td>
                    <td style="text-align: right; color: #dc2626; font-weight: bold;">₹${(slip.deductions?.others || 0).toLocaleString()}</td>
                  </tr>
                  <tr style="background: white;">
                    <td>Other Allowances</td>
                    <td style="text-align: right; color: #2563eb; font-weight: bold;">₹${(slip.allowances?.others || 0).toLocaleString()}</td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr class="total-row">
                    <td><strong>Gross Salary</strong></td>
                    <td style="text-align: right;"><strong>₹${(slip.grossSalary || 0).toLocaleString()}</strong></td>
                    <td><strong>Total Deductions</strong></td>
                    <td style="text-align: right;"><strong>₹${(slip.totalDeductions || 0).toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
              
              <div class="net-salary">
                <div class="net-amount">₹${(slip.netSalary || 0).toLocaleString()}</div>
                <div class="amount-label">Net Salary Amount</div>
              </div>
              
              <div class="signature-section">
                <div>
                  <div style="font-weight: bold; margin-bottom: 5px;">Employee Signature</div>
                  <div class="signature-box">_________________</div>
                </div>
                <div>
                  <div style="font-weight: bold; margin-bottom: 5px;">HR Department</div>
                  <div class="signature-box">_________________</div>
                </div>
                <div>
                  <div style="font-weight: bold; margin-bottom: 5px;">Authorized Signature</div>
                  <div class="signature-box">_________________</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <strong>Thank you for your dedicated service!</strong><br>
              This is a system-generated salary slip. For any discrepancies, please contact HR Department.<br>
              Generated on ${new Date().toLocaleString()} | NAGARJUNA Institute of Engineering, Technology & Management
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Completed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Failed': 'bg-red-100 text-red-800',
      'Refunded': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      'student': 'bg-blue-100 text-blue-800',
      'salary': 'bg-purple-100 text-purple-800'
    };
    return typeColors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Receipt Management</h1>
          
          {/* Search and Filters */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="student">Student Fees</option>
                <option value="salary">Salary</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Receipts Table */}
        <div className="p-6">
          {receipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-xl mb-2">📄</div>
              <p className="text-gray-500">No receipts found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receipts.filter(receipt => receipt && typeof receipt === 'object').map((receipt) => (
                      <tr key={receipt._id || Math.random()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {receipt.receiptNumber || receipt.paymentId || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {receipt.description || 'No description'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{receipt.recipientName || 'Unknown'}</div>
                          {receipt.studentId && (
                            <div className="text-sm text-gray-500">ID: {receipt.studentId}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{(receipt.amount || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">{receipt.paymentMethod || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(receipt.type)}`}>
                            {receipt.type === 'student' ? 'Student Fee' : 'Salary'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(receipt.status)}`}>
                            {receipt.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {receipt.paymentDate ? formatDate(receipt.paymentDate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewReceipt(receipt)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View Receipt
                          </button>
                          {receipt.receiptNumber && (
                            <button
                              onClick={() => navigator.clipboard.writeText(receipt.receiptNumber)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Copy Receipt Number"
                            >
                              📋
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between flex-1 sm:hidden">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * receiptsPerPage) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * receiptsPerPage, pagination.totalReceipts)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.totalReceipts}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={!pagination.hasPrev}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ←
                        </button>
                        {[...Array(pagination.totalPages)].map((_, index) => (
                          <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === index + 1
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={!pagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          →
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Receipts;
