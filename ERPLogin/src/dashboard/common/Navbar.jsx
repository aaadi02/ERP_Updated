import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ role }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getRoleName = () => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'conductor': return 'Conductor';
      case 'student': return 'Student';
      case 'driver': return 'Driver';
      default: return 'User';
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="text-white text-xl font-bold hover:text-green-200 transition-colors duration-200"
            >
              College Bus Management
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
              {getRoleName()}
            </span>
            <Link 
              to="/" 
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200"
            >
              Logout
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-green-200 transition-colors duration-200"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-green-700/50 backdrop-blur-sm rounded-lg mt-2">
              <div className="flex flex-col space-y-2">
                <span className="bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium text-center">
                  {getRoleName()}
                </span>
                <Link 
                  to="/" 
                  className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Logout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;