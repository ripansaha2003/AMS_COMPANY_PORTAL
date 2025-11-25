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
import { X, ChevronDown, Check } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function AssignAssetModal({
  setAssignmentId,
  children,
  open,
  onOpenChange,
  assetId,
  assignmentId = null, // Pass this for updates
  initialData = null, // Pass existing assignment data for updates
}) {
  const defaultData = {
    assignTo: "Department",
    client: "",
    location: "",
    room: "",
    department: "",
    staff_department: "",
    staff: "",
    assignType: "Multiple Users",
    selectedUsers: [],
  };

  const [formData, setFormData] = useState(initialData || defaultData);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // API data states
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset room when location changes
      if (name === "location") {
        newData.room = "";
        // Fetch rooms for the selected location
        if (value) {
          fetchRooms(value);
        } else {
          setRooms([]);
        }
      }

      // Reset staff when department changes
      if (name === "department") {
        newData.staff = "";
        newData.selectedUsers = []; // Reset selected users for department assignment
        // Fetch staff for the selected department
        if (value) {
          fetchStaff(value);
        } else {
          setStaff([]);
        }
      }

      return newData;
    });
  };

  const handleUserSelection = (user) => {
    setFormData((prev) => {
      const currentUsers = prev.selectedUsers || [];
      const isSelected = currentUsers.includes(user);

      if (isSelected) {
        return {
          ...prev,
          selectedUsers: currentUsers.filter((u) => u !== user),
        };
      } else {
        return {
          ...prev,
          selectedUsers: [...currentUsers, user],
        };
      }
    });
  };

  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization_id:", error);
      return null;
    }
  };

  // API functions
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/clients?organization_id=${organizationId}`
      );
      setClients(response.data.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/locations`
      );
      setLocations(response.data.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setError("Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchRooms = async (locationId) => {
    if (!locationId) return;

    setLoadingRooms(true);
    try {
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/locations/${locationId}/rooms`
      );
      setRooms(response.data.data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to load rooms");
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/departments`
      );
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Failed to load departments");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchStaff = async (departmentId) => {
    if (!departmentId) return;

    setLoadingStaff(true);
    try {
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/departments/${departmentId}/staff`
      );
      setStaff(
        response.data.data || response.data.staff || response.data || []
      );
    } catch (error) {
      console.error("Error fetching staff:", error);
      setError("Failed to load staff");
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch data when assignTo changes or modal opens

  useEffect(() => {
    if (initialData) {
      // Map API response to form structure
      const mappedData = {
        assignTo: initialData.assign_to || "Department",
        client: initialData.client_id || "",
        location: initialData.location_id || "",
        room: initialData.room_id || "",
        department: initialData.department_id || "",
        staff_department: initialData.staff_department || "",
        staff: initialData.staff_id || "",
        assignType: initialData.department_allocation_type || "Multiple Users",
        selectedUsers: initialData.selected_users
          ? initialData.selected_users
          : [],
      };

      setFormData(mappedData);
    } else {
      setFormData(defaultData);
    }
  }, [initialData]);

  useEffect(() => {
    if (open) {
      switch (formData.assignTo) {
        case "Client":
          fetchClients();
          break;
        case "Room":
          fetchLocations();
          break;
        case "Department":
        case "Staff":
          fetchDepartments();
          break;
        default:
          break;
      }
    }
  }, [open, formData.assignTo, initialData]);

  // Fetch rooms when location changes and modal is open
  useEffect(() => {
    if (open && formData.assignTo === "Room" && formData.location) {
      fetchRooms(formData.location);
    }
  }, [open, formData.assignTo, formData.location]);

  // FIXED: Fetch staff when department changes and modal is open for both Staff and Department (Multiple Users) modes
  useEffect(() => {
    if (open && formData.department) {
      // Fetch staff for "Staff" assignment type OR "Department" with "Multiple Users"
      if (
        formData.assignTo === "Department" &&
        formData.assignType === "Multiple Users"
      ) {
        fetchStaff(formData.department);
      }
    }
  }, [open, formData.assignTo, formData.department, formData.assignType]);

  useEffect(() => {
    if (open && formData.assignTo === "Staff" && formData.staff_department) {
      fetchStaff(formData.staff_department);
    }
  }, [open, formData.assignTo, formData.staff_department]);

  // Function to prepare API payload based on assign type
  const prepareApiPayload = () => {
    const organizationId = getOrganizationId();
    const basePayload = {
      organization_id: organizationId,
      asset_id: assetId,
      assign_to: formData.assignTo,
    };

    switch (formData.assignTo) {
      case "Department":
        return {
          ...basePayload,
          department_id: formData.department,
          department_allocation_type: formData.assignType,
          ...(formData.assignType === "Multiple Users" && {
            selected_users: formData.selectedUsers,
          }),
        };

      case "Client":
        return {
          ...basePayload,
          client_id: formData.client,
        };

      case "Staff":
        return {
          ...basePayload,
          staff_department: formData.staff_department,
          staff_id: formData.staff,
        };

      case "Room":
        return {
          ...basePayload,
          room_id: formData.room,
          location_id: formData.location,
        };

      default:
        return basePayload;
    }
  };

  // Function to handle API calls
  const handleApiCall = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = prepareApiPayload();
      let response;

      if (assignmentId) {
        // Update existing assignment
        response = await axiosPrivate.put(
          `/assignments/${assignmentId}`,
          payload
        );
      } else {
        // Create new assignment
        response = await axiosPrivate.post("/assignments", payload);
        setAssignmentId(
          response?.data?.data?.id ? response?.data?.data?.id : ""
        );
      }

      console.log("Assignment successful:", response.data);

      // Close modal on success
      if (onOpenChange) {
        onOpenChange(false);
      }

      // You can add success notification here
      // toast.success(assignmentId ? "Assignment updated successfully" : "Asset assigned successfully");
    } catch (error) {
      console.error("Assignment failed:", error);
      setError(
        error.response?.data?.message ||
          "Failed to assign asset. Please try again."
      );

      // You can add error notification here
      // toast.error("Failed to assign asset");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (formData.assignTo) {
      case "Client":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Client<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                disabled={loadingClients}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none disabled:opacity-50"
              >
                <option value="">
                  {loadingClients ? "Loading clients..." : "Select a client"}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.clientName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        );

      case "Room":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Location<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={loadingLocations}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {loadingLocations
                      ? "Loading locations..."
                      : "Select a location"}
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Room<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  disabled={!formData.location || loadingRooms}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {!formData.location
                      ? "First select a location"
                      : loadingRooms
                      ? "Loading rooms..."
                      : "Select a room"}
                  </option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </>
        );

      case "Staff":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Department<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="staff_department"
                  value={formData.staff_department}
                  onChange={handleChange}
                  disabled={loadingDepartments}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {loadingDepartments
                      ? "Loading departments..."
                      : "Select a department"}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.department}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Staff<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="staff"
                  value={formData.staff}
                  onChange={handleChange}
                  disabled={!formData.staff_department || loadingStaff}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {!formData.staff_department
                      ? "First select a department"
                      : loadingStaff
                      ? "Loading staff..."
                      : "Select a staff"}
                  </option>
                  {staff.map((staffMember) => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </>
        );

      case "Department":
      default:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Department<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loadingDepartments}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none disabled:opacity-50"
                >
                  <option value="">
                    {loadingDepartments
                      ? "Loading departments..."
                      : "Select a department"}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.departmentName || department.department}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Radio Buttons - only show for Department */}
            <div className="space-y-4">
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="entire-department"
                    name="assignType"
                    value="Entire Department"
                    checked={formData.assignType === "Entire Department"}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#ED1C24] focus:ring-[#ED1C24] border-gray-300"
                  />
                  <label
                    htmlFor="entire-department"
                    className="ml-2 text-sm text-gray-900"
                  >
                    Entire Department
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="multiple-users"
                    name="assignType"
                    value="Multiple Users"
                    checked={formData.assignType === "Multiple Users"}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#ED1C24] focus:ring-[#ED1C24] border-gray-300"
                  />
                  <label
                    htmlFor="multiple-users"
                    className="ml-2 text-sm text-gray-900"
                  >
                    Multiple Users
                  </label>
                </div>
              </div>
            </div>

            {/* Multi-Select Dropdown - only show when Multiple Users is selected */}
            {formData.assignType === "Multiple Users" && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Select Users<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent text-left flex items-center justify-between"
                    disabled={loadingStaff || !formData.department}
                  >
                    <span className="truncate">
                      {loadingStaff
                        ? "Loading staff..."
                        : !formData.department
                        ? "First select a department"
                        : formData.selectedUsers.length > 0
                        ? formData.selectedUsers
                            .map((userId) => {
                              const staffMember = staff.find(
                                (s) => s.id === userId
                              );
                              return staffMember ? staffMember.name : "";
                            })
                            .filter(Boolean)
                            .join(" | ")
                        : "Select Staff"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isDropdownOpen && staff.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {staff.map((staffMember) => (
                        <div
                          key={staffMember.id}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => handleUserSelection(staffMember.id)}
                        >
                          <span className="text-sm text-gray-900">
                            {staffMember.name}
                          </span>
                          {formData.selectedUsers.includes(staffMember.id) && (
                            <Check className="h-4 w-4 text-[#ED1C24]" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!assetId) {
      setError("Asset ID is required");
      return;
    }

    // Specific validations based on assign type
    switch (formData.assignTo) {
      case "Department":
        if (!formData.department) {
          setError("Please select a department");
          return;
        }
        if (
          formData.assignType === "Multiple Users" &&
          (!formData.selectedUsers || formData.selectedUsers.length === 0)
        ) {
          setError("Please select at least one user");
          return;
        }
        break;
      case "Client":
        if (!formData.client) {
          setError("Please select a client");
          return;
        }
        break;
      case "Staff":
        if (!formData.staff_department) {
          setError("Please select a department");
          return;
        }
        if (!formData.staff) {
          setError("Please select a staff member");
          return;
        }
        break;
      case "Room":
        if (!formData.room || !formData.location) {
          setError("Please select both location and room");
          return;
        }
        break;
    }

    await handleApiCall();
  };

  const isControlled = !children;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".relative")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {assignmentId ? "Transfer Asset" : "Assign Asset"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Assign To<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="assignTo"
                value={formData.assignTo}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none disabled:opacity-50"
              >
                <option value="Department">Department</option>
                <option value="Client">Client</option>
                <option value="Room">Room</option>
                <option value="Staff">Staff</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Dynamic Form Fields */}
          {renderFormFields()}
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <DialogClose asChild>
              <button
                className="px-6 py-2 text-gray-700 font-medium text-sm disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
