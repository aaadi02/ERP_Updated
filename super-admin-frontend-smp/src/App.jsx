import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
// import FacultyDashboard from "./FacultyPage/FacultyDashboard";
import PrivateRoute from "./components/PrivateRoute";
import FacultyPrivateRoute from "./FacultyPage/PrivateRoute";
import RoleLogin from "./FacultyPage/RoleLogin";

// Import dashboards for each faculty role
import StudentManagementDashboard from "./FacultyPage/roles/admissionmanagment/StudentManagementDashboard";
import StudentManageDash from "./FacultyPage/roles/admissionmanagment/StudentManageDash";
// import AccountSectionDashboard from "./FacultyPage/roles/accountsection/AccountSectionDashboard";
import DocumentSectionDashboard from "./FacultyPage/roles/Documentmanagment/DocumentSectionDashboard";
import ScholarshipManageDash from "./FacultyPage/roles/Scholarshipmanagment/ScholarshipManageDash";
// import NotificationSystemDashboard from "./FacultyPage/roles/NotificationSystemDashboard";
// import LibraryDashboard from "./FacultyPage/roles/LibraryDashboard";
// import BusDashboard from "./FacultyPage/roles/BusDashboard";
// import HostelDashboard from "./FacultyPage/roles/HostelDashboard";


// Main App component with routing
import React from "react";
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root to faculty role login */}
        <Route path="/" element={<RoleLogin />} />

        {/* Faculty login route */}
        <Route path="/faculty/rolelogin" element={<RoleLogin />} />

        {/* Super Admin login route */}
        <Route path="/super-admin-ved/login" element={<LoginForm />} />

        <Route
          path="/super-admin/*"
          element={
            <PrivateRoute>
              <SuperAdminDashboard />
            </PrivateRoute>
          }
        />
        
        <Route path="/dashboard/*" element={<StudentManageDash />} />

        {/* Role-based faculty dashboards */}
      {/* <Route path="/faculty/account-section" element={<AccountSectionDashboard />} /> */}
         <Route path="/faculty/document-section" element={<DocumentSectionDashboard />} />
        <Route path="/faculty/scholarship/*" element={<ScholarshipManageDash />} />
        {/* // <Route path="/faculty/notification-system" element={<NotificationSystemDashboard />} />
        // <Route path="/faculty/library" element={<LibraryDashboard />} />
        // <Route path="/faculty/bus" element={<BusDashboard />} />
        // <Route path="/faculty/hostel" element={<HostelDashboard />} /> */}
      </Routes>
    </Router>
  );
};

export default App;
