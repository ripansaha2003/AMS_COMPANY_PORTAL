import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import {
  createPayPalOrder,
  capturePayPalPayment,
} from "@/services/paymentService";
import { axiosPrivate } from "@/axios/axiosInstance";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const PayPalPaymentModal = ({
  open,
  onOpenChange,
  subscription,
  organizationId,
  onPaymentSuccess,
}) => {
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountedAmount, setDiscountedAmount] = useState(null);

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    console.error("PayPal Client ID not found in environment variables");
  }

  const originalAmount = subscription?.salePrice || subscription?.price || "0";
  const amount = discountedAmount !== null ? discountedAmount : originalAmount;
  const currency = subscription?.currency || "USD";

  const handleApplyCoupon = () => {
    if (!selectedCoupon) {
      toast.error("Please select a coupon");
      return;
    }

    const coupon = subscription?.applicable_coupons?.find(
      (c) => c.id === selectedCoupon
    );

    if (!coupon) {
      toast.error("Invalid coupon selected");
      return;
    }

    const originalPrice = subscription?.salePrice || subscription?.price || 0;
    let newAmount = originalPrice;

    if (coupon.discountType === "Fixed") {
      newAmount = originalPrice - coupon.value;
    } else if (coupon.discountType === "Percentage") {
      newAmount = originalPrice - (originalPrice * coupon.value) / 100;
    }

    newAmount = Math.max(0, newAmount);

    setDiscountedAmount(newAmount);
    setAppliedCoupon(coupon);
    toast.success(`Coupon "${coupon.code}" applied successfully!`);
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon("");
    setAppliedCoupon(null);
    setDiscountedAmount(null);
    toast.success("Coupon removed");
  };

  const createOrder = async () => {
    try {
      setProcessing(true);
      setPaymentError(null);

      console.log("Creating PayPal order for subscription:", subscription.id);

      sessionStorage.setItem(
        "pending_subscription",
        JSON.stringify({
          subscriptionId: subscription.id,
          organizationId: organizationId,
          durationInDays: subscription.durationInDays,
          amount: amount,
          currency: currency,
          planName: subscription.name,
        })
      );

      const orderData = await createPayPalOrder(
        amount,
        currency,
        organizationId,
        subscription.id
      );

      console.log("PayPal order created successfully:", orderData);

      if (orderData.approvalUrl) {
        console.log("Redirecting to PayPal approval:", orderData.approvalUrl);

        window.location.href = orderData.approvalUrl;
      }

      return orderData.orderId;
    } catch (error) {
      console.error("Error creating order:", error);
      setPaymentError("Failed to create payment order. Please try again.");
      toast.error("Failed to initiate payment");
      sessionStorage.removeItem("pending_subscription");
      throw error;
    }
  };

  const onApprove = async (data) => {
    try {
      console.log("PayPal payment approved, data:", data);
      setProcessing(true);
      setPaymentError(null);

      if (appliedCoupon) {
        try {
          await axiosPrivate.post(`/coupons/${appliedCoupon.id}`);
          console.log("Coupon applied successfully");
        } catch (couponError) {
          console.error("Error applying coupon:", couponError);
        }
      }

      const captureResult = await capturePayPalPayment(
        data.orderID,
        organizationId,
        subscription.id
      );

      console.log("Payment capture result:", captureResult);

      if (captureResult.status === "COMPLETED" || captureResult.success) {
        toast.success(
          "Payment successful! Your subscription has been activated."
        );
        onPaymentSuccess(subscription);
        onOpenChange(false);
      } else {
        throw new Error("Payment capture failed");
      }
    } catch (error) {
      console.error("Error capturing payment:", error);
      setPaymentError("Payment failed. Please try again.");
      toast.error("Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const onError = (err) => {
    console.error("PayPal Error:", err);
    setPaymentError("An error occurred during payment. Please try again.");
    toast.error("Payment error occurred");
  };

  const onCancel = () => {
    toast.info("Payment cancelled");
    setPaymentError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (processing) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-md bg-white"
        onInteractOutside={(e) => {
          if (processing) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (processing) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Complete Your Payment
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            You're upgrading to{" "}
            <span className="font-semibold">{subscription?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Subscription Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{subscription?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{subscription?.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Features:</span>
                <span className="font-medium text-right">
                  {subscription?.no_staff} Staff, {subscription?.no_assets}{" "}
                  Assets
                  <br />
                  {subscription?.no_clients} Clients, {subscription?.no_vendors}{" "}
                  Vendors
                </span>
              </div>
              {appliedCoupon && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Original Price:</span>
                    <span className="line-through">
                      ${originalAmount} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span>
                      {appliedCoupon.discountType === "Fixed"
                        ? `-$${appliedCoupon.value}`
                        : `-${appliedCoupon.value}%`}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ${amount.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coupon Selection */}
          {subscription?.applicable_coupons &&
            subscription.applicable_coupons.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Apply Coupon</h3>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedCoupon}
                      onChange={(e) => setSelectedCoupon(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a coupon</option>
                      {subscription.applicable_coupons.map((coupon) => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.code} -{" "}
                          {coupon.discountType === "Fixed"
                            ? `$${coupon.value} off`
                            : `${coupon.value}% off`}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!selectedCoupon}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-sm text-gray-600">
                        (
                        {appliedCoupon.discountType === "Fixed"
                          ? `$${appliedCoupon.value} off`
                          : `${appliedCoupon.value}% off`}
                        )
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* Payment Error */}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {paymentError}
            </div>
          )}

          {/* Processing Indicator */}
          {processing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Processing payment...</span>
            </div>
          )}

          {/* PayPal Buttons */}
          {!processing && paypalClientId && (
            <div className="paypal-button-container">
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "gold",
                  shape: "rect",
                  label: "paypal",
                  height: 45,
                }}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
                onCancel={onCancel}
                disabled={processing}
                forceReRender={[amount, currency, subscription?.id]}
                onInit={(data, actions) => {
                  console.log("PayPal buttons initialized");
                }}
                onClick={(data, actions) => {
                  console.log("PayPal button clicked");

                  const popup = window.open(
                    "",
                    "_blank",
                    "width=500,height=600"
                  );
                  if (
                    !popup ||
                    popup.closed ||
                    typeof popup.closed === "undefined"
                  ) {
                    console.warn(
                      "Popup blocked! Please allow popups for this site."
                    );
                    toast.error("Please allow popups to complete payment");
                    return actions.reject();
                  } else {
                    popup.close();
                    return actions.resolve();
                  }
                }}
              />
            </div>
          )}

          {!paypalClientId && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              PayPal is not configured. Please contact support.
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          <p>🔒 Secure payment powered by PayPal</p>
          <p className="mt-1">
            Your subscription will be activated immediately after payment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayPalPaymentModal;
