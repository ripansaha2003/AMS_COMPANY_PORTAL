import Layout from "@/components/common/Layout";
import React, { useEffect, useState } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
import AddBrandModal from "@/components/assets/AddBrandModal";
import Menu from "@/components/common/Menu";
import { Eye, Pencil, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import { axiosPrivate } from "@/axios/axiosInstance";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const BrandIcon = ({ brandName, brandLogo, size = "md" }) => {
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

  const [imgError, setImgError] = React.useState(false);

  // Use logo as-is from backend (should be properly formatted base64 with data URI prefix)
  const displayLogo = brandLogo && typeof brandLogo === "string" ? brandLogo : null;

  if (displayLogo && !imgError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative`}>
        <img
          src={displayLogo}
          alt={brandName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        {/* Hidden fallback element kept for accessibility/structure */}
        <div
          className={`${sizeClasses[size]} bg-gray-500 rounded-full flex items-center justify-center text-white font-medium absolute inset-0`}
          style={{ display: "none" }}
        >
          {getInitials(brandName)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-500 rounded-full flex items-center justify-center text-white font-medium`}
    >
      {getInitials(brandName)}
    </div>
  );
};

const Brands = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [openAddBrandModal, setOpenAddBrandModal] = useState(false);
  const [brandsData, setBrandsData] = useState([]);
  const [error, setError] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasEditPermission = checkPermission("assets", "edit");
  const hasDeletePermission = checkPermission("assets", "delete");
  const navigate = useNavigate();

  // Function to fetch brands data
  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get organization ID from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const organizationId = user?.organization_id;

      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/brands`
      );
      console.log(response);
      // Transform the API response to match your component's expected structure
      const transformedData = response.data.brands.map((brand) => ({
        id: brand.brand_id,
        brandName: brand.brand_name,
        logo: brand.logo,
        assetsAssigned: brand.assetsAssigned, // You might need another API call to get this count
      }));

      setBrandsData(transformedData);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError(err.message || "Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async () => {
    if (!brandToDelete) return;
    
    setDeleteLoading(true);
    try {
      setError(null);

      // Get organization ID from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const organizationId = user?.organization_id;

      if (!organizationId) {
        throw new Error("Organization ID not found");
      }

      await axiosPrivate.delete(
        `/organizations/${organizationId}/brands/${brandToDelete.id}`
      );

      // Refresh the brands list after successful deletion
      await fetchBrands();
      setOpenDeleteModal(false);
      setBrandToDelete(null);
    } catch (err) {
      console.error("Error deleting brand:", err);
      setError(err.message || "Failed to delete brand");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fetch brands on component mount
  useEffect(() => {
    fetchBrands();
  }, []);

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () =>
        navigate(`/asset/brand/brand-detail/${row.id}`, {
          state: row,
        }),
    },
    hasEditPermission && {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: () => {
        setOpenEditModal(true);
        setEditData(row);
      },
    },
    hasDeletePermission && {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => {
        setBrandToDelete(row);
        setOpenDeleteModal(true);
      },
    },
  ];

  const columns = [
    {
      title: "Brand Name",
      dataIndex: "brandName",
      key: "brandName",
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          <BrandIcon brandName={value} brandLogo={record.logo} />
          <div className="font-medium text-gray-900">{value}</div>
        </div>
      ),
      width: "300px",
    },
    {
      title: "No of Assets assigned",
      dataIndex: "assetsAssigned",
      key: "assetsAssigned",
      render: (value) => <div className="text-gray-900">{value}</div>,
      width: "200px",
    },
    {
      title: "Actions",
      key: "action",
      width: "100px",
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
    console.log(`Action clicked for ${record.brandName} (${record.id})`);
  };

  const filteredData = brandsData.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );

  useSetLocationArray([
    { label: "Assets", link: "/asset" },
    { label: "Brands", link: "" },
  ]);

  // Function to refresh data after adding/editing a brand
  const handleBrandModalClose = (shouldRefresh = false) => {
    setOpenAddBrandModal(false);
    setOpenEditModal(false);
    if (shouldRefresh) {
      fetchBrands();
    }
  };

  return (
    <Layout>
      <AddBrandModal
        open={openEditModal}
        onOpenChange={(open) => setOpenEditModal(open)}
        onClose={handleBrandModalClose}
        isEditMode={openEditModal}
        editData={editData}
      />

      <h1 className="text-xl font-semibold flex justify-between">
        Brands
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

          <AddBrandModal
            open={openAddBrandModal}
            onOpenChange={(open) => setOpenAddBrandModal(open)}
            onClose={handleBrandModalClose}
          >
            <PermissionWrapper module="assets" action="add">
              <button 
                onClick={() => setOpenAddBrandModal(true)}
                className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
              >
                Add New Brand
              </button>
            </PermissionWrapper>
          </AddBrandModal>
        </div>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
          <button
            onClick={fetchBrands}
            className="text-red-700 underline hover:no-underline"
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
          setBrandToDelete(null);
        }}
        onConfirm={deleteBrand}
        title="Delete Brand"
        message={`Are you sure you want to delete ${brandToDelete?.brandName}? This action cannot be undone.`}
        confirmText="Delete Brand"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default Brands;
