import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";


export default function AssignDepartmentModal({ 
  children, 
  open, 
  onOpenChange, 
  locationId, 
  roomId 
}) {
  const defaultData = {
    enabled: true,
    department: "",
  };

  const [formData, setFormData] = useState(defaultData);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get organization ID from localStorage
  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.organization_id;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  };

  // Fetch departments when modal opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    const organizationId = getOrganizationId();
    if (!organizationId) {
      console.error('Organization ID not found in user data');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosPrivate.get(`/organizations/${organizationId}/departments`);
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.department) {
      alert('Please select a department');
      return;
    }

    if (!locationId || !roomId) {
      console.error('Location ID or Room ID is missing');
      return;
    }

    const organizationId = getOrganizationId();
    if (!organizationId) {
      console.error('Organization ID not found in user data');
      return;
    }

    setSubmitting(true);
    try {
      const requestBody = {
        department: formData.department,
        status: formData.enabled ? "active" : "inactive"
      };

      await axiosPrivate.put(
        `/organizations/${organizationId}/locations/${locationId}/rooms/${roomId}`,
        requestBody
      );

      console.log("Department assigned successfully:", requestBody);
      
      // Reset form and close modal
      setFormData(defaultData);
      if (onOpenChange) {
        onOpenChange(false);
      }
      
      // You might want to show a success toast notification here
      
    } catch (error) {
      console.error('Error assigning department:', error);
      // You might want to show an error toast notification here
    } finally {
      setSubmitting(false);
    }
  };

  const isControlled = !children;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[500px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Assign Department
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Enable Toggle */}
          <div className="flex items-center gap-x-3">
            <label className="text-sm font-medium text-gray-900">
              Enable
            </label>
            <div className="relative">
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  formData.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md translate-y-[2px] transform transition-transform duration-200 ${
                    formData.enabled ? 'translate-x-[25px]' : 'translate-x-0.5'
                  } mt-0.5`}
                >
                  {formData.enabled && (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Select Department */}
          <div className="pb-1">
            <label className="block text-sm font-medium text-gray-900 mb-4">
              Select Department<span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
            >
              <option value="">
                {loading ? "Loading departments..." : "Select a department"}
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <DialogClose asChild>
              <button 
                className="px-6 py-2 text-gray-700 font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loading || !formData.department}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}