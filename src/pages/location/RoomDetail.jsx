import React, { useState, useEffect, useRef } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import Layout from "@/components/common/Layout";
import Menu from "@/components/common/Menu";
import { Eye, Pencil, Trash } from "lucide-react";
import { IoSearch } from "react-icons/io5";
import { useSetLocationArray } from "@/utils/locationSetter";
import AssignAssetsModal from "@/components/department/AssignAssetModal";
import AssignDepartmentModal from "@/components/staff/AssignDepartmentModal";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useArray } from "@/context/LocationContext";

const RoomDetail = () => {
  const didRun = useRef(false);
  const { setArray } = useArray();
  const [searchTerm, setSearchTerm] = useState("");
  const [assignModal, setAssignModal] = useState(false);
  const [assignAssetModal, setAssignAssetModal] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id, roomId } = useParams();
  const ORGANIZATION_ID = JSON.parse(
    localStorage.getItem("user")
  ).organization_id;
  const location = useLocation();
  const { location: locationData = {}, room: roomData = {} } = location?.state;

  useEffect(() => {
    fetchRoomAssets();
  }, [id, roomId]);

  const fetchRoomAssets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosPrivate.get(
        `/organizations/${ORGANIZATION_ID}/locations/${id}/rooms/${roomId}/assets`
      );
      setAssets(response.data.data || []);
    } catch (err) {
      console.error("Error fetching room assets:", err);
      setError(err.response?.data?.message || "Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
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
      dataIndex: "asset_name",
      key: "asset_name",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <img
            src={record.image || "https://via.placeholder.com/40"}
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
    },
    {
      title: "Assigned To",
      dataIndex: "assign_to",
      key: "assign_to",
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
      asset.asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assign_to?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (locationData?.name && roomData?.roomName) {
      setArray([
        { label: "Staff", link: "/staff" },
        {
          label: `${locationData?.name}`,
          // link: `/staff/location/${locationData?.id}`,
          link: -1,
        },
        { label: `${roomData?.roomName}`, link: "" },
      ]);
    }
  }, [locationData?.name]);
  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        Room 1
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
          <AssignDepartmentModal
            open={assignModal}
            onOpenChange={setAssignModal}
            locationId={id}
            roomId={roomId}
          >
            <button className="border border-[#ED1C24] text-[#ED1C24] font-normal bg-white rounded-sm px-4 py-2 text-base">
              Assign Department
            </button>
          </AssignDepartmentModal>
          <AssignAssetsModal
            for="Room"
            roomId={roomId}
            locationId={id}
            open={assignAssetModal}
            onOpenChange={setAssignAssetModal}
            onSuccess={fetchRoomAssets}
          >
            <button className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base">
              Assign assets
            </button>
          </AssignAssetsModal>
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
            columns={columns}
            data={filteredAssets}
            pagination={filteredAssets.length > 10}
          />
        )}
      </div>
    </Layout>
  );
};

export default RoomDetail;
