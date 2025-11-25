import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { axiosPublic } from "@/axios/axiosInstance";
import axios from "axios";
import toast from "react-hot-toast";
import { useSubscription } from "@/context/SubscriptionContext";

const Login = () => {
  const { fetchSubscriptionStatus } = useSubscription();
  const [currentScreen, setCurrentScreen] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: ["", "", "", "", "", ""],
    newPassword: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...formData.otp];
      newOtp[index] = value;
      setFormData((prev) => ({
        ...prev,
        otp: newOtp,
      }));

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      } else if (!value) {
        const nextInput = document.getElementById(`otp-${index - 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const res = await axiosPublic.post("/auth/forgot-password", {
        email: formData.email,
      });
      if (res.status == 200) {
        setCurrentScreen("otp");
      }
    } catch (error) {
      console.error("ERR::FORGOT", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    setLoading(true);
    try {
      const res = await axiosPublic.post("/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp.join(""),
      });
      if (res.status == 200) {
        setCurrentScreen("resetPassword");
      }
    } catch (error) {
      console.error("ERR::OTP", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const res = await axiosPublic.post("/auth/reset-password", {
        email: formData.email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      if (res.status == 200) {
        setCurrentScreen("login");
      }
    } catch (error) {
      console.error("ERR::OTP", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axiosPublic.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      if(res.status==200){

        const data = res.data;
        // persist user info but avoid storing very large fields (images/base64) in localStorage
        try {
          localStorage.setItem("user", JSON.stringify(data.user));

          localStorage.setItem(
            "roleDetail",
            data?.user?.roleDetails ? JSON.stringify(data.user.roleDetails) : JSON.stringify({})
          );

          // sanitize organization before storing: remove large data URLs or binary blobs
          const org = data?.user?.organization || {};
          const sanitizedOrg = { ...org };
          if (typeof sanitizedOrg.logo === "string") {
            // if logo is a data URL (base64) it's likely large — remove it from localStorage copy
            if (sanitizedOrg.logo.startsWith("data:")) {
              delete sanitizedOrg.logo;
            }
            // also guard against very large strings
            if (sanitizedOrg.logo && sanitizedOrg.logo.length > 10000) {
              delete sanitizedOrg.logo;
            }
          }

          localStorage.setItem("orgDetail", JSON.stringify(sanitizedOrg));

          localStorage.setItem("accessToken", data.tokens.accessToken);
        } catch (e) {
          console.warn("localStorage quota exceeded while saving user/org data:", e);
          // Try to recover by storing minimal info
          try {
            const minimalUser = { id: data.user?.id, email: data.user?.email, firstName: data.user?.firstName, lastName: data.user?.lastName };
            localStorage.setItem("user", JSON.stringify(minimalUser));
            localStorage.setItem("roleDetail", JSON.stringify({}));
            localStorage.setItem("orgDetail", JSON.stringify({ id: data.user?.organization?.id, name: data.user?.organization?.name }));
            localStorage.setItem("accessToken", data.tokens.accessToken);
          } catch (err) {
            console.error("Failed to save minimal user info to localStorage:", err);
          }
        }
        toast.success('Login Successfull')
        
        // Fetch subscription status after login
        await fetchSubscriptionStatus();
        
        navigate('/staff') 
      }
    } catch (error) {
      console.error("ERR::LOGIN", error);
        toast.error('Login Failed')

    }
  };

  const renderLoginScreen = () => (
    <div className="w-full max-w-md mr-auto ml-20 bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img
            src="./assets/imgs/auth/logo.png"
            alt="logo"
            className="w-[8rem]"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email*
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password*
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24] focus:border-[#ED1C24] border-gray-300 rounded"
          />
          <label
            htmlFor="remember"
            className="ml-2 block text-sm text-gray-700"
          >
            Remember me
          </label>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-[#ED1C24] text-white py-2 px-4 rounded-md hover:bg-[#df1a22] focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2 font-medium"
        >
          Log In
        </button>

        <div className="text-right">
          <button
            type="button"
            onClick={() => setCurrentScreen("forgotPassword")}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Forget your password?
          </button>
        </div>
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            No account yet?{" "}
            <Link to="/signup" className="text-[#ED1C24] font-semibold hover:underline" aria-label="Create an account">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );

  const renderForgotPasswordScreen = () => (
    <div className="w-full max-w-md mr-auto ml-20 bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img
            src="./assets/imgs/auth/logo.png"
            alt="logo"
            className="w-[8rem]"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Forget Password?</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email*
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <button
          onClick={handleForgotPassword}
          disabled={loading}
          className={`w-full flex items-center justify-center bg-[#ED1C24] text-white py-2 px-4 rounded-md font-medium
        ${loading ? "cursor-not-allowed opacity-75" : "hover:bg-[#df1a22]"}
        focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Send"
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setCurrentScreen("login")}
            className="text-sm text-[#ED1C24] hover:text-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );

  const renderOtpScreen = () => (
    <div className="w-full max-w-md mr-auto ml-20 bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img
            src="./assets/imgs/auth/logo.png"
            alt="logo"
            className="w-[8rem]"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Enter OTP</h2>
        <p className="text-sm text-gray-600 mt-2">
          Enter Verification Code sent to your Email
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex space-x-3 justify-center">
          {formData.otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            />
          ))}
        </div>

        <button
          onClick={handleOtpVerification}
          className="w-full bg-[#ED1C24] text-white py-2 px-4 rounded-md hover:bg-[#df1a22] focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2 font-medium"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Submit"
          )}
        </button>

        <div className="text-center">
          <span className="text-sm text-gray-600">Didn't Receive Code? </span>
          <button
            type="button"
            className="text-sm text-[#ED1C24] hover:text-blue-700"
          >
            Send Again
          </button>
        </div>
      </div>
    </div>
  );

  const renderResetPasswordScreen = () => (
    <div className="w-full max-w-md mr-auto ml-20 bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img
            src="./assets/imgs/auth/logo.png"
            alt="logo"
            className="w-[8rem]"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password*
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password*
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleResetPassword}
          className="w-full bg-[#ED1C24] text-white py-2 px-4 rounded-md hover:bg-[#df1a22] focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2 font-medium"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Proceed"
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-start p-4"
      style={{
        backgroundImage: `url('/assets/imgs/auth/bg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      {currentScreen === "login" && renderLoginScreen()}
      {currentScreen === "forgotPassword" && renderForgotPasswordScreen()}
      {currentScreen === "otp" && renderOtpScreen()}
      {currentScreen === "resetPassword" && renderResetPasswordScreen()}
    </div>
  );
};

export default Login;
