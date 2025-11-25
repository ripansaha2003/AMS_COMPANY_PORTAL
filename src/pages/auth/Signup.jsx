import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { axiosPrivate, axiosPublic } from "@/axios/axiosInstance";
import toast from "react-hot-toast";
import axios from "axios";
import { useCountryData } from "@/hooks/useCountryData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Signup = () => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizationName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+1",
    country: "United States",
    countryIso2: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    stateIso2: "",
    zipcode: "",
  });

  const [logoBase64, setLogoBase64] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  const {
    countries,
    states,
    cities,
    loadStates,
    loadCities,
    getCountryByName,
  } = useCountryData();

  // Seed default country metadata once the dataset is ready
  useEffect(() => {
    if (!countries.length || !formData.country) return;

    setFormData((prev) => {
      const existing =
        countries.find((country) => country.name === prev.country) ||
        countries[0];

      if (!existing) return prev;

      const needsUpdate =
        prev.countryIso2 !== existing.iso2 ||
        prev.countryCode !== existing.phoneCode;

      if (!needsUpdate) return prev;

      return {
        ...prev,
        countryIso2: existing.iso2,
        countryCode: existing.phoneCode,
      };
    });
  }, [countries, formData.country]);

  // Refresh the available states whenever the country changes
  useEffect(() => {
    loadStates(formData.countryIso2);
  }, [formData.countryIso2, loadStates]);

  // Ensure we have the state iso2 when editing existing data
  useEffect(() => {
    if (!states.length || !formData.state || formData.stateIso2) return;

    const matchingState = states.find((state) => state.name === formData.state);
    if (!matchingState) return;

    setFormData((prev) => ({
      ...prev,
      stateIso2: matchingState.iso2,
    }));
  }, [states, formData.state, formData.stateIso2]);

  // Load cities whenever the selected state changes
  useEffect(() => {
    loadCities(formData.countryIso2, formData.stateIso2);
  }, [formData.countryIso2, formData.stateIso2, loadCities]);
  const handleCountrySelect = (iso2) => {
    if (!iso2) {
      setFormData((prev) => ({
        ...prev,
        country: "",
        countryIso2: "",
        countryCode: "+1",
        state: "",
        stateIso2: "",
        city: "",
      }));
      return;
    }

    const selectedCountry =
      countries.find((country) => country.iso2 === iso2) ||
      getCountryByName(formData.country);

    if (!selectedCountry) return;

    setFormData((prev) => ({
      ...prev,
      country: selectedCountry.name,
      countryIso2: selectedCountry.iso2,
      countryCode: selectedCountry.phoneCode,
      state: "",
      stateIso2: "",
      city: "",
    }));
  };

  const handleStateSelect = (iso2) => {
    if (!iso2) {
      setFormData((prev) => ({
        ...prev,
        state: "",
        stateIso2: "",
        city: "",
      }));
      return;
    }

    const selectedState = states.find((state) => state.iso2 === iso2);
    if (!selectedState) return;

    setFormData((prev) => ({
      ...prev,
      state: selectedState.name,
      stateIso2: selectedState.iso2,
      city: "",
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setLogoBase64(base64);
      setLogoPreview(base64);
    } catch (error) {
      console.error("Error converting file to base64:", error);
      alert("Error uploading file");
    }
  };

  const validateField = (field, value) => {
    const msg = getFieldError(field, value);
    setErrors((prev) => ({ ...prev, [field]: msg }));
    return msg === "";
  };

  const getFieldError = (field, value) => {
    let msg = "";
    const v = (value || "").toString().trim();

    switch (field) {
      case "organizationName":
        if (!v) msg = "Organization Name is required";
        break;
      case "firstName":
        if (!v) msg = "First Name is required";
        break;
      case "lastName":
        if (!v) msg = "Last Name is required";
        break;
      case "email":
        if (!v) msg = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
          msg = "Enter a valid email";
        break;
      case "phone":
        if (!v) msg = "Phone number is required";
        else if (!/^\d{6,15}$/.test(v))
          msg = "Enter a valid phone number (6-15 digits)";
        break;
      case "addressLine1":
        if (!v) msg = "Address Line 1 is required";
        break;
      case "country":
        if (!v) msg = "Country is required";
        break;
      case "city":
        if (!v) msg = "City is required";
        break;
      case "state":
        if (!v) msg = "State is required";
        break;
      case "zipcode":
        if (!v) msg = "Zipcode is required";
        else if (!/^\d{3,10}$/.test(v)) msg = "Enter a valid zipcode";
        break;
      default:
        break;
    }

    return msg;
  };

  const validateAll = () => {
    const toValidate = [
      "organizationName",
      "firstName",
      "lastName",
      "email",
      "phone",
      "addressLine1",
      "country",
      "city",
      "state",
      "zipcode",
    ];

    const newErrors = {};
    let ok = true;
    toValidate.forEach((f) => {
      const msg = getFieldError(f, formData[f]);
      if (msg) ok = false;
      newErrors[f] = msg;
    });

    setErrors(newErrors);
    return { ok, newErrors };
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    const { ok: allValid, newErrors } = validateAll();

    const combinedErrors = { ...newErrors };
    if (!agreedToTerms)
      combinedErrors.terms = "Please agree to the Terms and Privacy Policy";

    setErrors(combinedErrors);

    if (!allValid || !agreedToTerms) {
      const firstErrorField = Object.keys(combinedErrors).find(
        (k) => combinedErrors[k]
      );
      if (firstErrorField) {
        if (firstErrorField === "terms") {
          const el = document.getElementById("terms");
          if (el && typeof el.scrollIntoView === "function")
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const el = document.querySelector(`[name="${firstErrorField}"]`);
          if (el && typeof el.focus === "function") el.focus();
          if (el && typeof el.scrollIntoView === "function")
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    try {
      const payload = {
        ...formData,
        phone: `${formData.phone}`,
        logo: logoBase64 || null,

        pocOwnerName: `${formData.firstName || ""} ${
          formData.lastName || ""
        }`.trim(),
      };

      const response = await axios.post(
        "https://udoftqxd0e.execute-api.ap-south-1.amazonaws.com/dev/organizations",
        payload
      );
      console.log("Registration success:", response.data);
      // Show blocking modal instead of toast. navigate after user clicks OK.
      setSuccessModalOpen(true);
    } catch (error) {
      console.error("Signup error:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <>
      <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/assets/imgs/auth/bg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="relative w-fit mx-auto bg-white rounded-2xl shadow-2xl p-14 backdrop-blur-sm border border-white/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo.png"
              alt="logo"
              className="w-[8rem]"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Let's Sign You In
          </h2>
        </div>

        <div className="space-y-5 lg:w-[30vw] w-[60vw]">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name*
            </label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={(e) =>
                handleInputChange("organizationName", e.target.value)
              }
              onBlur={() =>
                validateField("organizationName", formData.organizationName)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
              placeholder="Enter your Organization Name"
              required
            />
            {errors.organizationName && (
              <p className="text-sm text-red-600 mt-1">
                {errors.organizationName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name*
              </label>
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                onBlur={() => validateField("firstName", formData.firstName)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
                placeholder="Enter your First Name"
                required
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name*
              </label>
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                onBlur={() => validateField("lastName", formData.lastName)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
                placeholder="Enter your Last Name"
                required
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email*
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() => validateField("email", formData.email)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
                placeholder="Enter your Email"
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone*
              </label>
              <div className="flex w-full max-w-md overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#ED1C24]">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={(e) =>
                    handleInputChange("countryCode", e.target.value)
                  }
                  className="bg-gray-100 px-3 py-3 text-gray-900 focus:outline-none border-r border-gray-300 text-sm w-20"
                  disabled
                  title="Phone code is automatically set based on country"
                >
                  <option value={formData.countryCode}>
                    {formData.countryCode}
                  </option>
                </select>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    handleInputChange("phone", value);
                  }}
                  onBlur={() => validateField("phone", formData.phone)}
                  placeholder="e.g., 9876543210"
                  className="flex-1 px-4 py-3 text-gray-900 focus:outline-none bg-gray-50"
                  required
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1*
              </label>
              <input
                name="addressLine1"
                type="text"
                value={formData.addressLine1}
                onChange={(e) =>
                  handleInputChange("addressLine1", e.target.value)
                }
                onBlur={() =>
                  validateField("addressLine1", formData.addressLine1)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
                placeholder="Enter your Address Line 1"
                required
              />
              {errors.addressLine1 && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.addressLine1}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) =>
                  handleInputChange("addressLine2", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
                placeholder="Enter your Address Line 2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => handleInputChange("landmark", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
                placeholder="Enter your Landmark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country*
              </label>
              <div className="relative">
                <select
                  name="country"
                  value={formData.countryIso2}
                  onChange={(e) => handleCountrySelect(e.target.value)}
                  onBlur={() => validateField("country", formData.country)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                >
                  <option value="">Select a Country</option>
                  {countries.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.name} ({c.phoneCode})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
              </div>
              {errors.country && (
                <p className="text-sm text-red-600 mt-1">{errors.country}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City*
              </label>
              <div className="relative">
                <select
                  name="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  onBlur={() => validateField("city", formData.city)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                  disabled={!formData.stateIso2}
                >
                  <option value="">Select a City</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
              </div>
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State*
              </label>
              <div className="relative">
                <select
                  name="state"
                  value={formData.stateIso2}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  onBlur={() => validateField("state", formData.state)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                  disabled={!formData.countryIso2}
                >
                  <option value="">Select a State</option>
                  {states.map((s) => (
                    <option key={s.iso2} value={s.iso2}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
              </div>
              {errors.state && (
                <p className="text-sm text-red-600 mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zipcode*
              </label>
              <input
                name="zipcode"
                type="number"
                value={formData.zipcode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  handleInputChange("zipcode", value);
                }}
                onBlur={() => validateField("zipcode", formData.zipcode)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent transition-all duration-200 bg-gray-50"
                placeholder="Enter your Zipcode"
                required
              />
              {errors.zipcode && (
                <p className="text-sm text-red-600 mt-1">{errors.zipcode}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 py-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-[#ED1C24] focus:ring-[#ED1C24] border-gray-300 rounded"
            />
            <label
              htmlFor="terms"
              className="text-sm text-gray-600 leading-relaxed"
            >
              I agree to all the{" "}
              <Link to="/terms" className="text-[#ED1C24] hover:text-blue-800 cursor-pointer font-medium">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-[#ED1C24] hover:text-blue-800 cursor-pointer font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-600 mt-1">{errors.terms}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-[#ED1C24] hover:bg-[#d91b22] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2"
          >
            Signup
          </button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to={"/"}
                className="text-[#ED1C24] hover:text-blue-800 cursor-pointer font-semibold hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>

      <Dialog open={successModalOpen} onOpenChange={() => {}}>
          <DialogContent showClose={false} className="sm:max-w-md bg-white" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900 text-center">
              Your account is created
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 text-center">
              Please check your email for the login credentials
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6">
            <Button
              onClick={() => {
                setSuccessModalOpen(false);
                navigate("/");
              }}
              className="w-full bg-[#ED1C24] hover:bg-[#d91b22] text-white"
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default Signup;
