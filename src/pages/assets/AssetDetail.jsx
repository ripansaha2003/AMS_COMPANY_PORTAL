import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Eye,
  Trash,
  Edit3,
  Download,
  QrCode,
  Users,
  ArrowUpDown,
  FileText,
  Settings,
} from "lucide-react";
import Layout from "@/components/common/Layout";
import CustomDatatable from "@/components/common/CustomDatatable";
import { useSetLocationArray } from "@/utils/locationSetter";
import AssignAssetModal from "@/components/assets/AssignAsset";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import PermissionWrapper from "@/components/PermissionWrapper";
import { useArray } from "@/context/LocationContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const AssetDetail = () => {
  const navigate = useNavigate();
  const { id: assetId } = useParams();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [assignAssetOpen, setAssignAssetOpen] = useState(false);
  const [transferAssetOpen, setTransferAssetOpen] = useState(false);
  const [assetData, setAssetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentId, setAssignmentId] = useState("");
  const [assignmentData, setAssignmentData] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const didRun = useRef(false);
  const { setArray } = useArray();
  const location = useLocation();
  const asset = location?.state;

  // Get organization ID from localStorage
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.organization_id;
  };

  // Fetch asset details
  const fetchAssetDetails = async () => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        setError("Organization ID not found");
        setLoading(false);
        return;
      }

      if (!assetId) {
        setError("Asset ID not found");
        setLoading(false);
        return;
      }

      const response = await axiosPrivate.get(
        `/${organizationId}/assets/${assetId}`
      );
      setAssetData(response.data.data);
      setAssignmentId(
        response.data.data?.assignments.length > 0 &&
          response.data.data?.assignments
          ? response.data.data.assignments[0][0]
          : ""
      );
      setError(null);
    } catch (error) {
      console.error("Error fetching asset details:", error);
      setError("Failed to fetch asset details");
    } finally {
      setLoading(false);
    }
  };
  // Fetch assignment data

  const fetchAssignmentData = async () => {
    if (!assignmentId) return;

    try {
      setAssignmentLoading(true);
      const organizationId = getOrganizationId();
      if (!organizationId) {
        console.error("Organization ID not found");
        return;
      }

      const response = await axiosPrivate.get(`/assignments/${assignmentId}`);
      setAssignmentData(response.data.data);
    } catch (error) {
      console.error("Error fetching assignment data:", error);
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssetDetails();
  }, [assetId]);

  // Default images if none provided
  const defaultImages = [
    "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1429087969512-1e85aab2683d?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1679314213957-909df10381ac?q=80&w=327&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  // Prepare images array with primary image first, then gallery images
  const getAssetImages = () => {
    const images = [];

    // Add primary image first if it exists
    if (assetData?.primaryImage) {
      images.push(assetData.primaryImage);
    }

    // Add gallery images if they exist
    if (assetData?.galleryImage && Array.isArray(assetData.galleryImage)) {
      // Filter out the primary image from gallery to avoid duplicates
      const galleryImages = assetData.galleryImage.filter(
        (img) => img !== assetData.primaryImage
      );
      images.push(...galleryImages);
    }

    // If no images available, use default images
    return images.length > 0 ? images : defaultImages;
  };

  const images = getAssetImages();

  // Asset information for the table
  // Parse the description JSON and transform it for the table
  const getAssetInformation = () => {
    if (!assetData?.description) {
      return [
        {
          labelName: "Label 1",
          labelType: "Single Choice",
          labelInfo: "Lorem Ipsum",
        },
        {
          labelName: "Label 2",
          labelType: "Multi Choice",
          labelInfo: "Lorem Ipsum | Lorem Ipsum | Lorem Ipsum",
        },
        {
          labelName: "Label 3",
          labelType: "Descriptive",
          labelInfo:
            "Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
        {
          labelName: "Label 4",
          labelType: "Dropdown",
          labelInfo: "Lorem Ipsum",
        },
        {
          labelName: "Label 5",
          labelType: "Default",
          labelInfo: "Lorem Ipsum",
        },
      ];
    }

    try {
      const descriptionData = JSON.parse(assetData.description);
      return Object.values(descriptionData).map((item) => ({
        labelName: item.question,
        labelType: item.type,
        labelInfo: Array.isArray(item.answer)
          ? item.answer.join(" | ")
          : item.answer,
      }));
    } catch (error) {
      console.error("Error parsing asset description:", error);
      return [];
    }
  };

  const assetInformation = getAssetInformation();

  const assetColumns = [
    {
      title: "Label Name",
      dataIndex: "labelName",
      key: "labelName",
    },
    {
      title: "Label Type",
      dataIndex: "labelType",
      key: "labelType",
    },
    {
      title: "Label Information",
      dataIndex: "labelInfo",
      key: "labelInfo",
      render: (text) => (
        <div className="max-w-md whitespace-normal break-words">{text}</div>
      ),
    },
  ];

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    console.log("asdasdadsdasdasdasd:",asset)
    if (asset?.assetName || asset?.asset_name) {
      setArray([
        { label: "Assets", link: "/asset" },
        { label: `${asset?.assetName || asset?.asset_name}`, link: "" },
      ]);
    }
  }, [asset?.assetName || asset?.asset_name]);

  // Delete asset handler
  const handleDeleteAsset = async () => {
    setDeleteLoading(true);
    try {
      const organizationId = getOrganizationId();
      await axiosPrivate.delete(`/${organizationId}/assets/${assetId}`);
      alert("Asset deleted successfully!");
      setOpenDeleteModal(false);
      navigate("/asset");
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete asset");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadQRCode = async () => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        alert("Organization ID not found");
        return;
      }

      // Call the QR code generator API
      const response = await axiosPrivate.post(`/assetsQRCodeGenerator_AMS`, {
        assetId: assetId,
      });

      // Get the URL from the response
      const qrCodeUrl = response.data.download_url || response.data.data?.url;

      if (!qrCodeUrl) {
        alert("Failed to generate QR code");
        return;
      }

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `${assetData?.assetName || "asset"}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      alert("Failed to download QR code");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="space-y-4 col-span-1">
              <div className="bg-gray-200 rounded-lg h-72"></div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6 col-span-3">
              <div className="bg-gray-200 rounded-lg h-48"></div>
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => navigate("/asset")}
            className="bg-[#ED1C24] text-white px-4 py-2 rounded"
          >
            Back to Assets
          </button>
        </div>
      </Layout>
    );
  }

  if (!assetData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-gray-600 text-lg">Asset not found</div>
          <button
            onClick={() => navigate("/asset")}
            className="bg-[#ED1C24] text-white px-4 py-2 rounded mt-4"
          >
            Back to Assets
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold flex justify-between text-gray-900 mb-6">
        {assetData.assetName || "Asset"}
        <div className="flex gap-x-3">
          <PermissionWrapper module="assets" action="delete">
            <button
              onClick={() => setOpenDeleteModal(true)}
              className="text-black font-normal rounded-sm px-4 py-2 text-base hover:bg-red-50"
            >
              Delete
            </button>
          </PermissionWrapper>
          <PermissionWrapper module="assets" action="edit">
            <button
              onClick={() => navigate(`/asset/add-asset/${assetId}`)}
              className="border bg-[#ED1C24] text-white font-normal rounded-sm px-4 py-2 text-base"
            >
              Edit
            </button>
          </PermissionWrapper>
          <AssignAssetModal
            setAssignmentId={setAssignmentId}
            assetId={assetId}
            open={assignAssetOpen}
            onOpenChange={setAssignAssetOpen}
          >
            <button
              disabled={!!assignmentId}
              className="border border-[#ED1C24] text-[#ED1C24] font-normal bg-[#ED1C2408] disabled:border-gray-400 disabled:text-gray-600 disabled:bg-gray-100 rounded-sm px-4 py-2 text-base"
            >
              Assign Asset
            </button>
          </AssignAssetModal>
        </div>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="space-y-4 col-span-1">
          <div className="bg-white rounded-lg shadow-sm flex justify-center items-center overflow-hidden">
            <img
              src={images[activeImageIndex]}
              alt="Asset"
              className="w-full h-[18rem] object-cover"
            />
          </div>

          <div className="flex justify-between gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`w-16 h-16 rounded border-2 overflow-hidden ${
                  activeImageIndex === index
                    ? "border-[#ED1C24]"
                    : "border-gray-200"
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {assetData.assetName} (#{assetData.assetNumber})
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 text-gray-900">
                  {assetData.category || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Sub-Category:</span>
                <span className="ml-2 text-gray-900">
                  {assetData.subCategory || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Brand:</span>
                <span className="ml-2 text-gray-900">
                  {assetData.brand || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 text-gray-900">
                  {assetData.location || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cost/Value:</span>
                <span className="ml-2 text-gray-900">
                  ${assetData.value || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Purchase Date:</span>
                <span className="ml-2 text-gray-900">
                  {assetData.dateofbuy
                    ? new Date(assetData.dateofbuy).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Vendor:</span>
                <span className="ml-2 text-gray-900">
                  {assetData.vendor || "N/A"}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-gray-600">Custom Status:</span>
                <span className="ml-2 text-gray-900">
                  {assetData?.customStatus ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <button
              onClick={() =>
                navigate(`/asset/asset-detail/${assetId}/damage-report`, {
                  state: asset,
                })
              }
              className="flex flex-col items-center gap-2 p-4 border bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-600"
            >
              <FileText className="w-7 h-7" />
              <span className="text-sm text-center leading-tight">
                Damage Report
              </span>
            </button>

            <button
              disabled={!assetData?.customStatus}
              onClick={() =>
                navigate(`/asset/asset-detail/${assetId}/custom-status`, {
                  state: assetData,
                })
              }
              className="flex flex-col items-center gap-2 p-4 border bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:text-gray-300 text-gray-600"
            >
              <Settings className="w-7 h-7" />
              <span className="text-sm text-center leading-tight">
                Custom Status
              </span>
            </button>

            <button
              onClick={handleDownloadQRCode}
              className="flex flex-col items-center gap-2 p-4 border bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-600"
            >
              <QrCode className="w-7 h-7" />
              <span className="text-sm text-center leading-tight">
                Download QR code
              </span>
            </button>

            <button
              disabled={!assignmentId}
              onClick={() =>
                navigate(`/asset/asset-detail/${assignmentId}/assign-history`,{
                  state: assetData,
                })
              }
              className="flex flex-col items-center gap-2 p-4 border bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:text-gray-300 text-gray-600"
            >
              <Users className="w-7 h-7" />
              <span className="text-sm text-center leading-tight">
                Assigning history
              </span>
            </button>

            <AssignAssetModal
              open={transferAssetOpen}
              onOpenChange={setTransferAssetOpen}
              assetId={assetId}
              assignmentId={assignmentId}
              setAssignmentId={setAssignmentId}
              initialData={assignmentData || null}
            >
              <button
                disabled={!assignmentId}
                className="flex flex-col items-center gap-2 p-4 border bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:text-gray-300 text-gray-600"
              >
                <ArrowUpDown className="w-7 h-7" />
                <span className="text-sm text-center leading-tight">
                  Transfer asset
                </span>
              </button>
            </AssignAssetModal>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Asset Information
          </h3>
        </div>

        <div className="">
          <CustomDatatable
            data={assetInformation}
            columns={assetColumns}
            searchable={true}
            pagination={false}
            loading={false}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteAsset}
        title="Delete Asset"
        message={`Are you sure you want to delete ${assetData?.assetName}? This action cannot be undone.`}
        confirmText="Delete Asset"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default AssetDetail;
