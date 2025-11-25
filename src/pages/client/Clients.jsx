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
import axios from "axios";
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

const Clients = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openClientModal, setOpenClientModal] = useState(false);
  const [clientsData, setClientsData] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const navigate = useNavigate();
  const hasEditPermission = checkPermission("clients", "edit");
  const hasDeletePermission = checkPermission("clients", "delete");
  const { checkLimit } = useLimitCheck("clients");
  const { refreshAfterAction } = useSubscription();
  // Get organization ID from localStorage
  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization ID:", error);
      return null;
    }
  };

  // Fetch clients data
  const fetchClients = async () => {
    setLoading(true);
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      const response = await axios.get(
        `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/clients?organization_id=${organizationId}`
      );

      if (response.data && response.data.clients) {
        setClientsData(response.data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      // You can add error notification here
      alert("Failed to fetch clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsEditMode(true);
    setOpenClientModal(true);
  };

  const handleAdd = () => {
    if (!checkLimit()) {
      return; // Toast already shown
    }
    setEditingClient(null);
    setIsEditMode(false);
    setOpenClientModal(true);
  };

  const handleModalClose = () => {
    setOpenClientModal(false);
    setEditingClient(null);
    setIsEditMode(false);
    // Refresh clients list after modal closes
    fetchClients();
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    const clientId = clientToDelete.id;
    setDeleteLoading(true);
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      await axios.delete(
        `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/clients/${clientId}?organization_id=${organizationId}`
      );

      alert("Client deleted successfully!");
      setOpenDeleteModal(false);
      setClientToDelete(null);

      // Refresh subscription data after deletion
      await refreshAfterAction();

      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);

      if (error.response) {
        alert(
          `Error: ${error.response.data.message || "Failed to delete client"}`
        );
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/client/client-detail/${row.id}`,{
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
        setClientToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  const columns = [
    {
      title: "Client Name",
      dataIndex: "clientName",
      key: "clientName",
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          {record?.logo ? (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={record.logo}
                alt={value}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // fallback to initials if image fails to load
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
            <div className="text-sm text-gray-500">#{record.id}</div>
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
      width: "120px",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone, record) => (
        <div>
          <div className="text-sm text-gray-900">{phone}</div>
        </div>
      ),
      width: "200px",
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
    console.log(`Action clicked for ${record.clientName} (${record.id})`);
  };

  const filteredData = clientsData.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );

  useSetLocationArray([{ label: "Clients", link: "" }]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        Clients
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

          <PermissionWrapper module="clients" action="add">
            <button
              onClick={handleAdd}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
            >
              Add New Client
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
          pageSize={5}
          onRowAction={handleRowAction}
          loading={loading}
        />
      </div>

      <AddClientModal
        open={openClientModal}
        onOpenChange={handleModalClose}
        isEdit={isEditMode}
        clientData={editingClient}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setClientToDelete(null);
        }}
        onConfirm={handleDeleteClient}
        title="Delete Client"
        message={`Are you sure you want to delete the client "${clientToDelete?.clientName}"? This action cannot be undone.`}
        confirmText="Delete Client"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default Clients;
