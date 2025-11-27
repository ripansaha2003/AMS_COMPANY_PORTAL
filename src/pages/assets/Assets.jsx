import Layout from "@/components/common/Layout";
import React, { useEffect, useState } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
// import AddAssetModal from "@/components/assets/AddAssetModal";
import Menu from "@/components/common/Menu";
import { Eye, FilterIcon, Pencil, Trash, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import ImportModal from "@/components/assets/ImportModal";
import { axiosPrivate } from "@/axios/axiosInstance";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";
import { useLimitCheck } from "@/hooks/useLimitCheck";
import { useSubscription } from "@/context/SubscriptionContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const AssetIcon = ({ assetName, size = "md" }) => {
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
      className={`${sizeClasses[size]} bg-orange-500 rounded-full flex items-center justify-center text-white font-medium`}
    >
      {getInitials(assetName)}
    </div>
  );
};

const Assets = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [assetsData, setAssetsData] = useState([]);
  const [error, setError] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const hasEditPermission = checkPermission("assets", "edit");
  const hasDeletePermission = checkPermission("assets", "delete");
  const { checkLimit } = useLimitCheck("assets");
  const { refreshAfterAction } = useSubscription();
  const navigate = useNavigate();

  const handleAddAssetClick = () => {
    if (checkLimit()) {
      navigate("/asset/add-asset");
    }
  };

  // Fetch assets data from API
  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get organization ID from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organization_id;

      if (!organizationId) {
        throw new Error("Organization ID not found in user data");
      }

      // Make API call
      const response = await axiosPrivate.get(`/${organizationId}/assets`);

      setAssetsData(response.data.data || []);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError(err.message || "Failed to fetch assets");
      // Optionally set empty array or keep existing data
      setAssetsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/asset/asset-detail/${row.id}`, { state: row }),
    },
    hasEditPermission && {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: () => navigate(`/asset/add-asset/${row.id}`),
    },
    hasDeletePermission && {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => {
        setAssetToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  const handleDelete = async () => {
    if (!assetToDelete) return;
    
    setDeleteLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organization_id;

      await axiosPrivate.delete(`/${organizationId}/assets/${assetToDelete.id}`);

      // Refresh the data after successful deletion
      await fetchAssets();
      setOpenDeleteModal(false);
      setAssetToDelete(null);
    } catch (err) {
      console.error("Error deleting asset:", err);
      alert("Failed to delete asset. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const buttonItems = [
    {
      label: "Categories",
      onClick: () => navigate(`/assets/categories`),
    },
    {
      label: "Brands",
      onClick: () => navigate(`/assets/brands`),
    },
    {
      label: "Locations",
      onClick: () => navigate(`/assets/locations`),
    },
    {
      label: "Reports",
      onClick: () => navigate(`/assets/reports`),
    },
  ];

  const columns = [
    {
      title: "Asset Name",
      dataIndex: "assetName",
      key: "assetName",
      render: (value, record) => (
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/asset/asset-detail/${record.id}`, { state: record })}
        >
          {record?.primaryImage ? (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={record?.primaryImage}
                alt={value}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // fallback to initials if image fails
                  e.target.style.display = 'none';
                  const next = e.target.nextSibling;
                  if (next) next.style.display = 'flex';
                }}
              />
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium" style={{display: 'none'}}>
                {value
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || '?'}
              </div>
            </div>
          ) : (
            <AssetIcon assetName={value} />
          )}
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">#{record.id}</div>
          </div>
        </div>
      ),
      width: "200px",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      width: "120px",
    },
    {
      title: "Asset Number",
      dataIndex: "assetNumber",
      key: "assetNumber",
      width: "150px",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: "140px",
    },
    {
      title: "Sub-Category",
      dataIndex: "subCategory",
      key: "subCategory",
      width: "150px",
    },
    {
      title: "Actions",
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
    console.log(`Action clicked for ${record.assetName} (${record.id})`);
  };

  const filteredData = assetsData?.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );

  useSetLocationArray([{ label: "Assets", link: "" }]);

  return (
    <Layout>
      {/* <AddAssetModal open={openEditModal} onOpenChange={setOpenEditModal} /> */}
      <h1 className="text-xl font-semibold flex justify-between">
        Assets
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
          {/* <button className="bg-gray-100 px-3 rounded-sm text-gray-600">
            <FilterIcon className="h-5 w-5" />
          </button> */}

          <ImportModal open={openImportModal} onOpenChange={setOpenImportModal}>
            <button className="bg-gray-100 px-3 rounded-sm text-gray-600">
              <UploadCloud className="h-5 w-5" />
            </button>
          </ImportModal>
          <button
            onClick={() => navigate("/asset/brand")}
            className="border border-[#ED1C24] text-[#ED1C24] font-normal bg-white rounded-sm px-4 py-2 text-base"
          >
            Brands
          </button>
          <PermissionWrapper module="assets" action="add">
            <button
              onClick={handleAddAssetClick}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
            >
              Add New Asset
            </button>
          </PermissionWrapper>
        </div>
      </h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
          <p>Error: {error}</p>
          <button
            onClick={fetchAssets}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setAssetToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete ${assetToDelete?.assetName}? This action cannot be undone.`}
        confirmText="Delete Asset"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default Assets;
