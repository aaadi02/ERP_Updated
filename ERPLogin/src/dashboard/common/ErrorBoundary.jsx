import React from 'react';
import './ErrorBoundary.css';

const ErrorBoundary = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="error-boundary">
      <h3>Something went wrong</h3>
      <p>{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-btn">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;