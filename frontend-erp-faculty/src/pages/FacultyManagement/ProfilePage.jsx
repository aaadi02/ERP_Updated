import { useState } from "react";
import { Edit, Save, X, Eye, EyeOff } from "lucide-react";
import profileImage from "./assets/images.jpeg"; // Import the profile image

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@school.edu",
    phone: "(555) 123-4567",
    role: "Mathematics Teacher",
    teacherId: "TCH-2023-1045",
    password: "SecurePass123",
    profilePic: profileImage, // Use imported image
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedProfile({ ...profile });
      setShowPassword(false);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setProfile({ ...editedProfile });
    setIsEditing(false);
    setShowPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setEditedProfile((prev) => ({ ...prev, profilePic: imageUrl }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Display password as dots unless showPassword is true
  const displayPassword = showPassword ? profile.password : "••••••••••";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="bg-indigo-600 p-4 text-white">
          <h1 className="text-2xl font-bold text-center">Teacher Profile</h1>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex-1"></div>
            {isEditing ? (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  <Save size={16} className="mr-2" />
                  Save
                </button>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditToggle}
                className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
              >
                <Edit size={16} className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center mb-8 gap-6">
            <div className="relative w-32 h-32 group">
              <img
                src={profile.profilePic}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
                onError={(e) => {
                  e.target.src = "/fallback-image.jpeg"; // Fallback image in public folder
                }}
              />
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer transition-opacity duration-300 opacity-80 hover:opacity-100">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Change profile photo"
                  />
                  <span className="text-white text-sm font-medium px-2 py-1 bg-indigo-600 rounded-md">
                    Change Photo
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-800">
                {profile.name}
              </h2>
              <p className="text-indigo-600 font-semibold text-lg">
                {profile.role}
              </p>
              <p className="text-gray-500 mt-1">
                ID:{" "}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                  {profile.teacherId}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <label className="text-gray-700 font-medium text-sm sm:text-base">
                Name:
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editedProfile.name}
                  onChange={handleChange}
                  className="col-span-2 border border-gray-300 rounded-lg p-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                />
              ) : (
                <span className="col-span-2 text-gray-800 font-semibold">
                  {profile.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <label className="text-gray-700 font-medium text-sm sm:text-base">
                Email:
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email}
                  onChange={handleChange}
                  className="col-span-2 border border-gray-300 rounded-lg p-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                />
              ) : (
                <span className="col-span-2 text-gray-800">
                  {profile.email}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <label className="text-gray-700 font-medium text-sm sm:text-base">
                Phone:
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editedProfile.phone}
                  onChange={handleChange}
                  className="col-span-2 border border-gray-300 rounded-lg p-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                />
              ) : (
                <span className="col-span-2 text-gray-800">
                  {profile.phone}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <label className="text-gray-700 font-medium text-sm sm:text-base">
                Password:
              </label>
              {isEditing ? (
                <div className="col-span-2 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={editedProfile.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-700 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600 transition-colors duration-300"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              ) : (
                <div className="col-span-2 flex items-center">
                  <span className="text-gray-800 mr-2 font-mono bg-gray-100 px-2 py-1 rounded">
                    {displayPassword}
                  </span>
                  <button
                    onClick={togglePasswordVisibility}
                    className="text-gray-500 hover:text-indigo-600 transition-colors duration-300"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <label className="text-gray-700 font-medium text-sm sm:text-base">
                Teacher ID:
              </label>
              <span className="col-span-2 text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                {profile.teacherId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <label className="text-gray-700 font-medium text-sm sm:text-base">
                Role:
              </label>
              <span className="col-span-2 text-gray-800">{profile.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
