import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import BookList from './components/BookList';
import StudentList from './components/StudentList';
import BookActions from './components/BookActions';
import DueBill from './components/DueBill';
import Analytics from './components/Analytics';
import AddBook from './components/AddBook';
import BookIssueReturn from './components/BookIssueReturn';
import FacultyList from './components/FacultyList';
import FacultyBooks from './pages/FacultyBooks';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import RoleLogin from './components/Rolelogin';
import ProtectedRoute from './components/ProtectedRoute';
import AddBookFromData from './components/AddBookFromData';
import BorrowerEntry from './components/BorrowerEntry';
import PaymentHistory from './components/PaymentHistory';
import BookDetails from './components/BookDetails';
import StudentBooks from './components/StudentBooks';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const handleSidebarCollapse = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isAuthenticated && <Sidebar onCollapse={handleSidebarCollapse} />}
      <main
        className={`transition-all duration-300 flex-1 overflow-hidden
    ${isMobile
            ? 'ml-0'
            : isSidebarCollapsed
              ? 'ml-20'
              : !isAuthenticated
                ? ''
                : ''
          }
    ${isAuthenticated ? 'p-6 md:p-8' : ''}
  `}
      >
        <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/analytics" replace /> : <RoleLogin />
              }
            />
            <Route path="/book-list" element={<BookList />} />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <BookList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-book"
              element={
                <ProtectedRoute>
                  <AddBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-book-from-data"
              element={
                <ProtectedRoute>
                  <AddBookFromData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-details/:id"
              element={
                <ProtectedRoute>
                  <BookDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <StudentList />

                </ProtectedRoute>
              }
            />
            <Route
              path="/student-books/:id"
              element={
                <ProtectedRoute>
                  <StudentBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-actions"
              element={
                <ProtectedRoute>
                  <BookActions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/borrower-entry"
              element={
                <ProtectedRoute>
                  <BorrowerEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dues"
              element={
                <ProtectedRoute>
                  <DueBill />
                </ProtectedRoute>
              }
            />
            <Route
              path="/circulation/book-issue"
              element={
                <ProtectedRoute>
                  <BookIssueReturn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty"
              element={
                <ProtectedRoute>
                  <FacultyList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty-books"
              element={
                <ProtectedRoute>
                  <FacultyBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty-books/:employeeId"
              element={
                <ProtectedRoute>
                  <FacultyBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute>
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<div className="text-center py-10">Page not found</div>}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;