import Layout from "@/components/common/Layout";
import React, { useState, useEffect, useRef } from "react";
import { IoSearch } from "react-icons/io5";
import { Eye, Filter, X } from "lucide-react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { useSetLocationArray } from "@/utils/locationSetter";
import { useLocation, useParams } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useArray } from "@/context/LocationContext";

const AssigningHistory = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [assigningHistoryData, setAssigningHistoryData] = useState([]);
  const { id: assignmentId } = useParams();
  const location = useLocation();
  const didRun = useRef(false);
  const { setArray } = useArray();
  const asset = location?.state;
  // Function to format date from API response
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Function to determine if this is the current/active assignment
  const isCurrentAssignment = (index, dataArray) => {
    // The first item (index 0) is the most recent and considered "Present"
    return index === 0;
  };

  // Function to get assigned to display text
  const getAssignedToText = (record) => {
    switch (record.assign_to) {
      case "Department":
        if (
          record.department_allocation_type === "Multiple Users" &&
          record.selected_users?.length > 0
        ) {
          return `Department (${record.selected_users.join(", ")})`;
        }
        return `Department (${
          record.department_allocation_type || "Entire Department"
        })`;
      case "Room":
        return `Room ${
          record.room_name ? "(" + record.room_name + ")" : ""
        }`;
      case "Client":
        return `Client ${
          record.client_name ? "(" + record.client_name + ")" : ""
        }`;
      case "Staff":
        return `Staff ${
          record.staff_name ? "(" + record.staff_name + ")" : ""
        }`;
      default:
        return record.assign_to || "-";
    }
  };

  // Function to get location type
  const getLocationType = (record) => {
    if (record.assign_to === "Room") return "Static";
    if (
      record.assign_to === "Department" ||
      record.assign_to === "Staff" ||
      record.assign_to === "Client"
    )
      return "Dynamic";
    return "-";
  };

  // Function to fetch assignment history
  const fetchAssignmentHistory = async () => {
    if (!assignmentId) return;

    setLoading(true);
    try {
      const response = await axiosPrivate(
        `/assignments/${assignmentId}/history`
      );

      if (response.data.data) {
        // Transform API data to match component structure
        const transformedData = response.data.data.map((item, index) => ({
          id: item.history_id,
          startDate: formatDate(item.original_created_at),
          endDate: isCurrentAssignment(index, response.data.data)
            ? "Present"
            : formatDate(item.action_timestamp),
          assignedType: item.assign_to || "-",
          assignedTo: getAssignedToText(item),
          locationType: getLocationType(item),
          // Additional fields for modal display
          department: item.department_id,
          location: item.location_id,
          room: item.room_id,
          client: item.client_id,
          staff: item.staff_id,
          departmentAllocationType: item.department_allocation_type,
          selectedUsers: item.selected_users,
          actionType: item.action_type,
          actionTimestamp: item.action_timestamp,
          address: "",
          originalRecord: item,
        }));

        setAssigningHistoryData(transformedData);
      }
    } catch (error) {
      console.error("Error fetching assignment history:", error);
      // Keep empty array on error
      setAssigningHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentHistory();
  }, [assignmentId]);

  const columns = [
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: "120px",
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: "120px",
      render: (value) => (
        <span
          className={value === "Present" ? "text-[#ED1C24] font-medium" : ""}
        >
          {value}
        </span>
      ),
    },
    {
      title: "Assigned Type",
      dataIndex: "assignedType",
      key: "assignedType",
      width: "150px",
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      width: "300px",
    },
    {
      title: "Location Type",
      dataIndex: "locationType",
      key: "locationType",
      width: "150px",
    },
    {
      title: "View",
      key: "view",
      width: "80px",
      render: (value, record) => (
        <button
          onClick={() => handleView(record)}
          className="text-[#ED1C24] hover:text-blue-900 p-1 rounded"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const handleView = (record) => {
    setSelectedRecord(record);
  };

  const closeModal = () => {
    setSelectedRecord(null);
  };

  const filteredData = assigningHistoryData.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );

  const renderModalContent = () => {
    if (!selectedRecord) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date:
          </label>
          <p className="text-sm text-gray-900">{selectedRecord.startDate}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date:
          </label>
          <p
            className={`text-sm ${
              selectedRecord.endDate === "Present"
                ? "text-[#ED1C24] font-medium"
                : "text-gray-900"
            }`}
          >
            {selectedRecord.endDate}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action Type:
          </label>
          <p className="text-sm text-gray-900">{selectedRecord.actionType}</p>
        </div>

        {selectedRecord.department && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department ID:
            </label>
            <p className="text-sm text-gray-900">{selectedRecord.department}</p>
          </div>
        )}

        {selectedRecord.departmentAllocationType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Allocation Type:
            </label>
            <p className="text-sm text-gray-900">
              {selectedRecord.departmentAllocationType}
            </p>
          </div>
        )}

        {selectedRecord.selectedUsers &&
          selectedRecord.selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected Users:
              </label>
              <p className="text-sm text-gray-900">
                {selectedRecord.selectedUsers.join(", ")}
              </p>
            </div>
          )}

        {selectedRecord.location && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location ID:
            </label>
            <p className="text-sm text-gray-900">{selectedRecord.location}</p>
          </div>
        )}

        {selectedRecord.room && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room ID:
            </label>
            <p className="text-sm text-gray-900">{selectedRecord.room}</p>
          </div>
        )}

        {selectedRecord.client && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID:
            </label>
            <p className="text-sm text-gray-900">{selectedRecord.client}</p>
          </div>
        )}

        {selectedRecord.staff && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff ID:
            </label>
            <p className="text-sm text-gray-900">{selectedRecord.staff}</p>
          </div>
        )}

        {selectedRecord.address && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address:
            </label>
            <p className="text-sm text-gray-900 leading-relaxed">
              {selectedRecord.address}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignment ID:
          </label>
          <p className="text-sm text-gray-900 break-all">
            {selectedRecord.originalRecord?.assignment_id}
          </p>
        </div>
      </div>
    );
  };

  useSetLocationArray([
    { label: "Assets", link: "/asset" },
    { label: "Asset 1", link: "/asset/asset-detail/123" },
    { label: "Assigning History", link: "" },
  ]);

  
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
        { label: "Assigning History", link: "" },
      ]);
    }
  }, [asset.assetName]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        Assigning History
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
          loading={loading}
        />
      </div>

      {/* Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          ></div>

          {/* Modal content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assignment Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] rounded-full p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">{renderModalContent()}</div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AssigningHistory;
