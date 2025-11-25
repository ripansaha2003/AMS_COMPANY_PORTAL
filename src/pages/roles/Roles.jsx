import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import CustomDataTable from "@/components/common/CustomDatatable";
import { useSetLocationArray } from "@/utils/locationSetter";
import { IoSearch } from "react-icons/io5";
import AddRoleModal from "@/components/roles/AddRoleModal";
import Menu from "@/components/common/Menu";
import { CircleCheck, Eye, Pencil, Trash, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import toast from "react-hot-toast";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";

const Roles = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isRoleEdit, setIsRoleEdit] = useState(false);
  const [editData, setEditData] = useState({});

  const [isDeleting, setIsDeleting] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [dataToDelete, setDataToDelete] = useState(null);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasEditPermission = checkPermission("staff", "edit");
  const hasDeletePermission = checkPermission("staff", "delete");

  useSetLocationArray([
    { label: "Staff", link: "/staff" },
    { label: "Roles", link: "/staff/roles" },
  ]);
  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization ID:", error);
      return null;
    }
  };
  const fetchRoles = async () => {
    const organization_id = getOrganizationId();

    try {
      setLoading(true);
      const response = await axiosPrivate.get(
        `/staff/roles?organization_id=${organization_id}`
      );
      setRoles(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError("Failed to fetch roles data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDefault = async (roleId) => {
    try {
      const organization_id = getOrganizationId();

      await axiosPrivate.put(
        `/organizations/${organization_id}/roles/${roleId}/default`
      );

      await fetchRoles();

      console.log("Role marked as default successfully");
    } catch (err) {
      console.error("Error marking role as default:", err);
      setError("Failed to mark role as default");
    }
  };

  const handleDelete = async (roleId) => {
    setIsDeleting(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const organizationId = user?.organization_id;
      await axiosPrivate.delete(`/organizations/${organizationId}/roles/${roleId}`);

      await fetchRoles();
      toast.success("Role deleted successfully");
      console.log("Role deleted successfully");
    } catch (err) {
      console.error("Error deleting role:", err);
      setError("Failed to delete role");
    } finally {
      setIsDeleting(false);
      setOpenDeleteModal(false);
      setDataToDelete(null);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/staff/roles/role-detail/${row.id}`),
    },
    hasEditPermission && {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: (e) => {
        setEditData(row);
        setIsRoleEdit(true);
        setIsRoleModalOpen(true);
      },
    },
    hasDeletePermission && {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => {
        setDataToDelete(row);
        setOpenDeleteModal(true);
      },
    },
    {
      icon: <CircleCheck className="w-4 h-4" />,
      label: "Mark as Default",
      onClick: () => handleMarkAsDefault(row.id),
    },
  ];

  const columns = [
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
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
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => (
        <div
          style={{
            maxWidth: 200,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={text}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Menu items={menuItems(record)}>
          <button className="text-[#ED1C24] hover:text-blue-900 font-medium text-end">
            •••
          </button>
        </Menu>
      ),
      align: "right",
    },
  ];

  const filteredRoles = roles.filter(
    (role) =>
      role.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModalClose = (isOpen) => {
    setIsRoleModalOpen(isOpen);
    if (!isOpen) {
      setIsRoleEdit(false);
      setEditData({});
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading roles...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setDataToDelete(null);
        }}
        onConfirm={() => handleDelete(dataToDelete.id)}
        title="Delete Role"
        message={`Are you sure you want to delete ${dataToDelete?.role}? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="Delete Role"
        cancelText="Cancel"
        type="danger"
        icon={<Trash2 className="w-6 h-6" />}
        isLoading={isDeleting}
      />
      <h1 className="text-xl font-semibold flex justify-between">
        All Roles
        <div className="flex gap-x-3">
          <div className="relative flex items-center">
            <IoSearch className="absolute left-2 text-gray-600" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 pl-8 py-2 text-base bg-gray-100 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent w-full max-w-xs"
            />
          </div>

          <AddRoleModal
            isEdit={isRoleEdit}
            setIsEdit={setIsRoleEdit}
            isOpen={isRoleModalOpen}
            setIsOpen={handleModalClose}
            onRoleAdded={fetchRoles}
            editData={editData}
          >
            <PermissionWrapper module="staff" action="add">
              <button
                onClick={() => {
                  setIsRoleEdit(false);
                  setEditData({});
                  setIsRoleModalOpen(true);
                }}
                className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
              >
                Add Role
              </button>
            </PermissionWrapper>
          </AddRoleModal>
        </div>
      </h1>
      <div className="bg-white rounded-lg mt-10 shadow-sm">
        <CustomDataTable
          columns={columns}
          data={filteredRoles}
          pagination={false}
        />
      </div>
    </Layout>
  );
};

export default Roles;
