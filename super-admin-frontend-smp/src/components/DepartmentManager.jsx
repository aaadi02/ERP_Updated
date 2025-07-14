// import { useEffect, useState } from "react";
// import axios from "axios";

// const DepartmentManager = () => {
//   const [streams, setStreams] = useState([]);
//   const [selectedStreamId, setSelectedStreamId] = useState("");
//   const [departments, setDepartments] = useState([]);
//   const [newDept, setNewDept] = useState("");
//   const [editingDeptId, setEditingDeptId] = useState(null);
//   const [editedDeptName, setEditedDeptName] = useState("");

//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     fetchStreams();
//   }, []);

//   useEffect(() => {
//     if (selectedStreamId) {
//       fetchDepartments(selectedStreamId);
//     }
//   }, [selectedStreamId]);

//   const fetchStreams = async () => {
//     try {
//       const res = await axios.get("http://localhost:5000/api/streams", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setStreams(res.data);
//       if (res.data.length > 0) {
//         setSelectedStreamId(res.data[0]._id);
//       }
//     } catch (err) {
//       console.error("Failed to fetch streams", err);
//     }
//   };

//   const fetchDepartments = async (streamId) => {
//     try {
//       const res = await axios.get(`http://localhost:5000/api/superadmin/departments?streamId=${streamId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setDepartments(res.data);
//     } catch (err) {
//       console.error("Failed to fetch departments", err);
//     }
//   };

//   const handleAddDept = async () => {
//     if (!newDept.trim() || !selectedStreamId) return;
//     try {
//       await axios.post(
//         "http://localhost:5000/api/superadmin/departments",
//         { name: newDept, stream: selectedStreamId },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setNewDept("");
//       fetchDepartments(selectedStreamId);
//     } catch (err) {
//       console.error("Error adding department", err);
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await axios.delete(`http://localhost:5000/api/superadmin/departments/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       fetchDepartments(selectedStreamId);
//     } catch (err) {
//       console.error("Error deleting department", err);
//     }
//   };

//   const handleEdit = async (id) => {
//     try {
//       await axios.put(
//         `http://localhost:5000/api/superadmin/departments/${id}`,
//         { name: editedDeptName, stream: selectedStreamId },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setEditingDeptId(null);
//       setEditedDeptName("");
//       fetchDepartments(selectedStreamId);
//     } catch (err) {
//       console.error("Error updating department", err);
//     }
//   };

//   return (
//     <div>
//       <h3>Manage Departments</h3>

//       <div>
//         <label>Select Stream:</label>
//         <select value={selectedStreamId} onChange={(e) => setSelectedStreamId(e.target.value)}>
//           {streams.map((stream) => (
//             <option key={stream._id} value={stream._id}>
//               {stream.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div style={{ marginTop: "1rem" }}>
//         <input
//           type="text"
//           placeholder="Add new department"
//           value={newDept}
//           onChange={(e) => setNewDept(e.target.value)}
//         />
//         <button onClick={handleAddDept}>Add Department</button>
//       </div>

//       <ul>
//         {departments.map((dept) => (
//           <li key={dept._id}>
//             {editingDeptId === dept._id ? (
//               <>
//                 <input
//                   type="text"
//                   value={editedDeptName}
//                   onChange={(e) => setEditedDeptName(e.target.value)}
//                 />
//                 <button onClick={() => handleEdit(dept._id)}>Save</button>
//                 <button onClick={() => setEditingDeptId(null)}>Cancel</button>
//               </>
//             ) : (
//               <>
//                 {dept.name}
//                 <button
//                   onClick={() => {
//                     setEditingDeptId(dept._id);
//                     setEditedDeptName(dept.name);
//                   }}
//                 >
//                   Edit
//                 </button>
//                 <button onClick={() => handleDelete(dept._id)}>Delete</button>
//               </>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default DepartmentManager;

import { useEffect, useState } from "react";
import axios from "axios";

const DepartmentManager = () => {
  const [streams, setStreams] = useState([]);
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editedDeptName, setEditedDeptName] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStreams();
  }, []);

  useEffect(() => {
    if (selectedStreamId) {
      fetchDepartments(selectedStreamId);
    }
  }, [selectedStreamId]);

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
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const handleAddDept = async () => {
    if (!newDept.trim() || !selectedStreamId) return;
    try {
      await axios.post(
        "http://localhost:5000/api/superadmin/departments",
        { name: newDept, stream: selectedStreamId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewDept("");
      fetchDepartments(selectedStreamId);
    } catch (err) {
      console.error("Error adding department", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/superadmin/departments/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDepartments(selectedStreamId);
    } catch (err) {
      console.error("Error deleting department", err);
    }
  };

  const handleEdit = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/superadmin/departments/${id}`,
        { name: editedDeptName, stream: selectedStreamId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingDeptId(null);
      setEditedDeptName("");
      fetchDepartments(selectedStreamId);
    } catch (err) {
      console.error("Error updating department", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      {/* Header */}
      <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
        Manage Departments
      </h3>

      {/* Stream Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Stream:
        </label>
        <select
          value={selectedStreamId}
          onChange={(e) => setSelectedStreamId(e.target.value)}
          className="w-full md:w-1/2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
        >
          {streams.map((stream) => (
            <option key={stream._id} value={stream._id}>
              {stream.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Department Form */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-grow">
            <label
              htmlFor="newDepartment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Department
            </label>
            <input
              id="newDepartment"
              type="text"
              placeholder="Enter department name"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
          </div>
          <button
            onClick={handleAddDept}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Add Department
          </button>
        </div>
      </div>

      {/* Departments List */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-3">
          Departments
        </h4>

        {departments.length === 0 ? (
          <p className="text-gray-500 italic">
            No departments found. Add one to get started.
          </p>
        ) : (
          <ul className="bg-gray-50 rounded-lg divide-y divide-gray-200">
            {departments.map((dept) => (
              <li key={dept._id} className="px-4 py-3">
                {editingDeptId === dept._id ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      value={editedDeptName}
                      onChange={(e) => setEditedDeptName(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 flex-grow"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(dept._id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm px-4 py-2 text-center"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDeptId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg text-sm px-4 py-2 text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">
                      {dept.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingDeptId(dept._id);
                          setEditedDeptName(dept.name);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg text-xs px-3 py-1.5 text-center"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept._id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg text-xs px-3 py-1.5 text-center"
                      >
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

export default DepartmentManager;
