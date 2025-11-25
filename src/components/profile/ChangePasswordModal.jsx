import React, { useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";
import toast from "react-hot-toast";

export default function ChangePasswordModal({
  children,
  isOpen,
  setIsOpen,
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsOpen(false);
  };

  const handleSubmit = () => {
    // basic validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setLoading(true);
    const payload = {
      oldPassword: oldPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    };

    axiosPrivate
      .post("/auth/change-password", payload)
      .then((res) => {
        toast.success("Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsOpen(false);
      })
      .catch((err) => {
        console.error("Change password error:", err);
        const msg = err.response?.data?.message || "Failed to change password";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto pt-5 px-5 bg-white rounded-lg shadow-lg">
          <DialogHeader >
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-medium text-gray-900">
                Change Password
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="px-[2px] space-y-6">
            {/* Old Password */}
            <div className="space-y-2">
              <Label
                htmlFor="oldPassword"
                className="text-sm font-medium text-gray-900"
              >
                Old Password<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-sm font-medium text-gray-900"
              >
                New Password<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-900"
              >
                Confirm Password<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4  bg-white rounded-b-lg">
            <button
              onClick={handleCancel}
              className="px-6 py-2 h-9 text-sm  text-gray-700 font-medium"
            >
              Cancel
            </button>
            <Button
              onClick={handleSubmit}
              className="px-6 py-2 h-9 text-sm bg-[#ED1C24] hover:bg-[#d91b22] text-white rounded-md"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

