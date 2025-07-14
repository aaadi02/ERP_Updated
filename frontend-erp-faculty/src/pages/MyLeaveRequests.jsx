import React, { useEffect, useState } from "react";
import axios from "axios";

const MyLeaveRequests = ({ userData }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userData?.employeeId) return;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/leave/my-leaves/${userData.employeeId}`)
      .then((res) => {
        setLeaves(res.data.leaves || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch leave requests");
        setLoading(false);
      });
  }, [userData]);

  if (loading) return <div>Loading your leave requests...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>My Leave Requests</h2>
      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", marginTop: 16 }}
      >
        <thead>
          <tr>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Reason</th>
            <th>Status</th>
            <th>HOD Decision</th>
            <th>Principal Decision</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 ? (
            <tr>
              <td colSpan="7">No leave requests found.</td>
            </tr>
          ) : (
            leaves.map((leave) => (
              <tr key={leave._id}>
                <td>{leave.leaveType}</td>
                <td>{leave.startDate?.slice(0, 10)}</td>
                <td>{leave.endDate?.slice(0, 10)}</td>
                <td>{leave.reason}</td>
                <td>{leave.status}</td>
                <td>{leave.hodDecision || "-"}</td>
                <td>{leave.principalDecision || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MyLeaveRequests;
