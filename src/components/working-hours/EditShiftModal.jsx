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
import { X, Clock } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function EditShiftModal({ children, open, onOpenChange, shift, onShiftUpdated }) {


  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get organization_id from localStorage
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.organization_id;
  };

  // Parse time from API format ("07:30 am") to component format
  const parseTimeFromAPI = (timeString) => {
    if (!timeString) return { time: "07:30", period: "AM" };
    
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!match) return { time: "07:30", period: "AM" };
    
    const [, hours, minutes, period] = match;
    const time24 = period.toLowerCase() === 'pm' && parseInt(hours) !== 12 
      ? `${parseInt(hours) + 12}:${minutes}`
      : period.toLowerCase() === 'am' && parseInt(hours) === 12
        ? `00:${minutes}`
        : `${hours.padStart(2, '0')}:${minutes}`;
    
    return {
      time: time24,
      period: period.toUpperCase()
    };
  };

  // Format time for API (convert to "HH:MM am/pm" format)
  const formatTimeForAPI = (time, period) => {
    const [hours, minutes] = time.split(':');
    let hour12 = parseInt(hours);
    
    if (period === 'PM' && hour12 !== 12) {
      hour12 += 12;
    } else if (period === 'AM' && hour12 === 12) {
      hour12 = 0;
    }
    
    const hour12Formatted = hour12 === 0 ? 12 : (hour12 > 12 ? hour12 - 12 : hour12);
    const periodFormatted = hour12 >= 12 ? 'pm' : 'am';
    
    return `${hour12Formatted.toString().padStart(2, '0')}:${minutes} ${periodFormatted}`;
  };

  // Update form data when shift prop changes
  useEffect(() => {
    if (shift && open) {
      const startTimeParsed = parseTimeFromAPI(shift.start_time);
      const endTimeParsed = parseTimeFromAPI(shift.end_time);
      
      setFormData({
        enabled: shift.status === 'active',
        startTime: startTimeParsed.time,
        startPeriod: startTimeParsed.period,
        endTime: endTimeParsed.time,
        endPeriod: endTimeParsed.period,
        breakTime: shift.break_time?.toString() || "1",
        shiftName: shift.shift_name || "",
      });
      setErrors({});
    }
  }, [shift, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.shiftName.trim()) {
      newErrors.shiftName = 'Shift name is required';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    
    if (!formData.breakTime || parseFloat(formData.breakTime) < 0) {
      newErrors.breakTime = 'Valid break time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !shift) {
      return;
    }

    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      
      const requestData = {
        shift_name: formData.shiftName.trim(),
        start_time: formatTimeForAPI(formData.startTime, formData.startPeriod),
        end_time: formatTimeForAPI(formData.endTime, formData.endPeriod),
        break_time: parseFloat(formData.breakTime),
        status: formData.enabled ? "active" : "inactive",
      };

      await axiosPrivate.put(`/organizations/${organizationId}/shifts/${shift.shift_id}`, requestData);
      
      console.log("Shift updated successfully");
      setErrors({});
      
      if (onOpenChange) {
        onOpenChange(false);
      }
      
      // Call the callback to refresh the shifts list
      if (onShiftUpdated) {
        onShiftUpdated();
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error updating shift. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!shift) return;

    setDeleteLoading(true);
    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      
      await axiosPrivate.delete(`/organizations/${organizationId}/shifts/${shift.id}`);
      
      console.log("Shift deleted successfully");
      
      setOpenDeleteModal(false);
      
      if (onOpenChange) {
        onOpenChange(false);
      }
      
      // Call the callback to refresh the shifts list
      if (onShiftUpdated) {
        onShiftUpdated();
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error deleting shift. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  const isControlled = !children;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {shift?.shift_name || "Edit Shift"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Shift Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Shift Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="shiftName"
              value={formData.shiftName}
              onChange={handleChange}
              placeholder="Morning"
              className={`w-full px-3 py-2.5 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                errors.shiftName ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.shiftName && <p className="text-red-500 text-xs mt-1">{errors.shiftName}</p>}
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
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
                disabled={loading}
              />
              <div
                className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  formData.enabled ? 'bg-green-500' : 'bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !loading && setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
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

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-6">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Start Time<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className={`flex items-center bg-gray-50 border rounded-md ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none"
                    disabled={loading}
                  />
                  <div className="px-3 py-2.5 border-l border-gray-300">
                    <select
                      name="startPeriod"
                      value={formData.startPeriod}
                      onChange={handleChange}
                      className="text-sm text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none"
                      disabled={loading}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                End Time<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className={`flex items-center bg-gray-50 border rounded-md ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none"
                    disabled={loading}
                  />
                  <div className="px-3 py-2.5 border-l border-gray-300">
                    <select
                      name="endPeriod"
                      value={formData.endPeriod}
                      onChange={handleChange}
                      className="text-sm text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none"
                      disabled={loading}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
              </div>
            </div>
          </div>

          {/* Break Time */}
          <div className="pb-1">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Break Time (in hrs)<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="breakTime"
              value={formData.breakTime}
              onChange={handleChange}
              min="0"
              step="0.5"
              className={`w-full px-3 py-2.5 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                errors.breakTime ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.breakTime && <p className="text-red-500 text-xs mt-1">{errors.breakTime}</p>}
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <button
              onClick={() => setOpenDeleteModal(true)}
              className="px-6 py-2 text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Delete
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 font-medium text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Shift"
        message={`Are you sure you want to delete ${shift?.shift_name}? This action cannot be undone.`}
        confirmText="Delete Shift"
        type="danger"
        isLoading={deleteLoading}
      />
    </Dialog>
  );
}