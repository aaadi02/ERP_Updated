import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Download, Printer, ArrowLeft, FileText } from 'lucide-react';

const AcademicCalendarPrint = ({ calendar, onBack }) => {
  const printRef = useRef();
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    if (calendar) {
      // Process calendar data for print format
      const processedData = processCalendarForPrint(calendar);
      setPrintData(processedData);
    }
  }, [calendar]);n

  const processCalendarForPrint = (cal) => {
    // Sort topics by planned date
    const sortedTopics = [...(cal.topics || [])].sort((a, b) => 
      new Date(a.plannedDate) - new Date(b.plannedDate)
    );

    // Generate date range for the calendar
    const startDate = new Date(cal.startDate);
    const endDate = new Date(cal.endDate);
    
    // Create schedule entries
    const scheduleEntries = [];
    let currentWeek = 1;
    let topicIndex = 0;

    // Generate weekly schedule
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
      if (topicIndex < sortedTopics.length) {
        const topic = sortedTopics[topicIndex];
        scheduleEntries.push({
          week: currentWeek,
          date: new Date(date),
          topic: topic,
          isScheduled: true
        });
        topicIndex++;
      } else {
        // Add empty weeks for completion
        scheduleEntries.push({
          week: currentWeek,
          date: new Date(date),
          topic: null,
          isScheduled: false
        });
      }
      currentWeek++;
    }

    return {
      ...cal,
      scheduleEntries,
      totalWeeks: currentWeek - 1,
      totalHours: sortedTopics.reduce((sum, topic) => sum + (topic.estimatedHours || 0), 0)
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF (you might want to use a library like jsPDF or html2pdf)
    window.print();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDay = (date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  if (!printData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Actions */}
      <div className="bg-white shadow-sm border-b px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Back to Calendar
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Printable Calendar */}
      <div 
        ref={printRef}
        className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none"
        style={{ 
          minHeight: '297mm', // A4 height
          padding: '20mm', // A4 margins
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-black mb-1">
              {printData.institutionName || "NAGARJUNA UNIVERSITY"}
            </h1>
            <h2 className="text-lg font-bold text-black mb-1">
              DEPARTMENT OF {printData.department?.toUpperCase() || "COMPUTER SCIENCE ENGINEERING"}
            </h2>
            <div className="text-base font-semibold text-black mb-2">
              Academic Year: {printData.academicYear} &nbsp;&nbsp;&nbsp; Semester: {printData.semester}
            </div>
            <div className="text-sm text-black">
              <p><strong>Subject:</strong> {printData.subjectId?.name} ({printData.subjectId?.code})</p>
              <p><strong>Faculty:</strong> {printData.facultyId?.name}</p>
            </div>
          </div>
        </div>

        {/* Calendar Table */}
        <div className="overflow-hidden">
          <table className="w-full border-collapse" style={{ border: '2px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th className="px-2 py-3 text-xs font-bold text-center" style={{ border: '1px solid black', width: '8%' }}>
                  S.No
                </th>
                <th className="px-2 py-3 text-xs font-bold text-center" style={{ border: '1px solid black', width: '10%' }}>
                  Week No.
                </th>
                <th className="px-2 py-3 text-xs font-bold text-center" style={{ border: '1px solid black', width: '12%' }}>
                  Date
                </th>
                <th className="px-2 py-3 text-xs font-bold text-center" style={{ border: '1px solid black', width: '8%' }}>
                  Day
                </th>
                <th className="px-2 py-3 text-xs font-bold text-center" style={{ border: '1px solid black', width: '40%' }}>
                  Topics to be Covered / Teaching Learning Method / Assignments
                </th>
                <th className="px-2 py-3 text-xs font-bold text-center" style={{ border: '1px solid black', width: '10%' }}>
                  Hours
                </th>
                <th className="px-2 py-3 text-xs font-bold text-center" style={{ border: '1px solid black', width: '12%' }}>
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {printData.scheduleEntries.map((entry, index) => (
                <tr key={index} style={{ minHeight: '40px' }}>
                  <td className="px-2 py-2 text-xs text-center" style={{ border: '1px solid black' }}>
                    {index + 1}
                  </td>
                  <td className="px-2 py-2 text-xs text-center" style={{ border: '1px solid black' }}>
                    {entry.week}
                  </td>
                  <td className="px-2 py-2 text-xs text-center" style={{ border: '1px solid black' }}>
                    {entry.topic ? formatDate(new Date(entry.topic.plannedDate)) : formatDate(entry.date)}
                  </td>
                  <td className="px-2 py-2 text-xs text-center" style={{ border: '1px solid black' }}>
                    {entry.topic ? getDay(new Date(entry.topic.plannedDate)) : getDay(entry.date)}
                  </td>
                  <td className="px-2 py-2 text-xs" style={{ border: '1px solid black' }}>
                    {entry.topic ? (
                      <div>
                        <div className="font-medium">{entry.topic.name}</div>
                        {entry.topic.description && (
                          <div className="text-xs text-gray-700 mt-1">
                            {entry.topic.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs text-center" style={{ border: '1px solid black' }}>
                    {entry.topic ? entry.topic.estimatedHours || 1 : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs" style={{ border: '1px solid black' }}>
                    {entry.topic?.actualDate ? (
                      <span className="text-green-700 text-xs font-medium">
                        ✓ Done
                      </span>
                    ) : entry.topic ? (
                      <span className="text-orange-700 text-xs">Planned</span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}

              {/* Add extra empty rows for a full page */}
              {Array.from({ length: Math.max(0, 30 - printData.scheduleEntries.length) }, (_, index) => (
                <tr key={`empty-${index}`} style={{ height: '35px' }}>
                  <td className="px-2 py-2 text-xs text-center" style={{ border: '1px solid black' }}>
                    {printData.scheduleEntries.length + index + 1}
                  </td>
                  <td style={{ border: '1px solid black' }}>&nbsp;</td>
                  <td style={{ border: '1px solid black' }}>&nbsp;</td>
                  <td style={{ border: '1px solid black' }}>&nbsp;</td>
                  <td style={{ border: '1px solid black' }}>&nbsp;</td>
                  <td style={{ border: '1px solid black' }}>&nbsp;</td>
                  <td style={{ border: '1px solid black' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          <div>
            <h4 className="font-bold text-sm mb-2 text-black">COURSE SUMMARY:</h4>
            <div className="text-xs space-y-1">
              <p><strong>Total Topics:</strong> {printData.topics?.length || 0}</p>
              <p><strong>Total Contact Hours:</strong> {printData.totalHours}</p>
              <p><strong>Duration:</strong> {printData.totalWeeks} weeks</p>
              <p><strong>Status:</strong> {printData.status?.toUpperCase()}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-sm mb-2 text-black">FACULTY DETAILS:</h4>
            <div className="text-xs space-y-1">
              <p><strong>Name:</strong> {printData.facultyId?.name}</p>
              <p><strong>Designation:</strong> {printData.facultyId?.designation}</p>
              <p><strong>Employee ID:</strong> {printData.facultyId?.employeeId}</p>
              <p><strong>Department:</strong> {printData.department}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-sm mb-2 text-black">APPROVALS:</h4>
            <div className="text-xs space-y-6">
              <div>
                <div className="border-b border-black w-32 mb-1"></div>
                <p><strong>Faculty In-charge</strong></p>
              </div>
              <div>
                <div className="border-b border-black w-32 mb-1"></div>
                <p><strong>Head of Department</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes Section */}
        <div className="mt-6">
          <h4 className="font-bold text-sm mb-2 text-black">NOTES:</h4>
          <div className="border border-black p-3 min-h-16">
            <p className="text-xs">
              {printData.description || "Additional notes and instructions will be added here as needed."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Generated on: {new Date().toLocaleDateString('en-IN')} | Academic Calendar System</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          /* Print specific styles */
          @page {
            margin: 20mm;
            size: A4;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
};

export default AcademicCalendarPrint;
