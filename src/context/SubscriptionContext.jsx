import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { axiosPrivate } from "@/axios/axiosInstance";
import toast from "react-hot-toast";

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFreeTrialModal, setShowFreeTrialModal] = useState(false);

  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.organization_id || user?.organizationId;
    } catch (e) {
      return null;
    }
  };

  // Fetch subscription status from API
  const fetchSubscriptionStatus = useCallback(async (silent = false) => {
    const orgId = getOrganizationId();
    if (!orgId) {
      setLoading(false);
      return null;
    }

    try {
      if (!silent) setLoading(true);
      const response = await axiosPrivate.get(`/${orgId}/status`);
      const data = response.data;

      setSubscriptionData(data);

      // Show free trial modal if no subscription (first time)
      if (
        !data.subscription &&
        !sessionStorage.getItem("freeTrialModalShown")
      ) {
        setShowFreeTrialModal(true);
      }

      return data;
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      toast.error("Failed to load subscription status");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user can perform an action (create staff, asset, etc.)
  const canPerformAction = useCallback(
    (resourceType) => {
      if (!subscriptionData) return false;
      if (!subscriptionData.subscription) return false;

      const limit = subscriptionData.limits?.[resourceType];
      return limit ? limit.allowed : false;
    },
    [subscriptionData]
  );

  // Get limit info for a resource
  const getLimitInfo = useCallback(
    (resourceType) => {
      if (!subscriptionData?.limits?.[resourceType]) {
        return { limit: 0, current: 0, allowed: false };
      }
      return subscriptionData.limits[resourceType];
    },
    [subscriptionData]
  );

  // Refresh subscription after an action (create/delete)
  const refreshAfterAction = useCallback(async () => {
    // Silent refresh to update limits without showing loader
    await fetchSubscriptionStatus(true);
  }, [fetchSubscriptionStatus]);

  // Start free trial
  const startFreeTrial = useCallback(async () => {
    const orgId = getOrganizationId();
    if (!orgId) return;

    try {
      // Call the upgrade/subscription API to start free trial
      // Using the same endpoint as when upgrading plans
      await axiosPrivate.put(`/${orgId}/freetrial`, {
        // or whatever your backend expects for free trial
      });

      toast.success("Free trial started successfully!");
      sessionStorage.setItem("freeTrialModalShown", "true");
      setShowFreeTrialModal(false);

      // Refresh subscription status
      await fetchSubscriptionStatus(true);
      // Notify other parts of the app that subscription changed (e.g., subscription list page)
      try {
        window.dispatchEvent(new Event("subscription-updated"));
      } catch (e) {
        // ignore in non-browser environments
      }
    } catch (error) {
      console.error("Error starting free trial:", error);
      toast.error("Failed to start free trial");
    }
  }, [fetchSubscriptionStatus]);

  // Initial load
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const value = {
    subscriptionData,
    loading,
    hasSubscription: subscriptionData?.subscription || false,
    canPerformAction,
    getLimitInfo,
    refreshAfterAction,
    fetchSubscriptionStatus,
    showFreeTrialModal,
    setShowFreeTrialModal,
    startFreeTrial,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
