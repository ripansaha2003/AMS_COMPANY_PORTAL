import Layout from "@/components/common/Layout";
import React, { useEffect, useRef, useState } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
// import AddAssetModal from "@/components/assets/AddAssetModal";
import Menu from "@/components/common/Menu";
import { Eye, FilterIcon, Pencil, Trash, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import ImportModal from "@/components/assets/ImportModal";
import { useLocation } from "react-router-dom";
import { useArray } from "@/context/LocationContext";

const CustomStatus = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const location = useLocation();
  const dataSource = location.state.customStatus || [];
  const didRun = useRef(false);
  const { setArray } = useArray();
  const asset = location?.state;
  const navigate = useNavigate();

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/asset/asset-detail/${row.id}`,{
          state: row,
        }),
    },
    {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: () => navigate(`/assets/add-asset/${row.id}`),
    },
    {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: () => alert("Delete clicked"),
    },
  ];

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
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Track Location",
      dataIndex: "trackLocation",
      key: "trackLocation",
      render: (value) => (value ? "Yes" : "No"),
    },
    {
      title: "Office Location Selection",
      dataIndex: "officeLocationSelection",
      key: "officeLocationSelection",
      render: (value) => (value ? "Yes" : "No"),
    },
    {
      title: "Rooms",
      dataIndex: "rooms",
      key: "rooms",
      render: (value) => (value ? "Yes" : "No"),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (value) => (value ? "Yes" : "No"),
    },
    // {
    //   title: "Actions",
    //   key: "action",
    //   width: "80px",
    //   render: (value, record) => (
    //     <Menu items={menuItems(record)}>
    //       <button
    //         onClick={() => handleRowAction(record)}
    //         className="text-[#ED1C24] hover:text-blue-900 font-medium"
    //       >
    //         •••
    //       </button>
    //     </Menu>
    //   ),
    // },
  ];

  const handleRowAction = (record) => {
    console.log(`Action clicked for ${record.assetName} (${record.id})`);
  };

  const filteredData = dataSource.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );



  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (asset?.assetName) {
      setArray([
        { label: "Assets", link: "/asset" },
        { label: `${asset.assetName}`, link: -1 },
        { label: "Custom Status", link: "" },
      ]);
    }
  }, [asset.assetName]);
  return (
    <Layout>
      {/* <AddAssetModal open={openEditModal} onOpenChange={setOpenEditModal} /> */}
      <h1 className="text-xl font-semibold flex justify-between">
        Custom Status
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
    </Layout>
  );
};

export default CustomStatus;
