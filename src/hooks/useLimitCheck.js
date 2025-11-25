import { useSubscription } from "@/context/SubscriptionContext";
import toast from "react-hot-toast";

/**
 * Custom hook to check subscription limits before performing actions
 * @param {string} resourceType - The type of resource (staff, assets, clients, vendors)
 */
export const useLimitCheck = (resourceType) => {
  const { canPerformAction, getLimitInfo } = useSubscription();

  const checkLimit = () => {
    if (!resourceType) {
      console.warn("useLimitCheck: resourceType not provided");
      return false;
    }

    const canPerform = canPerformAction(resourceType);
    
    if (!canPerform) {
      const limitInfo = getLimitInfo(resourceType);
      toast.error(
        `Limit reached! You can only have ${limitInfo.limit} ${resourceType}. Currently at ${limitInfo.current}/${limitInfo.limit}.`,
        { duration: 4000 }
      );
      return false;
    }
    
    return true;
  };

  return { checkLimit };
};
