import { checkPermission, isAuthenticated } from "@/utils/permissions";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import Layout from "./common/Layout";

const ProtectedRoute = ({
  children,
  module,
  action = "view",
  fallback = null,
  requireAuth = true, // New prop
  publicRoute = false, // For login/signup routes
}) => {
  const navigate = useNavigate();
  // For public routes (login/signup), redirect if already authenticated
  if (publicRoute) {
    if (isAuthenticated()) {
      return <Navigate to="/staff" replace />;
    }
    return children;
  }

  // Check authentication first
  if (requireAuth && !isAuthenticated()) {
    // Redirect to login page
    return <Navigate to="/" replace />;
  }

  // Skip permission check if auth is not required
  if (!requireAuth) {
    return children;
  }

  // Allow profile route for all authenticated users regardless of permissions
  const location = useLocation();
  if (location && (location.pathname === "/profile" || location.pathname.startsWith("/profile/"))) {
    return children;
  }

  const hasPermission = checkPermission(module, action);

  if (!hasPermission) {
    if (fallback) {
      return fallback;
    }

    // Show access denied page
    return (
       <Layout>
        <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">Please contact your administrator for access.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return children;
};

export default ProtectedRoute;
