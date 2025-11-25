import Layout from "@/components/common/Layout";
import AddStaffModal from "@/components/staff/AddStaffModal";
import React, { useEffect, useRef, useState } from "react";
import { useArray } from "@/context/LocationContext";
import CustomDataTable from "@/components/common/CustomDatatable";
import { FiEye } from "react-icons/fi";
import ViewLogs from "@/components/staff/ViewLogs";
import { useSetLocationArray } from "@/utils/locationSetter";
import Menu from "@/components/common/Menu";
import AssignAssetModal from "@/components/client/AssignAssetModal";
import AddClientModal from "@/components/client/AddClientModal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AssignAssetsModal from "@/components/department/AssignAssetModal";
import PermissionWrapper from "@/components/PermissionWrapper";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const ClientDetail = () => {
  const [openAssignModal, setOpenAssignModal] = React.useState(false);
  const [transferAssetModalOpen, setTransferAssetModalOpen] =
    React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const navigate = useNavigate();
  const { setArray } = useArray();
  const didRun = useRef(false);
  const location = useLocation();

  const client = location?.state;
  const { clientId } = useParams(); // Get clientId from URL params

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

  // Fetch client details by ID
  const fetchClientDetails = async () => {
    if (!clientId) return;

    setLoading(true);
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        throw new Error("Organization ID not found");
      }
      console.log(organizationId);
      const response = await axios.get(
        `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/clients/${clientId}?organization_id=${organizationId}`
      );

      if (response.data) {
        setClientData(response.data);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
      alert("Failed to fetch client details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete client function
  const handleDeleteClient = async () => {
    if (!clientId || !clientData) return;

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
      // Navigate back to clients list
      navigate("/client");
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

  // Fetch assigned assets for the client
  const fetchAssignedAssets = async () => {
    if (!clientId) return;

    setAssetsLoading(true);
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      const response = await axios.get(
        `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/clients/${clientId}/assets?organization_id=${organizationId}`
      );

      if (response.data && response.data.assignments) {
        setAssignedAssets(response.data.assignments);
      }
    } catch (error) {
      console.error("Error fetching assigned assets:", error);
      setAssignedAssets([]);
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
    fetchAssignedAssets();
  }, [clientId]);

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (client?.clientName) {
      setArray([
        { label: "Clients", link: "/client" },
        { label: `${client?.clientName}`, link: -1 },
      ]);
    }
  }, [client?.clientName]);
  const menuItems = (row) => [
    {
      label: "View",
      onClick: () =>
        navigate(`/asset/asset-detail/${row.asset_id}`, {
          state: row,
        }),
    },
  ];

  const columns = [
    {
      title: "Asset Name",
      key: "assetName",
      dataIndex: "assetName",
      align: "left",
      render: (text, record) => (
        <div className="flex items-center gap-x-2">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <div className="font-medium text-gray-800">{record.asset_name}</div>
            <div className="text-sm text-gray-500">
              {record.asset_id?.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      dataIndex: "category",
      align: "left",
      render: (text, record) => record.asset_category || "N/A",
    },
    {
      title: "Sub-Category",
      key: "subCategory",
      dataIndex: "subCategory",
      align: "left",
      render: (text, record) => record.asset_subcategory || "N/A",
    },
    {
      title: "Assignment ID",
      key: "assignmentId",
      dataIndex: "assignmentId",
      align: "left",
      render: (text, record) => record.id?.slice(0, 8).toUpperCase() || "N/A",
    },
    {
      title: <div className="text-right w-full">Actions</div>,
      key: "view",
      dataIndex: "view",
      align: "right",
      render: (_, record) => (
        <Menu items={menuItems(record)}>
          <span className="flex justify-end">•••</span>
        </Menu>
      ),
    },
  ];

  // Function to handle modal close and refresh data
  const handleEditModalClose = (wasEdited = false) => {
    setEditMode(false);
    // Refresh client data after edit only if client was actually edited
    if (wasEdited) {
      fetchClientDetails();
    }
  };

  // Function to handle assign modal close and refresh assets
  const handleAssignModalClose = (wasAssigned = false) => {
    setOpenAssignModal(false);
    // Refresh assets if assignment was made
    if (wasAssigned) {
      fetchAssignedAssets();
    }
  };

  // Function to handle edit button click
  const handleEditClick = () => {
    setEditMode(true);
  };

  // Format address from client data
  const formatAddress = () => {
    if (!clientData) return "Address not available";

    const addressParts = [
      clientData.addressLine1,
      clientData.addressLine2,
      clientData.landmark,
      clientData.city,
      clientData.state,
      clientData.zipcode,
    ].filter(Boolean); // Remove empty/null values

    return addressParts.join(", ") || "Address not available";
  };

  useSetLocationArray([
    { label: "Clients", link: "/client" },
    { label: clientData?.clientName || "Client Details", link: "" },
  ]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading client details...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Edit Client Modal */}
      <AddClientModal
        open={editMode}
        onOpenChange={handleEditModalClose}
        isEdit={true}
        clientData={clientData}
      />

      <h1 className="text-xl font-semibold flex justify-between">
        {clientData?.clientName || "Client Details"}
        <div className="flex gap-x-3">
          <PermissionWrapper module="clients" action="delete">
            <button
              className="font-normal rounded-sm px-4 py-2 text-base text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setOpenDeleteModal(true)}
              disabled={deleteLoading}
            >
              Delete
            </button>
          </PermissionWrapper>

          <PermissionWrapper module="clients" action="edit">
            <button
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base hover:bg-[#d91b22]"
              onClick={handleEditClick}
            >
              Edit
            </button>
          </PermissionWrapper>

          <AssignAssetsModal
            open={openAssignModal}
            onOpenChange={handleAssignModalClose}
            for="Client"
            clientId={clientId}
          >
            <button className="border border-[#ED1C24] text-[#ED1C24] font-normal bg-[#ED1C2408] rounded-sm px-4 py-2 text-base hover:bg-[#ED1C2415]">
              Assign Assets
            </button>
          </AssignAssetsModal>
        </div>
      </h1>
      <div className="my-10 w-full flex flex-col gap-y-4 justify-center items-center ">
        <div className="flex gap-x-4">
          <img
            className="w-[13rem] h-[12rem] object-cover rounded-md border border-gray-300"
            src={
              clientData?.logo ||
              "https://mir-s3-cdn-cf.behance.net/project_modules/hd/7a3ec529632909.55fc107b84b8c.png"
            }
            alt={clientData?.clientName || "Client Logo"}
          />
          <ul className="flex flex-col  h-full gap-y-3 text-[#1A2947]">
            <li>
              <span className="font-semibold">Client ID:</span>{" "}
              {clientData?.id?.slice(0, 8).toUpperCase() || "N/A"}
            </li>
            <li>
              <span className="font-semibold">POC/Owner Name:</span>{" "}
              {clientData?.ownerName || "N/A"}
            </li>
            <li>
              <span className="font-semibold">Email:</span>{" "}
              {clientData?.email || "N/A"}
            </li>
            <li>
              <span className="font-semibold">Phone:</span>{" "}
              {clientData?.phone || "N/A"}
            </li>

            <li>
              <span className="font-semibold">Address:</span> {formatAddress()}
            </li>
          </ul>
        </div>
        <div className="flex w-full items-center mt-4">
          <hr className="w-full border-gray-400" />
          <button className="text-xl border border-gray-400 whitespace-nowrap bg-gray-200 px-20 py-2 rounded-md  text-gray-700 font-semibold">
            Assets Assigned
          </button>
          <hr className="w-full border-gray-400" />
        </div>
      </div>
      <CustomDataTable
        columns={columns}
        data={assignedAssets}
        loading={assetsLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteClient}
        title="Delete Client"
        message={`Are you sure you want to delete the client "${clientData?.clientName}"? This action cannot be undone.`}
        confirmText="Delete Client"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default ClientDetail;
