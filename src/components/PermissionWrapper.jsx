import React from 'react';
import { checkPermission, isAuthenticated } from '../utils/permissions';

const PermissionWrapper = ({ 
  children, 
  module, 
  action = 'view', 
  fallback = null,
  showMessage = false,
  requireAuth = true // New prop to control auth requirement
}) => {
  // Skip permission check if auth is not required (for login/signup)
  if (!requireAuth) {
    return children;
  }

  // Check if user is authenticated first
  if (!isAuthenticated()) {
    if (showMessage) {
      return (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
          <p className="text-red-800">
            Please log in to access this content.
          </p>
        </div>
      );
    }
    return fallback;
  }

  const hasPermission = checkPermission(module, action);
  
  if (!hasPermission) {
    if (showMessage) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center">
          <p className="text-yellow-800">
            You don't have permission to {action} {module}. Contact admin for access.
          </p>
        </div>
      );
    }
    return fallback;
  }
  
  return children;
};

export default PermissionWrapper;