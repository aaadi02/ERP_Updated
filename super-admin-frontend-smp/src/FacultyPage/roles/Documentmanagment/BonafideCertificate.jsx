import React from 'react';

const BC = ({ studentId, studentData }) => {
  // Sample data for preview
  const formData = {
    studentName: studentData?.fullName || 'John Doe',
    course: studentData?.course || `${studentData?.stream?.name || 'B.Tech'} in ${studentData?.department?.name || 'Computer Science Engineering'}`,
    semesterNumber: studentData?.semesterNumber || '5',
    year: studentData?.semesterNumber ? Math.ceil(studentData.semesterNumber / 2) : '3',
    session: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    dateOfBirth: studentData?.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString('en-GB') : '15/08/2002',
    dateOfBirthWords: studentData?.dateOfBirthWords || 'Fifteenth August Two Thousand Two',
    conduct: 'good moral character',
    dateOfIssue: new Date().toLocaleDateString('en-GB'),
  };

  const gender = studentData?.gender || 'Male';
  const isFemalePronoun = gender.toLowerCase() === 'female';
  const heShe = isFemalePronoun ? 'she' : 'he';
  const hisHer = isFemalePronoun ? 'her' : 'his';
  const studentTitle = isFemalePronoun ? 'Ku.' : 'Shri';

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg">
      {/* Certificate Preview */}
      <div className="border-2 border-gray-300 p-8 bg-white" style={{ minHeight: '800px' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">NAGARJUNA</h1>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">
            Institute of Engineering, Technology & Management
          </h2>
          <p className="text-sm text-gray-600 mb-1">
            (AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)
          </p>
          <p className="text-sm text-gray-600 mb-1">
            Village Satnavri, Amravati Road, Nagpur - 440023
          </p>
          <p className="text-sm text-gray-600">
            Email: maitrey.ngp@gmail.com, Website: www.maitrey.in, Phone No. 07118 322211, 322212
          </p>
        </div>

        {/* College Code */}
        <div className="mb-4">
          <p className="text-sm text-gray-700">College Code: 4192</p>
        </div>

        {/* Divider Line */}
        <hr className="border-gray-400 mb-6" />

        {/* Reference and Date */}
        <div className="flex justify-between mb-8">
          <p className="text-sm text-gray-700">Ref No.: NIETM / 2025-26</p>
          <p className="text-sm text-gray-700">Date: {formData.dateOfIssue}</p>
        </div>

        {/* Certificate Title */}
        <div className="flex justify-center mb-8">
          <div className="border-2 border-gray-400 px-6 py-2">
            <h3 className="text-xl font-bold text-gray-800">BONAFIDE CERTIFICATE</h3>
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-12">
          <p className="text-base text-gray-800 leading-relaxed text-justify">
            Certified that {studentTitle} <span className="font-semibold">{formData.studentName}</span> is a bonafide student of this college studying in{' '}
            <span className="font-semibold">{formData.course}</span> {formData.year} Year in {formData.semesterNumber} Sem in the session{' '}
            <span className="font-semibold">{formData.session}</span>. According to our college record {hisHer} date of birth is{' '}
            <span className="font-semibold">{formData.dateOfBirth}</span>. As far as known to me {heShe} bears{' '}
            <span className="font-semibold">{formData.conduct}</span>.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-24">
          <div>
            <p className="text-sm text-gray-700">Date: {formData.dateOfIssue}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-700">Checked by</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-700">Principal/Vice-Principal</p>
          </div>
        </div>
      </div>

      {/* Action Buttons
      <div className="mt-6 flex justify-center space-x-4">
        <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
          Download PDF
        </button>
        <button className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors">
          Print Certificate
        </button>
      </div> */}
    </div>
  );
};

export default BC;