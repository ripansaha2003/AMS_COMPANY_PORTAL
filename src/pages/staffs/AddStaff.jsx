import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/common/Layout";
import { Upload, X, Calendar } from "lucide-react";
import { useSetLocationArray } from "@/utils/locationSetter";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useSubscription } from "@/context/SubscriptionContext";
import { useLimitCheck } from "@/hooks/useLimitCheck";

const AddStaff = () => {
  const { refreshAfterAction } = useSubscription();
  const { checkLimit } = useLimitCheck("staff");
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Check limit on component mount for direct URL access
  useEffect(() => {
    if (!isEditMode && !checkLimit()) {
      navigate("/staff");
    }
  }, []);
  const defaultFormData = {
    firstName: "",
    lastName: "",
    gender: "Female",
    email: "",
    phone: "",
  countryCode: "+91",
    department: "",
    role: "",
    selectWorkingDays: "",
    selectWorkingShift: "",
    customWorkingDays: [],
    status: "Active",
    joinDate: new Date().toISOString().split('T')[0],
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const joinDateRef = useRef(null);

  const openJoinDatePicker = () => {
    if (!joinDateRef.current) return;
    if (typeof joinDateRef.current.showPicker === "function") {
      joinDateRef.current.showPicker();
    } else {
      joinDateRef.current.click();
      joinDateRef.current.focus();
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingWorkingHours, setLoadingWorkingHours] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [errors, setErrors] = useState({});
  const [allCountryCodes, setAllCountryCodes] = useState([]);

  const ORGANIZATION_ID = JSON.parse(localStorage.getItem('user')).organization_id;

  useEffect(() => {
    const loadData = async () => {
      
      await Promise.all([
        fetchDepartments(),
        fetchRoles(),
        fetchWorkingHours(),
        fetchShifts()
      ]);
    };

    loadData();
  }, []);

  
  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,idd");
        const countries = await response.json();
        const codes = countries
          .map((country) => ({
            name: country.name.common,
            code: country.idd?.root + (country.idd?.suffixes?.[0] || ""),
          }))
          .filter((c) => c.code)
          .sort((a, b) => a.name.localeCompare(b.name));
        setAllCountryCodes(codes);
      } catch (error) {
        console.error("Failed to fetch country codes:", error);
      }
    };

    fetchCountryCodes();
  }, []);

  
  useEffect(() => {
    const loadStaffData = async () => {
      if (isEditMode && id && workingHours.length > 0 && shifts?.length > 0) {
        const staffData = await fetchStaffData(id);
        
        if (staffData) {
          
          const customDaysMap = {
            'Monday': 'Mon',
            'Tuesday': 'Tue',
            'Wednesday': 'Wed',
            'Thursday': 'Thu',
            'Friday': 'Fri',
            'Saturday': 'Sat',
            'Sunday': 'Sun'
          };
          
          const customWorkingDaysAbbrev = (staffData.working_days || []).map(
            day => customDaysMap[day] || day
          );
          
          setFormData({
            firstName: staffData.firstName || "",
            lastName: staffData.lastName || "",
            gender: staffData.gender || "Female",
            email: staffData.email || "",
            phone: staffData.phone?.replace(/^\+\d+\s*/, "") || "",
            countryCode: staffData.phone?.match(/^\+\d+/)?.[0] || "+1",
            department: staffData.department || "",
            role: staffData.role || "",
            selectWorkingDays: mapWorkingDaysToSelect(staffData.working_days, workingHours),
            selectWorkingShift: mapWorkingShiftToSelect(staffData.working_shift, shifts),
            customWorkingDays: customWorkingDaysAbbrev,
            status: staffData.status || "Active",
            joinDate: staffData.joinDate || new Date().toISOString().split('T')[0],
          });
        }
      }
    };

    loadStaffData();
  }, [isEditMode, id, workingHours, shifts]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await axiosPrivate.get(`/organizations/${ORGANIZATION_ID}/departments`);
      setDepartments(response.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to fetch departments");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await axiosPrivate.get(`/staff/roles?organization_id=${ORGANIZATION_ID}`);
      setRoles(response.data || []);
      setFormData(prev=>({...prev,role:response?.data && response?.data?.find(e=>e.default)?.id}))
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError("Failed to fetch roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchWorkingHours = async () => {
    try {
      setLoadingWorkingHours(true);
      const response = await axiosPrivate.get(`/organizations/${ORGANIZATION_ID}/workinghours`);
      setWorkingHours(response.data.working_hours || []);
      
      
      if (response.data.working_hours && response.data.working_hours.length > 0 && !isEditMode) {
        setFormData(prev => ({
          ...prev,
          selectWorkingDays: response.data.working_hours[0].workinghours_id
        }));
      }
    } catch (err) {
      console.error("Error fetching working hours:", err);
      setError("Failed to fetch working hours");
    } finally {
      setLoadingWorkingHours(false);
    }
  };

  const fetchShifts = async () => {
    try {
      setLoadingShifts(true);
      const response = await axiosPrivate.get(`/organizations/${ORGANIZATION_ID}/shifts`);
      setShifts(response.data.shifts || []);
      
      
      if (response?.data?.shifts && response?.data?.shifts?.length > 0 && !isEditMode) {
        setFormData(prev => ({
          ...prev,
          selectWorkingShift: response.data.shifts[0].shift_id
        }));
      }
    } catch (err) {
      console.error("Error fetching shifts:", err);
      setError("Failed to fetch shifts");
    } finally {
      setLoadingShifts(false);
    }
  };

  const fetchStaffData = async (staffId) => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get(`/organizations/${ORGANIZATION_ID}/staff/${staffId}`);
      
      const staffData = response.data.data;
      console.log("STAFF DATAAA:",staffData)
      
      
      return staffData;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Error fetching staff data:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const mapWorkingDaysToSelect = (workingDays, workingHoursData) => {
    if (!workingDays || workingDays.length === 0) {
      return workingHoursData.length > 0 ? workingHoursData[0].workinghours_id : "";
    }
    
    const weekends = ['Saturday', 'Sunday'];
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    
    for (const profile of workingHoursData) {
      const profileDays = getWorkingDaysFromProfile(profile);
      if (JSON.stringify(workingDays.sort()) === JSON.stringify(profileDays.sort())) {
        return profile.workinghours_id;
      }
    }
    
    
    if (JSON.stringify(workingDays.sort()) === JSON.stringify(weekends.sort())) {
      return "Weekends Only";
    } else if (JSON.stringify(workingDays.sort()) === JSON.stringify(allDays.sort())) {
      return "All Days";
    } else {
      return "Custom";
    }
  };

  const mapWorkingShiftToSelect = (workingShift, shiftsData) => {
    if (!workingShift) return shiftsData.length > 0 ? shiftsData[0]?.id : "";
    
    
    if (typeof workingShift === 'number' || !isNaN(workingShift)) {
      return workingShift;
    }
    
    
    switch (workingShift.toLowerCase()) {
      case 'morning':
        return shiftsData?.find(s => s.shift_name.toLowerCase().includes('morning'))?.id || "";
      case 'night':
        return shiftsData?.find(s => s.shift_name.toLowerCase().includes('night'))?.id || "";
      case 'evening':
        return shiftsData?.find(s => s.shift_name.toLowerCase().includes('evening'))?.id || "";
      case 'flexible':
        return shiftsData?.find(s => s.shift_name.toLowerCase().includes('flexible'))?.id || "";
      default:
        return shiftsData?.length > 0 ? shiftsData[0]?.id : "";
    }
  };

  const getWorkingDaysFromProfile = (profile) => {
    const days = [];
    if (profile.monday) days.push('Monday');
    if (profile.tuesday) days.push('Tuesday');
    if (profile.wednesday) days.push('Wednesday');
    if (profile.thursday) days.push('Thursday');
    if (profile.friday) days.push('Friday');
    if (profile.saturday) days.push('Saturday');
    if (profile.sunday) days.push('Sunday');
    return days;
  };

  const getWorkingDaysArray = () => {
    
    const selectedProfile = workingHours?.find(wh => wh.workinghours_id === formData.selectWorkingDays);
    if (selectedProfile) {
      return getWorkingDaysFromProfile(selectedProfile);
    }
    
    
    switch (formData.selectWorkingDays) {
      case "Weekends Only":
        return ['Saturday', 'Sunday'];
      case "All Days":
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      case "Custom":
        return formData.customWorkingDays.map(day => {
          const dayMap = {
            'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
            'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
          };
          return dayMap[day] || day;
        });
      default:
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }
  };

  const getWorkingShift = () => {
    
    return formData.selectWorkingShift;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: typeof value === 'string' ? value.trim() : value }));
    
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (countryCode, phone) => {
    if (!phone) return false;
    
    const digits = phone.replace(/\D/g, "");
    
    if (countryCode === "+1") return digits.length === 10;
    return digits.length >= 7 && digits.length <= 15;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName || formData.firstName.trim().length === 0) newErrors.firstName = "Please enter first name";
    if (!formData.lastName || formData.lastName.trim().length === 0) newErrors.lastName = "Please enter last name";
    if (!formData.email || formData.email.trim().length === 0) newErrors.email = "Please enter email";
    else if (!validateEmail(formData.email)) newErrors.email = "Please check your email";
    if (!formData.phone || formData.phone.trim().length === 0) newErrors.phone = "Please enter phone number";
    else if (!validatePhone(formData.countryCode, formData.phone)) newErrors.phone = "Please enter a valid phone number";
    if (!formData.department || formData.department === "") newErrors.department = "Please select a department";
    if (!formData.role || formData.role === "") newErrors.role = "Please select a role";
    if (!formData.joinDate) newErrors.joinDate = "Please select join date";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageFile(file);
      setError("");
    }
  };

  const handleImageRemove = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setImageFile(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      
      let imageBase64 = null;
      if (imageFile) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`,
        department: formData.department,
        role: formData.role,
        status: formData.status,
        joinDate: formData.joinDate,
        working_days: getWorkingDaysArray(),
        working_shift: getWorkingShift(),
        organization_id: ORGANIZATION_ID,
        image: imageBase64,
      };

      if (isEditMode) {
        payload.staff_id = id;
      }

      let response;
      if (isEditMode) {
        response = await axiosPrivate.put(`/organizations/${ORGANIZATION_ID}/staff/${id}`, payload);
      } else {
        response = await axiosPrivate.post(`/organizations/${ORGANIZATION_ID}/staff`, payload);
      }

      console.log(`Staff ${isEditMode ? 'updated' : 'added'}:`, response.data);
      
      // Refresh subscription data after successful creation/update
      await refreshAfterAction();
      
      navigate("/staff");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} staff:`, err);
    } finally {
      setLoading(false);
    }
  };

  useSetLocationArray([
    { label: "Staff", link: "/staff" },
    { label: isEditMode ? "Edit Staff" : "Add Staff", link: "" },
  ]);

  if (loading && isEditMode) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div>Loading staff data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        {isEditMode ? "Edit Staff" : "Add Staff"}
        <div className="flex gap-x-3">
          <button
            className="text-gray-800 font-normal rounded-sm px-4 py-2 text-base hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2 hover:ring-2 hover:ring-[#ED1C24]"
            onClick={() => navigate("/staff")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base disabled:opacity-50"
          >
            {loading ? "Saving..." : (isEditMode ? "Update" : "Add")}
          </button>
        </div>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-3 py-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.firstName}
              placeholder="Enter first name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
              required
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.lastName}
              placeholder="Enter last name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
              required
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender<span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            required
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.email}
              placeholder="Enter email address"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            required
          />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone<span className="text-red-500">*</span>
          </label>
          <div className="flex w-full max-w-md overflow-hidden rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#ED1C24]">
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleInputChange}
              className="bg-gray-100 px-3 py-2.5 text-gray-900 focus:outline-none border-r border-gray-300 text-sm w-20"
            >
              {allCountryCodes.length > 0 ? (
                allCountryCodes.map(({ code }) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))
              ) : (
                <>
                  <option value="+1">+1</option>
                  <option value="+91">+91</option>
                  <option value="+44">+44</option>
                </>
              )}
            </select>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                handleInputChange({ target: { name: "phone", value } });
              }}
              onBlur={handleBlur}
              placeholder="e.g. 5555555555"
              aria-invalid={!!errors.phone}
              className="flex-1 px-3 py-2.5 text-gray-900 focus:outline-none text-sm"
              required
            />
          </div>
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign Department
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.department}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            disabled={loadingDepartments}
          >
            <option value="">
              {loadingDepartments ? "Loading departments..." : "Select Department"}
            </option>
            {departments?.map((dept) => (
              <option key={dept?.id} value={dept?.id}>
                {dept.department}
              </option>
            ))}
          </select>
          {errors.department && (
            <p className="text-red-600 text-sm mt-1">{errors.department}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.role}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            disabled={loadingRoles}
          >
            <option value="">
              {loadingRoles ? "Loading roles..." : "Select Role"}
            </option>
            {roles?.map((role) => (
              <option key={role?.id} value={role?.id}>
                {role.role}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-red-600 text-sm mt-1">{errors.role}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Join Date<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={joinDateRef}
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleInputChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.joinDate}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
              required
            />
            <button
              type="button"
              onClick={openJoinDatePicker}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              aria-label="Open date picker"
            >
              <Calendar className="h-5 w-5" />
            </button>
          </div>
          {errors.joinDate && (
            <p className="text-red-600 text-sm mt-1">{errors.joinDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Working Days
          </label>
          <select
            name="selectWorkingDays"
            value={formData.selectWorkingDays}
            onChange={handleInputChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            disabled={loadingWorkingHours}
          >
            <option value="">
              {loadingWorkingHours ? "Loading working hours..." : "Select Working Days"}
            </option>
            {workingHours?.map((wh) => (
              <option key={wh.workinghours_id} value={wh.workinghours_id}>
                {wh.profile_name}
              </option>
            ))}
            <option value="Weekends Only">Weekends Only</option>
            <option value="All Days">All Days</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        {formData.selectWorkingDays === "Custom" && (
          <div className="flex flex-wrap gap-x-10 mt-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <label key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.customWorkingDays.includes(day)}
                  onChange={() => {
                    setFormData((prev) => {
                      const isSelected = prev.customWorkingDays.includes(day);
                      const updatedDays = isSelected
                        ? prev.customWorkingDays.filter((d) => d !== day)
                        : [...prev.customWorkingDays, day];
                      return { ...prev, customWorkingDays: updatedDays };
                    });
                  }}
                  className="form-checkbox h-4 w-4 text-[#ED1C24]"
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Working Shift
          </label>
          <select
            name="selectWorkingShift"
            value={formData.selectWorkingShift}
            onChange={handleInputChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            disabled={loadingShifts}
          >
            <option value="">
              {loadingShifts ? "Loading shifts..." : "Select Shift"}
            </option>
            {shifts?.map((shift) => (
              <option key={shift.shift_id} value={shift.shift_id}>
                {shift.shift_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff Image
          </label>
          <div className="border-2 border-dashed border-[#ED1C24] rounded-lg p-8 text-center bg-[#ED1C2408]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center mb-3">
                <Upload className="text-[#ED1C24]" size={24} />
              </div>

              {imagePreview ? (
                <div className="border-2 border-gray-200 rounded-lg p-4 w-full max-w-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={imagePreview} alt="Staff preview" className="w-16 h-16 object-cover rounded-lg border" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Image uploaded</p>
                        <p className="text-xs text-gray-500">Ready to submit</p>
                      </div>
                    </div>
                    <button type="button" onClick={handleImageRemove} className="text-red-500 hover:text-red-700">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-1">
                    Drag your image or{" "}
                    <label className="text-[#ED1C24] hover:underline cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">
                    Dimension 200×200
                  </p>
                </>
              )}

              {imageFile && !imagePreview && (
                <p className="text-sm text-green-600 mt-2">Selected: {imageFile.name}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
};

export default AddStaff;