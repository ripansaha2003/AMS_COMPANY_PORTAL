import Layout from "@/components/common/Layout";
import Menu from "@/components/common/Menu";
import AddLocationModal from "@/components/staff/AddLocationModal";
import EditShiftModal from "@/components/working-hours/EditShiftModal";
import { useSetLocationArray } from "@/utils/locationSetter";
import { axiosPrivate } from "@/axios/axiosInstance";

import React, { useState, useEffect } from "react";
import { CiLocationOn } from "react-icons/ci";
import { IoPerson, IoSearch } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import AddShiftModal from "../../components/working-hours/AddShiftModal";
import WorkingDaysModal from "../../components/working-hours/WorkingDayModal";
import PermissionWrapper from "@/components/PermissionWrapper";
import { checkPermission } from "@/utils/permissions";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const WorkingHours = () => {
  useSetLocationArray([
    { label: "Staff", link: "/staff" },
    { label: "Working Hours", link: "" },
  ]);
  const navigate = useNavigate();
  const [openAddShiftModal, setOpenAddShiftModal] = useState(false);
  const [openWorkingDaysModal, setOpenWorkingDaysModal] = useState(false);
  const [openEditShiftModal, setOpenEditShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const hasEditPermission = checkPermission("staff", "edit");
  const hasDeletePermission = checkPermission("staff", "delete");
  // Get organization_id from localStorage
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.organization_id;
  };

  // Fetch shifts from API
  const fetchShifts = async () => {
    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/shifts`
      );
      setShifts(response.data.shifts || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete shift
  const handleDeleteShift = async () => {
    if (!shiftToDelete) return;
    
    setDeleteLoading(true);
    try {
      const organizationId = getOrganizationId();
      await axiosPrivate.delete(
        `/organizations/${organizationId}/shifts/${shiftToDelete.shift_id}`
      );
      // Refresh the shifts list
      fetchShifts();
      setOpenDeleteModal(false);
      setShiftToDelete(null);
    } catch (error) {
      console.error("Error deleting shift:", error);
      alert("Error deleting shift");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle edit shift
  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setOpenEditShiftModal(true);
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Filter shifts based on search term
  const filteredShifts = shifts.filter((shift) =>
    shift.shift_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const menuItems = (shift) => [
    hasEditPermission &&{
      label: "Edit",
      onClick: (e) => {
        e.stopPropagation();
        handleEditShift(shift);
      },
    },
    hasDeletePermission && {
      label: "Delete",
      onClick: (e) => {
        e.stopPropagation();
        setShiftToDelete(shift);
        setOpenDeleteModal(true);
      },
    },
  ];

  const buttonItems = [
    {
      label: "Holidays",
      onClick: (e) => navigate("/staff/working-hours/holiday"),
    },
    {
      label: "Working Days",
      onClick: (e) => {
        setOpenWorkingDaysModal(true);
      },
    },
  
  ];

  return (
    <Layout>
      <EditShiftModal
        open={openEditShiftModal}
        onOpenChange={setOpenEditShiftModal}
        shift={selectedShift}
        onShiftUpdated={fetchShifts}
      />
      <WorkingDaysModal
        open={openWorkingDaysModal}
        onOpenChange={setOpenWorkingDaysModal}
      />
      <h1 className="text-xl font-semibold flex justify-between mb-6">
        Working Hours
        <div className="flex gap-x-3">
          <div className="relative flex items-center">
            <IoSearch className="absolute left-2 text-gray-600" />
            <input
              type="text"
              placeholder="Search shifts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 pl-8 py-2 text-base bg-gray-100 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent w-full max-w-xs"
            />
          </div>

          <AddShiftModal
            open={openAddShiftModal}
            onOpenChange={setOpenAddShiftModal}
            onShiftAdded={fetchShifts}
          >
            <PermissionWrapper module="staff" action="add">
              <button
                onClick={() => setOpenAddShiftModal(true)}
                className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
              >
                Add New Shift
              </button>
            </PermissionWrapper>
          </AddShiftModal>
          <Menu items={buttonItems}>
            <button className="bg-gray-200 text-gray-600 font-normal  rounded-sm px-4 py-2 text-base">
              •••
            </button>
          </Menu>
        </div>
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-600">Loading shifts...</div>
        </div>
      ) : (
        <div className="flex gap-6 flex-wrap">
          {filteredShifts.length > 0 ? (
            filteredShifts.map((shift) => (
              <div
                key={shift.shift_id}
                className="flex flex-col relative items-center border border-gray-300 rounded-lg p-6 w-40 bg-white shadow-sm hover:shadow-md transition"
              >
                <Menu items={menuItems(shift)}>
                  <button className="absolute focus:outline-none top-2 right-2 rotate-90 bg-gray-100 text-[#ED1C24] font-normal  rounded-sm px-2 text-sm py-2 ">
                    •••
                  </button>
                </Menu>
                <IoPerson size={40} className="mb-4 text-gray-600" />
                <span className="text-base font-medium text-center">
                  {shift.shift_name}
                </span>
                <div className="text-sm text-gray-500 mt-2">
                  {shift.start_time} - {shift.end_time}
                </div>
                {shift.status && (
                  <div
                    className={`text-xs px-2 py-1 rounded-full mt-2 ${
                      shift.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {shift.status}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-600 py-8">
              {searchTerm
                ? "No shifts found matching your search."
                : "No shifts available. Add your first shift to get started."}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setShiftToDelete(null);
        }}
        onConfirm={handleDeleteShift}
        title="Delete Shift"
        message={`Are you sure you want to delete ${shiftToDelete?.shift_name}? This action cannot be undone.`}
        confirmText="Delete Shift"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default WorkingHours;
