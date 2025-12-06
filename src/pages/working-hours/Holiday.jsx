import CustomDatatable from "@/components/common/CustomDatatable";
import Layout from "@/components/common/Layout";
import Menu from "@/components/common/Menu";
import AddHolidayModal from "@/components/working-hours/AddHolidayModal";
import ViewHolidayModal from "@/components/working-hours/ViewHolidayModal";
import { useSetLocationArray } from "@/utils/locationSetter";
import { axiosPrivate } from "@/axios/axiosInstance";
import { Eye, Edit, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PermissionWrapper from "@/components/PermissionWrapper";
import { checkPermission } from "@/utils/permissions";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const Holidays = () => {
  useSetLocationArray([
    { label: "Staff", link: "/staff" },
    { label: "Working Hours", link: "/staff/working-hours" },
    { label: "Holidays", link: "" },
  ]);

  const [holidayModal, setHolidayModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [viewHolidayModal, setViewHolidayModal] = useState(false);
  const [selectedViewHoliday, setSelectedViewHoliday] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
    const hasEditPermission = checkPermission("staff", "edit");
  const hasDeletePermission = checkPermission("staff", "delete");
  // Get organization_id from localStorage
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.organization_id;
  };

  // Fetch holidays from API
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/holiday`
      );
      setHolidays(response.data.holidays || response.data || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete holiday
  const handleDeleteHoliday = async () => {
    if (!holidayToDelete) return;
    
    setDeleteLoading(true);
    try {
      const organizationId = getOrganizationId();
      await axiosPrivate.delete(
        `/organizations/${organizationId}/holiday/${holidayToDelete.holiday_id || holidayToDelete.id}`
      );
      // Refresh the holidays list
      fetchHolidays();
      setOpenDeleteModal(false);
      setHolidayToDelete(null);
    } catch (error) {
      console.error("Error deleting holiday:", error);
      alert("Error deleting holiday");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle edit holiday
  const handleEditHoliday = (holiday) => {
    setSelectedHoliday(holiday);
    setHolidayModal(true);
  };

  // Handle add holiday
  const handleAddHoliday = () => {
    setSelectedHoliday(null);
    setHolidayModal(true);
  };

  // Format date for display (assuming API returns YYYY-MM-DD format)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => {
        setSelectedViewHoliday(row);
        setViewHolidayModal(true);
      },
    },
    hasEditPermission && {
      icon: <Edit className="w-4 h-4" />,
      label: "Edit",
      onClick: () => {
        handleEditHoliday(row);
      },
    },
    hasDeletePermission && {
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete",
      onClick: () => {
        setHolidayToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  // Format holidays data for table display
  const formattedHolidays = holidays.map((holiday) => ({
    ...holiday,
    key: holiday.holiday_id || holiday.id,
    dateDisplay: formatDateForDisplay(holiday.date), // For display only
    date: holiday.date, // Keep original date format for editing
    departmentAssigned: holiday.department_name || holiday.department || "All",
    shiftsAssigned:
      holiday.working_hours_name || holiday.working_hours || "All",
  }));

  // Table columns
  const columns = [
    {
      title: "Holiday Name",
      dataIndex: "holiday_name",
      key: "holiday_name",
      width: "20%",
    },
    {
      title: "Date",
      dataIndex: "dateDisplay",
      key: "dateDisplay",
      width: "15%",
    },
    {
      title: "Department Assigned",
      dataIndex: "departmentAssigned",
      key: "departmentAssigned",
      width: "25%",
    },
    {
      title: "Shifts Assigned",
      dataIndex: "shiftsAssigned",
      key: "shiftsAssigned",
      width: "25%",
    },
    {
      title: "Actions",
      key: "action",
      width: "15%",
      render: (value, record) => (
        <Menu items={menuItems(record)}>
          <button className="text-[#ED1C24] hover:text-blue-900 font-medium">
            •••
          </button>
        </Menu>
      ),
    },
  ];

  return (
    <Layout>
      <div className="mx-auto">
        <h1 className="text-xl font-semibold flex justify-between">
          Holidays
          <PermissionWrapper module="staff" action="add">
            <button
              onClick={handleAddHoliday}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
            >
              Add Holiday
            </button>
          </PermissionWrapper>
        </h1>

        {/* Add/Edit Holiday Modal */}
        <AddHolidayModal
          open={holidayModal}
          onOpenChange={setHolidayModal}
          holiday={selectedHoliday}
          onHolidayUpdated={fetchHolidays}
        />

        {/* View Holiday Modal */}
        <ViewHolidayModal
          open={viewHolidayModal}
          onOpenChange={setViewHolidayModal}
          holiday={selectedViewHoliday}
        />

        <div className="bg-white rounded-lg mt-10 shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Loading holidays...</div>
            </div>
          ) : (
            <CustomDatatable
              data={formattedHolidays}
              columns={columns}
              pagination={false}
            />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={openDeleteModal}
          onClose={() => {
            setOpenDeleteModal(false);
            setHolidayToDelete(null);
          }}
          onConfirm={handleDeleteHoliday}
          title="Delete Holiday"
          message={`Are you sure you want to delete ${holidayToDelete?.holiday_name}? This action cannot be undone.`}
          confirmText="Delete Holiday"
          type="danger"
          isLoading={deleteLoading}
        />
      </div>
    </Layout>
  );
};

export default Holidays;
