import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { User, Lock, BookOpen, School, Truck } from 'lucide-react';
import Modal from './components/Modal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', type: 'success' });
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use different endpoints based on role
      let endpoint, requestBody;
      
      if (role === 'student') {
        // For students, use the student auth endpoint with email as studentId
        endpoint = 'http://localhost:5000/api/student/auth/login';
        requestBody = { 
          studentId: email.trim(), // Using email as studentId for student login
          password: password.trim() 
        };
      } else {
        // For other roles (driver, conductor), use the general auth endpoint
        endpoint = 'http://localhost:5000/api/auth/login';
        requestBody = { email, password, role };
      }

      console.log('Login attempt:', { role, endpoint, requestBody: { ...requestBody, password: '[HIDDEN]' } });
      
      // Add specific logging for student login
      if (role === 'student') {
        console.log('Student login details:', {
          studentId: requestBody.studentId,
          passwordLength: requestBody.password.length,
          passwordFormat: /^\d{8}$/.test(requestBody.password) ? 'Valid YYYYMMDD' : 'Invalid format'
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Backend Response:', data);

      if (!response.ok) {
        setError(data.message || 'Login failed. Please check your credentials.');
      } else if ((data.token && data.user) || (data.success && data.token && data.student)) {
        // Handle different response structures
        let token, userData, userRole;
        
        if (role === 'student' && data.success) {
          // Student login response structure
          token = data.token;
          userData = data.student;
          userRole = 'student';
        } else {
          // Other roles response structure
          token = data.token;
          userData = data.user;
          userRole = data.user.role;
        }

        localStorage.setItem('token', token);
        
        // For students, ensure the data has a role property for authentication
        if (role === 'student' && userData) {
          const enhancedUserData = { ...userData, role: 'student' };
          localStorage.setItem('user', JSON.stringify(enhancedUserData));
          localStorage.setItem('studentData', JSON.stringify(enhancedUserData));
          console.log('Enhanced student data stored:', enhancedUserData);
        } else {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('studentData', JSON.stringify(userData));
        }
        
        console.log('Stored in localStorage:', {
          token: !!token,
          user: !!userData,
          studentData: !!userData,
          userDataStructure: userData
        });
        
        if (rememberMe) {
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userRole', userRole);
        }
        
        // Show success modal
        setModalData({
          title: 'Login Successful!',
          message: `Welcome back! You will be redirected to your ${userRole} dashboard.`,
          type: 'success'
        });
        setShowModal(true);
        
        // Navigate after a short delay
        setTimeout(() => {
          console.log('Navigating to dashboard for role:', userRole);
          switch (userRole) {
            case 'student':
              navigate('/dashboard/student');
              break;
            case 'driver':
              navigate('/dashboard/driver/bus-details');
              break;
            case 'conductor':
              navigate('/dashboard/conductor');
              break;
            default:
              navigate('/dashboard/student');
          }
        }, 1000); // Reduced timeout
      } else {
        setError('Unexpected error. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to the server. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'conductor':
        return <BookOpen className="h-7 w-7 text-white" />;
      case 'student':
        return <School className="h-7 w-7 text-white" />;
      case 'driver':
        return <Truck className="h-7 w-7 text-white" />;
      default:
        return <User className="h-7 w-7 text-white" />;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(e);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
      />
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
            <div className="text-white">
              {getRoleIcon()}
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type={role === 'student' ? 'text' : 'email'}
                placeholder={role === 'student' ? 'Student ID or Email' : 'Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl w-full px-3 py-3 pl-10 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 sm:text-sm"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl w-full px-3 py-3 pl-10 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 sm:text-sm"
              />
            </div>

            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-xl w-full px-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 sm:text-sm appearance-none bg-white"
              >
                <option value="student">Student</option>
                <option value="conductor">Conductor</option>
                <option value="driver">Driver</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
              />
              <span className="ml-2 select-none">Remember me</span>
            </label>
            <a className="text-sm font-medium text-blue-600 hover:text-blue-500 cursor-pointer transition-colors">
              Forgot your password?
            </a>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl text-white transition-all duration-200 transform ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;