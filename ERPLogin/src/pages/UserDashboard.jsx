import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Outlet } from 'react-router-dom';
import Navbar from '../dashboard/common/Navbar';
import BusMap from '../dashboard/common/BusMap';
import BusList from '../dashboard/common/BusList';
import ScheduleView from '../dashboard/common/ScheduleView';
import { getAllBuses } from '../services/busServices';
import { getCurrentUser } from '../services/authService';
import { getStudentById } from '../services/studentService';
import './UserDashboard.css';

const UserDashboard = () => {
  const [activeView, setActiveView] = useState('map');
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getCurrentUser();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const { data } = await getAllBuses();
        setBuses(data.buses);
        setLoading(false);
      } catch (err) {
        setError('Failed to load buses');
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError('');
        const stored = localStorage.getItem('student');
        if (!stored) {
          setError('No student info found. Please log in.');
          setLoading(false);
          return;
        }
        const s = JSON.parse(stored);
        const res = await getStudentById(s._id);
        
        // Check if student login is enabled
        if (res.loginEnabled === false) {
          setError('Your account access has been disabled. Please contact administration.');
          setLoading(false);
          return;
        }
        
        setStudent(res);
      } catch (err) {
        setError('Failed to fetch student info');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!student) return <div className="text-white">No student info found. Please log in.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
          Welcome, {student.firstName} {student.lastName}
        </h2>
        
        {/* Student Info Card */}
        <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 sm:p-6 mb-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-300">Student ID</p>
              <p className="text-lg font-medium text-white">{student.studentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Enrollment Number</p>
              <p className="text-lg font-medium text-white">{student.enrollmentNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Mobile Number</p>
              <p className="text-lg font-medium text-white">{student.mobileNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Email</p>
              <p className="text-lg font-medium text-white">{student.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Department</p>
              <p className="text-lg font-medium text-white">{student.department?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Stream</p>
              <p className="text-lg font-medium text-white">{student.stream?.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Bus & Route Information */}
        <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 sm:p-6 mb-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">Bus & Route Information</h3>
          {student.routes ? (
            <>
              <p className="text-base text-gray-200 mb-2">
                <span className="font-semibold text-indigo-300">Assigned Route:</span> {student.routes}
              </p>
              {/* Add more route info here as needed */}
            </>
          ) : (
            <p className="text-gray-400">No route assigned.</p>
          )}
        </div>

        {/* Dashboard Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Bus Tracking */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Bus Tracking</h4>
                <p className="text-sm text-gray-300">Track your bus location</p>
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Route Details</h4>
                <p className="text-sm text-gray-300">View route stops and timings</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19l5-5m0 0l5-5m-5 5v12" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Notifications</h4>
                <p className="text-sm text-gray-300">Bus alerts and updates</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Bus Schedule</h4>
                <p className="text-sm text-gray-300">View departure times</p>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">My Profile</h4>
                <p className="text-sm text-gray-300">View and edit profile</p>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Help & Support</h4>
                <p className="text-sm text-gray-300">Get assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;