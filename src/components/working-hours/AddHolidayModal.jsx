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
import { X, Calendar, ChevronDown } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function AddHolidayModal({ children, open, onOpenChange, holiday, onHolidayUpdated }) {
  const defaultData = {
    date: "",
    holidayName: "",
    department: "",
    workingHours: "",
  };

  const [formData, setFormData] = useState(defaultData);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchingData, setFetchingData] = useState(false);

  // Get organization_id from localStorage
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.organization_id;
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/departments`
      );
      setDepartments(response.data.departments || response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      // If departments API fails, provide fallback options
      setDepartments([
        { id: "all", name: "All Departments" },
        { id: "finance", name: "Finance" },
        { id: "hr", name: "HR" },
        { id: "it", name: "IT" },
        { id: "marketing", name: "Marketing" },
        { id: "operations", name: "Operations" },
      ]);
    }
  };

  // Fetch shifts from API
  const fetchShifts = async () => {
    try {
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/shifts`
      );
      setShifts(response.data.shifts || response.data || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      // If shifts API fails, provide fallback options
      setShifts([
        { id: "all", shift_name: "All Shifts" },
        { id: "morning", shift_name: "Morning Shift" },
        { id: "evening", shift_name: "Evening Shift" },
        { id: "night", shift_name: "Night Shift" },
      ]);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      setFetchingData(true);
      Promise.all([fetchDepartments(), fetchShifts()]).finally(() => {
        setFetchingData(false);
      });
    }
  }, [open]);

  // Format date from API format (YYYY-MM-DD) to input format (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0]; // Remove time part if present
  };

  // Format API/ISO date to display DD/MM/YYYY
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  // Convert display DD/MM/YYYY to ISO yyyy-mm-dd for the native input and API
  const displayToIso = (display) => {
    if (!display) return "";
    const parts = display.split("/");
    if (parts.length !== 3) return display;
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  };

  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    if (!dateInputRef.current) return;
    // Prefer showPicker if available, otherwise fall back to click()
    if (typeof dateInputRef.current.showPicker === "function") {
      dateInputRef.current.showPicker();
    } else {
      dateInputRef.current.click();
      dateInputRef.current.focus();
    }
  };

  // Update form data when holiday prop changes (for editing)
  useEffect(() => {
    if (holiday && open) {
      // Convert date from API format (YYYY-MM-DD) to display format (DD/MM/YYYY)
      const displayDate = formatDateForDisplay(holiday.date) || "";
      setFormData({
        // display DD/MM/YYYY in the visible field
        date: displayDate,
        holidayName: holiday.holiday_name || "",
        // Use department_id if available, otherwise fall back to department
        department: holiday.department_id || holiday.department || "",
        // Use working_hours_id if available, otherwise fall back to working_hours
        workingHours: holiday.working_hours_id || holiday.working_hours || "",
      });
      setErrors({});
    } else if (!holiday && open) {
      setFormData(defaultData);
      setErrors({});
    }
  }, [holiday, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.holidayName || !formData.holidayName.trim()) {
      newErrors.holidayName = "Holiday name is required";
    }

    if (!formData.department) {
      newErrors.department = "Department is required";
    }

    if (!formData.workingHours) {
      newErrors.workingHours = "Working hours is required";
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

      // Convert date from DD/MM/YYYY to YYYY-MM-DD format for API
      let dateForApi = formData.date;
      if (formData.date && formData.date.includes("/")) {
        // It's in DD/MM/YYYY format, convert to YYYY-MM-DD
        dateForApi = displayToIso(formData.date);
      }

      const requestData = {
        date: dateForApi,
        holiday_name: formData.holidayName.trim(),
        department: formData.department,
        working_hours: formData.workingHours,
      };

      if (holiday) {
        // Edit existing holiday - use holiday_id if available, otherwise fall back to id
        const holidayId = holiday.holiday_id || holiday.id;
        await axiosPrivate.put(
          `/organizations/${organizationId}/holiday/${holidayId}`,
          requestData
        );
        console.log("Holiday updated successfully");
      } else {
        // Create new holiday
        await axiosPrivate.post(
          `/organizations/${organizationId}/holiday`,
          requestData
        );
        console.log("Holiday added successfully");
      }

      setFormData(defaultData);
      setErrors({});

      if (onOpenChange) {
        onOpenChange(false);
      }

      // Call the callback to refresh the holidays list
      if (onHolidayUpdated) {
        onHolidayUpdated();
      }
    } catch (error) {
      console.error("Error saving holiday:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error saving holiday. Please try again.");
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

  const isControlled = !children;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {holiday ? "Edit Holiday" : "Add Holiday"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : (
          <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {/* Visible text field in DD/MM/YYYY format */}
                <input
                  type="text"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                  placeholder="DD/MM/YYYY"
                />
                {/* Hidden native date input used to open the calendar and produce ISO value */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={displayToIso(formData.date)}
                  onChange={(e) => {
                    const iso = e.target.value; // yyyy-mm-dd
                    if (!iso) {
                      setFormData((prev) => ({ ...prev, date: "" }));
                      return;
                    }
                    const d = new Date(iso);
                    const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(
                      d.getMonth() + 1
                    ).padStart(2, "0")}/${d.getFullYear()}`;
                    setFormData((prev) => ({ ...prev, date: formatted }));
                  }}
                  className="sr-only"
                  aria-hidden="true"
                />
                {/* Clickable calendar icon to open native picker */}
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  aria-label="Open date picker"
                >
                  <Calendar className="h-5 w-5" />
                </button>
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>
            </div>

            {/* Holiday Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holiday Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="holidayName"
                value={formData.holidayName}
                onChange={handleChange}
                className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent ${
                  errors.holidayName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter holiday name"
                disabled={loading}
              />
              {errors.holidayName && (
                <p className="text-red-500 text-xs mt-1">{errors.holidayName}</p>
              )}
            </div>

            {/* Department Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Department<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 ${
                    errors.department ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                {errors.department && (
                  <p className="text-red-500 text-xs mt-1">{errors.department}</p>
                )}
              </div>
            </div>

            {/* Working Hours Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Working Hours<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 border rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 ${
                    errors.workingHours ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                >
                  <option value="">Select Working Hours</option>
                  {shifts.map((shift) => (
                    <option key={shift.shift_id} value={shift.shift_id}>
                      {shift.shift_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                {errors.workingHours && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workingHours}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
              disabled={loading || fetchingData}
            >
              {loading ? "Saving..." : holiday ? "Update" : "Add"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}