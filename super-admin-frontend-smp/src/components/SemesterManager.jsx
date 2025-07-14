import { useEffect, useState } from "react";
import axios from "axios";
import {
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  BookOpen,
  School,
} from "lucide-react";

const SemesterManager = () => {
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newSemester, setNewSemester] = useState({
    number: "",
    subjectIds: [],
  });
  const [editingSemester, setEditingSemester] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [semesterRes, subjectRes] = await Promise.all([
          axios.get(
            "http://localhost:5000/api/superadmin/semesters"
          ),
          axios.get(
            "http://localhost:5000/api/superadmin/subjects"
          ),
        ]);
        setSemesters(semesterRes.data);
        setSubjects(subjectRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingSemester) {
      setEditingSemester((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewSemester((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    if (editingSemester) {
      setEditingSemester((prev) => {
        // Merge previous and new, avoiding duplicates
        const prevIds = prev.subjectIds || [];
        const merged = Array.from(new Set([...prevIds, ...selectedOptions]));
        return { ...prev, subjectIds: merged };
      });
    } else {
      setNewSemester((prev) => ({ ...prev, subjectIds: selectedOptions }));
    }
  };

  const handleCreateSemester = async () => {
    if (
      !newSemester.number ||
      isNaN(newSemester.number) ||
      newSemester.number < 1 ||
      newSemester.number > 9
    ) {
      setError("Semester number must be between 1 and 9");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/superadmin/semesters",
        {
          number: Number(newSemester.number),
          subjectIds: newSemester.subjectIds,
        }
      );
      setSemesters([...semesters, res.data]);
      setNewSemester({ number: "", subjectIds: [] });
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create semester");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSemester = (semester) => {
    setEditingSemester({
      _id: semester._id,
      number: semester.number,
      subjectIds: semester.subjects.map((sub) => sub._id),
    });
    setError("");
  };

  const handleUpdateSemester = async () => {
    if (
      !editingSemester.number ||
      isNaN(editingSemester.number) ||
      editingSemester.number < 1 ||
      editingSemester.number > 9
    ) {
      setError("Semester number must be between 1 and 9");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/superadmin/semesters/${editingSemester._id}`,
        {
          number: Number(editingSemester.number),
          subjectIds: editingSemester.subjectIds,
        }
      );
      setSemesters(
        semesters.map((sem) => (sem._id === res.data._id ? res.data : sem))
      );
      setEditingSemester(null);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to update semester");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSemester = async (semesterId) => {
    if (!window.confirm("Are you sure you want to delete this semester?"))
      return;

    setLoading(true);
    try {
      await axios.delete(
        `http://localhost:5000/api/superadmin/semesters/${semesterId}`
      );
      setSemesters(semesters.filter((semester) => semester._id !== semesterId));
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to delete semester");
    } finally {
      setLoading(false);
    }
  };

  // Helper to group subjects by department
  const groupSubjectsByDepartment = (subjects) => {
    const grouped = {};
    subjects.forEach((subject) => {
      const deptName = subject.department?.name || "N/A";
      if (!grouped[deptName]) grouped[deptName] = [];
      grouped[deptName].push(subject);
    });
    return grouped;
  };

  // Get all unique department names (including those with no subjects)
  const allDepartments = Array.from(
    new Set(subjects.map((s) => s.department?.name || "N/A"))
  );

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <School className="mr-2 h-6 w-6 text-emerald-600" />
        Manage Semesters
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center">
          <X className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 text-emerald-600 animate-spin mr-2" />
          <span className="text-gray-600">Loading...</span>
        </div>
      )}

      {/* Create/Edit Form */}
      <div className="bg-gray-50 p-5 rounded-lg mb-8 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          {editingSemester ? (
            <>
              <Edit2 className="mr-2 h-5 w-5 text-amber-500" />
              Edit Semester
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5 text-emerald-600" />
              Create Semester
            </>
          )}
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester Number (1-9)
            </label>
            <input
              type="number"
              name="number"
              value={
                editingSemester ? editingSemester.number : newSemester.number
              }
              onChange={handleInputChange}
              placeholder="Enter semester number"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="1"
              max="9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subjects
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-white max-h-48 overflow-y-auto">
              {allDepartments.map((dept) => {
                const deptSubjects = subjects.filter(
                  (s) => (s.department?.name || "N/A") === dept
                );
                return (
                  <div key={dept} className="mb-3">
                    <div className="font-semibold text-emerald-700 mb-1">
                      {dept}
                    </div>
                    {deptSubjects.length > 0 ? (
                      deptSubjects.map((subject) => {
                        // Determine if subject is selected
                        const selectedIds = editingSemester
                          ? editingSemester.subjectIds
                          : newSemester.subjectIds;
                        const checked = selectedIds.includes(subject._id);
                        return (
                          <label
                            key={subject._id}
                            className="flex items-center gap-2 mb-1 cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              value={subject._id}
                              checked={checked}
                              disabled={loading}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (editingSemester) {
                                  setEditingSemester((prev) => {
                                    let newIds = prev.subjectIds || [];
                                    if (isChecked) {
                                      newIds = [...newIds, subject._id];
                                    } else {
                                      newIds = newIds.filter(
                                        (id) => id !== subject._id
                                      );
                                    }
                                    return { ...prev, subjectIds: newIds };
                                  });
                                } else {
                                  setNewSemester((prev) => {
                                    let newIds = prev.subjectIds || [];
                                    if (isChecked) {
                                      newIds = [...newIds, subject._id];
                                    } else {
                                      newIds = newIds.filter(
                                        (id) => id !== subject._id
                                      );
                                    }
                                    return { ...prev, subjectIds: newIds };
                                  });
                                }
                              }}
                            />
                            {subject.name}
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-400 italic">None</div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select or deselect subjects using checkboxes.
            </p>
            {/* Show selected subjects */}
            <div className="mt-2">
              <span className="text-xs text-gray-700 font-semibold">
                Selected Subjects:{" "}
              </span>
              <span className="text-xs text-gray-600">
                {(editingSemester
                  ? editingSemester.subjectIds
                  : newSemester.subjectIds
                )
                  .map((id) => {
                    const subj = subjects.find((s) => s._id === id);
                    return subj ? subj.name : null;
                  })
                  .filter(Boolean)
                  .join(", ") || (
                  <span className="italic text-gray-400">None</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {editingSemester ? (
            <>
              <button
                onClick={handleUpdateSemester}
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Check className="mr-1 h-4 w-4" />
                Update Semester
              </button>
              <button
                onClick={() => setEditingSemester(null)}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCreateSemester}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <PlusCircle className="mr-1 h-4 w-4" />
              Create Semester
            </button>
          )}
        </div>
      </div>

      {/* Semester List */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-emerald-600" />
          Semester List
        </h3>

        {semesters.length === 0 && !loading ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No semesters found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {semesters.map((semester) => (
              <div
                key={semester._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 text-lg font-semibold h-8 w-8 rounded-full mr-2">
                          {semester.number}
                        </span>
                        <h4 className="text-lg font-semibold text-gray-800">
                          Semester {semester.number}
                        </h4>
                      </div>

                      {semester.subjects.length > 0 ? (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Subjects:
                          </h5>
                          <ul className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                            {semester.subjects.map((subject) => {
                              // Find the subject in the global subjects list to get the department if missing
                              const fullSubject =
                                subjects.find((s) => s._id === subject._id) ||
                                subject;
                              return (
                                <li
                                  key={subject._id}
                                  className="py-1 px-2 text-sm text-gray-700 border-b border-gray-100 last:border-0"
                                >
                                  <span className="font-medium">
                                    {subject.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    (Dept:{" "}
                                    {fullSubject.department?.name || "N/A"})
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500 italic">
                          No subjects assigned.
                        </p>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 self-end md:self-start">
                      <button
                        onClick={() => handleEditSemester(semester)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded flex items-center text-sm font-medium transition-colors"
                        disabled={loading}
                      >
                        <Edit2 className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSemester(semester._id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded flex items-center text-sm font-medium transition-colors"
                        disabled={loading}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SemesterManager;
