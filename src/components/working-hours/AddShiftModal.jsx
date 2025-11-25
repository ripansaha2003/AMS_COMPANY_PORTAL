import React, { useState } from "react";
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

export default function AddShiftModal({ children, open, onOpenChange, onShiftAdded }) {
  const defaultData = {
    shiftName: "",
    startTime: "07:30",
    startPeriod: "AM",
    endTime: "07:30",
    endPeriod: "PM",
    breakTime: "1",
  };

  const [formData, setFormData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get organization_id from localStorage
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.organization_id;
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.shiftName || !formData.shiftName.trim()) {
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
    if (!validateForm()) {
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
      };

      await axiosPrivate.post(`/organizations/${organizationId}/shifts`, requestData);
      
      console.log("Shift added successfully");
      setFormData(defaultData);
      setErrors({});
      
      if (onOpenChange) {
        onOpenChange(false);
      }
      
      // Call the callback to refresh the shifts list
      if (onShiftAdded) {
        onShiftAdded();
      }
    } catch (error) {
      console.error('Error adding shift:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error adding shift. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(defaultData);
      setErrors({});
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };


  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Add Shift
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
              value={formData.shiftName || ""}
              onChange={handleChange}
              placeholder="Morning"
              className={`w-full px-3 py-2.5 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                errors.shiftName ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.shiftName && <p className="text-red-500 text-xs mt-1">{errors.shiftName}</p>}
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
                    value={formData.startTime || "07:30"}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none"
                    disabled={loading}
                  />
                  <div className="px-3 py-2.5 border-l border-gray-300">
                    <select
                      name="startPeriod"
                      value={formData.startPeriod || "AM"}
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
                    value={formData.endTime || "07:30"}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none"
                    disabled={loading}
                  />
                  <div className="px-3 py-2.5 border-l border-gray-300">
                    <select
                      name="endPeriod"
                      value={formData.endPeriod || "PM"}
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
              value={formData.breakTime || "1"}
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
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}