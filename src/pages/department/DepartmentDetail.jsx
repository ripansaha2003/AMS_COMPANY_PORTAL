import CustomDatatable from "@/components/common/CustomDatatable";
import Layout from "@/components/common/Layout";
import Menu from "@/components/common/Menu";
import { Eye, Pencil, Trash } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { IoSearch } from "react-icons/io5";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import AssignAssetsModal from "@/components/department/AssignAssetModal";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useArray } from "@/context/LocationContext";

const DepartmentAssets = () => {
  const { setArray } = useArray();
  const didRun = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const { id } = useParams(); // Department ID from URL params
  const navigate = useNavigate();
  const location = useLocation();

  const department = location?.state || {};

  // Fetch department assets
  useEffect(() => {
    const fetchDepartmentAssets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get organization ID from localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        const organizationId = user?.organization_id;

        if (!organizationId || !id) {
          throw new Error("Missing organization ID or department ID");
        }

        const response = await axiosPrivate.get(
          `/organizations/${organizationId}/departments/${id}/assets`
        );

        setAssets(response.data || []);
      } catch (err) {
        console.error("Error fetching department assets:", err);
        setError(err.message || "Failed to fetch department assets");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentAssets();
  }, [id, refresh]);

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/asset/asset-detail/${row.asset_id}`,{
          state: row,
        }),
    },
  ];

  const columns = [
    {
      title: "Asset Name",
      dataIndex: "asset_name",
      key: "asset_name",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <img
            src={
              record.image ||
              "https://static.vecteezy.com/system/resources/previews/003/747/223/non_2x/pc-logo-monogram-with-slash-style-design-template-free-vector.jpg"
            }
            alt="asset"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div>{record.asset_name}</div>
            <div className="text-sm text-gray-500">{record.asset_id}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "asset_category",
      key: "asset_category",
    },
    {
      title: "Sub-Category",
      dataIndex: "asset_subcategory",
      key: "asset_subcategory",
      render: (text) => text || "N/A",
    },
    {
      title: "Assigned To",
      dataIndex: "assigned_to",
      key: "assigned_to",
      render: (_, record) => {
        if (record.department_allocation_type === "Entire Department") {
          return "Entire Department";
        } else if (
          record.selected_users &&
          Array.isArray(JSON.parse(record.selected_users))
        ) {
          return JSON.parse(record.selected_users).join(" | ");
        }
        return "Not Assigned";
      },
    },
    {
      title: <p className="text-center w-full">Actions</p>,
      key: "actions",
      render: (_, record) => (
        <Menu items={menuItems(record)}>
          <button className="text-[#ED1C24] hover:text-blue-900 font-medium text-center w-full">
            •••
          </button>
        </Menu>
      ),
      align: "right",
    },
  ];

  // Filter assets based on search term
  const filteredAssets = assets.filter(
    (asset) =>
      asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_subcategory?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Transform data for the table
  const tableData = filteredAssets.map((asset, index) => ({
    key: asset.id || index,
    ...asset,
  }));

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (department?.department) {
      setArray([
        { label: "Staff", link: "/staff" },
        { label: "Department", link: "/staff/department" },

        { label: `${department?.department}`, link: "" },
      ]);
    }
  }, [department?.department]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading department assets...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        {department.department}
        <div className="flex gap-x-3">
          <div className="relative flex items-center">
            <IoSearch className="absolute left-2 text-gray-600" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 pl-8 py-2 text-base bg-gray-100 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] w-full max-w-xs"
            />
          </div>
          <AssignAssetsModal
            open={openModal}
            for="Department"
            onOpenChange={setOpenModal}
            onSuccess={() => setRefresh((prev) => !prev)}
            departmentId={id}
          >
            <button className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base">
              Assign assets
            </button>
          </AssignAssetsModal>
        </div>
      </h1>

      <div className="bg-white rounded-lg mt-10 shadow-sm">
        <CustomDatatable
          columns={columns}
          data={tableData}
          pagination={false}
        />
      </div>
    </Layout>
  );
};

export default DepartmentAssets;
