import { useState, useEffect } from "react";
import { X, Search, Plus, Filter } from "lucide-react";

export default function FacultyManagementPage() {
  // Teaching roles categorized
  const teachingRoles = {
    "Professors (Senior Faculty)": [
      "Professor",
      "Associate Professor",
      "Assistant Professor",
    ],
    "Lecturers / Teaching Fellows": [
      "Senior Lecturer",
      "Lecturer",
      "Assistant Lecturer",
      "Ad-hoc Lecturer",
      "Guest Lecturer",
    ],
    "Non-Regular/Contractual Staff": [
      "Visiting Faculty",
      "Contractual Faculty",
    ],
    "Teaching Assistants / Academic Support": [
      "Teaching Assistant",
      "Research Assistant",
    ],
    "Department Heads / Deans": ["Head of Department", "Dean"],
  };

  // Non-teaching roles categorized
  const nonTeachingRoles = {
    "Administrative Staff": [
      "Registrar",
      "Office Superintendent",
      "Administrative Officer",
      "Senior Clerk",
      "Junior Clerk",
      "Accounts Officer",
      "Accountant",
      "Cashier",
      "Data Entry Operator",
    ],
    "Library Staff": [
      "Librarian",
      "Assistant Librarian",
      "Library Assistant",
      "Library Attendant",
    ],
    "Laboratory & Technical Staff": [
      "Lab Technician",
      "Lab Assistant",
      "Technical Assistant",
      "System Administrator",
      "Network Technician",
    ],
    "Maintenance and Support Staff": [
      "Electrician",
      "Plumber",
      "Carpenter",
      "Maintenance Supervisor",
      "Multitasking Staff",
    ],
    "Security & Safety": [
      "Security Officer",
      "Security Guard",
      "Fire Safety Officer",
    ],
    "Housekeeping & General Services": [
      "Housekeeping Supervisor",
      "Cleaning Staff",
      "Gardener",
      "Driver",
      "Peon",
      "Attendant",
    ],
    "IT & Communication Support": [
      "IT Administrator",
      "Web Administrator",
      "Audio-Visual Technician",
      "Helpdesk Staff",
    ],
    "Medical & Welfare Staff": [
      "College Nurse",
      "Medical Officer",
      "Counselor",
      "Student Welfare Officer",
    ],
  };

  const allTeachingRoles = Object.values(teachingRoles).flat();
  const allNonTeachingRoles = Object.values(nonTeachingRoles).flat();

  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleCategory, setRoleCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch faculty data from backend API
    const fetchFaculty = async () => {
      try {
        const response = await fetch("/api/faculty"); // Adjust the API endpoint as needed
        const data = await response.json();
        setFaculty(data);
      } catch (error) {
        console.error("Error fetching faculty data:", error);
      }
    };

    fetchFaculty();
  }, []);

  const getRoleCategories = () => {
    if (typeFilter === "teaching" || typeFilter === "all") {
      return Object.keys(teachingRoles);
    } else if (typeFilter === "non-teaching") {
      return Object.keys(nonTeachingRoles);
    }
    return [];
  };

  const getRolesByCategory = () => {
    if (roleCategory === "all") return [];
    if (
      typeFilter === "teaching" ||
      (typeFilter === "all" && teachingRoles[roleCategory])
    ) {
      return teachingRoles[roleCategory] || [];
    } else if (
      typeFilter === "non-teaching" ||
      (typeFilter === "all" && nonTeachingRoles[roleCategory])
    ) {
      return nonTeachingRoles[roleCategory] || [];
    }
    return [];
  };

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    roleCategory: "",
    department: "",
    type: "teaching",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddFaculty = () => {
    const newFaculty = {
      id: faculty.length + 1,
      name: formData.name,
      role: formData.role,
      department: formData.department,
      type: formData.type,
    };
    setFaculty([...faculty, newFaculty]);
    setFormData({
      name: "",
      role: "",
      roleCategory: "",
      department: "",
      type: "teaching",
    });
    setShowModal(false);
  };

  const filteredFaculty = faculty.filter((member) => {
    const matchesTypeFilter =
      typeFilter === "all" || member.type === typeFilter;
    let matchesRoleFilter = true;
    if (roleFilter !== "all") {
      matchesRoleFilter = member.role === roleFilter;
    } else if (roleCategory !== "all") {
      if (member.type === "teaching") {
        matchesRoleFilter =
          teachingRoles[roleCategory]?.includes(member.role) || false;
      } else {
        matchesRoleFilter =
          nonTeachingRoles[roleCategory]?.includes(member.role) || false;
      }
    }
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTypeFilter && matchesRoleFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Faculty Management
        </h1>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search faculty..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => setShowModal(true)}
            >
              <Plus size={20} />
              <span>Add Faculty</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                className="border rounded-lg px-3 py-2"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setRoleCategory("all");
                  setRoleFilter("all");
                }}
              >
                <option value="all">All Staff</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="border rounded-lg px-3 py-2"
                value={roleCategory}
                onChange={(e) => {
                  setRoleCategory(e.target.value);
                  setRoleFilter("all");
                }}
              >
                <option value="all">All Role Categories</option>
                {getRoleCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {roleCategory !== "all" && (
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-lg px-3 py-2"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles in Category</option>
                  {getRolesByCategory().map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Faculty Table or Mobile Cards */}
        <div className="bg-white rounded-lg shadow hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFaculty.length > 0 ? (
                  filteredFaculty.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {member.role}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                        {member.department}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            member.type === "teaching"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {member.type === "teaching"
                            ? "Teaching"
                            : "Non-Teaching"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No faculty members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden mt-4">
          {filteredFaculty.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredFaculty.map((member) => (
                <div key={member.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-600">{member.role}</div>
                  <div className="text-sm text-gray-600">
                    {member.department}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        member.type === "teaching"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {member.type === "teaching" ? "Teaching" : "Non-Teaching"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow text-center text-sm text-gray-500">
              No faculty members found
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium">Add New Faculty</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Type
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="teaching"
                      checked={formData.type === "teaching"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Teaching
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="non-teaching"
                      checked={formData.type === "non-teaching"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Non-Teaching
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Category
                </label>
                <select
                  name="roleCategory"
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    const category = e.target.value;
                    const roles =
                      formData.type === "teaching"
                        ? teachingRoles[category]
                        : nonTeachingRoles[category];
                    setFormData({
                      ...formData,
                      roleCategory: category,
                      role: roles?.[0] || "",
                    });
                  }}
                  value={formData.roleCategory || ""}
                >
                  <option value="">Select a category</option>
                  {(formData.type === "teaching"
                    ? Object.keys(teachingRoles)
                    : Object.keys(nonTeachingRoles)
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  required
                  value={formData.role || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!formData.roleCategory}
                >
                  <option value="">Select a role</option>
                  {(formData.type === "teaching"
                    ? teachingRoles[formData.roleCategory]
                    : nonTeachingRoles[formData.roleCategory]
                  )?.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFaculty}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
