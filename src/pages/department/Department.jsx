import CustomDatatable from "@/components/common/CustomDatatable";
import Layout from "@/components/common/Layout";
import Menu from "@/components/common/Menu";
import AddDepartmentModal from "@/components/department/AddDeptartmentModal";
import { useSetLocationArray } from "@/utils/locationSetter";
import { Eye, Pencil, Trash } from "lucide-react";
import React, { useState, useEffect } from "react";
import { IoSearch } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const Department = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRoleEdit, setIsRoleEdit] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  // Get organization ID from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const organizationId = user?.organization_id;

  const hasEditPermission = checkPermission("staff", "edit");
  const hasDeletePermission = checkPermission("staff", "delete");

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      if (!organizationId) {
        alert("Organization ID not found. Please log in again.");
        return;
      }

      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/departments`
      );
      setDepartments(response?.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      alert("Failed to fetch departments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchDepartments();
    }
  }, [organizationId]);

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;
    
    setDeleteLoading(true);
    try {
      await axiosPrivate.delete(
        `/organizations/${organizationId}/departments/${departmentToDelete.id}`
      );
      alert("Department deleted successfully");
      fetchDepartments(); // Refresh the list
      setOpenDeleteModal(false);
      setDepartmentToDelete(null);
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Failed to delete department. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () =>
        navigate(
          `/staff/department/department-detail/${row.id || row.department}`,{
            state:row
          }
        ),
    },
    hasEditPermission && {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: () => {
        setSelectedDepartment(row);
        setIsRoleEdit(true);
        setIsRoleModalOpen(true);
      },
    },
    hasDeletePermission && {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => {
        setDepartmentToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  const columns = [
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (text, record) => (
        <>
          {text}
          {record.default && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                color: "#4B5FFA",
                background: "#F5F6FF",
                padding: "2px 8px",
                borderRadius: 4,
                marginTop: -2,
                marginBottom: -2,
              }}
            >
              Default
            </span>
          )}
        </>
      ),
    },
    {
      title: "No of staff assigned",
      dataIndex: "staff",
      key: "staff",
      render: (value) => value || 0, // Show 0 if no staff count provided
    },
    {
      title: <p className="text-center w-full">Actions</p>,
      key: "actions",
      render: (_, record) => (
        <Menu items={menuItems(record)}>
          <button className="text-[#ED1C24] hover:text-blue-900 font-medium text-center w-full">
            •••
          </button>
        </Menu>
      ),
      align: "right",
    },
  ];

  // Filter departments based on search term
  const filteredData = departments.filter((department) =>
    department.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setIsRoleEdit(false);
    setIsRoleModalOpen(true);
  };

  const handleModalClose = () => {
    setIsRoleModalOpen(false);
    setIsRoleEdit(false);
    setSelectedDepartment(null);
  };

  const handleModalSuccess = () => {
    fetchDepartments(); // Refresh the list after successful add/edit
    handleModalClose(); // Close the modal
  };

  useSetLocationArray([
    { label: "Staff", link: "/staff" },
    { label: "Departments", link: "" },
  ]);

  // Don't render if no organization ID
  if (!organizationId) {
    return (
      <Layout>
        <div className="p-4 text-center text-red-600">
          Organization ID not found. Please log in again.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        All Departments
        <div className="flex gap-x-3">
          <div className="relative flex items-center">
            <IoSearch className="absolute left-2 text-gray-600" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 pl-8 py-2 text-base bg-gray-100 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent w-full max-w-xs"
            />
          </div>

          <AddDepartmentModal
            isEdit={isRoleEdit}
            setIsEdit={setIsRoleEdit}
            isOpen={isRoleModalOpen}
            setIsOpen={setIsRoleModalOpen}
            organizationId={organizationId}
            departmentData={selectedDepartment}
            onSuccess={handleModalSuccess}
          >
            <PermissionWrapper module="staff" action="add">
              <button
                onClick={handleAddDepartment}
                className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base hover:bg-[#d91b22] transition-colors"
              >
                Add Department
              </button>
            </PermissionWrapper>
          </AddDepartmentModal>
        </div>
      </h1>

      <div className="bg-white rounded-lg mt-10 shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED1C24]"></div>
            <p className="mt-2 text-gray-600">Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No departments found.</p>
            <p className="text-sm">
              Click "Add Department" to create your first department.
            </p>
          </div>
        ) : (
          <CustomDatatable
            columns={columns}
            data={filteredData}
            pagination={true}
            pageSize={10}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setDepartmentToDelete(null);
        }}
        onConfirm={handleDeleteDepartment}
        title="Delete Department"
        message={`Are you sure you want to delete the ${departmentToDelete?.department} department? This action cannot be undone.`}
        confirmText="Delete Department"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default Department;
