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

export default function AssignModal({
  children,
  open: controlledOpen,
  onOpenChange,
}) {
  const defaultFormData = {
    status: "Asset 1",
  };

  const [formData, setFormData] = useState(defaultFormData);
  const statusOptions = ["Asset 1", "Asset 2", "Asset 3", "Asset 4"];

  useEffect(() => {
    if (controlledOpen?.data) {
      setFormData({
        ...defaultFormData,
        ...controlledOpen.data,
      });
    }
  }, [controlledOpen]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const handleSubmit = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isControlled = !children;

  return (
    <Dialog
      open={isControlled ? controlledOpen : undefined}
      onOpenChange={onOpenChange}
    >
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[500px] bg-white pt-5 px-5 max-h-[90vh] min-h-[30vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              Assign
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-8 overflow-y-auto no-scrollbar flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Assign Assets
            </label>
            <select
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-md text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-4 justify-end w-full">
            <DialogClose asChild>
              <button
                onClick={handleCancel}
                className="px-8 py-3 text-gray-700 font-medium text-sm hover:text-gray-900"
                type="button"
              >
                Cancel
              </button>
            </DialogClose>
            <DialogClose asChild>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm"
                type="submit"
              >
                Add
              </button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
