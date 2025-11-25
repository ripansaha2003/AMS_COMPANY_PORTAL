import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, Upload, Loader2 } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function AddBrandModal({ 
  children, 
  open, 
  onOpenChange, 
  onClose,
  isEditMode = false,
  editData = null 
}) {
  const defaultData = {
    brandName: "",
    logoFile: null,
  };

  const [formData, setFormData] = useState(defaultData);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevPreviewRef = useRef(null);

  // Effect to populate form data when in edit mode
  useEffect(() => {
    if (isEditMode && editData && open) {
      setFormData({
        brandName: editData.brandName || "",
        logoFile: null, // We don't prefill file, but show existing logo
      });
    } else if (!isEditMode && open) {
      setFormData(defaultData);
    }
  }, [isEditMode, editData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
    }
    // Revoke old preview if any
    if (prevPreviewRef.current) {
      URL.revokeObjectURL(prevPreviewRef.current);
      prevPreviewRef.current = null;
    }

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      prevPreviewRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }

    setFormData((prev) => ({ ...prev, logoFile: file }));
    if (error) setError(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
      
      // Revoke previous preview if any
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }

      const objectUrl = URL.createObjectURL(file);
      prevPreviewRef.current = objectUrl;
      setPreviewUrl(objectUrl);

      setFormData((prev) => ({ ...prev, logoFile: file }));
      if (error) setError(null);
    }
  };

  // Function to convert file to base64 with proper data URI format
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // Read the file as a data URL (includes the mime type prefix)
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Return the complete data URI (data:image/...;base64,...)
        resolve(reader.result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Function to create or update brand via API
  const createOrUpdateBrand = async (brandData) => {
    try {
      setLoading(true);
      setError(null);

      // Get organization ID from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const organizationId = user?.organization_id;

      if (!organizationId) {
        throw new Error("Organization ID not found. Please login again.");
      }

      // Prepare the request body
      const requestBody = {
        organization_id: organizationId,
        brand_name: brandData.brandName.trim(),
      };

      // Convert logo to base64 if file is provided
      if (brandData.logoFile) {
        const logoBase64 = await fileToBase64(brandData.logoFile);
        requestBody.logo = logoBase64;
      }

      let response;

      if (isEditMode && editData?.id) {
        // Update existing brand (PUT request)
        console.log("put",editData, isEditMode)
        response = await axiosPrivate.put(`/organizations/${organizationId}/brands/${editData.id}`, requestBody);
        console.log("Brand updated successfully:", response.data);
      } else {
        console.log("post",editData, isEditMode)
        // Create new brand (POST request)
        response = await axiosPrivate.post(`/organizations/${organizationId}/brands`, requestBody);
        console.log("Brand created successfully:", response.data);
      }
      
      // Reset form
      setFormData(defaultData);
      // cleanup preview
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
        setPreviewUrl(null);
      }
      
      // Close modal and trigger refresh
      if (onClose) {
        onClose(true); // Pass true to indicate data should be refreshed
      } else if (onOpenChange) {
        onOpenChange(false);
      }

      return response.data;

    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} brand:`, err);
      
      // Handle different types of errors
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || 
                           err.response.data?.error || 
                           `Server error: ${err.response.status}`;
        setError(errorMessage);
      } else if (err.request) {
        // Request was made but no response received
        setError("Network error. Please check your connection and try again.");
      } else {
        // Something else happened
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.brandName.trim()) {
      setError("Brand name is required");
      return;
    }

    await createOrUpdateBrand(formData);
  };

  const handleCancel = () => {
    setFormData(defaultData);
    setError(null);
    if (prevPreviewRef.current) {
      URL.revokeObjectURL(prevPreviewRef.current);
      prevPreviewRef.current = null;
      setPreviewUrl(null);
    }
    if (onClose) {
      onClose(false); // Pass false to indicate no refresh needed
    } else if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }
    };
  }, []);

  const getDisplaySrc = (filePreviewUrl, editLogo) => {
    if (filePreviewUrl) return filePreviewUrl;
    if (!editLogo) return null;

    // Return logo as-is (should be proper base64 with data URI prefix from backend)
    return typeof editLogo === 'string' ? editLogo : null;
  };

  const isControlled = !children;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {isEditMode ? "Edit Brand" : "Add New Brand"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Brand Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              placeholder="Enter brand name"
              disabled={loading}
            />
          </div>

          {/* Upload Logo Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Logo
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-[#d41920] bg-[#ED1C2408]"
                  : "border-[#ED1C24] bg-[#ED1C2408]"
              } ${loading ? 'pointer-events-none opacity-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
                disabled={loading}
              />

              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[#ED1C24]" />
                </div>

                <div>
                  <p className="text-gray-600">
                    Drag the logo or{" "}
                    <span className="text-[#ED1C24] font-medium cursor-pointer">
                      browse
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Dimension 200*200
                  </p>
                </div>
              </div>

              {(formData.logoFile || (isEditMode && editData?.logo)) ? (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  {formData.logoFile && (
                    <p className="mb-2">Selected: {formData.logoFile.name}</p>
                  )}
                  {!formData.logoFile && isEditMode && editData?.logo && (
                    <p className="mb-2">Current logo will be kept (upload new file to replace)</p>
                  )}
                  <div className="mt-2">
                    <img
                      src={getDisplaySrc(previewUrl, editData?.logo)}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 font-medium text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.brandName.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Add')}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
