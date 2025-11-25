import Layout from "@/components/common/Layout";
import AddStaffModal from "@/components/staff/AddStaffModal";
import React, { useEffect, useRef, useState } from "react";
import { useArray } from "@/context/LocationContext";
import CustomDataTable from "@/components/common/CustomDatatable";
import { FiEye } from "react-icons/fi";
import ViewLogs from "@/components/staff/ViewLogs";
import { useNavigate, useParams } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useSetLocationArray } from "@/utils/locationSetter";
import PermissionWrapper from "@/components/PermissionWrapper";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const StaffDetail = () => {
  const { setArray } = useArray();
  const didRun = useRef(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (didRun.current) return;
    setArray((prev) => [...prev]);
    didRun.current = true;
  }, [setArray]);

  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization_id:", error);
      return null;
    }
  };

  const handleDeleteStaff = async () => {
    setDeleteLoading(true);
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        alert("Organization ID not found");
        return;
      }

      await axiosPrivate.delete(`/organizations/${organizationId}/staff/${id}`);
      setOpenDeleteModal(false);
      navigate("/staff");
    } catch (err) {
      console.error("Error deleting staff:", err);
      const msg = err.response?.data?.message || "Failed to delete staff";
      alert(msg);
    } finally {
      setDeleteLoading(false);
    }
  };
  // Fetch staff details
  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        setLoading(true);
        const organizationId = getOrganizationId(); // or however you store it

        if (!organizationId) {
          setError("Organization ID not found in localStorage");
          return;
        }

        const response = await axiosPrivate.get(
          `/organizations/${organizationId}/staff/${id}`
        );

        const data = await response.data.data;
        setStaffData(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching staff details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStaffDetails();
    }
  }, [id]);

  const columns = [
    {
      title: <div className="text-left w-full">Date</div>,
      key: "date",
      dataIndex: "date",
      align: "left",
    },
    {
      title: <div className="text-left w-full">Time</div>,
      key: "time",
      dataIndex: "time",
      align: "left",
    },
    {
      title: <div className="text-left w-full">Activity</div>,
      key: "activity",
      dataIndex: "activity",
      align: "left",
    },
    {
      title: <div className="text-right w-full">View</div>,
      key: "view",
      dataIndex: "view",
      align: "right",
      render: () => (
        <span className="flex justify-end">
          <ViewLogs>
            <FiEye className="text-blue-700 text-lg cursor-pointer" />
          </ViewLogs>
        </span>
      ),
    },
  ];

  const data = [];

   useEffect(() => {
    if (staffData?.firstName && staffData?.lastName) {
      setArray([
        { label: "Staff", link: "/staff" },
        { label: `${staffData?.firstName} ${staffData?.lastName}`, link: "" },
      ]);
    }
  }, [staffData?.firstName, staffData?.lastName, setArray]);
  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading staff details...</div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-lg">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  // No data state
  if (!staffData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Staff not found</div>
        </div>
      </Layout>
    );
  }
  // useSetLocationArray([
  //   { label: "Staff", link: "" },
  //   { label: "All Staffs", link: "/staff" },
  // ]);

  // Format join date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };
  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        {staffData.firstName} {staffData.lastName}
        <div className="flex gap-x-3 ">
          <PermissionWrapper module="staff" action="delete">
            <button onClick={() => setOpenDeleteModal(true)} className="border border-[#ED1C24] text-[#ED1C24] font-normal bg-[#ED1C2408] rounded-sm px-4 py-2 text-base">
              Delete
            </button>
          </PermissionWrapper>

          <PermissionWrapper module="staff" action="edit">
            <button
              onClick={() => navigate(`/staff/add-staff/${id}`)}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
            >
              Edit Staff
            </button>
          </PermissionWrapper>
        </div>
      </h1>

      <div className="my-10 w-full flex flex-col gap-y-4 justify-center items-center ">
        <div className="flex gap-x-4">
          <img
            className="w-[13rem] h-[13rem] object-cover rounded-md"
            src={
              staffData.image ||
              "https://img.freepik.com/free-photo/close-up-portrait-curly-handsome-european-male_176532-8133.jpg?semt=ais_hybrid&w=500"
            }
            alt={staffData.name}
            onError={(e) => {
              e.target.src =
                "https://img.freepik.com/free-photo/close-up-portrait-curly-handsome-european-male_176532-8133.jpg?semt=ais_hybrid&w=500";
            }}
          />
          <ul className="flex flex-col h-full gap-y-3 text-[#1A2947]">
            <li>
              <span className="font-semibold">Staff ID:</span> {staffData.id}
            </li>
            <li>
              <span className="font-semibold">Gender:</span> {staffData.gender}
            </li>
            <li>
              <span className="font-semibold">Email:</span> {staffData.email}
            </li>
            <li>
              <span className="font-semibold">Phone:</span> {staffData.phone}
            </li>
            <li>
              <span className="font-semibold">Department:</span>{" "}
              {staffData.department_name}
            </li>
            <li>
              <span className="font-semibold">Role:</span> {staffData.role_name}
            </li>
            
            {staffData.last_login && (
              <li>
                <span className="font-semibold">Last Login:</span>{" "}
                {formatDate(staffData.last_login)}
              </li>
            )}
          </ul>
        </div>

        <div className="flex w-full items-center mt-4">
          <hr className="w-full border-gray-400" />
          <button className="text-xl border border-gray-400 bg-gray-200 px-20 py-2 rounded-md text-gray-700 font-semibold">
            Logs
          </button>
          <hr className="w-full border-gray-400" />
        </div>
      </div>

      <CustomDataTable columns={columns} data={data} />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteStaff}
        title="Delete Staff"
        message={`Are you sure you want to delete ${staffData?.firstName} ${staffData?.lastName}? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="Delete Staff"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default StaffDetail;
