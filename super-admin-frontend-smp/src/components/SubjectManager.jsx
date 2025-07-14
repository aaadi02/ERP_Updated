import { useEffect, useState } from "react";
import axios from "axios";

const SubjectManager = () => {
  const [streams, setStreams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editedSubjectName, setEditedSubjectName] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStreams();
  }, []);

  useEffect(() => {
    if (selectedStreamId) {
      fetchDepartments(selectedStreamId);
    }
  }, [selectedStreamId]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchSubjects(selectedDepartmentId);
    }
  }, [selectedDepartmentId]);

  const fetchStreams = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/streams",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStreams(res.data);
      if (res.data.length > 0) {
        setSelectedStreamId(res.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch streams", err);
    }
  };

  const fetchDepartments = async (streamId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/superadmin/departments?streamId=${streamId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDepartments(res.data);
      if (res.data.length > 0) {
        setSelectedDepartmentId(res.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchSubjects = async (departmentId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/superadmin/subjects?departmentId=${departmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSubjects(res.data);
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim() || !selectedDepartmentId) return;
    try {
      await axios.post(
        "http://localhost:5000/api/superadmin/subjects",
        { name: newSubject, department: selectedDepartmentId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewSubject("");
      fetchSubjects(selectedDepartmentId);
    } catch (err) {
      console.error("Error adding subject", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/superadmin/subjects/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchSubjects(selectedDepartmentId);
    } catch (err) {
      console.error("Error deleting subject", err);
    }
  };

  const handleEdit = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/superadmin/subjects/${id}`,
        { name: editedSubjectName, department: selectedDepartmentId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingSubjectId(null);
      setEditedSubjectName("");
      fetchSubjects(selectedDepartmentId);
    } catch (err) {
      console.error("Error updating subject", err);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto my-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
        Manage Subjects
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Select Stream
          </label>
          <select
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          >
            {streams.map((stream) => (
              <option key={stream._id} value={stream._id}>
                {stream.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Select Department
          </label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          >
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
        <input
          type="text"
          placeholder="Add new subject"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAddSubject}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 ease-in-out shadow-sm"
        >
          Add Subject
        </button>
      </div>

      {subjects.length > 0 ? (
        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {subjects.map((subject) => (
              <li
                key={subject._id}
                className="p-4 hover:bg-gray-100 transition duration-150 ease-in-out"
              >
                <div className="flex justify-between items-center">
                  {editingSubjectId === subject._id ? (
                    <div className="flex flex-1 items-center gap-3">
                      <input
                        type="text"
                        value={editedSubjectName}
                        onChange={(e) => setEditedSubjectName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md py-1.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleEdit(subject._id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-4 rounded-md transition duration-200 ease-in-out text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSubjectId(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1.5 px-4 rounded-md transition duration-200 ease-in-out text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-800 font-medium text-lg">
                        {subject.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSubjectId(subject._id);
                            setEditedSubjectName(subject.name);
                          }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-1.5 px-4 rounded-md transition duration-200 ease-in-out text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject._id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1.5 px-4 rounded-md transition duration-200 ease-in-out text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No subjects found for this department.
          </p>
          <p className="text-gray-500 mt-2">
            Add a new subject to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;
