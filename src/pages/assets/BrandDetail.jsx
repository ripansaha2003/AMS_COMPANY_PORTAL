import React, { useEffect, useRef, useState } from "react";
import Layout from "@/components/common/Layout";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
import Menu from "@/components/common/Menu";
import { Eye, Pencil, Trash } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useArray } from "@/context/LocationContext";
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

const BrandDetail = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandData, setBrandData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const ORGANIZATION_ID = JSON.parse(
    localStorage.getItem("user")
  ).organization_id;

  const location = useLocation();
  const didRun = useRef(false);
  const { setArray } = useArray();
  const brand = location?.state;

  useEffect(() => {
    if (id) {
      fetchBrandAssets();
    }
  }, [id]);

  const fetchBrandAssets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosPrivate.get(
        `/organizations/${ORGANIZATION_ID}/brands/${id}/assets`
      );
      setBrandData(response.data.brand);
      setAssets(response.data.brand?.assets || []);
    } catch (err) {
      console.error("Error fetching brand assets:", err);
      setError(err.response?.data?.message || "Failed to fetch brand assets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    
    setDeleteLoading(true);
    try {
      await axiosPrivate.delete(
        `/organizations/${ORGANIZATION_ID}/assets/${assetToDelete.id}`
      );
      // Refresh the assets list
      fetchBrandAssets();
      setOpenDeleteModal(false);
      setAssetToDelete(null);
    } catch (err) {
      console.error("Error deleting asset:", err);
      alert(err.response?.data?.message || "Failed to delete asset");
    } finally {
      setDeleteLoading(false);
    }
  };

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () =>
        navigate(`/asset/asset-detail/${row.id}`, {
          state: row,
        }),
    },
    {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: () => navigate(`/asset/add-asset/${row.id}`),
    },
    {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => {
        setAssetToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  const columns = [
    {
      title: "Asset Name",
      dataIndex: "assetName",
      key: "assetName",
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          {record.primaryImage ? (
            <img
              src={record.primaryImage}
              alt={value}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <AssetIcon assetName={value} />
          )}
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              #{record.id?.substring(0, 8)}
            </div>
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
        <div className="font-medium text-gray-900">
          ${value ? value.toFixed(2) : "0.00"}
        </div>
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

  const filteredData = assets.filter((row) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      row.assetName?.toLowerCase().includes(searchLower) ||
      row.assetNumber?.toLowerCase().includes(searchLower) ||
      row.category?.toString().toLowerCase().includes(searchLower) ||
      row.subCategory?.toString().toLowerCase().includes(searchLower) ||
      row.id?.toLowerCase().includes(searchLower)
    );
  });

  useSetLocationArray([
    { label: "Assets", link: "/asset" },
    { label: "Brands", link: "/asset/brand" },
    { label: brandData?.brand_name || "Brand", link: "" },
  ]);

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (brand?.brandName) {
      setArray([
        { label: "Assets", link: "/asset" },
        { label: "Brands", link: "/asset/brand" },
        { label: `${brand?.brandName}` },
      ]);
    }
  }, [brand?.brandName]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        {brandData?.brand_name || "Brand Details"}
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
        </div>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mt-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg mt-10 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div>Loading assets...</div>
          </div>
        ) : (
          <CustomDatatable
            data={filteredData}
            columns={columns}
            searchable={false}
            pagination={true}
            pageSize={10}
            onRowAction={handleRowAction}
            loading={loading}
          />
        )}
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

export default BrandDetail;
