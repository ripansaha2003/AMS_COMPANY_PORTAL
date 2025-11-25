import { axiosPrivate } from "@/axios/axiosInstance";
import Layout from "@/components/common/Layout";
import PermissionWrapper from "@/components/PermissionWrapper";
import { useSetLocationArray } from "@/utils/locationSetter";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PayPalPaymentModal from "@/components/subscription/PayPalPaymentModal";
import { useSubscription } from "@/context/SubscriptionContext";
import toast from "react-hot-toast";

export default function Subscription() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null); // Track which subscription is being upgraded
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const { fetchSubscriptionStatus } = useSubscription();

  useSetLocationArray([{ label: "Subscriptions", link: "" }]);

  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.organization_id;
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      const res = await axiosPrivate.get(
        `/organizations/${organizationId}/subscriptions`
      );

      if (res.data.success) {
        setSubscriptions(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (subscription) => {
    // Open PayPal payment modal
    setSelectedSubscription(subscription);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (subscription) => {
    try {
      setUpgrading(subscription.id);

      // Calculate start date (today) and renewal date
      const startDate = new Date();
      const renewalDate = new Date(startDate);
      renewalDate.setDate(startDate.getDate() + subscription.durationInDays);

      const organizationId = getOrganizationId();
      await axiosPrivate.put(
        `/organizations/${organizationId}/subscriptions/${subscription.id}`,
        {
          start_date: startDate.toISOString().split("T")[0],
          renewal_date: renewalDate.toISOString().split("T")[0],
          status: "active",
        }
      );

      // Refresh subscriptions and subscription context
      await fetchSubscriptions();
      await fetchSubscriptionStatus();
      
      toast.success("Subscription activated successfully!");
    } catch (error) {
      console.error("Failed to activate subscription:", error);
      toast.error("Failed to activate subscription. Please contact support.");
    } finally {
      setUpgrading(null);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Listen for global subscription updates (e.g., after free trial started)
  useEffect(() => {
    const handler = () => {
      fetchSubscriptions();
    };
    window.addEventListener("subscription-updated", handler);
    return () => window.removeEventListener("subscription-updated", handler);
  }, []);

  const renderSubscriptionCard = (subscription) => {
    const isSubscribed = subscription.subscribed === 1;
    const isUpgrading = upgrading === subscription.id;
    const isTrial = String(subscription.subscription_status || "").toLowerCase() === "trial";

    // Determine displayed prices. For trial subscriptions, sale price should be 0
    // and original price should show the normal price as struck-through.
    let displayPrice = subscription.salePrice ?? subscription.price;
    let displayOriginal = subscription.originalPrice;
    if (isTrial) {
      displayPrice = 0;
      displayOriginal =  subscription.originalPrice;
    }

    return (
      <div
        key={subscription.id}
        className={`relative bg-[#F5F8FF] rounded-xl p-6 shadow-sm w-full flex flex-col h-full ${
          subscription.name.toLowerCase().includes("platinum") ? "mt-8" : ""
        }`}
      >
        {subscription.name.toLowerCase().includes("platinum") && (
          <div className="absolute -top-[3.8rem] left-1/2 transform -translate-x-1/2 -z-10 w-[99%] text-center">
            <div className="bg-[#172B4D] text-white py-1.5 pt-[1.5rem] pb-[3rem] rounded-xl text-base font-medium uppercase tracking-wide">
              MOST POPULAR
            </div>
          </div>
        )}

        <h3
          className={`text-lg font-medium text-gray-800 mb-4 ${
            subscription.name.toLowerCase().includes("platinum") ? "mt-4" : ""
          }`}
        >
          {subscription.name}
        </h3>

        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">${displayPrice}</span>

          {displayOriginal !== undefined && displayOriginal !== displayPrice && (
            <div className="text-sm text-gray-400 line-through">${displayOriginal}</div>
          )}
        </div>

        <div className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
          <p className="mb-2">{subscription.description}</p>
          <div className="space-y-1">
            <p>• Staff: {subscription.no_staff}</p>
            <p>• Assets: {subscription.no_assets}</p>
            <p>• Clients: {subscription.no_clients}</p>
            <p>• Vendors: {subscription.no_vendors}</p>
            <p>• Duration: {subscription.duration} months</p>
          </div>
        </div>

        <div className="mt-4">
          {isSubscribed ? (
            <div className="space-y-2">
              <button className="w-full py-2.5 px-4 bg-gray-400 text-white rounded text-sm font-medium cursor-not-allowed">
                Currently Active
              </button>
              {subscription.start_date && subscription.renewal_date && (
                <div className="text-xs text-gray-500 text-center">
                  <p>
                    Started: {" "}
                    {new Date(subscription.start_date).toLocaleDateString()}
                  </p>
                  <p>
                    Renews: {" "}
                    {new Date(subscription.renewal_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <PermissionWrapper module="subscriptions" action="edit">
              <button
                onClick={() => handleUpgrade(subscription)}
                disabled={isUpgrading}
                className="w-full py-2.5 px-4 bg-[#ED1C24] text-white rounded text-sm font-medium hover:bg-[#d91b22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpgrading ? "Activating..." : "Upgrade"}
              </button>
            </PermissionWrapper>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading subscriptions...</div>
        </div>
      </Layout>
    );
  }


  const activeSubscriptions = subscriptions.filter(
    (s) => String(s.status || "").toLowerCase() === "active"
  );

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between mb-10">
        Subscriptions
        <div className="flex gap-x-3">
          <button
            onClick={() => navigate("/subscription/history")}
            className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
          >
            Subscription History
          </button>
        </div>
      </h1>

      <div className="max-w-6xl mx-auto mt-[5rem]">
        {activeSubscriptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr justify-items-center">
            {activeSubscriptions.map((s) => (
              <div className="w-full max-w-[20rem] h-full">{renderSubscriptionCard(s)}</div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No subscriptions available</div>
        )}
      </div>

      {/* PayPal Payment Modal */}
      {selectedSubscription && (
        <PayPalPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          subscription={selectedSubscription}
          organizationId={getOrganizationId()}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Layout>
  );
}
