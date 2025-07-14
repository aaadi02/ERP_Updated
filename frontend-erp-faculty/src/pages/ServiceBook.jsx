import { useState, useEffect } from "react";
import {
  Download,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  User,
  Calendar,
  Building,
  Mail,
  Phone,
} from "lucide-react";

export default function ServiceBook() {
  const [activeTab, setActiveTab] = useState("Employment");
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = ["Employment", "Qualifications", "Achievements", "Documents"];

  useEffect(() => {
    // Example: Fetch all service book data from backend
    const fetchServiceBook = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with your actual API endpoint and authentication if needed
        const res = await fetch("/api/servicebook");
        if (!res.ok) throw new Error("Failed to fetch service book data");
        const data = await res.json();
        setEmploymentHistory(data.employmentHistory || []);
        setQualifications(data.qualifications || []);
        setAchievements(data.achievements || []);
        setDocuments(data.documents || []);
      } catch (err) {
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchServiceBook();
  }, []);

  // Function to handle document download
  const handleDownload = (docName) => {
    // In a real app, this would trigger an actual file download
    // For this demo, we'll just show an alert
    alert(`Downloading ${docName}...`);
    // You would normally have code like:
    // const link = document.createElement('a');
    // link.href = documentUrl;
    // link.download = docName;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };

  // Function to handle service record export
  const handleExportServiceRecord = () => {
    alert("Exporting complete service record...");
    // In a real application, this would generate a PDF or other document format
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-800">Service Book</h1>
        <button
          onClick={handleExportServiceRecord}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <Download size={18} />
          <span>Export Service Record</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 mb-8 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Picture and Name Section */}
          <div className="flex flex-col items-center text-center md:w-1/4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl mb-4 shadow-md">
              JS
            </div>
            <h2 className="text-2xl font-bold mt-2 text-gray-800">
              John Smith
            </h2>
            <p className="text-gray-600">Associate Professor</p>
            <div className="mt-4">
              <span className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-full shadow-sm">
                Computer Science
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:w-3/4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-semibold text-gray-800">FAC-2020-045</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Joining</p>
                <p className="font-semibold text-gray-800">June 15, 2020</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Position</p>
                <p className="font-semibold text-gray-800">
                  Associate Professor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Building size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold text-gray-800">Computer Science</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-800">
                  john.smith@university.edu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-semibold text-gray-800">+91 98765 43210</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-8 py-4 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-500 hover:text-blue-500 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "Employment" && (
            <div>
              <div className="flex items-center mb-8">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600 mr-3">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Employment History
                </h3>
              </div>

              {/* Employment Timeline */}
              <div className="relative pl-10 border-l-2 border-blue-200">
                {employmentHistory.map((job, index) => (
                  <div key={index} className="mb-10 relative last:mb-0">
                    <div
                      className={`absolute -left-12 mt-1 w-6 h-6 rounded-full ${
                        job.isCurrent ? "bg-blue-600" : "bg-gray-300"
                      } border-4 border-white shadow-md`}
                    ></div>
                    <div
                      className={`p-6 rounded-xl ${
                        job.isCurrent
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      } transition-all hover:shadow-md`}
                    >
                      <h4 className="font-bold text-lg text-gray-800">
                        {job.position}
                      </h4>
                      <p className="text-blue-600 font-medium">
                        {job.organization}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{job.period}</p>
                      <p className="mt-3 text-gray-700">{job.description}</p>
                      {job.isCurrent && (
                        <div className="mt-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                            Current Position
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Qualifications" && (
            <div>
              <div className="flex items-center mb-8">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600 mr-3">
                  <GraduationCap size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Educational Qualifications
                </h3>
              </div>

              <div className="space-y-6">
                {qualifications.map((qual, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <h4 className="font-bold text-lg text-gray-800">
                      {qual.degree}
                    </h4>
                    <p className="text-blue-600 font-medium">
                      {qual.institution}
                    </p>
                    <div className="flex items-center mt-2">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <p className="text-sm text-gray-500">
                        Graduated {qual.year}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-gray-700">
                        <span className="font-medium">Specialization:</span>{" "}
                        {qual.specialization}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Achievements" && (
            <div>
              <div className="flex items-center mb-8">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600 mr-3">
                  <Award size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Awards & Recognitions
                </h3>
              </div>

              <div className="space-y-6">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg text-gray-800">
                        {achievement.title}
                      </h4>
                      <span className="bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
                        {achievement.year}
                      </span>
                    </div>
                    <p className="text-blue-600 font-medium mt-1">
                      {achievement.event}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-gray-700">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Documents" && (
            <div>
              <div className="flex items-center mb-8">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600 mr-3">
                  <FileText size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Document Repository
                </h3>
              </div>

              <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Document Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Size
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc, index) => (
                      <tr
                        key={index}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 mr-3 bg-blue-100 rounded text-blue-600">
                              <FileText size={16} />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {doc.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {doc.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-600">
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDownload(doc.name)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
