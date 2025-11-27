import Layout from "@/components/common/Layout";
import React, { useEffect, useState } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
import AddStaffModal from "@/components/staff/AddStaffModal";
import Menu from "@/components/common/Menu";
import { Eye, Pencil, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import AddClientModal from "@/components/client/AddClientModal";
import AddVendorModal from "@/components/vendor/AddVendorModal";
import axios from "axios";
import { axiosPrivate } from "@/axios/axiosInstance";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";
import { useLimitCheck } from "@/hooks/useLimitCheck";
import { useSubscription } from "@/context/SubscriptionContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";

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

const Avatar = ({ name, size = "md" }) => {
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

  return (
    <div
      className={`${sizeClasses[size]} bg-[#ED1C24] rounded-full flex items-center justify-center text-white font-medium`}
    >
      {getInitials(name)}
    </div>
  );
};

const Vendors = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openVendorModal, setOpenVendorModal] = useState(false);
  const [vendorsData, setVendorsData] = useState([]);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();
  // const API_BASE_URL = "https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev";
  const ORGANIZATION_ID = JSON.parse(
    localStorage.getItem("user")
  ).organization_id;
  const hasEditPermission = checkPermission("vendors", "edit");
  const hasDeletePermission = checkPermission("vendors", "delete");
  const { checkLimit } = useLimitCheck("vendors");
  const { refreshAfterAction } = useSubscription();

  // Fetch vendors data
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivate.get(
        `/vendors?organization_id=${ORGANIZATION_ID}`
      );

      if (response.data && response.data.vendors) {
        // Transform API data to match component structure
        const transformedData = response.data.vendors.map((vendor) => ({
          id: vendor.id,
          name: vendor.vendorName,
          ownerName: vendor.pocOwnerName,
          email: vendor.email,
          phone: vendor.phone,
          status: vendor.status,
          addressLine1: vendor.addressLine1,
          addressLine2: vendor.addressLine2,
          landmark: vendor.landmark,
          city: vendor.city,
          state: vendor.state,
          zipcode: Number(vendor.zipcode),
          logo: vendor.logo,
          created_at: vendor.created_at,
          updated_at: vendor.updated_at,
          organization_id: vendor.organization_id,
        }));

        setVendorsData(transformedData);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      // You might want to show a toast/notification here
    } finally {
      setLoading(false);
    }
  };

  // Load vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setIsEditMode(true);
    setOpenVendorModal(true);
  };

  const handleAdd = () => {
    if (!checkLimit()) {
      return; // Toast already shown
    }
    setEditingVendor(null);
    setIsEditMode(false);
    setOpenVendorModal(true);
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;
    
    setDeleteLoading(true);
    try {
      await axiosPrivate.delete(
        `/vendors/${vendorToDelete.id}?organization_id=${ORGANIZATION_ID}`
      );

      // Remove from local state
      setVendorsData((prev) =>
        prev.filter((vendor) => vendor.id !== vendorToDelete.id)
      );

      // Refresh subscription data after deletion
      await refreshAfterAction();

      setOpenDeleteModal(false);
      setVendorToDelete(null);
      console.log("Vendor deleted successfully");
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVendorSuccess = (data) => {
    // Refresh the vendors list after successful add/edit
    fetchVendors();

    // You might want to show a success toast here
    console.log("Vendor operation successful:", data);
  };

  const handleVendorError = (error) => {
    console.error("Vendor operation failed:", error);
    // You might want to show an error toast here
  };

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/vendor/vendor-detail/${row.id}`,{
        state:row
      }),
    },
    hasEditPermission && {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: () => handleEdit(row),
    },
    hasDeletePermission && {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => {
        setVendorToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  const columns = [
    {
      title: "Vendor Name",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/vendor/vendor-detail/${record.id}`, { state: record })}
        >
          {record?.logo ? (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={record.logo}
                alt={value}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const next = e.target.nextSibling;
                  if (next) next.style.display = 'flex';
                }}
              />
              <div className="w-8 h-8 bg-[#ED1C24] rounded-full flex items-center justify-center text-white font-medium" style={{display: 'none'}}>
                {value
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || '?'}
              </div>
            </div>
          ) : (
            <Avatar name={value} />
          )}
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              #{record.id.substring(0, 8)}...
            </div>
          </div>
        </div>
      ),
      width: "250px",
    },
    {
      title: "Owner Name",
      dataIndex: "ownerName",
      key: "ownerName",
      width: "150px",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: "200px",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "contact",
      render: (phone, record) => (
        <div>
          <div className="text-sm text-gray-900">{phone}</div>
        </div>
      ),
      width: "150px",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusBadge status={status} />,
      width: "100px",
    },
    {
      title: "Action",
      key: "action",
      width: "80px",
      render: (value, record) => (
        <Menu items={menuItems(record)}>
          <button
            onClick={() => handleRowAction(record)}
            className="text-[#ED1C24] hover:text-blue-900 font-medium"
          >
            •••
          </button>
        </Menu>
      ),
    },
  ];

  const handleRowAction = (record) => {
    console.log(`Action clicked for ${record.name} (${record.id})`);
  };

  const filteredData = vendorsData.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );

  useSetLocationArray([{ label: "Vendors", link: "" }]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        Vendors
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

          <PermissionWrapper module="vendors" action="add">
            <button
              onClick={handleAdd}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
            >
              Add New Vendor
            </button>
          </PermissionWrapper>
        </div>
      </h1>

      <div className="bg-white rounded-lg mt-10 shadow-sm">
        <CustomDatatable
          data={filteredData}
          columns={columns}
          searchable={true}
          pagination={true}
          pageSize={10}
          onRowAction={handleRowAction}
          loading={loading}
        />
      </div>

      {/* Add/Edit Vendor Modal */}
      <AddVendorModal
        open={openVendorModal}
        onOpenChange={setOpenVendorModal}
        isEdit={isEditMode}
        editData={editingVendor}
        organizationId={ORGANIZATION_ID}
        onSuccess={handleVendorSuccess}
        onError={handleVendorError}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setVendorToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${vendorToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete Vendor"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default Vendors;
