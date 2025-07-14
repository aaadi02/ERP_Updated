import React, { useState, useEffect } from "react";

function FetchedTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);

  // Get current day for highlighting (e.g., "Monday")
  const today = new Date().toLocaleString("en-US", { weekday: "long" });

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        // Retrieve token and user data
        const token = localStorage.getItem("authToken");
        const user = JSON.parse(localStorage.getItem("user"));

        console.log("FetchedTimetable - Token exists:", !!token);
        console.log("FetchedTimetable - User data:", user);
        console.log("FetchedTimetable - Token length:", token ? token.length : 0);

        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }
        if (!user || !user.department) {
          throw new Error("User data or department not found. Please log in.");
        }

        setUserDepartment(user.department);

        // Backend API URL
        const apiUrl = `http://localhost:5000/api/timetable?department=${encodeURIComponent(
          user.department
        )}`;
        console.log("Fetching from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // Debug response
        console.log("Response status:", response.status);
        console.log(
          "Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        // Check for non-JSON response
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error(
            `Expected JSON, but received ${contentType || "no content-type"}`
          );
        }

        if (!response.ok) {
          throw new Error(
            `HTTP error: ${response.status} ${response.statusText}`
          );
        }

        const timetableData = await response.json();
        console.log("Received data:", timetableData);
        setTimetable(timetableData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to fetch timetable: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!timetable.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-600">
          No timetable available for {userDepartment || "your department"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Timetable for {userDepartment}
      </h2>
      {timetable.map((entry) => (
        <div key={entry._id} className="mb-8 p-4 bg-white shadow-md rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {entry.collegeInfo.name} - {entry.collegeInfo.department} -{" "}
            {entry.collegeInfo.semester}
          </h3>
          <p className="text-gray-600 mb-4">
            Room: {entry.collegeInfo.room} | Section:{" "}
            {entry.collegeInfo.section}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-sm font-medium text-gray-700 w-24">
                    Day
                  </th>
                  {entry.timeSlots.map((slot, index) => (
                    <th
                      key={index}
                      className="border border-gray-300 p-2 text-center text-sm font-medium text-gray-700 w-32"
                    >
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entry.timetableData.map((dayData) => (
                  <tr
                    key={dayData.day}
                    className={`${
                      dayData.day === today ? "bg-blue-50" : ""
                    } hover:bg-gray-50`}
                  >
                    <td className="border border-gray-300 p-2 text-sm font-medium text-gray-700">
                      {dayData.day}
                    </td>
                    {entry.timeSlots.map((_, slotIndex) => {
                      const classItem = dayData.classes[slotIndex] || {};
                      return (
                        <td
                          key={slotIndex}
                          colSpan={classItem.colSpan || 1}
                          className={`border border-gray-300 p-2 text-sm text-center ${
                            classItem.type === "Lecture"
                              ? "bg-green-100"
                              : classItem.type === "Lab"
                              ? "bg-yellow-100"
                              : classItem.type
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {classItem.subject ? (
                            <>
                              <div className="font-medium">
                                {classItem.subject}
                              </div>
                              <div className="text-xs text-gray-600">
                                ({classItem.type}) - {classItem.faculty}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">Free</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FetchedTimetable;
