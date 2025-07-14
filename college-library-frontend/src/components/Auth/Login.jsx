import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar'; // Adjust the import path as necessary

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      if (response.data.success) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsAuthenticated(true); // Update authentication status
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-400 to-teal-300 overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-300 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 bg-purple-200 opacity-20 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center">
        <div className="w-full space-y-8 bg-white/90 p-10 rounded-3xl shadow-2xl border border-gray-100 backdrop-blur-xl">
          <div>
            <h2 className="mt-2 text-center text-4xl font-extrabold text-gray-900 tracking-tight drop-shadow-lg">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-base text-gray-600">
              Or{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-2 transition-colors"
              >
                create a new account
              </button>
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative text-center animate-shake" role="alert">
              <span className="block sm:inline font-medium">{error}</span>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div className="rounded-2xl shadow-sm bg-gray-50 p-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-lg block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base transition-all duration-200 shadow-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-lg block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base transition-all duration-200 shadow-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-2 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-xl text-white shadow-lg transition-all duration-200
                  ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600'}`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Render Sidebar if authenticated and not on auth pages */}
      {isAuthenticated && !['/login', '/signup', '/forgot-password'].includes(window.location.pathname) && (
        <Sidebar onCollapse={handleSidebarCollapse} />
      )}
    </div>
  );
};

export default Login;