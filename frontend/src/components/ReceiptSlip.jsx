import React from 'react';

const ReceiptSlip = ({ payment, student, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    // Auto print receipt with professional styling
    printReceiptAuto();
  };

  const printReceiptAuto = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${payment.receiptNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 2px solid #1e40af;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 15px;
          }
          .logo-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
          .college-info {
            flex: 1;
            text-align: center;
            padding: 0 20px;
          }
          .college-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
            letter-spacing: 1px;
          }
          .college-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 3px;
          }
          .college-address {
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
          }
          .accreditation {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: bold;
            display: inline-block;
          }
          .document-title {
            font-size: 22px;
            font-weight: bold;
            color: #1e40af;
            margin: 15px 0;
            text-align: center;
            letter-spacing: 2px;
            border: 2px solid #1e40af;
            padding: 8px;
            background: #f0f4ff;
          }
          .receipt-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 25px;
          }
          .detail-section {
            background: #f8fafc;
            padding: 15px;
            border-left: 4px solid #1e40af;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            padding: 3px 0;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          .detail-value {
            font-weight: bold;
            color: #000;
          }
          .receipt-number {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #1e40af;
            background: #e0f2fe;
            padding: 5px 10px;
            border-radius: 5px;
          }
          .amount-highlight {
            font-size: 18px;
            color: #059669;
            background: #ecfdf5;
            padding: 8px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #059669;
          }
          .payment-summary {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 2px solid #1e40af;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .total-amount {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            margin: 15px 0;
            padding: 15px;
            background: white;
            border: 2px dashed #059669;
            border-radius: 8px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #1e40af;
            text-align: center;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            height: 40px;
          }
          .footer-note {
            font-size: 10px;
            color: #666;
            margin-top: 15px;
            font-style: italic;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 60px;
            color: rgba(30, 64, 175, 0.05);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
          }
          @media print {
            body { margin: 0; }
            .receipt-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="watermark">FEE RECEIPT</div>
          
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <img src="/naac-b-plus-logo.png" alt="NAAC B++ Logo" class="logo" />
              <div class="college-info">
                <div class="college-name">NOIDA INSTITUTE OF ENGINEERING AND TECHNOLOGY</div>
                <div class="college-subtitle">GREATER NOIDA</div>
                <div class="college-address">
                  19, Knowledge Park II, Institutional Area, Greater Noida - 201306<br>
                  Phone: +91-120-2329800 | Email: info@niet.co.in | Website: www.niet.co.in
                </div>
                <div class="accreditation">NAAC Accredited B++ Grade</div>
              </div>
              <img src="/nietm-logo.png" alt="NIETM Logo" class="logo" />
            </div>
          </div>

          <!-- Document Title -->
          <div class="document-title">FEE PAYMENT RECEIPT</div>

          <!-- Receipt Details -->
          <div class="receipt-details">
            <!-- Student Information -->
            <div class="detail-section">
              <div class="section-title">Student Information</div>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${student?.firstName || ''} ${student?.lastName || ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Student ID:</span>
                <span class="detail-value">${student?.studentId || ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span class="detail-value">${student?.department || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${student?.casteCategory || 'General'}</span>
              </div>
            </div>

            <!-- Receipt Information -->
            <div class="detail-section">
              <div class="section-title">Receipt Information</div>
              <div class="detail-row">
                <span class="detail-label">Receipt No:</span>
                <span class="detail-value receipt-number">${payment.receiptNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(payment.paymentDate)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${payment.paymentMethod}</span>
              </div>
              ${payment.transactionId ? `
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${payment.transactionId}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="payment-summary">
            <div class="section-title" style="text-align: center; margin-bottom: 15px;">Payment Summary</div>
            
            ${payment.feeHead ? `
            <div class="detail-row">
              <span class="detail-label">Fee Head:</span>
              <span class="detail-value">${payment.feeHead.title}</span>
            </div>
            ` : ''}
            
            ${payment.description ? `
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${payment.description}</span>
            </div>
            ` : ''}
            
            ${payment.collectedBy ? `
            <div class="detail-row">
              <span class="detail-label">Collected By:</span>
              <span class="detail-value">${payment.collectedBy}</span>
            </div>
            ` : ''}
            
            <div class="total-amount">
              TOTAL AMOUNT PAID: ₹${payment.amount.toLocaleString('en-IN')}
            </div>
            
            ${payment.remarks ? `
            <div style="margin-top: 15px;">
              <div class="detail-label">Remarks:</div>
              <div style="background: white; padding: 10px; border-radius: 5px; margin-top: 5px;">
                ${payment.remarks}
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Student Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Cashier Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Authorized Signature</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div style="font-weight: bold; margin-bottom: 10px;">
              Thank you for your payment!
            </div>
            <div class="footer-note">
              This is a computer generated receipt and does not require physical signature.<br>
              Please keep this receipt for your records. For any queries, contact the accounts department.<br>
              Generated on: ${new Date().toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Print Button */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Payment Receipt</h2>
          <div className="space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🖨️ Print Professional Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <img src="/naac-b-plus-logo.png" alt="NAAC B++" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-blue-700">NIET</h1>
                <p className="text-xs text-gray-600">Fee Receipt Preview</p>
              </div>
              <img src="/nietm-logo.png" alt="NIETM" className="h-12 w-12 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">FEE RECEIPT</h2>
            <p className="text-sm text-gray-600">Professional Receipt with Institutional Branding</p>
          </div>

          {/* Receipt Details Preview */}
          <div className="space-y-4">
            {/* Receipt Number */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-700">Receipt No:</span>
                <span className="font-mono text-lg font-bold text-blue-600">{payment.receiptNumber}</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Date:</span>
              <span className="text-gray-800">{formatDate(payment.paymentDate)}</span>
            </div>

            {/* Student Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-blue-700">Student Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{student?.firstName} {student?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Student ID:</span>
                  <span className="font-mono">{student?.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span>{student?.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span>{student?.casteCategory}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-blue-700">Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-lg text-green-600">₹{payment.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold">{payment.paymentMethod}</span>
                </div>
                {payment.feeHead && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee Head:</span>
                    <span>{payment.feeHead.title}</span>
                  </div>
                )}
                {payment.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm">{payment.transactionId}</span>
                  </div>
                )}
                {payment.collectedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Collected By:</span>
                    <span>{payment.collectedBy}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {payment.description && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="text-right max-w-xs">{payment.description}</span>
                </div>
              </div>
            )}

            {/* Remarks */}
            {payment.remarks && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Remarks:</span>
                  <span className="text-right max-w-xs">{payment.remarks}</span>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t-2 border-blue-300 pt-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">TOTAL PAID:</span>
                  <span className="text-2xl font-bold text-green-600">₹{payment.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Professional Footer */}
            <div className="text-center pt-6">
              <div className="border-t border-gray-300 pt-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 font-semibold mb-1">Professional Receipt with Institutional Branding</p>
                  <p className="text-xs text-gray-600">Click "Print Professional Receipt" for full-featured printout</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Thank you for your payment!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptSlip;