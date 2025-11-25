import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function AssignAssetsModal({
  children,
  open: controlledOpen,
  onOpenChange,
  onSuccess = () => {},
  for: assignFor,
  departmentId,
  roomId,
  locationId,
  clientId
}) {
  const defaultFormData = {
    asset: "",
    operatedBy: "Entire Department",
    users: [],
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [assetOptions, setAssetOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const operatedByOptions = ["Entire Department", "Multiple Users"];

  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.organization_id;
  };

  const fetchAssets = async () => {
    try {
      const organizationId = getOrganizationId();
      console.log("Fetching assets for org:", organizationId);
      if (!organizationId) return;

      const response = await axiosPrivate.get(`/organizations/${organizationId}/assigned-assets`);
      console.log("Assets response:", response.data);
      if (response.data.success) {
        setAssetOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const fetchDepartmentStaff = async () => {
    if (assignFor !== "Department") return;

    try {
      const organizationId = getOrganizationId();
      console.log("Fetching staff for org/dept:", organizationId, departmentId);
      if (!organizationId || !departmentId) return;

      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/departments/${departmentId}/staff`
      );
      console.log("Staff response:", response.data);
      setUserOptions(response.data);
    } catch (error) {
      console.error("Error fetching department staff:", error);
    }
  };

  useEffect(() => {
    console.log("Modal state changed:", {
      controlledOpen,
      assignFor,
      departmentId,
      roomId,
      locationId,
    });

    if (controlledOpen) {
      console.log("Loading data...");
      setLoading(true);

      const promises = [fetchAssets()];
      if (assignFor === "Department") {
        promises.push(fetchDepartmentStaff());
      }

      Promise.all(promises).finally(() => setLoading(false));
    }
  }, [controlledOpen, assignFor, departmentId, roomId, locationId, clientId]);

  useEffect(() => {
    if (controlledOpen?.data) {
      setFormData({
        ...defaultFormData,
        ...controlledOpen.data,
      });
    }
  }, [controlledOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "operatedBy") {
      setFormData((prev) => ({
        ...prev,
        operatedBy: value,
        users: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const toggleUser = (userId) => {
    setFormData((prev) => {
      const alreadySelected = prev.users.includes(userId);
      const updatedUsers = alreadySelected
        ? prev.users.filter((id) => id !== userId)
        : [...prev.users, userId];
      return { ...prev, users: updatedUsers };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.asset) {
      alert("Please select an asset");
      return;
    }

    if (
      assignFor === "Department" &&
      formData.operatedBy === "Multiple Users" &&
      formData.users.length === 0
    ) {
      alert("Please select at least one user");
      return;
    }

    if (assignFor === "Department" && !departmentId) {
      console.error("Department ID is required for department assignment");
      return;
    }

    if (assignFor === "Room" && (!roomId || !locationId)) {
      console.error("Room ID and Location ID are required for room assignment");
      return;
    }
  if (assignFor === "Client" && (!clientId)) {
      console.error("Client ID is required for client assignment");
      return;
    }
    setSubmitting(true);

    try {
      const organizationId = getOrganizationId();

      let requestBody;

      if (assignFor === "Department") {
        requestBody = {
          organization_id: organizationId,
          asset_id: formData.asset,
          assign_to: "Department",
          department_id: departmentId,
          department_allocation_type: formData.operatedBy,
        };

        if (formData.operatedBy === "Multiple Users") {
          requestBody.selected_users = formData.users;
        }
      } else if (assignFor === "Room") {
        requestBody = {
          organization_id: organizationId,
          asset_id: formData.asset,
          assign_to: "Room",
          room_id: roomId,
          location_id: locationId,
        };
      } else if (assignFor === "Client") {
        requestBody = {
          organization_id: organizationId,
          asset_id: formData.asset,
          assign_to: "Client",
          client_id: clientId,
        };
      }
      

      console.log("Submitting assignment:", requestBody);
      await axiosPrivate.post("/assignments", requestBody);

      onOpenChange(false);
      setFormData(defaultFormData);
      setUserDropdownOpen(false);
      onSuccess();

      alert("Asset assigned successfully!");
    } catch (error) {
      console.error("Error assigning asset:", error);
      alert("Failed to assign asset. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isControlled = !children;
  const shouldShowOperatedBy = assignFor === "Department";
  const shouldShowUsers =
    assignFor === "Department" && formData.operatedBy === "Multiple Users";

  const getSelectedUserNames = () => {
    return formData.users
      .map((userId) => {
        const user = userOptions.find((u) => u.id === userId);
        return user ? user.name || user.first_name || userId : userId;
      })
      .join(" | ");
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[500px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Assign Assets to {assignFor}
            </DialogTitle>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="px-[2px] space-y-4 overflow-y-auto no-scrollbar flex-1"
          >
            {/* Select Asset */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Asset<span className="text-red-500">*</span>
              </label>
              <select
                name="asset"
                value={formData.asset}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:ring-2 focus:ring-[#ED1C24]"
              >
                <option value="">Select Asset</option>
                {assetOptions.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset?.assetName}
                  </option>
                ))}
              </select>
            </div>

            {/* Operated By - Only show for Department */}
            {shouldShowOperatedBy && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operated By<span className="text-red-500">*</span>
                </label>
                <select
                  name="operatedBy"
                  value={formData.operatedBy}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:ring-2 focus:ring-[#ED1C24]"
                >
                  {operatedByOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Select Users - Only show for Department with Multiple Users */}
            {shouldShowUsers && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Users<span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-100 text-gray-900 cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {formData.users.length > 0
                      ? getSelectedUserNames()
                      : "Select users..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {userDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto">
                    {userOptions.length === 0 ? (
                      <div className="px-4 py-2 text-gray-500">
                        No staff members found
                      </div>
                    ) : (
                      userOptions.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => toggleUser(user.id)}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            formData.users.includes(user.id)
                              ? "bg-[#ED1C2408] text-blue-700 font-medium"
                              : ""
                          }`}
                        >
                          {user.name ||
                            user.first_name ||
                            user.email ||
                            user.id}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        )}

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
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || loading}
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
