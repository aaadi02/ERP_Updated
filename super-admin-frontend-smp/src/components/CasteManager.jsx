// import { useEffect, useState } from "react";
// import axios from "axios";

// const CasteManager = () => {
//   const [castes, setCastes] = useState([]);
//   const [newCaste, setNewCaste] = useState("");
//   const [editingCaste, setEditingCaste] = useState(null);
//   const [editedName, setEditedName] = useState("");
//   const [subcasteInput, setSubcasteInput] = useState({});
//   const [editingSubcaste, setEditingSubcaste] = useState({});
//   const [editedSubcasteName, setEditedSubcasteName] = useState({});

//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     fetchCastes();
//   }, []);

//   const fetchCastes = async () => {
//     try {
//       const res = await axios.get(
//         "http://localhost:5000/api/superadmin/castes",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setCastes(res.data);
//     } catch (err) {
//       console.error("Error fetching castes:", err);
//     }
//   };

//   const handleAddCaste = async () => {
//     if (!newCaste.trim()) return;
//     try {
//       await axios.post(
//         "http://localhost:5000/api/superadmin/castes",
//         { name: newCaste },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setNewCaste("");
//       fetchCastes();
//     } catch (err) {
//       console.error("Error adding caste:", err);
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await axios.delete(
//         `http://localhost:5000/api/superadmin/castes/${id}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       fetchCastes();
//     } catch (err) {
//       console.error("Error deleting caste:", err);
//     }
//   };

//   const handleEdit = async (id) => {
//     if (!editedName.trim()) return;
//     try {
//       await axios.put(
//         `http://localhost:5000/api/superadmin/castes/${id}`,
//         { name: editedName },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setEditingCaste(null);
//       setEditedName("");
//       fetchCastes();
//     } catch (err) {
//       console.error("Error updating caste:", err);
//     }
//   };

//   const handleAddSubcaste = async (casteId) => {
//     const sub = subcasteInput[casteId]?.trim();
//     if (!sub) return;
//     const caste = castes.find((c) => c._id === casteId);
//     const updatedSubs = [...(caste.subcastes || []), sub];
//     try {
//       await axios.put(
//         `http://localhost:5000/api/superadmin/castes/${casteId}/subcastes`,
//         { subcastes: updatedSubs },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setSubcasteInput((prev) => ({ ...prev, [casteId]: "" }));
//       fetchCastes();
//     } catch (err) {
//       console.error("Error adding subcaste:", err);
//     }
//   };

//   const handleEditSubcaste = async (casteId, index) => {
//     const caste = castes.find((c) => c._id === casteId);
//     const newName = editedSubcasteName[casteId]?.trim();
//     if (!newName) return;

//     const updatedSubcastes = [...(caste.subcastes || [])];
//     updatedSubcastes[index] = newName;

//     try {
//       await axios.put(
//         `http://localhost:5000/api/superadmin/castes/${casteId}/subcastes`,
//         { subcastes: updatedSubcastes },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setEditingSubcaste((prev) => ({ ...prev, [casteId]: null }));
//       setEditedSubcasteName((prev) => ({ ...prev, [casteId]: "" }));
//       fetchCastes();
//     } catch (err) {
//       console.error("Error editing subcaste:", err);
//     }
//   };

//   const handleDeleteSubcaste = async (casteId, index) => {
//     const caste = castes.find((c) => c._id === casteId);
//     const updatedSubcastes = caste.subcastes.filter((_, i) => i !== index);
//     try {
//       await axios.put(
//         `http://localhost:5000/api/superadmin/castes/${casteId}/subcastes`,
//         { subcastes: updatedSubcastes },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       fetchCastes();
//     } catch (err) {
//       console.error("Error deleting subcaste:", err);
//     }
//   };

//   return (
//     <div>
//       <h3>Manage Castes & Subcastes</h3>
//       <input
//         type="text"
//         placeholder="Add new caste"
//         value={newCaste}
//         onChange={(e) => setNewCaste(e.target.value)}
//       />
//       <button onClick={handleAddCaste}>Add Caste</button>

//       <ul>
//         {castes.map((caste) => (
//           <li key={caste._id}>
//             {editingCaste === caste._id ? (
//               <>
//                 <input
//                   type="text"
//                   value={editedName}
//                   onChange={(e) => setEditedName(e.target.value)}
//                 />
//                 <button onClick={() => handleEdit(caste._id)}>Save</button>
//                 <button onClick={() => setEditingCaste(null)}>Cancel</button>
//               </>
//             ) : (
//               <>
//                 <strong>{caste.name}</strong>
//                 <button
//                   onClick={() => {
//                     setEditingCaste(caste._id);
//                     setEditedName(caste.name);
//                   }}
//                 >
//                   Edit
//                 </button>
//                 <button onClick={() => handleDelete(caste._id)}>Delete</button>
//               </>
//             )}

//             <ul>
//               {(caste.subcastes || []).map((sc, idx) => (
//                 <li key={idx}>
//                   {editingSubcaste[caste._id] === idx ? (
//                     <>
//                       <input
//                         type="text"
//                         value={editedSubcasteName[caste._id] || ""}
//                         onChange={(e) =>
//                           setEditedSubcasteName((prev) => ({
//                             ...prev,
//                             [caste._id]: e.target.value,
//                           }))
//                         }
//                       />
//                       <button onClick={() => handleEditSubcaste(caste._id, idx)}>
//                         Save
//                       </button>
//                       <button
//                         onClick={() =>
//                           setEditingSubcaste((prev) => ({
//                             ...prev,
//                             [caste._id]: null,
//                           }))
//                         }
//                       >
//                         Cancel
//                       </button>
//                     </>
//                   ) : (
//                     <>
//                       {sc}
//                       <button
//                         onClick={() => {
//                           setEditingSubcaste((prev) => ({
//                             ...prev,
//                             [caste._id]: idx,
//                           }));
//                           setEditedSubcasteName((prev) => ({
//                             ...prev,
//                             [caste._id]: sc,
//                           }));
//                         }}
//                       >
//                         Edit
//                       </button>
//                       <button onClick={() => handleDeleteSubcaste(caste._id, idx)}>
//                         Delete
//                       </button>
//                     </>
//                   )}
//                 </li>
//               ))}
//             </ul>

//             <input
//               type="text"
//               placeholder="Add subcaste"
//               value={subcasteInput[caste._id] || ""}
//               onChange={(e) =>
//                 setSubcasteInput((prev) => ({
//                   ...prev,
//                   [caste._id]: e.target.value,
//                 }))
//               }
//             />
//             <button onClick={() => handleAddSubcaste(caste._id)}>
//               Add Subcaste
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default CasteManager;

import { useEffect, useState } from "react";
import axios from "axios";

const CasteManager = () => {
  const [castes, setCastes] = useState([]);
  const [newCaste, setNewCaste] = useState("");
  const [editingCaste, setEditingCaste] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [subcasteInput, setSubcasteInput] = useState({});
  const [editingSubcaste, setEditingSubcaste] = useState({});
  const [editedSubcasteName, setEditedSubcasteName] = useState({});
  const [expandedCaste, setExpandedCaste] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCastes();
  }, []);

  const fetchCastes = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/superadmin/castes",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCastes(res.data);
    } catch (err) {
      console.error("Error fetching castes:", err);
    }
  };

  const handleAddCaste = async () => {
    if (!newCaste.trim()) return;
    try {
      await axios.post(
        "http://localhost:5000/api/superadmin/castes",
        { name: newCaste },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewCaste("");
      fetchCastes();
    } catch (err) {
      console.error("Error adding caste:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/superadmin/castes/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCastes();
    } catch (err) {
      console.error("Error deleting caste:", err);
    }
  };

  const handleEdit = async (id) => {
    if (!editedName.trim()) return;
    try {
      await axios.put(
        `http://localhost:5000/api/superadmin/castes/${id}`,
        { name: editedName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingCaste(null);
      setEditedName("");
      fetchCastes();
    } catch (err) {
      console.error("Error updating caste:", err);
    }
  };

  const handleAddSubcaste = async (casteId) => {
    const sub = subcasteInput[casteId]?.trim();
    if (!sub) return;
    const caste = castes.find((c) => c._id === casteId);
    const updatedSubs = [...(caste.subcastes || []), sub];
    try {
      await axios.put(
        `http://localhost:5000/api/superadmin/castes/${casteId}/subcastes`,
        { subcastes: updatedSubs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubcasteInput((prev) => ({ ...prev, [casteId]: "" }));
      fetchCastes();
    } catch (err) {
      console.error("Error adding subcaste:", err);
    }
  };

  const handleEditSubcaste = async (casteId, index) => {
    const caste = castes.find((c) => c._id === casteId);
    const newName = editedSubcasteName[casteId]?.trim();
    if (!newName) return;

    const updatedSubcastes = [...(caste.subcastes || [])];
    updatedSubcastes[index] = newName;

    try {
      await axios.put(
        `http://localhost:5000/api/superadmin/castes/${casteId}/subcastes`,
        { subcastes: updatedSubcastes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingSubcaste((prev) => ({ ...prev, [casteId]: null }));
      setEditedSubcasteName((prev) => ({ ...prev, [casteId]: "" }));
      fetchCastes();
    } catch (err) {
      console.error("Error editing subcaste:", err);
    }
  };

  const handleDeleteSubcaste = async (casteId, index) => {
    const caste = castes.find((c) => c._id === casteId);
    const updatedSubcastes = caste.subcastes.filter((_, i) => i !== index);
    try {
      await axios.put(
        `http://localhost:5000/api/superadmin/castes/${casteId}/subcastes`,
        { subcastes: updatedSubcastes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCastes();
    } catch (err) {
      console.error("Error deleting subcaste:", err);
    }
  };

  const toggleExpandCaste = (casteId) => {
    setExpandedCaste(expandedCaste === casteId ? null : casteId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
        Manage Castes & Subcastes
      </h1>

      {/* Add Caste Form */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-grow">
            <label
              htmlFor="newCaste"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Add New Caste
            </label>
            <input
              id="newCaste"
              type="text"
              placeholder="Enter caste name"
              value={newCaste}
              onChange={(e) => setNewCaste(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAddCaste}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          >
            Add Caste
          </button>
        </div>
      </div>

      {/* Castes List */}
      <div className="space-y-4">
        {castes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No castes found. Add your first caste above.
          </p>
        ) : (
          castes.map((caste) => (
            <div
              key={caste._id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-100 p-4">
                {editingCaste === caste._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleEdit(caste._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCaste(null)}
                      className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpandCaste(caste._id)}
                        className="text-gray-700 hover:text-gray-900"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 transition-transform ${
                            expandedCaste === caste._id
                              ? "transform rotate-90"
                              : ""
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <h3 className="text-lg font-semibold">{caste.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {(caste.subcastes || []).length} subcastes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCaste(caste._id);
                          setEditedName(caste.name);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(caste._id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {expandedCaste === caste._id && (
                <div className="p-4">
                  {/* Subcastes List */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Subcastes
                    </h4>
                    {(caste.subcastes || []).length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No subcastes added yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {(caste.subcastes || []).map((sc, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                          >
                            {editingSubcaste[caste._id] === idx ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type="text"
                                  value={editedSubcasteName[caste._id] || ""}
                                  onChange={(e) =>
                                    setEditedSubcasteName((prev) => ({
                                      ...prev,
                                      [caste._id]: e.target.value,
                                    }))
                                  }
                                  className="flex-grow px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                />
                                <button
                                  onClick={() =>
                                    handleEditSubcaste(caste._id, idx)
                                  }
                                  className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() =>
                                    setEditingSubcaste((prev) => ({
                                      ...prev,
                                      [caste._id]: null,
                                    }))
                                  }
                                  className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-gray-800">{sc}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingSubcaste((prev) => ({
                                        ...prev,
                                        [caste._id]: idx,
                                      }));
                                      setEditedSubcasteName((prev) => ({
                                        ...prev,
                                        [caste._id]: sc,
                                      }));
                                    }}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Edit"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteSubcaste(caste._id, idx)
                                    }
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Delete"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Add Subcaste Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new subcaste"
                      value={subcasteInput[caste._id] || ""}
                      onChange={(e) =>
                        setSubcasteInput((prev) => ({
                          ...prev,
                          [caste._id]: e.target.value,
                        }))
                      }
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={() => handleAddSubcaste(caste._id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CasteManager;
