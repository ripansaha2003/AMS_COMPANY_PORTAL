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
import { X, Check } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function WorkingDaysModal({ children, open, onOpenChange, organizationId }) {
  const defaultData = {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  };

  const [formData, setFormData] = useState(defaultData);
  const [workingHoursId, setWorkingHoursId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get organization_id from localStorage if not provided as prop
  const getOrganizationId = () => {

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.organization_id;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  };

  // Fetch existing working hours when modal opens
  useEffect(() => {
    if (open) {
      fetchWorkingHours();
    }
  }, [open]);

  const fetchWorkingHours = async () => {
    const orgId = getOrganizationId();
    if (!orgId) {
      console.error('Organization ID not found');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosPrivate.get(`/organizations/${orgId}/workinghours`);
      
      
      console.log(response)

      const data =  response.data;
      if (data.working_hours && data.working_hours.length > 0) {
        const existingWorkingHours = data.working_hours[0];
        console.log("hour:",existingWorkingHours.workinghours_id)
        setWorkingHoursId(existingWorkingHours.workinghours_id);
        
        // Map API response to form data
        setFormData({
          mon: !!existingWorkingHours.monday || false,
          tue: !!existingWorkingHours.tuesday || false,
          wed: !!existingWorkingHours.wednesday || false,
          thu: !!existingWorkingHours.thursday || false,
          fri: !!existingWorkingHours.friday || false,
          sat: !!existingWorkingHours.saturday || false,
          sun: !!existingWorkingHours.sunday || false,
        });
      } else {
        // No existing working hours, reset to default
        setWorkingHoursId(null);
        setFormData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching working hours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (day) => {
    setFormData((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSubmit = async () => {
    const orgId = getOrganizationId();
    if (!orgId) {
      console.error('Organization ID not found');
      return;
    }

    try {
      setIsLoading(true);

      // Map form data to API format
      const requestBody = {
        monday: formData.mon,
        tuesday: formData.tue,
        wednesday: formData.wed,
        thursday: formData.thu,
        friday: formData.fri,
        saturday: formData.sat,
        sunday: formData.sun,
        is_default: true,
        profile_name: "Standard Business Hours"
      };

      let response;
      
      if (workingHoursId) {
        // Update existing working hours
        response = await axiosPrivate.put(`/organizations/${orgId}/workinghours/${workingHoursId}` ,requestBody);
      } else {
        // Create new working hours
        response = await axiosPrivate.post(`/organizations/${orgId}/workinghours`, requestBody);
      }

     

      const result = await response.data;
      console.log("Working Days Data saved:", result);

      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving working hours:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const isControlled = !children;

  const days = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 relative">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Working Days
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6 overflow-y-auto no-scrollbar flex-1">
          {isLoading && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-600">Loading...</div>
            </div>
          )}
          
          {/* Working Days Grid */}
          <div className="flex flex-wrap justify-start gap-8 w-full mb-6">
            {days.map((day) => (
              <div key={day.key} className="flex items-center space-x-3">
                <div
                  className={`w-6 h-6 rounded border-2 cursor-pointer flex items-center justify-center ${
                    formData[day.key]
                      ? 'bg-[#ED1C24] border-[#ED1C24]'
                      : 'border-gray-300 bg-white'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isLoading && handleChange(day.key)}
                >
                  {formData[day.key] && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <label
                  className={`text-sm font-medium text-gray-900 cursor-pointer ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !isLoading && handleChange(day.key)}
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <DialogClose asChild>
              <button className="px-6 py-2 text-gray-700 font-medium text-sm" disabled={isLoading}>
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}