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
import AddVendorModal from "@/components/vendor/AddVendorModal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Loader2, AlertCircle } from "lucide-react";
import PermissionWrapper from "@/components/PermissionWrapper";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const VendorDetail = () => {
  const [openVendorModal, setOpenVendorModal] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [assetsData, setAssetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { setArray } = useArray();
  const { id: vendorId } = useParams();
  const navigate = useNavigate();
  const didRun = useRef(false);
  const location = useLocation();


  const API_BASE_URL =
    "https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev";
  const ORGANIZATION_ID = JSON.parse(
    localStorage.getItem("user")
  ).organization_id;

  // Fetch vendor details
  const fetchVendorDetails = async () => {
    if (!vendorId) {
      setError("Vendor ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/vendors/${vendorId}?organization_id=${ORGANIZATION_ID}`
      );

      if (response.data) {
        setVendorData(response.data);
        console.log("Vendor details loaded:", response.data);
      } else {
        setError("Vendor not found");
      }
    } catch (err) {
      console.error("Error fetching vendor details:", err);

      if (err.response?.status === 404) {
        setError("Vendor not found");
      } else if (err.response?.status === 401) {
        setError("Unauthorized access");
      } else {
        setError("Failed to load vendor details");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch assets purchased from this vendor
  const fetchVendorAssets = async () => {
    try {
      setAssetsLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/vendors/${vendorId}/assets?organization_id=${ORGANIZATION_ID}`
      );

      if (response.data && Array.isArray(response.data)) {
        setAssetsData(response.data);
        console.log("Vendor assets loaded:", response.data);
      } else {
        setAssetsData([]);
      }
    } catch (err) {
      console.error("Error fetching vendor assets:", err);
      // Set empty array on error, but don't show critical error since vendor details loaded
      setAssetsData([]);
    } finally {
      setAssetsLoading(false);
    }
  };

  // Handle vendor deletion
  const handleDeleteVendor = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/vendors/${vendorId}?organization_id=${ORGANIZATION_ID}`
      );

      setOpenDeleteModal(false);
      navigate("/vendor");
      console.log("Vendor deleted successfully");
    } catch (err) {
      console.error("Error deleting vendor:", err);

      let errorMessage = "Failed to delete vendor";
      if (err.response?.status === 404) {
        errorMessage = "Vendor not found";
      } else if (err.response?.status === 401) {
        errorMessage = "Unauthorized to delete vendor";
      }

      alert(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle successful vendor update
  const handleVendorUpdateSuccess = (updatedData) => {
    fetchVendorDetails();
    console.log("Vendor updated successfully:", updatedData);
  };

  const handleVendorUpdateError = (error) => {
    console.error("Vendor update failed:", error);
  };

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (vendorData?.vendorName) {
      setArray([
        { label: "Vendors", link: "/vendor" },
        {
          label: `${
            vendorData?.vendorName ? vendorData?.vendorName : "loading..."
          }`,
          link: -1,
        },
      ]);
    }
  }, [vendorData?.vendorName]);

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
      fetchVendorAssets();
    }
  }, [vendorId]);

  // Update breadcrumb when vendor data is loaded

  const columns = [
    {
      title: "Asset Name",
      key: "asset_name",
      dataIndex: "asset_name",
      align: "left",
      render: (text, record) => (
        <div className="flex items-center gap-x-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-600">📦</span>
          </div>
          <div>
            <div className="font-medium text-gray-800">{record.asset_name}</div>
            <div className="text-sm text-gray-500">
              #{record.asset_id?.substring(0, 8)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Asset ID",
      key: "asset_id",
      dataIndex: "asset_id",
      align: "left",
      render: (text) => (
        <span className="text-sm text-gray-600">
          {text?.substring(0, 13)}...
        </span>
      ),
    },
    {
      title: "Category",
      key: "asset_category",
      dataIndex: "asset_category",
      align: "left",
      render: (text) => (
        <span className="text-sm text-gray-700">{text || "N/A"}</span>
      ),
    },
    {
      title: "Sub-Category",
      key: "asset_subcategory",
      dataIndex: "asset_subcategory",
      align: "left",
      render: (text) => (
        <span className="text-sm text-gray-700">{text || "N/A"}</span>
      ),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#ED1C24] mx-auto mb-4" />
            <p className="text-gray-600">Loading vendor details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchVendorDetails()}
              className="bg-[#ED1C24] text-white px-4 py-2 rounded-md hover:bg-[#d91b22]"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Format address for display
  const formatAddress = () => {
    const parts = [];
    if (vendorData?.addressLine1) parts.push(vendorData.addressLine1);
    if (vendorData?.addressLine2) parts.push(vendorData.addressLine2);
    if (vendorData?.landmark) parts.push(vendorData.landmark);
    if (vendorData?.city) parts.push(vendorData.city);
    if (vendorData?.state) parts.push(vendorData.state);
    if (vendorData?.zipcode) parts.push(vendorData.zipcode);

    return parts.length > 0 ? parts.join(", ") : "No address provided";
  };

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        {vendorData?.vendorName}
        <div className="flex gap-x-3">
          <PermissionWrapper module="vendors" action="delete">
            <button
              onClick={() => setOpenDeleteModal(true)}
              className="font-normal rounded-sm px-4 py-2 text-base text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </PermissionWrapper>

          <AddVendorModal
            open={openVendorModal}
            onOpenChange={setOpenVendorModal}
            isEdit={true}
            editData={{
              id: vendorData?.id,
              name: vendorData?.vendorName,
              vendorName: vendorData?.vendorName,
              ownerName: vendorData?.pocOwnerName,
              pocOwnerName: vendorData?.pocOwnerName,
              email: vendorData?.email,
              phone: vendorData?.phone,
              addressLine1: vendorData?.addressLine1,
              addressLine2: vendorData?.addressLine2,
              landmark: vendorData?.landmark,
              city: vendorData?.city,
              state: vendorData?.state,
              zipcode: vendorData?.zipcode || "",
              status: vendorData?.status,
              logo: vendorData?.logo,
            }}
            organizationId={ORGANIZATION_ID}
            onSuccess={handleVendorUpdateSuccess}
            onError={handleVendorUpdateError}
          >
            <PermissionWrapper module="vendors" action="edit">
              <button onClick={() => setOpenVendorModal(true)} className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base">
                Edit
              </button>
            </PermissionWrapper>
          </AddVendorModal>
        </div>
      </h1>

      <div className="my-10 w-full flex flex-col gap-y-4 justify-center items-center">
        <div className="flex gap-x-4">
          <img
            className="w-[13rem] h-[12rem] object-cover rounded-md border border-gray-300"
            src={
              vendorData?.logo ||
              "https://mir-s3-cdn-cf.behance.net/project_modules/hd/7a3ec529632909.55fc107b84b8c.png"
            }
            alt={`${vendorData?.vendorName} logo`}
            onError={(e) => {
              e.target.src =
                "https://mir-s3-cdn-cf.behance.net/project_modules/hd/7a3ec529632909.55fc107b84b8c.png";
            }}
          />
          <ul className="flex flex-col h-full gap-y-3 text-[#1A2947]">
            <li>
              <span className="font-semibold">Vendor ID:</span>{" "}
              {vendorData?.id?.substring(0, 8)}...
            </li>
            <li>
              <span className="font-semibold">POC/Owner Name:</span>{" "}
              {vendorData?.pocOwnerName}
            </li>
            <li>
              <span className="font-semibold">Email:</span> {vendorData?.email}
            </li>
            <li>
              <span className="font-semibold">Phone:</span> {vendorData?.phone}
            </li>
            <li>
              <span className="font-semibold">Address:</span> {formatAddress()}
            </li>
          </ul>
        </div>

        <div className="flex w-full items-center mt-4">
          <hr className="w-full border-gray-400" />
          <button className="text-xl border border-gray-400 whitespace-nowrap bg-gray-200 px-20 py-2 rounded-md text-gray-700 font-semibold">
            Assets Purchased ({assetsData.length})
          </button>
          <hr className="w-full border-gray-400" />
        </div>
      </div>

      {assetsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#ED1C24] mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Loading assets...</p>
          </div>
        </div>
      ) : assetsData.length > 0 ? (
        <CustomDataTable
          columns={columns}
          data={assetsData}
          pagination={true}
          pageSize={10}
        />
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <span className="text-4xl">📦</span>
          </div>
          <p className="text-gray-600">
            No assets purchased from this vendor yet
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Assets will appear here once they are purchased from this vendor
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${vendorData?.vendorName}? This action cannot be undone.`}
        confirmText="Delete Vendor"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default VendorDetail;
