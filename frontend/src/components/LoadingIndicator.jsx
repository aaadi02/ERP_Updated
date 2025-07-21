import React from 'react';

/**
 * LoadingIndicator component - Displays a loading spinner with optional text
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('sm', 'md', 'lg', 'xl')
 * @param {string} props.message - Optional message to display with the spinner
 * @param {string} props.type - Type of loading indicator ('spinner', 'dots', 'pulse')
 * @param {boolean} props.overlay - Whether to display as a full screen overlay
 */
export default function LoadingIndicator({ 
  size = 'md', 
  message = 'Loading...', 
  type = 'spinner',
  overlay = false
}) {
  // Size class mapping
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  // Font size mapping based on spinner size
  const fontSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };
  
  // Spinner component
  const Spinner = () => (
    <div className={`${sizeClasses[size]} relative inline-block`}>
      <div className={`absolute inset-0 rounded-full border-2 border-blue-200 opacity-25 animate-ping`}></div>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-blue-600`}></div>
    </div>
  );
  
  // Dots component
  const Dots = () => (
    <div className="flex space-x-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size] === 'w-4 h-4' ? 'w-1 h-1' : 
                       sizeClasses[size] === 'w-8 h-8' ? 'w-2 h-2' :
                       sizeClasses[size] === 'w-12 h-12' ? 'w-3 h-3' : 'w-4 h-4'} 
                    bg-blue-600 rounded-full animate-bounce`}
          style={{ 
            animationDelay: `${i * 0.1}s`, 
            animationDuration: '0.5s' 
          }}
        ></div>
      ))}
    </div>
  );
  
  // Pulse component
  const Pulse = () => (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}></div>
  );
  
  // Determine which indicator to show
  let LoadingIcon;
  switch (type) {
    case 'dots':
      LoadingIcon = Dots;
      break;
    case 'pulse':
      LoadingIcon = Pulse;
      break;
    default:
      LoadingIcon = Spinner;
  }
  
  // If it's an overlay, render with a backdrop
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <LoadingIcon />
          {message && <p className={`mt-3 ${fontSizeClasses[size]} text-gray-700 font-medium`}>{message}</p>}
        </div>
      </div>
    );
  }
  
  // Default display
  return (
    <div className="flex flex-col items-center justify-center">
      <LoadingIcon />
      {message && <p className={`mt-2 ${fontSizeClasses[size]} text-gray-600`}>{message}</p>}
    </div>
  );
}
