import React, { useState, useEffect, useRef } from "react";

const API_BASE = "/api/files"; // Adjust if your backend route is different

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [department, setDepartment] = useState(""); // Added department state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectsTaught, setSubjectsTaught] = useState([]);
  const fileInputRef = useRef();

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    // Fetch subjects and department from backend
    const fetchSubjectsAndDepartment = async () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log(
          "Fetching user data with token:",
          token ? "Token exists" : "No token"
        );
        const response = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Profile response status:", response.status);
        if (response.ok) {
          const userData = await response.json();
          console.log("User data:", userData);
          
          // Set department automatically
          const userDepartment = userData.department || "Unknown Department";
          setDepartment(userDepartment);
          console.log("User department:", userDepartment);
          
          let subjects = userData.subjectsTaught || [];
          console.log("Raw subjects:", subjects);
          // Normalize to array of strings
          if (
            subjects.length &&
            typeof subjects[0] === "object" &&
            subjects[0] !== null
          ) {
            subjects = subjects.map((s) => s.name || s);
          }
          console.log("Processed subjects:", subjects);
          setSubjectsTaught(subjects);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchSubjectsAndDepartment();
  }, []);

  const fetchFiles = async () => {
    setError("");
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      } else {
        setError(data.message || "Failed to fetch files");
      }
    } catch {
      setError("Failed to fetch files");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!title || !file || !year || !section || !subject || !department) {
      setError(
        "Please provide a material title, select subject, ensure department is loaded, target year, section, and choose a file to share."
      );
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("year", year);
    formData.append("section", section);
    formData.append("department", department); // Added department to form data
    formData.append("file", file);
    formData.append("subject", subject);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(API_BASE, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Study material "${title}" shared successfully with ${section === 'ALL' ? 'all sections of' : 'section ' + section} Year ${year} students in ${department} department for ${subject}!`);
        setTitle("");
        setYear("");
        setSection("");
        setSubject("");
        setFile(null);
        fileInputRef.current.value = "";
        fetchFiles();
      } else {
        setError(data.message || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to remove this study material? Students will no longer be able to access it.")) return;
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Study material removed successfully.");
        fetchFiles();
      } else {
        setError(data.message || "Delete failed");
      }
    } catch {
      setError("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
            📚 Share Study Materials with Students
          </h1>
          <p className="text-center text-gray-600 text-lg">
            Upload and share documents, notes, assignments, and study materials with your students
          </p>
        </div>

        {/* Upload Form Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-6">
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <input
            type="text"
            className="rounded-lg px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="📋 Material Title (e.g., Unit 1 Notes, Assignment 2, Lab Manual)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            required
          />
          <select
            className="rounded-lg px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={uploading}
            required
          >
            <option value="" className="bg-white text-gray-800">
              📚 Select Subject ({subjectsTaught.length} subjects available)
            </option>
            {subjectsTaught.map((subj, idx) => (
              <option key={idx} value={subj} className="bg-white text-gray-800">
                📖 {subj}
              </option>
            ))}
          </select>
          <div className="rounded-lg px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">🏛️ Department:</span>
              <span className="font-semibold text-gray-800">
                {department || "Loading department..."}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              📝 Department is automatically detected from your profile
            </div>
          </div>
          <select
            className="rounded-lg px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={uploading}
            required
          >
            <option value="" className="bg-white text-gray-800">🎓 Select Target Year</option>
            <option value="1" className="bg-white text-gray-800">1️⃣ 1st Year Students</option>
            <option value="2" className="bg-white text-gray-800">2️⃣ 2nd Year Students</option>
            <option value="3" className="bg-white text-gray-800">3️⃣ 3rd Year Students</option>
            <option value="4" className="bg-white text-gray-800">4️⃣ 4th Year Students</option>
          </select>
          <select
            className="rounded-lg px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={uploading}
            required
          >
            <option value="" className="bg-white text-gray-800">📝 Select Target Section</option>
            <option value="A" className="bg-white text-gray-800">📑 Section A</option>
            <option value="B" className="bg-white text-gray-800">📑 Section B</option>
            <option value="C" className="bg-white text-gray-800">📑 Section C</option>
            <option value="D" className="bg-white text-gray-800">📑 Section D</option>
            <option value="ALL" className="bg-white text-gray-800">📋 All Sections (Broadcast to all)</option>
          </select>
          <input
            type="file"
            className="rounded-lg px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 file:bg-blue-600 file:text-white file:rounded-lg file:px-4 file:py-2 file:border-0 file:mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={uploading}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip,.rar"
            title="📎 Accepted formats: PDF, Word, PowerPoint, Text, Images, Archives"
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            💡 <strong>Tip:</strong> Students will only see materials for subjects they study and their respective year/section
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                📚 Share with Students
              </>
            )}
          </button>
        </form>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4 text-center">
            {success}
          </div>
        )}
      </div>

      {/* Files List Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📁 Shared Study Materials
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Materials you've shared with your students across different subjects and classes
        </p>
        {files.length === 0 ? (
          <div className="text-gray-500 text-center bg-gray-50 rounded-lg py-12 border border-gray-200">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl">No study materials shared yet</p>
            <p className="text-sm opacity-75 mt-2">Start by uploading your first document!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between bg-white rounded-lg px-6 py-4 border border-gray-200 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-lg mb-2 flex items-center gap-2">
                    📄 {f.title}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    📚 Subject: {f.subject || "General"} • 🎓 Year {f.year || "N/A"} • 📝 Section {f.section || "All"}
                    {f.uploaderDepartment && (
                      <> • 🏛️ Department: {f.uploaderDepartment}</>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    👨‍🏫 Shared by: {f.uploaderName || "You"} • 📅{" "}
                    {new Date(f.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-3 ml-4">
                  <a
                    href={f.url || `${API_BASE}/download/${f._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md"
                  >
                    💾 Download
                  </a>
                  <button
                    onClick={() => handleDelete(f._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default FilesPage;
