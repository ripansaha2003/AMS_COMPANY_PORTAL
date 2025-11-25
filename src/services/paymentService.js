import { axiosPrivate } from "@/axios/axiosInstance";

/**
 * Payment Service - Handles PayPal payment integration
 */

/**
 * Create PayPal order via backend
 * @param {string} amount - Payment amount
 * @param {string} currency - Currency code (e.g., "USD")
 * @param {string} organizationId - Organization ID
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} - PayPal order data with order_id and approval_url
 */
export const createPayPalOrder = async (amount, currency, organizationId, subscriptionId) => {
  try {
    const response = await axiosPrivate.post("/payments", {
      action: "create_order",
      amount: amount.toString(),
      currency: currency || "USD",
      organization_id: organizationId,
      subscription_id: subscriptionId,
    });
    console.log('res',response);
    
    if (response.data && response.data.order_id) {
      // Return the full response data including approval_url
      return {
        orderId: response.data.order_id,
        approvalUrl: response.data.approval_url,
        status: response.data.status
      };
    }

    throw new Error("Failed to create PayPal order - no order_id returned");
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw error;
  }
};

/**
 * Capture PayPal payment after approval
 * @param {string} orderId - PayPal order ID
 * @param {string} organizationId - Organization ID
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} - Payment capture result
 */
export const capturePayPalPayment = async (orderId, organizationId, subscriptionId) => {
  try {
    const response = await axiosPrivate.post("/payments", {
      action: "capture_payment",
      order_id: orderId,
      organization_id: organizationId,
      subscription_id: subscriptionId,
    });

    console.log("Capture payment response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    throw error;
  }
};

/**
 * Verify payment status
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<Object>} - Payment verification result
 */
export const verifyPayment = async (orderId) => {
  try {
    const response = await axiosPrivate.get(`/payments/verify/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};
