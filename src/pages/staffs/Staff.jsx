import Layout from "@/components/common/Layout";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
import AddStaffModal from "@/components/staff/AddStaffModal";
import Menu from "@/components/common/Menu";
import { Eye, Pencil, Trash, AlertTriangle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import { axiosPrivate } from "@/axios/axiosInstance";
import toast from "react-hot-toast";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";
import { useLimitCheck } from "@/hooks/useLimitCheck";
import { useSubscription } from "@/context/SubscriptionContext";

const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}
    >
      {status}
    </span>
  );
};

const Avatar = ({ name, imageUrl, size = "md" }) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-[#ED1C24] rounded-full flex items-center justify-center text-white font-medium`}
    >
      {getInitials(name)}
    </div>
  );
};

const Staff = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [staffData, setStaffData] = useState([]);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [editModal, setEditModal] = useState({
    status: false,
    data: {},
  });
  const hasEditPermission = checkPermission("staff", "edit");
  const hasDeletePermission = checkPermission("staff", "delete");
  const { checkLimit } = useLimitCheck("staff");
  const { refreshAfterAction } = useSubscription();

  const navigate = useNavigate();

  const handleAddStaffClick = () => {
    if (checkLimit()) {
      navigate("/staff/add-staff");
    }
  };

  const buttonItems = [
    {
      label: "Roles",
      onClick: () => navigate(`/staff/roles`),
    },
    {
      label: "Department",
      onClick: () => navigate(`/staff/department`),
    },
    {
      label: "Location",
      onClick: () => navigate(`/staff/location`),
    },
    {
      label: "Working Hours",
      onClick: () => navigate(`/staff/working-hours`),
    },
  ];

  const fetchStaffData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const organization_id = JSON.parse(
        localStorage.getItem("user")
      ).organization_id;
      const response = await axiosPrivate.get(
        `/organizations/${organization_id}/staff`
      );
      console.log("Staff data fetched:", response.data.data.staff);

      const data = Array.isArray(response.data.data.staff)
        ? response.data.data.staff
        : [];
      setStaffData(data);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      setError("Failed to load staff data. Please try again.");
      setStaffData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStaffUpdate = useCallback(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleDeleteStaff = async () => {
    if (!staffToDelete?.id) {
      console.error("Staff ID is required for deletion");
      return;
    }

    setIsDeleting(true);
    setDeleteLoading(staffToDelete.id);

    try {
      const organization_id = JSON.parse(
        localStorage.getItem("user")
      ).organization_id;

      await axiosPrivate.delete(
        `/organizations/${organization_id}/staff/${staffToDelete.id}`
      );

      setStaffData((prev) =>
        prev.filter((staff) => staff.id !== staffToDelete.id)
      );

      toast.success("Deleted successfully");
      console.log(`Staff member ${staffToDelete.id} deleted successfully`);
      
      // Refresh subscription data after deletion
      await refreshAfterAction();
    } catch (error) {
      console.error("Error deleting staff:", error);
      setError("Failed to delete staff member. Please try again.");
      toast.error("Failed to delete staff member");

      fetchStaffData();
    } finally {
      setDeleteLoading(null);
      setIsDeleting(false);
      setOpenDeleteModal(false);
      setStaffToDelete(null);
    }
  };

  const handleEditStaff = useCallback((staffData) => {
    console.log("Opening edit modal for:", staffData);
    setEditModal({ status: true, data: staffData });
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditModal({ status: false, data: {} });
  }, []);

  const getMenuItems = useCallback(
    (row) => [
      {
        icon: <Eye className="w-4 h-4" />,
        label: "View",
        onClick: () => navigate(`/staff/staff-detail/${row.id}`),
      },
      hasEditPermission && {
        icon: <Pencil className="w-4 h-4" />,
        label: "Edit",
        onClick: () => navigate(`/staff/add-staff/${row.id}`),
      },
      hasDeletePermission && {
        icon: <Trash className="w-4 h-4 text-red-500" />,
        label: deleteLoading === row.id ? "Deleting..." : "Delete",
        onClick: () => {
          setStaffToDelete(row);
          setOpenDeleteModal(true);
        },
        disabled: deleteLoading === row.id,
        className:
          deleteLoading === row.id ? "opacity-50 cursor-not-allowed" : "",
      },
    ],
    [navigate, deleteLoading, handleEditStaff]
  );

  const columns = useMemo(
    () => [
      {
        title: "Staff Name",
        dataIndex: "name",
        key: "name",
        render: (value, record) => (
          <div className="flex items-center space-x-3">
            <Avatar
              name={`${record.firstName} ${record.lastName}`}
              imageUrl={record.image ? record.image : null}
            />
            <div>
              <div className="font-medium text-gray-900">
                {`${record.firstName || ""} ${record.lastName || ""}`.trim() ||
                  "N/A"}
              </div>
              <div className="text-sm text-gray-500">
                #{staffData.findIndex((item) => item.id === record.id) + 1}
              </div>
            </div>
          </div>
        ),
        width: "250px",
      },
      {
        title: "Contact",
        dataIndex: "phone",
        key: "contact",
        render: (phone, record) => (
          <div>
            <div className="text-sm text-gray-900">{phone || "N/A"}</div>
            <div className="text-xs text-gray-500">{record.email || "N/A"}</div>
          </div>
        ),
        width: "200px",
      },
      {
        title: "Department",
        dataIndex: "department_name",
        key: "department",
        render: (department) => {
          if (typeof department === "object" && department?.department) {
            return department.department;
          }
          return department || "N/A";
        },
        width: "150px",
      },
      {
        title: "Role",
        dataIndex: "role_name",
        key: "role",
        render: (role) => {
          if (typeof role === "object" && role?.role) {
            return role.role;
          }
          return role || "N/A";
        },
        width: "120px",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => <StatusBadge status={status || "Active"} />,
        width: "100px",
      },
      {
        title: "Join Date",
        dataIndex: "joinDate",
        key: "joinDate",
        render: (date, record) => {
          const joinDate = date || record.createdAt || record.dateJoined;
          if (joinDate) {
            try {
              return new Date(joinDate).toLocaleDateString();
            } catch (e) {
              return "Invalid Date";
            }
          }
          return "N/A";
        },
        width: "120px",
      },
      {
        title: "Action",
        key: "action",
        width: "80px",
        render: (value, record) => (
          <Menu items={getMenuItems(record)}>
            <button
              className="text-[#ED1C24] hover:text-[#df1a22] font-medium transition-colors duration-200 p-1 rounded hover:bg-gray-50"
              disabled={deleteLoading === record.id}
            >
              •••
            </button>
          </Menu>
        ),
      },
    ],
    [staffData, getMenuItems, deleteLoading]
  );

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return staffData;

    return staffData.filter((row) => {
      const searchableFields = [
        row.firstName,
        row.lastName,
        row.email,
        row.phone,

        typeof row.department === "object"
          ? row.department?.department
          : row.department,

        typeof row.role === "object" ? row.role?.role : row.role,
        row.status,
      ];

      return searchableFields.some(
        (field) =>
          field &&
          field.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [staffData, searchTerm]);

  const handleRowAction = useCallback((record) => {
    console.log(
      `Action clicked for ${record.firstName} ${record.lastName} (${record.id})`
    );
  }, []);

  useSetLocationArray([
    { label: "Staff", link: "" },
    { label: "All Staffs", link: "/staff" },
  ]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  return (
    <Layout>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleDeleteStaff}
        title="Delete Staff"
        message={`Are you sure you want to delete ${staffToDelete?.firstName} ${staffToDelete?.lastName}? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="Delete Staff"
        cancelText="Cancel"
        type="danger"
        icon={<Trash2 className="w-6 h-6" />}
        isLoading={isDeleting}
      />

      <div className="mb-6">
        <h1 className="text-xl font-semibold flex justify-between items-center">
          <span>All Staffs</span>
          <div className="flex gap-x-3 items-center">
            <div className="relative flex items-center">
              <IoSearch className="absolute left-2 text-gray-600 z-10" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 pl-8 py-2 text-base bg-gray-100 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent w-full max-w-xs transition-all duration-200"
              />
            </div>

            <PermissionWrapper module="staff" action="add">
              <button
                onClick={handleAddStaffClick}
                className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
              >
                Add New Staff
              </button>
            </PermissionWrapper>
            <Menu items={buttonItems}>
              <button className="bg-gray-200 text-gray-600 font-normal  rounded-sm px-4 py-2 text-base">
                •••
              </button>
            </Menu>
            {/* </PermissionWrapper> */}
          </div>
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <CustomDatatable
          data={filteredData}
          columns={columns}
          searchable={false}
          pagination={true}
          pageSize={10}
          onRowAction={handleRowAction}
          loading={loading}
          className="border-0"
        />

        {filteredData.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            No staff members found matching "{searchTerm}"
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Staff;
