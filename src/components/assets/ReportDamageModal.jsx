import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function ReportDamageModal({ 
  open, 
  onOpenChange, 
  children, 
  onSuccess,
  assetId,
  editData = null // For edit mode
}) {
  const defaultData = {
    damageName: "",
    damageReportedBy: "",
    department: "",
    description: "",
    images: [],
  };

  const [formData, setFormData] = useState(editData || defaultData);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffData, setStaffData] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Get organization_id from localStorage
  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.organization_id;
    } catch (error) {
      console.error('Error getting organization_id:', error);
      return null;
    }
  };

  // Fetch departments data
  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        throw new Error('Organization ID not found');
      }

      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/departments`
      );
      console.log("Departments data fetched:", response.data);
      
      const data = Array.isArray(response.data) ? response.data : [];
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Fetch staff data
  const fetchStaffData = async () => {
    setStaffLoading(true);
    try {
      const organization_id = getOrganizationId();
      if (!organization_id) {
        throw new Error('Organization ID not found');
      }
      
      const response = await axiosPrivate.get(`/staff?organization_id=${organization_id}`);
      console.log("Staff data fetched:", response.data);

      const data = Array.isArray(response.data) ? response.data : [];
      setStaffData(data);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      setStaffData([]);
    } finally {
      setStaffLoading(false);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchStaffData();
      fetchDepartments();
    }
  }, [open]);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const base64Images = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          data: await fileToBase64(file)
        }))
      );
      setFormData((prev) => ({ ...prev, images: base64Images }));
    } catch (error) {
      console.error('Error converting files to base64:', error);
      setError('Error processing images. Please try again.');
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

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      try {
        const base64Images = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            data: await fileToBase64(file)
          }))
        );
        setFormData((prev) => ({ ...prev, images: base64Images }));
      } catch (error) {
        console.error('Error converting files to base64:', error);
        setError('Error processing images. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setFormData(editData || defaultData);
    setError("");
    onOpenChange(false);
  };

  const validateForm = () => {
    if (!formData.damageName.trim()) {
      setError("Damage name is required");
      return false;
    }

    if (!formData.damageReportedBy) {
      setError("Reporter selection is required");
      return false;
    }
    if (!formData.department) {
      setError("Department selection is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const organizationId = getOrganizationId();
    if (!organizationId) {
      setError('Organization ID not found. Please log in again.');
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare JSON data
      const submitData = {
        damageName: formData.damageName,
        damageReportedBy: formData.damageReportedBy, // This will be the staff ID
        department: formData.department, // This will be the department ID
        description: formData.description,
        damageImages: formData.images, // Base64 images array
        assetNumber:assetId
      };

      let response;
      
      if (editData && editData.id) {
        // Update existing report (PUT request)
        response = await axiosPrivate.put(
          `/${organizationId}/damage-reports/${editData.id}`, 
          submitData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('Damage report updated successfully:', response.data);
      } else {
        // Create new report (POST request)
        response = await axiosPrivate.post(
          `/${organizationId}/damage-reports`, 
          submitData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('New damage report created successfully:', response.data);
      }
      
      // Reset form and close modal
      setFormData(defaultData);
      onOpenChange(false);
      
      // Call success callback to refresh parent data
      if (onSuccess) {
        onSuccess(response.data);
      }
      
    } catch (error) {
      console.error('Error submitting damage report:', error);
      
      // Handle different error scenarios
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 413) {
        setError('File size too large. Please upload smaller images.');
      } else if (error.response?.status === 400) {
        setError('Invalid data. Please check your inputs.');
      } else if (error.response?.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to perform this action.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Failed to submit damage report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isControlled = !children;
  const isEditMode = !!editData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[700px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Damage Report' : 'Report a Damage'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Damage Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Damage Name<span className="text-red-500">*</span>
            </label>
            <input
              name="damageName"
              value={formData.damageName}
              onChange={handleChange}
              placeholder="e.g., Cracked Monitor"
              disabled={loading}
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Reported By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Damage Reported By<span className="text-red-500">*</span>
            </label>
            <select
              name="damageReportedBy"
              value={formData.damageReportedBy}
              onChange={handleChange}
              disabled={loading || staffLoading}
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
            >
              <option value="">
                {staffLoading ? "Loading staff..." : "Select Reporter"}
              </option>
              {staffData.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.firstName} {staff.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Department<span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={loading || departmentsLoading}
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
            >
              <option value="">
                {departmentsLoading ? "Loading departments..." : "Select Department"}
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue briefly..."
              disabled={loading}
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Upload Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-[#d41920] bg-[#ED1C2408]"
                  : "border-[#ED1C24] bg-[#ED1C2408]"
              } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[#ED1C24]" />
                </div>
                <div>
                  <p className="text-gray-600">
                    Drag your Images or{" "}
                    <span className="text-[#ED1C24] font-medium cursor-pointer">
                      browse
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Dimension 200×200
                  </p>
                </div>
              </div>

              {formData.images.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">Selected Images:</p>
                  {formData.images.map((img, i) => (
                    <p key={i} className="text-left">
                      • {img.name} ({(img.size / 1024).toFixed(1)} KB)
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 text-gray-700 font-medium text-sm disabled:opacity-50 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? 'Submitting...' : (isEditMode ? 'Update' : 'Add Report')}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}