import React from "react";
import { Navigate } from "react-router-dom";
import { useSubscription } from "@/context/SubscriptionContext";

const SubscriptionGuard = ({ children }) => {
  const { subscriptionData, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // If no subscription, redirect to subscription page
  if (!subscriptionData?.subscription) {
    return <Navigate to="/subscription" replace />;
  }

  // Has subscription, render children
  return <>{children}</>;
};

export default SubscriptionGuard;
