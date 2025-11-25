import { axiosPrivate } from "@/axios/axiosInstance";
import CustomDatatable from "@/components/common/CustomDatatable";
import Layout from "@/components/common/Layout";
import Menu from "@/components/common/Menu";
import PermissionWrapper from "@/components/PermissionWrapper";
import AddRoomModal from "@/components/staff/AddRoomModal";
import { useArray } from "@/context/LocationContext";
import { useSetLocationArray } from "@/utils/locationSetter";
import { checkPermission } from "@/utils/permissions";
import { Eye, Edit } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { MdOutlineMeetingRoom } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const Rooms = () => {
  // Breadcrumbs
  // useSetLocationArray([
  //   { label: "Staff", link: "/staff" },
  //   { label: "Location 1", link: "/staff/location" },
  //   { label: "Rooms", link: "" },
  // ]);

  const [roomModal, setRoomModal] = React.useState(false);
  const didRun = useRef(false);
  const { setArray } = useArray();
  const [editingRoom, setEditingRoom] = useState(null);
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { id } = useParams(); // This is locationId from URL
  const hasEditPermission = checkPermission("staff", "edit");
  const location = useLocation();
  const locationData = location?.state;
  // Handler functions for modal
  const handleAddNewRoom = () => {
    setEditingRoom(null); // Clear any existing room data
    setRoomModal(true); // Open modal in create mode
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room); // Set room data for editing
    setRoomModal(true); // Open modal in edit mode
  };

  const handleModalClose = () => {
    setRoomModal(false);
    setEditingRoom(null); // Clear editing room when closing
  };

  const handleRoomSuccess = (roomData) => {
    // Refresh the rooms list after successful add/edit
    getOrganizationRooms();

    // Show success message (you can add toast notification here)
    console.log(
      editingRoom ? "Room updated successfully!" : "Room added successfully!"
    );
  };

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () =>
        navigate(`/staff/location/${id}/room/${row.id}`, {
          state: { location: locationData, room: row },
        }),
    },
    hasEditPermission && {
      icon: <Edit className="w-4 h-4" />,
      label: "Edit",
      onClick: () => handleEditRoom(row),
    },
  ];

  // Table columns as per the image
  const columns = [
    {
      title: "Room Name",
      dataIndex: "roomName",
      key: "roomName",
      width: "60%",
      render: (_, record) => (
        <div className="flex gap-x-2 items-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-300">
            <MdOutlineMeetingRoom size={20} className="text-gray-600" />
          </span>
          <span>{record.roomName}</span>
        </div>
      ),
    },
    {
      title: "Department Assigned",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            status === "active"
              ? "bg-green-100 text-green-800"
              : status === "inactive"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
      ),
    },
    {
      title: "No. of assets Assigned",
      dataIndex: "assets",
      key: "assets",
      render: (assets) => assets || 0,
    },
    {
      title: "Action",
      key: "action",
      width: "80px",
      render: (value, record) => (
        <Menu items={menuItems(record)}>
          <button className="text-[#ED1C24] hover:text-blue-900 font-medium">
            •••
          </button>
        </Menu>
      ),
    },
  ];

  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization_id:", error);
      return null;
    }
  };

  const getOrganizationRooms = async () => {
    try {
      setLoading(true);
      const organizationId = getOrganizationId();

      if (!organizationId) {
        console.error("No organization ID found");
        return;
      }

      const res = await axiosPrivate.get(
        `/organizations/${organizationId}/locations/${id}/rooms`
      );
      console.log("response", res);

      if (res.status === 200) {
        // Transform data if needed to match your table structure
        const transformedData = res.data.data.map((room, index) => ({
          ...room,
          key: room.id || index,
          roomName: room.roomName,
          department: room.department,
          assets: room.assets || 0, // Add default if not provided by API
        }));
        setRoomData(transformedData);
      }
    } catch (error) {
      console.error("ERR::GET", error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      getOrganizationRooms();
    }
  }, [id]);

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  useEffect(() => {
    if (locationData.name) {
      setArray([
        { label: "Staff", link: "/staff" },
        { label: `${locationData.name}`, link: "/staff/location" },
        { label: "Rooms", link: "" },
      ]);
    }
  }, [locationData.name]);

  return (
    <Layout>
      <div className="mx-auto">
        <h1 className="text-xl font-semibold flex justify-between">
          Rooms
          <PermissionWrapper module="staff" action="add">
            <button
              onClick={handleAddNewRoom}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base hover:bg-[#d91b22] transition-colors"
            >
              Add New Room
            </button>
          </PermissionWrapper>
        </h1>

        <div className="bg-white rounded-lg mt-10 shadow-sm">
          <CustomDatatable
            data={roomData}
            columns={columns}
            pagination={false}
            loading={loading}
          />
        </div>

        {/* Add Room Modal */}
        <AddRoomModal
          open={roomModal}
          onOpenChange={handleModalClose}
          axiosPrivate={axiosPrivate}
          organizationId={getOrganizationId()}
          locationId={id} // id from params is locationId
          roomData={editingRoom} // null for adding, room object for editing
          onSuccess={handleRoomSuccess}
        />
      </div>
    </Layout>
  );
};

export default Rooms;
