import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useLimitCheck } from "@/hooks/useLimitCheck";
import { useCountryData } from "@/hooks/useCountryData";

export default function AddClientModal({
  open,
  onOpenChange,
  children,
  isEdit = false,
  clientData = null,
}) {
  const { refreshAfterAction } = useSubscription();
  const { checkLimit } = useLimitCheck("clients");

  // Check limit when modal opens (for any programmatic opening)
  useEffect(() => {
    if (open && !isEdit && !checkLimit()) {
      onOpenChange(false);
    }
  }, [open]);
  const defaultData = {
    clientName: "",
    ownerName: "",
    email: "",
    phone: "",
    countryCode: "+1",
    country: "United States",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    zipcode: "",
    logo: null,
  };

  const [formData, setFormData] = useState(defaultData);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const { countries, states, cities, loading, fetchStates, fetchCities, getPhoneCode } = useCountryData();

  // Handle country change - fetch states and update phone code
  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country);
      const phoneCode = getPhoneCode(formData.country);
      setFormData((prev) => ({
        ...prev,
        countryCode: phoneCode,
        state: "",
        city: "",
      }));
    }
  }, [formData.country]);

  // Handle state change - fetch cities
  useEffect(() => {
    if (formData.country && formData.state) {
      fetchCities(formData.country, formData.state);
      setFormData((prev) => ({
        ...prev,
        city: "",
      }));
    }
  }, [formData.state]);

  // Populate form data when in edit mode
  useEffect(() => {
    if (isEdit && clientData) {
      // Split phone into countryCode and phone if it exists
      const phoneData = clientData.phone 
        ? {
            countryCode: clientData.phone.split(" ")[0] || "+91",
            phone: clientData.phone.split(" ")[1] || "",
          }
        : { countryCode: "+91", phone: "" };

      setFormData({
        clientName: clientData.clientName || "",
        ownerName: clientData.ownerName || "",
        email: clientData.email || "",
        ...phoneData,
        country: clientData.country || "",
        addressLine1: clientData.addressLine1 || "",
        addressLine2: clientData.addressLine2 || "",
        landmark: clientData.landmark || "",
        city: clientData.city || "",
        state: clientData.state || "",
        zipcode: clientData.zipcode || "",
        logo: null, // Reset logo for edit mode
      });
    } else {
      setFormData(defaultData);
    }
  }, [isEdit, clientData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // revoke previous preview if exists
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData((prev) => ({ ...prev, logo: file }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (["dragenter", "dragover"].includes(e.type)) {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setFormData((prev) => ({ ...prev, logo: file }));
      }
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageRemove = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setFormData((prev) => ({ ...prev, logo: null }));
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleCancel = () => {
    setFormData(defaultData);
    onOpenChange(false);
  };

  const validateForm = () => {
    const requiredFields = [
      "clientName",
      "ownerName",
      "email",
      "phone",
      "addressLine1",
      "city",
      "state",
      "zipcode",
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        alert(
          `Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`
        );
        return false;
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get organization ID from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const ORGANIZATION_ID = user.organization_id;

      // Convert logo to base64 if present
      let logoBase64 = null;
      if (formData.logo) {
        logoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.logo);
        });
      }

      // Build JSON payload with base64 image
      const payload = {
        organization_id: ORGANIZATION_ID,
        clientName: formData.clientName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || "",
        landmark: formData.landmark || "",
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        status: "active",
        logo: logoBase64,
      };

      let response;
      const base = "https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev";

      if (isEdit && clientData) {
        // Update existing client
        response = await axios.put(
          `${base}/clients/${clientData.id}?organization_id=${ORGANIZATION_ID}`,
          payload
        );
        console.log("Client updated successfully:", response.data);
        alert("Client updated successfully!");
      } else {
        // Create new client
        response = await axios.post(`${base}/clients`, payload);
        console.log("Client added successfully:", response.data);
        alert("Client added successfully!");
      }

      // Reset form and close modal on success
      setFormData(defaultData);
      
      // Refresh subscription data after successful creation/update
      await refreshAfterAction();
      
      // Pass true to indicate that editing was successful
      onOpenChange(isEdit ? true : false);
    } catch (error) {
      console.error(`Error ${isEdit ? "updating" : "adding"} client:`, error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        console.error("Server Error:", error.response.data);
        alert(
          `Error: ${
            error.response.data.message ||
            `Failed to ${isEdit ? "update" : "add"} client`
          }`
        );
      } else if (error.request) {
        // Network error
        console.error("Network Error:", error.request);
        alert("Network error. Please check your connection and try again.");
      } else {
        // Other error
        console.error("Error:", error.message);
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isControlled = !children;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[700px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {isEdit ? "Edit Client" : "Add Client"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name<span className="text-red-500">*</span>
            </label>
            <input
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Enter client name"
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Name<span className="text-red-500">*</span>
            </label>
            <input
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="Enter owner name"
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone<span className="text-red-500">*</span>
              </label>
              <div className="flex w-full max-w-md overflow-hidden rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#ED1C24]">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
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
                    handleChange({ target: { name: "phone", value } });
                  }}
                  placeholder="e.g., 9876543210"
                  className="flex-1 px-3 py-3 text-gray-900 focus:outline-none text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Address Line 1 and 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1<span className="text-red-500">*</span>
              </label>
                <input
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Enter address line 1"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Enter address line 2 (optional)"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Landmark and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark
              </label>
              <input
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="Enter landmark (optional)"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country<span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Select a Country</option>
                {countries.map((c) => (
                  <option key={c.iso2} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City<span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={!formData.state || loading || isLoading}
              >
                <option value="">Select a City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State<span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={!formData.country || loading || isLoading}
              >
                <option value="">Select a State</option>
                {states.map((s) => (
                  <option key={s.iso2 || s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Zipcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zipcode<span className="text-red-500">*</span>
              </label>
              <input
                name="zipcode"
                value={formData.zipcode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  handleChange({ target: { name: "zipcode", value } });
                }}
                placeholder="Enter zipcode"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Upload Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Logo</label>
            {imagePreview ? (
              <div className="border-2 border-gray-200 rounded-lg p-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={imagePreview} alt="Logo preview" className="w-16 h-16 object-cover rounded-lg border" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Logo uploaded</p>
                      <p className="text-xs text-gray-500">Ready to submit</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleImageRemove} className="text-red-500 hover:text-red-700">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed border-[#ED1C24] rounded-lg p-8 text-center bg-[#ED1C240F] cursor-pointer hover:bg-[#ED1C2415] transition-colors ${
                  dragActive ? "border-[#d41920] bg-[#ED1C2408]" : "border-[#ED1C24] bg-[#ED1C2408]"
                } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                onClick={handleBrowseClick}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isLoading} />

                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-[#ED1C24]" />
                  </div>
                  <div>
                    <p className="text-gray-600">
                      Drag your Logo or{' '}
                      <button type="button" onClick={handleBrowseClick} className="text-[#ED1C24] font-medium cursor-pointer">
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Dimension 200×200</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 font-medium text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading
                ? isEdit
                  ? "Updating..."
                  : "Adding..."
                : isEdit
                ? "Update"
                : "Add"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
