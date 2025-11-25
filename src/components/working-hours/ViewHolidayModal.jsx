import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { axiosPrivate } from "@/axios/axiosInstance";

export default function ViewHolidayModal({ open, onOpenChange, holiday }) {
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.organization_id;
  };

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const org = getOrganizationId();
        const [dRes, sRes] = await Promise.all([
          axiosPrivate.get(`/organizations/${org}/departments`),
          axiosPrivate.get(`/organizations/${org}/shifts`),
        ]);
        setDepartments(dRes.data.departments || dRes.data || []);
        setShifts(sRes.data.shifts || sRes.data || []);
      } catch (err) {
        console.error("Error fetching lookup data:", err);
        setDepartments([]);
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB");
  };

  const getDepartmentName = (id) => {
    if (!id) return "All";
    const dept = departments.find((d) => d.id === id || d.department_id === id || d.department === id);
    return dept ? dept.department || dept.name || "" : id;
  };

  const getShiftName = (id) => {
    if (!id) return "All";
    const s = shifts.find((sh) => sh.id === id || sh.shift_id === id || sh.workinghours_id === id);
    return s ? s.shift_name || s.profile_name || "" : id;
  };

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">View Holiday</DialogTitle>
        </DialogHeader>

        <div className="px-[2px] space-y-4 overflow-y-auto no-scrollbar flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label>
            <div className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">{holiday?.holiday_name || "-"}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">{formatDateForDisplay(holiday?.date) || "-"}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <div className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">{getDepartmentName(holiday?.department)}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
            <div className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">{getShiftName(holiday?.working_hours)}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
            <div className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">{holiday?.created_at ? new Date(holiday.created_at).toLocaleString() : "-"}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
            <div className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900">{holiday?.updated_at ? new Date(holiday.updated_at).toLocaleString() : "-"}</div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <button onClick={() => onOpenChange(false)} className="px-6 py-2 text-gray-700 font-medium text-sm">Close</button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
