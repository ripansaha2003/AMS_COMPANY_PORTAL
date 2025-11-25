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
import { axiosPrivate } from "@/axios/axiosInstance";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "closed":
        return "bg-green-100 text-green-800 border-green-200";
      case "open":
        return "bg-red-100 text-red-800 border-red-200";
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-purple-100 text-purple-800 border-purple-200";
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

const Dispute = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openClientModal, setOpenClientModal] = useState(false);
  const [ticketsData, setTicketsData] = useState([]);
  const [error, setError] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasEditPermission = checkPermission("support_tickets", "edit");
  const hasDeletePermission = checkPermission("support_tickets", "delete");
  const navigate = useNavigate();

  // Fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const organizationId = JSON.parse(
        localStorage.getItem("user")
      ).organization_id; // You might want to get this from context/props
      const response = await fetch(
        `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/tickets?organization_id=${organizationId}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTicketsData(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError(error.message);
      // Fallback to sample data if API fails
      setTicketsData([
        {
          id: "ST456666",
          case_id: "ST456666",
          status: "Closed",
          created_at: "2023-01-15",
        },
        {
          id: "ST456667",
          case_id: "ST456667",
          status: "Open",
          created_at: "2022-11-20",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Delete ticket function
  const deleteTicket = async () => {
    if (!ticketToDelete) return;
    
    setDeleteLoading(true);
    const organizationId = JSON.parse(
      localStorage.getItem("user")
    ).organization_id;

    try {
      const response = await axiosPrivate.delete(
        `/tickets/${ticketToDelete.id}?organization_id=${organizationId}`
      );

      // Refresh the tickets list
      fetchTickets();
      alert("Ticket deleted successfully");
      setOpenDeleteModal(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket: " + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/dispute/dispute-detail/${row.id}`),
    },
    hasEditPermission && {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: () => {
        navigate(`/dispute/add-ticket/${row.id}`);
      },
    },
    hasDeletePermission && {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => {
        setTicketToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Format time helper
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const columns = [
    {
      title: "Case Id",
      dataIndex: "case_id",
      key: "case_id",
      render: (value, record) => (
        <div className="text-sm text-gray-500">#{record.case_id}</div>
      ),
      width: "140px",
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => formatDate(value),
      width: "100px",
    },
    {
      title: "Time",
      dataIndex: "created_at",
      key: "time",
      render: (value) => formatTime(value),
      width: "100px",
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
    console.log(`Action clicked for ${record.case_id} (${record.id})`);
  };

  const filteredData = ticketsData.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );

  useSetLocationArray([{ label: "Raise a Dispute", link: "" }]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        Disputes
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

          <PermissionWrapper module="support_tickets" action="add">
            <button
              onClick={() => navigate("/dispute/add-ticket")}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
            >
              Add New Ticket
            </button>
          </PermissionWrapper>
        </div>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          Error loading tickets: {error}
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setTicketToDelete(null);
        }}
        onConfirm={deleteTicket}
        title="Delete Ticket"
        message={`Are you sure you want to delete ticket ${ticketToDelete?.case_id}? This action cannot be undone.`}
        confirmText="Delete Ticket"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default Dispute;
