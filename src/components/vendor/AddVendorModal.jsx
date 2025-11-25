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
import { Upload, X, Loader2 } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useLimitCheck } from "@/hooks/useLimitCheck";
import { useCountryData } from "@/hooks/useCountryData";

export default function AddVendorModal({
  open,
  onOpenChange,
  children,
  isEdit = false,
  editData = null, // Data for editing
  organizationId = "", // Default or pass as prop
  onSuccess, // Callback for successful submission
  onError, // Callback for error handling
}) {
  const { refreshAfterAction } = useSubscription();
  const { checkLimit } = useLimitCheck("vendors");

  // Check limit when modal opens (for any programmatic opening)
  useEffect(() => {
    if (open && !isEdit && !checkLimit()) {
      onOpenChange(false);
    }
  }, [open]);
  
  const defaultData = {
    vendorName: "",
    pocOwnerName: "",
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
    status: "active",
  };
console.log("edit data",editData)
  const [formData, setFormData] = useState(defaultData);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const { countries, states, cities, loading, fetchStates, fetchCities, getPhoneCode } = useCountryData();

  const API_BASE_URL = "https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev";

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

  // Effect to populate form data when editing
  useEffect(() => {
    if (isEdit && editData && open) {
      // Safely split phone into countryCode and phone if it exists.
      // Some callers may pass numbers (or NaN) — coerce to string first.
      const phoneStr = editData.phone ? String(editData.phone) : "";
      let phoneData = { countryCode: "+91", phone: "" };
      if (phoneStr) {
        if (phoneStr.includes(" ")) {
          const parts = phoneStr.split(" ");
          phoneData = { countryCode: parts[0] || "+91", phone: parts.slice(1).join(" ") || "" };
        } else {
          // No explicit country code in the string — treat entire string as phone
          phoneData = { countryCode: "+91", phone: phoneStr };
        }
      }

      setFormData({
        vendorName: editData.name || editData.vendorName || "",
        pocOwnerName: editData.ownerName || editData.pocOwnerName || "",
        email: editData.email || "",
        ...phoneData,
        country: editData.country || "",
        addressLine1: editData.addressLine1 || "",
        addressLine2: editData.addressLine2 || "",
        landmark: editData.landmark || "",
        city: editData.city || "",
        state: editData.state || "",
        zipcode: editData.zipcode || "",
        logo: null, // Don't pre-populate file input
        status: editData.status || "active",
      });
      // If editData contains a logo url/string, show it as preview
      if (editData.logo) {
        setImagePreview(editData.logo);
      } else {
        setImagePreview(null);
      }
    } else if (!isEdit && open) {
      // Reset form for add mode
      setFormData(defaultData);
      setImagePreview(null);
    }
    
    // Clear errors when modal opens/closes
    if (open) {
      setErrors({});
    }
  }, [isEdit, editData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    // Only revoke object URLs that we created via createObjectURL
    if (imagePreview && imagePreview.startsWith && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (e) {
        // ignore
      }
    }
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, logo: null }));
  };

  useEffect(() => {
    return () => {
      // Only revoke blob/object URLs
      if (imagePreview && imagePreview.startsWith && imagePreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [imagePreview]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = "Vendor name is required";
    }

    if (!formData.pocOwnerName.trim()) {
      newErrors.pocOwnerName = "Owner name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address Line 1 is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    setFormData(defaultData);
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare the payload according to API specification
      const payload = {
        organization_id: organizationId,
        vendorName: formData.vendorName,
        pocOwnerName: formData.pocOwnerName,
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`,
        addressLine1: formData.addressLine1,
        status: formData.status,
      };

      // Optional fields - only include if they have values
      if (formData.addressLine2?.trim()) {
        payload.addressLine2 = formData.addressLine2;
      }
      if (formData.landmark?.trim()) {
        payload.landmark = formData.landmark;
      }
      if (formData.city?.trim()) {
        payload.city = formData.city;
      }
      if (formData.state?.trim()) {
        payload.state = formData.state;
      }
      if (formData.zipcode !== undefined && String(formData.zipcode || "").trim()) {
        payload.zipcode = String(formData.zipcode);
      }

      // Convert logo to base64 if present
      if (formData.logo) {
        const logoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.logo);
        });
        payload.logo = logoBase64;
      }

      console.log("Submitting vendor data:", payload);

      let response;
      
      if (isEdit && editData?.id) {
        // Update existing vendor
        response = await axios.put(`${API_BASE_URL}/vendors/${editData.id}?organization_id=${organizationId}`, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("Vendor updated successfully:", response.data);
      } else {
        // Create new vendor
        response = await axios.post(`${API_BASE_URL}/vendors`, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("Vendor created successfully:", response.data);
      }

      // Reset form and close modal
      setFormData(defaultData);
      onOpenChange(false);

      // Refresh subscription data after successful creation/update
      await refreshAfterAction();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} vendor:`, error);

      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} vendor. Please try again.`;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check your inputs.";
      } else if (error.response?.status === 401) {
        errorMessage = "Unauthorized. Please check your credentials.";
      } else if (error.response?.status === 404 && isEdit) {
        errorMessage = "Vendor not found. It may have been deleted.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      setErrors({ submit: errorMessage });

      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
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
              {isEdit ? "Edit" : "Add"} Vendor
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name<span className="text-red-500">*</span>
            </label>
            <input
              name="vendorName"
              value={formData.vendorName}
              onChange={handleChange}
              placeholder="Enter vendor name"
              className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                errors.vendorName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.vendorName && (
              <p className="text-red-500 text-xs mt-1">{errors.vendorName}</p>
            )}
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Name<span className="text-red-500">*</span>
            </label>
            <input
              name="pocOwnerName"
              value={formData.pocOwnerName}
              onChange={handleChange}
              placeholder="Enter owner name"
              className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                errors.pocOwnerName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.pocOwnerName && (
              <p className="text-red-500 text-xs mt-1">{errors.pocOwnerName}</p>
            )}
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
                className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
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
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
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
                className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                  errors.addressLine1 ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.addressLine1 && (
                <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>
              )}
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
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
                City
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={!formData.state || loading}
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
              <label className="block text-sm text-gray-700 mb-1">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={!formData.country || loading}
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
                Zipcode
              </label>
              <input
                name="zipcode"
                type="number"
                value={formData.zipcode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  handleChange({ target: { name: "zipcode", value } });
                }}
                placeholder="Enter zipcode"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
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
                }`}
                onClick={handleBrowseClick}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

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
              disabled={isSubmitting}
              className="px-6 py-2 text-gray-700 font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm disabled:opacity-50 disabled:hover:bg-[#ED1C24] flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Adding..." : isEdit ? "Update" : "Add"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}