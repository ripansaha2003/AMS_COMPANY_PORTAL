import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Trash2 } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function AddRoleModal({
  children,
  isEdit,
  setIsEdit,
  isOpen = false,
  editData,
  setIsOpen,
  onRoleAdded,
}) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const moduleMapping = {
    Staff: "staff",
    Assets: "assets",
    Clients: "clients",
    Vendors: "vendors",
    Subscription: "subscriptions",
    "Support Tickets": "support_tickets",
    Reports: "reports",
    Logs: "logs",
  };

  const reverseModuleMapping = {
    staff: "Staff",
    assets: "Assets",
    clients: "Clients",
    vendors: "Vendors",
    subscriptions: "Subscription",
    support_tickets: "Support Tickets",
    reports: "Reports",
    logs: "Logs",
  };

  const addPermission = () => {
    const newPermission = {
      id: Date.now(),
      module: "",
      add: false,
      edit: false,
      view: false,
      delete: false,
    };
    setPermissions([...permissions, newPermission]);
  };

  const removePermission = (id) => {
    setPermissions(permissions.filter((perm) => perm.id !== id));
  };

  const updatePermission = (id, field, value) => {
    setPermissions(
      permissions.map((perm) =>
        perm.id === id ? { ...perm, [field]: value } : perm
      )
    );
  };

  const formatPermissionsForAPI = () => {
    const formattedPermissions = {};

    permissions.forEach((permission) => {
      if (permission.module) {
        const apiModuleName =
          moduleMapping[permission.module] || permission.module;
        formattedPermissions[apiModuleName] = {
          add: permission.add,
          edit: permission.edit,
          view: permission.view,
          delete: permission.delete,
        };
      }
    });

    return formattedPermissions;
  };
  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization ID:", error);
      return null;
    }
  };
  const handleSubmit = async () => {
    setError("");

    if (!roleName.trim()) {
      setError("Role name is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    const hasValidPermissions = permissions.some((perm) => perm.module);
    if (!hasValidPermissions) {
      setError("At least one permission module must be selected");
      return;
    }

    try {
      setIsSubmitting(true);
      const organization_id = getOrganizationId();
      const roleData = {
        organization_id,
        role: roleName.trim(),
        description: description.trim(),
        permissions: formatPermissionsForAPI(),
      };

      let response;
      if (isEdit && editData?.id) {
        response = await axiosPrivate.put(
          `/staff/roles/${editData.id}?organization_id=${organization_id}`,
          roleData
        );
        console.log("Role updated:", response.data);
      } else {
        response = await axiosPrivate.post("/staff/roles", roleData);
        console.log("Role created:", response.data);
      }

      if (onRoleAdded) onRoleAdded();

      resetForm();
      setIsOpen(false);
    } catch (err) {
      console.error("Error saving role:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save role. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fixed resetForm function - now properly clears all data
  const resetForm = () => {
    setRoleName("");
    setDescription("");
    setPermissions([]);
    setError("");
    if (isEdit) setIsEdit(false);
  };

  const handleCancel = () => {
    setIsEdit(false);
    setIsOpen(false);
    resetForm();
  };

  // Fixed: Handle modal close from Dialog component
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      // Modal is being closed
      resetForm();
    }
  };

  // Fixed: Only populate edit data when modal is open and in edit mode
  useEffect(() => {
    if (isOpen && isEdit && editData) {
      setRoleName(editData.role || "");
      setDescription(editData.description || "");

      const newPermissions = Object.entries(editData.permissions || {}).map(
        ([moduleKey, perms], index) => ({
          id: index + 1,
          module: reverseModuleMapping[moduleKey] || moduleKey,
          add: perms.add,
          edit: perms.edit,
          view: perms.view,
          delete: perms.delete,
        })
      );

      setPermissions(newPermissions);
    } else if (isOpen && !isEdit) {
      // For new role, ensure form is clean
      resetForm();
    }
  }, [isOpen, isEdit, editData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <div className="">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto pt-5 px-5 bg-white rounded-lg shadow-lg no-scrollbar">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-medium text-gray-900">
                {isEdit ? "Edit" : "Add"} Role
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="px-[2px] space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="roleName"
                className="text-sm font-medium text-gray-900"
              >
                Role Name<span className="text-red-500">*</span>
              </Label>
              <input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-900"
              >
                Description<span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter role description"
                className="w-full h-20 px-3 py-2.5 text-sm resize-none border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900">
                Permissions
              </h3>

              {permissions.map((permission, index) => (
                <div key={permission.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {index + 1}
                      </span>
                      <Label className="text-sm font-medium text-gray-900">
                        Select Module<span className="text-red-500">*</span>
                      </Label>
                    </div>
                    {permissions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePermission(permission.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 h-auto"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  <select
                    value={permission.module}
                    onChange={(e) =>
                      updatePermission(permission.id, "module", e.target.value)
                    }
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]"
                    disabled={isSubmitting}
                  >
                    <option value="">Select module</option>
                    <option value="Staff">Staff</option>
                    <option value="Assets">Assets</option>
                    <option value="Clients">Clients</option>
                    <option value="Vendors">Vendors</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Support Tickets">Support Tickets</option>
                    <option value="Reports">Reports</option>
                    <option value="Logs">Logs</option>
                  </select>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`add-${permission.id}`}
                        checked={permission.add}
                        onCheckedChange={(checked) =>
                          updatePermission(permission.id, "add", checked)
                        }
                        className="w-4 h-4 rounded-none data-[state=checked]:bg-[#ED1C24] data-[state=checked]:text-white"
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor={`add-${permission.id}`}
                        className="text-sm text-gray-700"
                      >
                        Add
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${permission.id}`}
                        checked={permission.edit}
                        onCheckedChange={(checked) =>
                          updatePermission(permission.id, "edit", checked)
                        }
                        className="w-4 h-4 rounded-none data-[state=checked]:bg-[#ED1C24] data-[state=checked]:text-white"
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor={`edit-${permission.id}`}
                        className="text-sm text-gray-700"
                      >
                        Edit
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`view-${permission.id}`}
                        checked={permission.view}
                        onCheckedChange={(checked) =>
                          updatePermission(permission.id, "view", checked)
                        }
                        className="w-4 h-4 rounded-none data-[state=checked]:bg-[#ED1C24] data-[state=checked]:text-white"
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor={`view-${permission.id}`}
                        className="text-sm text-gray-700"
                      >
                        View
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`delete-${permission.id}`}
                        checked={permission.delete}
                        onCheckedChange={(checked) =>
                          updatePermission(permission.id, "delete", checked)
                        }
                        className="w-4 h-4 rounded-none data-[state=checked]:bg-[#ED1C24] data-[state=checked]:text-white"
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor={`delete-${permission.id}`}
                        className="text-sm text-gray-700"
                      >
                        Delete
                      </Label>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={addPermission}
                className="bg-[#ED1C24] hover:bg-[#df1a22] text-white text-sm px-4 py-2 h-9 rounded-[2px]"
                disabled={isSubmitting}
              >
                Add Permission
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 h-9 text-sm text-gray-700 border-none shadow-none"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="px-6 py-2 h-9 text-sm bg-[#ED1C24] hover:bg-[#df1a22] text-white rounded-md"
              disabled={isSubmitting}
            >
              {isEdit ? "Update" : isSubmitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
