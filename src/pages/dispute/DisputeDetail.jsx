import Layout from "@/components/common/Layout";
import React, { useEffect, useRef, useState } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
import AddStaffModal from "@/components/staff/AddStaffModal";
import Menu from "@/components/common/Menu";
import { AlertCircle, Eye, Pencil, Trash } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import AddClientModal from "@/components/client/AddClientModal";
import AddVendorModal from "@/components/vendor/AddVendorModal";
import { axiosPrivate } from "@/axios/axiosInstance";
import PermissionWrapper from "@/components/PermissionWrapper";
import { useArray } from "@/context/LocationContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "closed":
        return "bg-green-100 text-green-800 border-green-200";
      case "open":
        return "bg-red-100 text-red-800 border-red-200";
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

const DisputeDetail = () => {
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState({});
  const [error, setError] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { setArray } = useArray();
  const didRun = useRef(false);

  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization ID:", error);
      return null;
    }
  };
  // Fetch ticket data for edit mode
  const organizationId = getOrganizationId();

  const formatDateForInput = (dateString) => {
    if (!dateString) return ["", ""];

    const date = new Date(dateString);

    // Format date as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Format time as HH:MM AM/PM
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const formattedTime = `${displayHours
      .toString()
      .padStart(2, "0")}:${minutes} ${ampm}`;

    return [formattedDate, formattedTime];
  };

  const fetchTicketData = async (ticketId) => {
    setLoading(true);
    try {
      const response = await axiosPrivate(
        `/tickets?organization_id=${organizationId}&limit=20`
      );

      const data = response.data;
      const ticket = data.tickets?.find((t) => t.id === ticketId);

      if (ticket) {
        setTicketData({
          case_id: ticket.case_id || "",
          subject: ticket.subject || "",
          description: ticket.description || "",
          priority: ticket.priority || "Medium",
          category: "Technical", // Not in API response, keeping default
          status: ticket.status || "Open",
          dueDate: ticket.created_at
            ? formatDateForInput(ticket.created_at)[0]
            : "",
          time: ticket.created_at
            ? formatDateForInput(ticket.created_at)[1]
            : "",
          requester: ticket.user_name || "",
          department: "IT", // Not in API response, keeping default
          attachments: [],
        });
      } else {
        setError("Ticket not found");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async () => {
    setDeleteLoading(true);
    const organizationId = JSON.parse(
      localStorage.getItem("user")
    ).organization_id;

    try {
      const response = await axiosPrivate.delete(
        `/tickets/${id}?organization_id=${organizationId}`
      );
      setOpenDeleteModal(false);
      navigate(-1);
      alert("Ticket deleted successfully");
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket: " + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTicketData(id);
  }, [id]);

 
  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (ticketData?.case_id) {
      setArray([
        { label: "Raise a Disputes", link: "/dispute" },
        {
          label: `${ticketData?.case_id ? ticketData?.case_id : "loading..."}`,
          link: -1,
        },
      ]);
    }
  }, [ticketData?.case_id]);
  return (
    <Layout>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}
      <div className="text-xl font-semibold flex justify-between items-center">
        <h1 className="flex gap-x-3 items-center">
          {ticketData?.case_id}
          <span className="bg-red-100 text-xs px-1 rounded-md text-red-800 border-red-200 border">
            {ticketData?.status}
          </span>
        </h1>
        <div className="flex gap-x-3">
          <PermissionWrapper module="support_tickets" action="delete">
            <button
              onClick={() => setOpenDeleteModal(true)}
              className=" text-black font-normal rounded-sm px-4 py-2 text-base"
            >
              Delete
            </button>
          </PermissionWrapper>
          <PermissionWrapper module="support_tickets" action="edit">
            <button
              onClick={() => navigate(`/dispute/add-ticket/${id}`)}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
            >
              Edit
            </button>
          </PermissionWrapper>
        </div>
      </div>

      <div className="mt-10">
        <ul className="space-y-2">
          <li>
            <span className="font-medium">Date: </span>
            {ticketData?.dueDate}
          </li>
          <li>
            <span className="font-medium">Time: </span>
            {ticketData?.time}
          </li>
          <li>
            <span className="font-medium">Subject: </span>
            {ticketData?.subject}
          </li>
          <li>
            <span className="font-medium">Description: </span>
            {ticketData?.description}
          </li>
        </ul>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={deleteTicket}
        title="Delete Ticket"
        message={`Are you sure you want to delete ticket ${ticketData?.case_id}? This action cannot be undone.`}
        confirmText="Delete Ticket"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default DisputeDetail;
