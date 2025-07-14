import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teaching");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("Probation Period");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
          firstName,
          lastName,
          employeeId,
          gender,
          dateOfBirth,
          mobile,
          address,
          aadhaar,
          department,
          designation,
          dateOfJoining,
          employmentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
      } else {
        alert("Registration successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2 className="text-2xl font-bold mb-6 text-center">Signup</h2>
      <form onSubmit={handleSignup}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Username</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          >
            <option value="teaching">Teacher</option>
            <option value="nonteaching">Non-Teaching Staff</option>
            <option value="HOD">Head of Department</option>
            <option value="principal">Principal</option>
            <option value="director">Director</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Employee ID</label>
          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Gender</label>
          <input
            type="text"
            placeholder="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Mobile</label>
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Address</label>
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Aadhaar Number</label>
          <input
            type="text"
            placeholder="Aadhaar Number"
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Department</label>
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Designation</label>
          <input
            type="text"
            placeholder="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Date of Joining</label>
          <input
            type="date"
            value={dateOfJoining}
            onChange={(e) => setDateOfJoining(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Employment Status</label>
          <select
            value={employmentStatus}
            onChange={(e) => setEmploymentStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          >
            <option value="Probation Period">Probation Period</option>
            <option value="Permanent Employee">Permanent Employee</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className={`w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
