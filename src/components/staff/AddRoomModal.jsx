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

export default function AddRoomModal({
  children,
  open,
  onOpenChange,
  axiosPrivate,
  organizationId,
  locationId,
  roomData = null, // For editing existing room
  onSuccess,
}) {
  const defaultData = {
    roomName: "",
    department: "",
    status: "active",
    address1: "",
    address2: "",
    landmark: "",
    city: "",
    state: "",
    zipcode: "",
    image: null,
  };

  const [formData, setFormData] = useState(defaultData);
  const [imageName, setImageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = roomData !== null;

  // Populate form data when editing
  useEffect(() => {
    if (isEditing && roomData) {
      setFormData({
        roomName: roomData.roomName || "",
        department: roomData.department || "",
        status: roomData.status || "active",
        address1: roomData.address1 || "",
        address2: roomData.address2 || "",
        landmark: roomData.landmark || "",
        city: roomData.city || "",
        state: roomData.state || "",
        zipcode: roomData.zipcode || "",
        image: null, // Don't populate existing image for security
      });
      setImageName("");
    } else {
      setFormData(defaultData);
      setImageName("");
    }
  }, [roomData, open, isEditing]);

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
      // Convert image to base64 if present
      let imageBase64 = null;
      if (formData.image) {
        imageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(formData.image);
        });
      }

      // Prepare JSON data for API
      const submitData = {
        roomName: formData.roomName,
        department: formData.department,
        status: formData.status,
      };

      // Add optional address fields
      if (formData.address1) submitData.address1 = formData.address1;
      if (formData.address2) submitData.address2 = formData.address2;
      if (formData.landmark) submitData.landmark = formData.landmark;
      if (formData.city) submitData.city = formData.city;
      if (formData.state) submitData.state = formData.state;
      if (formData.zipcode) submitData.zipcode = formData.zipcode;

      // Add base64 image if present
      if (imageBase64) {
        submitData.image = imageBase64;
      }

      let response;
      if (isEditing) {
        // Update existing room
        response = await axiosPrivate.put(
          `/organizations/${organizationId}/locations/${locationId}/rooms/${roomData.id}`,
          submitData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Create new room
        response = await axiosPrivate.post(
          `/organizations/${organizationId}/locations/${locationId}/rooms`,
          submitData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log(`${isEditing ? "Updated" : "Created"} Room:`, response.data);

      // Reset form
      setFormData(defaultData);
      setImageName("");

      // Close modal
      if (onOpenChange) {
        onOpenChange(false);
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} room:`,
        error
      );
      // You might want to show an error message to the user here
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
              {isEditing ? "Edit Room" : "Add Room"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1"
        >
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="roomName"
              value={formData.roomName}
              onChange={handleChange}
              placeholder="Enter room name"
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status<span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Address section */}
          <h2 className="text-lg font-semibold text-gray-900">
            Location Details
          </h2>

          <div className="grid grid-cols-2 gap-4 pb-2">
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

          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Image
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4 mr-2" />
                <span className="text-sm text-gray-700">Choose File</span>
                <input
                  type="file"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                  className="hidden"
                />
              </label>
              {imageName && (
                <span className="text-sm text-gray-600">{imageName}</span>
              )}
            </div>
          </div>
        </form>

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
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Adding..."
                : isEditing
                ? "Update"
                : "Add"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
