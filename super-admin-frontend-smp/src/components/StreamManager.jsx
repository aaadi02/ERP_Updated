import React, { useEffect, useState } from "react";
import { PlusCircle, Edit2, Trash2, Save, X, Loader } from "lucide-react";

const StreamManager = () => {
  const [streams, setStreams] = useState([]);
  const [newStream, setNewStream] = useState({ name: "", description: "" });
  const [editingStream, setEditingStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        // Keep the original API call logic
        const res = await fetch(
          "http://localhost:5000/api/streams"
        );
        const data = await res.json();
        setStreams(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const handleCreateStream = async () => {
    try {
      // Keep the original API call logic
      const res = await fetch(
        "http://localhost:5000/api/streams",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newStream),
        }
      );
      const data = await res.json();
      setStreams([...streams, data]);
      setNewStream({ name: "", description: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditStream = (stream) => {
    setEditingStream(stream);
  };

  const handleSaveStream = async () => {
    try {
      // Keep the original API call logic
      const res = await fetch(
        `http://localhost:5000/api/streams/${editingStream._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingStream),
        }
      );
      const data = await res.json();
      setStreams(streams.map((s) => (s._id === data._id ? data : s)));
      setEditingStream(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStream = async (id) => {
    try {
      // Keep the original API call logic
      await fetch(`http://localhost:5000/api/streams/${id}`, {
        method: "DELETE",
      });
      setStreams(streams.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
        Stream Manager
      </h2>

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
