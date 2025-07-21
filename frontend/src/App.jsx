import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import Breadcrumbs from "./components/Breadcrumbs";
import RoleLogin from "./components/RoleLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Accounting/Expenses";
import StudentDetails from "./pages/Students/StudentDetails";
import FeeHeads from "./pages/Fee/FeeHeads";
import PaymentHistory from "./pages/Accounting/PaymentHistory";
import Scholarship from "./pages/Students/Scholarship";
import ExamFeePayment from "./pages/Students/ExamFeePayment";
import Insurance from "./pages/Students/Insurance";
import ADUIT from "./pages/Accounting/Audit";
import Salary from "./pages/Faculty/Salary";
import SalarySlip from "./pages/Faculty/SalarySlip";
import IncomeTax from "./pages/Faculty/IncomeTax";
import IncomeTaxSimple from "./pages/Faculty/IncomeTaxSimple";
import PFProfessionalTax from "./pages/Faculty/PFProfessionalTax";
import GratuityTax from "./pages/Faculty/GratuityTax";
import Compliance from "./pages/Faculty/Compliance";
import FacultyDashboard from "./pages/Faculty/FacultyDashboard";
import Receipts from "./pages/Accounting/Receipts";
import Reports from "./pages/Reports";
import Store from "./pages/Store";
import Maintenance from "./pages/Maintenance";
import PurchaseModule from "./pages/Purchase";
import AddPayment from "./pages/Accounting/AddPayment";
import Ledger from "./pages/Accounting/Ledger";

// Main App component with authentication
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <RoleLogin />;
  }

  // Show authenticated app
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-grow bg-gray-100 min-h-screen p-6">
        <Breadcrumbs />
        <Routes>
          {/* All Routes - Account Management Role Required */}
          <Route path="/" element={<ProtectedRoute requiredRole="accounting"><Dashboard /></ProtectedRoute>} />
          
          {/* Student Routes - Account Management can access all student data */}
          <Route path="/students/overview" element={<ProtectedRoute requiredRole="accounting"><StudentDetails /></ProtectedRoute>} />
          <Route path="/students/details" element={<ProtectedRoute requiredRole="accounting"><StudentDetails /></ProtectedRoute>} />
          <Route path="/students/insurance" element={<ProtectedRoute requiredRole="accounting"><Insurance /></ProtectedRoute>} />
          <Route path="/students/scholarship" element={<ProtectedRoute requiredRole="accounting"><Scholarship /></ProtectedRoute>} />
          <Route path="/students/exam-fee" element={<ProtectedRoute requiredRole="accounting"><ExamFeePayment /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute requiredRole="accounting"><StudentDetails /></ProtectedRoute>} />
          
          {/* Accounting Routes - Primary access for Account Management */}
          <Route path="/accounting/expenses" element={<ProtectedRoute requiredRole="accounting"><Expenses /></ProtectedRoute>} />
          <Route path="/accounting/payments" element={<ProtectedRoute requiredRole="accounting"><PaymentHistory /></ProtectedRoute>} />
          <Route path="/accounting/add-payment" element={<ProtectedRoute requiredRole="accounting"><AddPayment /></ProtectedRoute>} />
          <Route path="/accounting/receipts" element={<ProtectedRoute requiredRole="accounting"><Receipts /></ProtectedRoute>} />
          <Route path="/accounting/audit" element={<ProtectedRoute requiredRole="accounting"><ADUIT /></ProtectedRoute>} />
          <Route path="/accounting/ledger" element={<ProtectedRoute requiredRole="accounting"><Ledger /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute requiredRole="accounting"><PaymentHistory /></ProtectedRoute>} />
          
          {/* Fee Routes - Account Management handles fee management */}
          <Route path="/fee/heads" element={<ProtectedRoute requiredRole="accounting"><FeeHeads /></ProtectedRoute>} />
          
          {/* Faculty Routes - Account Management handles faculty payroll */}
          <Route path="/faculty/salary" element={<ProtectedRoute requiredRole="accounting"><Salary /></ProtectedRoute>} />
          <Route path="/faculty/salary-slip" element={<ProtectedRoute requiredRole="accounting"><SalarySlip /></ProtectedRoute>} />
          <Route path="/faculty/incometax" element={<ProtectedRoute requiredRole="accounting"><IncomeTax /></ProtectedRoute>} />
          <Route path="/faculty/incometax-simple" element={<ProtectedRoute requiredRole="accounting"><IncomeTaxSimple /></ProtectedRoute>} />
          <Route path="/faculty/pfproftax" element={<ProtectedRoute requiredRole="accounting"><PFProfessionalTax /></ProtectedRoute>} />
          <Route path="/faculty/gratuitytax" element={<ProtectedRoute requiredRole="accounting"><GratuityTax /></ProtectedRoute>} />
          <Route path="/faculty/compliance" element={<ProtectedRoute requiredRole="accounting"><Compliance /></ProtectedRoute>} />
          <Route path="/faculty/dashboard" element={<ProtectedRoute requiredRole="accounting"><FacultyDashboard /></ProtectedRoute>} />
          
          {/* General Routes - Account Management access */}
          <Route path="/reports" element={<ProtectedRoute requiredRole="accounting"><Reports /></ProtectedRoute>} />
          <Route path="/store" element={<ProtectedRoute requiredRole="accounting"><Store /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute requiredRole="accounting"><Maintenance /></ProtectedRoute>} />
          <Route path="/purchase/*" element={<ProtectedRoute requiredRole="accounting"><PurchaseModule /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute requiredRole="accounting"><Dashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
