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
import { Upload } from "lucide-react";

export default function AddStaffModal({
  children,
  open: controlledOpen,
  onOpenChange,
}) {
  const defaultFormData = {
    firstName: "",
    lastName: "",
    gender: "Female",
    email: "",
    phone: "",
    countryCode: "+1",
    department: "",
    role: "",
  };

  const [formData, setFormData] = useState(defaultFormData);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Staff added:", formData);
    if (onOpenChange) {
      onOpenChange({ ...controlledOpen, status: false });
    }
    setFormData(defaultFormData);
  };

  const isControlled = !children;

  return (
    <Dialog
      open={isControlled ? controlledOpen?.status : undefined}
      onOpenChange={(isOpen) => {
        if (onOpenChange) {
          onOpenChange({ ...controlledOpen, status: isOpen });
        }
      }}
    >
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[500px] bg-white pt-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {controlledOpen?.data ? "Edit Staff" : "Add Staff"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-3 py-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                required
              />
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                required
              />
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone<span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleInputChange}
                className="px-3 py-2.5 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 border-r-0 text-gray-900"
              >
                <option value="+1">+1</option>
                <option value="+91">+91</option>
                <option value="+44">+44</option>
              </select>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            >
              <option value="">Select</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ED1C24] bg-gray-50 text-gray-900"
            >
              <option value="">Select</option>
              <option value="Manager">Manager</option>
              <option value="Senior">Senior</option>
              <option value="Junior">Junior</option>
              <option value="Intern">Intern</option>
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
                <p className="text-gray-600 mb-1">
                  Drag your image or{" "}
                  <button
                    type="button"
                    className="text-[#ED1C24] hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Dimension 200×200
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <DialogClose asChild>
              <button className="px-6 py-2 text-gray-700 font-medium">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium"
            >
              Add
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
