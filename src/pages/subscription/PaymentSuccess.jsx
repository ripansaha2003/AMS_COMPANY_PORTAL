import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { capturePayPalPayment } from "@/services/paymentService";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useSubscription } from "@/context/SubscriptionContext";
import toast from "react-hot-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchSubscriptionStatus } = useSubscription();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("Processing your payment...");

  useEffect(() => {
    const processPayment = async () => {
      try {
        const token = searchParams.get("token");
        const payerId = searchParams.get("PayerID");

        if (!token) {
          setStatus("error");
          setMessage("Invalid payment session. Missing token.");
          return;
        }

        console.log("Processing payment with token:", token, "PayerID:", payerId);

        // Capture the payment
        const captureResult = await capturePayPalPayment(token);
        console.log("Payment capture result:", captureResult);

        if (captureResult.status === "COMPLETED" || captureResult.success) {
          // Get subscription ID from localStorage or session
          const subscriptionData = JSON.parse(
            sessionStorage.getItem("pending_subscription") || "{}"
          );

          if (subscriptionData.subscriptionId && subscriptionData.organizationId) {
            // Activate the subscription
            const startDate = new Date();
            const renewalDate = new Date(startDate);
            renewalDate.setDate(
              startDate.getDate() + (subscriptionData.durationInDays || 30)
            );

            // await axiosPrivate.put(
            //   `/organizations/${subscriptionData.organizationId}/subscriptions/${subscriptionData.subscriptionId}`,
            //   {
            //     start_date: startDate.toISOString().split("T")[0],
            //     renewal_date: renewalDate.toISOString().split("T")[0],
            //     status: "active",
            //   }
            // );

            // Clear pending subscription
            sessionStorage.removeItem("pending_subscription");
          }

          // Refresh subscription status
          await fetchSubscriptionStatus();

          setStatus("success");
          setMessage("Payment successful! Your subscription has been activated.");
          toast.success("Payment completed successfully!");

          // Redirect to subscription page after 3 seconds
          setTimeout(() => {
            navigate("/subscription");
          }, 3000);
        } else {
          throw new Error("Payment capture failed");
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            error.message ||
            "Failed to process payment. Please contact support."
        );
        toast.error("Payment processing failed");
      }
    };

    processPayment();
  }, [searchParams, navigate, fetchSubscriptionStatus]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {status === "processing" && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please do not close this window...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                Your subscription is now active and ready to use.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to subscriptions page...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                If you were charged, please contact our support team with your
                transaction details.
              </p>
            </div>
            <button
              onClick={() => navigate("/subscription")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Return to Subscriptions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
