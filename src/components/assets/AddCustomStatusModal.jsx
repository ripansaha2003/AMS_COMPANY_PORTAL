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
import { X } from "lucide-react";


const ToggleSwitch = ({ enabled, onToggle, disabled = false }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:ring-offset-2 ${
        enabled
          ? "bg-green-600"
          : disabled
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
      {enabled && (
        <span className="absolute right-1.5 top-1.5">
          <svg
            className="h-3 w-3 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
      {disabled && !enabled && (
        <span className="absolute right-1.5 top-1">
          <X className="h-3 w-3 text-gray-500" />
        </span>
      )}
    </button>
  );
};

export default function AddCustomStatusModal({
  children,
  open,
  onOpenChange,
  onAdd,
}) {
  const defaultData = {
    name: "",
    trackLocation: false,
    officeLocationSelection: false,
    rooms: false,
    notes: false,
    uploadPhoto: false,
  };

  const [formData, setFormData] = useState(defaultData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => {
      const newVal = !prev[field];
      const updated = { ...prev, [field]: newVal };

      // If trackLocation is being turned ON, force-off and disable related options
      if (field === "trackLocation" && newVal) {
        updated.officeLocationSelection = false;
        updated.rooms = false;
      }

      return updated;
    });
  };

const handleSubmit = () => {
  console.log("Custom Status Data:", formData);
  if (onAdd) onAdd(formData);
  setFormData(defaultData);
  if (onOpenChange) {
    onOpenChange(false);
  }
};


  const handleCancel = () => {
    setFormData(defaultData);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const isControlled = !children;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[650px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Add Custom Status
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-8 overflow-y-auto no-scrollbar flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
              placeholder="Enter status name"
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-center  gap-8">
              <div className="flex items-center justify-between gap-x-5">
                <span className="text-sm font-medium text-gray-700">
                  Track Location
                </span>
                <ToggleSwitch
                  enabled={formData.trackLocation}
                  onToggle={() => handleToggle("trackLocation")}
                />
              </div>
              <div className="flex items-center justify-between gap-x-5">
                <span className="text-sm font-medium text-gray-700">
                  Office Location Selection
                </span>
                <ToggleSwitch
                  enabled={formData.officeLocationSelection}
                  onToggle={() => handleToggle("officeLocationSelection")}
                  disabled={formData.trackLocation}
                />
              </div>
              <div className="flex items-center justify-between gap-x-5">
                <span className="text-sm font-medium text-gray-700">Rooms</span>
                <ToggleSwitch
                  enabled={formData.rooms}
                  onToggle={() => handleToggle("rooms")}
                  disabled={formData.trackLocation}
                />
              </div>
            </div>

            <div className="flex justify-start gap-8">
              <div className="flex items-center justify-between gap-x-5">
                <span className="text-sm font-medium text-gray-700">Notes</span>
                <ToggleSwitch
                  enabled={formData.notes}
                  onToggle={() => handleToggle("notes")}
                />
              </div>
              <div className="flex items-center justify-between gap-x-5">
                <span className="text-sm font-medium text-gray-700">
                  Upload Photo
                </span>
                <ToggleSwitch
                  enabled={formData.uploadPhoto}
                  onToggle={() => handleToggle("uploadPhoto")}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm"
            >
              Add
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
