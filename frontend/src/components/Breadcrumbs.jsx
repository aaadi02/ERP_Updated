import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Define route mapping for better display names
  const routeMapping = {
    'students': 'Students',
    'faculty': 'Faculty',
    'accounting': 'Accounting',
    'fee': 'Fee Management',
    'overview': 'Overview',
    'details': 'Details',
    'insurance': 'Insurance',
    'expenses': 'Expenses',
    'payments': 'Payments',
    'add-payment': 'Add Payment',
    'receipts': 'Receipts',
    'heads': 'Fee Heads',
    'scholarship': 'Scholarship',
    'exam-fee': 'Exam Fee',
    'audit': 'Audit',
    'salary': 'Salary Management',
    'salary-slip': 'Salary Slip',
    'income-tax': 'Income Tax',
    'pf-professional-tax': 'PF & Professional Tax',
    'gratuity-tax': 'Gratuity',
    'compliance': 'Compliance',
    'faculty-dashboard': 'Faculty Dashboard',
    'reports': 'Reports',
    'store': 'Store',
    'maintenance': 'Maintenance',
  };

  return (
    <nav className="py-3 px-1">
      <ol className="flex flex-wrap items-center space-x-1 text-sm">
        <li className="breadcrumb-item">
          <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
        </li>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = routeMapping[name] || name.charAt(0).toUpperCase() + name.slice(1);
          
          return (
            <React.Fragment key={routeTo}>
              <li className="breadcrumb-separator">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className={`breadcrumb-item ${isLast ? 'font-medium' : ''}`}>
                {isLast ? (
                  <span className="text-gray-800">{displayName}</span>
                ) : (
                  <Link 
                    to={routeTo}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {displayName}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
