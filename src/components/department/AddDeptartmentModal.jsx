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
import { Label } from "@/components/ui/label";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function AddDepartmentModal({
  children,
  isEdit,
  setIsEdit,
  isOpen = false,
  setIsOpen,
  organizationId,
  departmentData,
  onSuccess,
}) {
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && departmentData) {
      setDepartmentName(departmentData.department || "");
    } else {
      setDepartmentName("");
    }
  }, [isEdit, departmentData]);

  const handleCancel = () => {
    setIsEdit(false);
    setIsOpen(false);
    setDepartmentName("");
  };

  const handleSubmit = async () => {
    if (!departmentName.trim()) {
      alert("Department name is required");
      return;
    }

    if (!organizationId) {
      alert("Organization ID is required");
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        organization_id: organizationId,
        departmentName: departmentName.trim(),
      };

      if (isEdit && departmentData?.id) {
        // PUT request for editing
        const response = await axiosPrivate.put(
          `/organizations/${organizationId}/departments/${departmentData.id}`,
          requestBody
        );
        
        if (response.status === 200) {
          alert("Department updated successfully");
        }
      } else {
        // POST request for adding
        const response = await axiosPrivate.post(
          `/organizations/${organizationId}/departments`,
          requestBody
        );
        
        if (response.status === 200 || response.status === 201) {
          alert("Department added successfully");
        }
      }

      // Close modal and reset form
      setIsOpen(false);
      setDepartmentName("");
      setIsEdit(false);
      
      // Call success callback to refresh the department list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving department:", error);
      
      // More detailed error handling
      const errorMessage = error.response?.data?.message || error.message || "An error occurred";
      alert(
        `${isEdit ? "Failed to update" : "Failed to add"} department: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="w-full mx-4 pt-5 px-5 overflow-y-auto bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-medium text-gray-900">
                {isEdit ? "Edit" : "Add"} Department
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="px-[2px] space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="departmentName"
                className="text-sm font-medium text-gray-900"
              >
                Department Name<span className="text-red-500">*</span>
              </Label>
              <input
                id="departmentName"
                value={departmentName}
                placeholder="Enter department name"
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4 bg-white">
            <button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 h-9 text-sm text-gray-700 border-none font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !departmentName.trim()}
              className="px-6 py-2 h-9 text-sm bg-[#ED1C24] hover:bg-[#d91b22] text-white rounded-md disabled:opacity-50"
            >
              {loading 
                ? "Saving..." 
                : (isEdit ? "Update" : "Add")
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}