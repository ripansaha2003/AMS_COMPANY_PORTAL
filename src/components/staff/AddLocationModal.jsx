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
import { Upload } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function AddLocationModal({
  children,
  open,
  onOpenChange,
  editLocation = null,
  onLocationSaved,
}) {
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.organization_id;
  };
  const defaultData = {
    name: "",
    address1: "",
    address2: "",
    landmark: "",
    city: "",
    state: "",
    zipcode: "",
    image: null,
    status: "active",
    organization_id: getOrganizationId(),
  };

  const [formData, setFormData] = useState(defaultData);
  const [imageName, setImageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get organization ID from localStorage

  // Convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Initialize form data when editing
  useEffect(() => {
    if (editLocation) {
      setFormData({
        name: editLocation.name || "",
        address1: editLocation.address1 || "",
        address2: editLocation.address2 || "",
        landmark: editLocation.landmark || "",
        city: editLocation.city || "",
        state: editLocation.state || "",
        zipcode: editLocation.zipcode || "",
        image: null,
        status: editLocation.status || "active",
        organization_id: getOrganizationId(),
      });
    } else {
      setFormData(defaultData);
    }
    setImageName("");
  }, [editLocation, open]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      setImageName(file?.name || "");
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        alert("Organization ID not found");
        return;
      }

      // Prepare form data
      const submitData = { ...formData };

      // Convert image to base64 if present
      if (formData.image) {
        const base64Image = await convertToBase64(formData.image);
        submitData.image = base64Image;
      }

      // Remove the file object since we're sending base64
      delete submitData.image;
      if (formData.image) {
        submitData.image = await convertToBase64(formData.image);
      }

      if (editLocation) {
        // Update existing location
        await axiosPrivate.put(
          `/organizations/${organizationId}/locations/${editLocation.id}`,
          submitData
        );
        alert("Location updated successfully!");
      } else {
        // Create new location
        await axiosPrivate.post(
          `/organizations/${organizationId}/locations`,
          submitData
        );
        alert("Location added successfully!");
      }

      // Reset form and close modal
      setFormData(defaultData);
      setImageName("");
      if (onOpenChange) {
        onOpenChange(false);
      }
      if (onLocationSaved) {
        onLocationSaved();
      }
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Failed to save location. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isControlled = !children;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editLocation ? "Edit Location" : "Add Location"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter location name"
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            />
          </div>

          {/* Address section */}
          <h2 className="text-lg font-semibold text-gray-900">Location-</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="address1"
                value={formData.address1}
                onChange={handleChange}
                placeholder="Enter address line 1"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                name="address2"
                value={formData.address2}
                onChange={handleChange}
                placeholder="Enter address line 2 (optional)"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Landmark
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="Enter landmark (optional)"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              />
            </div>

            <div>
                  <label className="block text-sm text-gray-700 mb-1">State</label>
                  <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Zipcode
              </label>
              <input
                type="text"
                name="zipcode"
                value={formData.zipcode}
                onChange={handleChange}
                placeholder="Enter zipcode"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Upload Image */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-2">
              Upload Image
            </label>
            <div className="border-2 border-dashed border-[#d41920] rounded-lg p-6 text-center bg-[#ED1C2408] relative">
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className="text-[#ED1C24] mb-2" />
                <p className="text-sm text-gray-700">
                  Drag your Image or{" "}
                  <span className="text-[#ED1C24] underline cursor-pointer">
                    browse
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Dimension 200×200
                </p>
                {imageName && (
                  <p className="text-xs text-gray-800 mt-2 font-medium">
                    Selected: {imageName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <DialogClose asChild>
              <button
                className="px-6 py-2 text-gray-700 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : editLocation ? "Update" : "Add"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
