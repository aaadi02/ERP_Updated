import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MaterialList = ({ subject }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No authentication token found');
          setMaterials([]);
          setLoading(false);
          return;
        }

        // Fetch files for the logged-in student from their department
        const response = await axios.get('/api/files/student/my-files', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          let files = response.data.files || [];
          
          // Filter by subject if provided
          if (subject) {
            files = files.filter(file => 
              file.subject && file.subject.toLowerCase().includes(subject.toLowerCase())
            );
          }
          
          setMaterials(files);
        } else {
          console.error('Failed to fetch materials:', response.data.message);
          setMaterials([]);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [subject]);

  if (loading) return <div className="flex justify-center items-center p-4">Loading materials...</div>;
  if (!materials.length) return <div className="text-center text-gray-500 p-4">No study materials found{subject ? ` for ${subject}` : ''}.</div>;

  return (
    <div className="space-y-4">
      {materials.map(mat => (
        <div key={mat._id} className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 mb-2">{mat.title}</h3>
              <div className="text-sm text-gray-600 mb-2">
                <span className="inline-block mr-4">📚 Subject: {mat.subject || 'General'}</span>
                <span className="inline-block mr-4">🎓 Year: {mat.year}</span>
                <span className="inline-block mr-4">📝 Section: {mat.section}</span>
              </div>
              <div className="text-sm text-gray-500 mb-3">
                <span className="inline-block mr-4">👨‍🏫 Shared by: {mat.uploaderName || 'Faculty'}</span>
                <span className="inline-block mr-4">🏛️ Department: {mat.uploaderDepartment}</span>
                <span className="inline-block">📅 {new Date(mat.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href={`/api/files/download/${mat._id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              💾 Download
            </a>
            {mat.filePath && mat.filePath.toLowerCase().endsWith('.pdf') && (
              <a
                href={`/api/files/download/${mat._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                👁️ View PDF
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaterialList;