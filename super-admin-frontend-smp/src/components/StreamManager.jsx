import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Edit2, Trash2, Save, X, Loader } from "lucide-react";

const StreamManager = () => {
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [newStream, setNewStream] = useState({ name: "", description: "" });
  const [editingStream, setEditingStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem('token');
      navigate('/');
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const res = await fetch(
          "/api/superadmin/streams",
          { headers }
        );
        
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        
        const data = await res.json();
        setStreams(data);
        setLoading(false);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to fetch streams");
        setLoading(false);
      }
    };

    fetchStreams();
  }, [navigate]);

  const handleCreateStream = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(
        "/api/superadmin/streams",
        {
          method: "POST",
          headers,
          body: JSON.stringify(newStream),
        }
      );
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      
      const data = await res.json();
      setStreams([...streams, data]);
      setNewStream({ name: "", description: "" });
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to create stream");
    }
  };

  const handleEditStream = (stream) => {
    setEditingStream(stream);
  };

  const handleSaveStream = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(
        `/api/superadmin/streams/${editingStream._id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(editingStream),
        }
      );
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      
      const data = await res.json();
      setStreams(streams.map((s) => (s._id === data._id ? data : s)));
      setEditingStream(null);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to update stream");
    }
  };

  const handleDeleteStream = async (id) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`/api/superadmin/streams/${id}`, {
        method: "DELETE",
        headers,
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      
      setStreams(streams.filter((s) => s._id !== id));
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to delete stream");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
        Stream Manager
      </h2>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Create Stream Section */}
      <div className="mb-8 bg-gray-50 p-5 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Create Stream
        </h3>
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <input
            type="text"
            value={newStream.name}
            onChange={(e) =>
              setNewStream({ ...newStream, name: e.target.value })
            }
            placeholder="Stream Name"
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
          <input
            type="text"
            value={newStream.description}
            onChange={(e) =>
              setNewStream({ ...newStream, description: e.target.value })
            }
            placeholder="Stream Description"
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
          <button
            onClick={handleCreateStream}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200 flex items-center justify-center"
            disabled={!newStream.name.trim()}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Stream
          </button>
        </div>
      </div>

      {/* Stream List Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Existing Streams
        </h3>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading streams...</span>
          </div>
        ) : streams.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            No streams found. Create one to get started.
          </div>
        ) : (
          <ul className="space-y-3">
            {streams.map((stream) => (
              <li
                key={stream._id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {editingStream && editingStream._id === stream._id ? (
                  <div className="p-4 bg-blue-50">
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        value={editingStream.name}
                        onChange={(e) =>
                          setEditingStream({
                            ...editingStream,
                            name: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Stream Name"
                      />
                      <input
                        type="text"
                        value={editingStream.description}
                        onChange={(e) =>
                          setEditingStream({
                            ...editingStream,
                            description: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Stream Description"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveStream}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingStream(null)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md flex items-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-3 md:mb-0">
                      <h4 className="font-medium text-gray-800">
                        {stream.name}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {stream.description}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStream(stream)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded flex items-center"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStream(stream._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StreamManager;
