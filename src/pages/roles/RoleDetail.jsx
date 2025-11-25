import CustomDatatable from "@/components/common/CustomDatatable";
import Layout from "@/components/common/Layout";
import Menu from "@/components/common/Menu";
import AddRoleModal from "@/components/roles/AddRoleModal";
import { useSetLocationArray } from "@/utils/locationSetter";
import { Eye, Pencil, Trash } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { axiosPrivate } from "@/axios/axiosInstance";

const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}
    >
      {status}
    </span>
  );
};

const Avatar = ({ name, size = "md" }) => {
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
      className={`${sizeClasses[size]} bg-[#ED1C24] rounded-full flex items-center justify-center text-white font-medium`}
    >
      {getInitials(name)}
    </div>
  );
};

const RoleDetail = () => {
  const params = useParams(); // Get route parameters
  const id = params.id; // Ensure 'id' matches the route param name
  console.log(id)
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [error, setError] = useState(null);
  const [openEditModal, setOpenEditModal] = useState({ status: false, data: null });

  // Fetch role details and associated staff
  useEffect(() => {
    const fetchRoleDetail = async () => {
      try {
        const organizationId = JSON.parse(localStorage.getItem('user')).organization_id
        setLoading(true);
        const response = await axiosPrivate.get(`/organizations/${organizationId}/roles/${id}`);
        setRoleData(response.data);
        
        // Assuming the API response contains staff data or we need to fetch it separately
        // If staff data is included in the role response:
        if (response.data.staff) {
          setStaffData(response.data.staff);
        } else {
          // If we need to fetch staff data separately, you might need another endpoint
          // For now, using empty array until the actual API structure is confirmed
          setStaffData([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching role details:', err);
        setError('Failed to fetch role details');
        setRoleData(null);
        setStaffData([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoleDetail();
    }
  }, [id]);

  // Update location array when role data is loaded
  useSetLocationArray([
    { label: "Staff", link: "/staff" },
    { label: "Roles", link: "/staff/roles" },
    { label: roleData?.role || "Role Detail", link: "" },
  ]);

  const menuItems = (row) => [
    {
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: () => navigate(`/staff/staff-detail/${row.id}`),
    },
    // {
    //   icon: <Pencil className="w-4 h-4" />,
    //   label: "Edit",
    //   onClick: (e) => {
    //     console.log(row);
    //     setOpenEditModal({ status: true, data: row });
    //   },
    // },
    // {
    //   icon: <Trash className="w-4 h-4 text-red-500" />,
    //   label: "Delete",
    //   onClick: () => alert("Delete clicked"),
    // },
  ];

  const columns = [
    {
      title: "Staff Name",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          <Avatar name={value} />
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">#{record.id}</div>
          </div>
        </div>
      ),
      width: "250px",
    },
    {
      title: "Contact",
      dataIndex: "phone",
      key: "contact",
      render: (phone, record) => (
        <div>
          <div className="text-sm text-gray-900">{phone}</div>
          <div className="text-sm text-gray-500">{record.email}</div>
        </div>
      ),
      width: "200px",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      width: "150px",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: "120px",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusBadge status={status} />,
      width: "100px",
    },
    {
      title: "Join Date",
      dataIndex: "joinDate",
      key: "joinDate",
      render: (date) => date ? new Date(date).toLocaleDateString() : "N/A",
      width: "120px",
    },
    {
      title: "Action",
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
    console.log(`Action clicked for ${record.name} (${record.id})`);
  };

  const filteredData = staffData.filter((row) =>
    columns.some((column) => {
      const value = row[column.dataIndex];
      return (
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  );

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading role details...</div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => navigate('/staff/roles')}
              className="bg-[#ED1C24] text-white px-4 py-2 rounded-md hover:bg-[#df1a22]"
            >
              Back to Roles
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // No role data found
  if (!roleData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-gray-600 mb-4">Role not found</div>
            <button
              onClick={() => navigate('/staff/roles')}
              className="bg-[#ED1C24] text-white px-4 py-2 rounded-md hover:bg-[#df1a22]"
            >
              Back to Roles
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold">{roleData.role}</h1>
            <p className="text-gray-600 mt-1">{roleData.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              {staffData.length} staff member{staffData.length !== 1 ? 's' : ''} assigned
            </div>
          </div>
        
        </div>

    
    
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(roleData.permissions).map(([module, perms]) => (
                <div key={module} className="bg-white rounded-md p-3 border">
                  <div className="font-medium text-sm text-gray-900 mb-2 capitalize">
                    {module}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(perms).map(([action, allowed]) => (
                      <span
                        key={action}
                        className={`text-xs px-2 py-1 rounded-full ${
                          allowed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
       
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 flex justify-between ">
          <h2 className="text-lg font-medium">Assigned Staff</h2>
           <div className="relative flex items-center">
                        <IoSearch className="absolute left-2 text-gray-600 z-10" />
                        <input
                          type="text"
                          placeholder="Search staff..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="px-3 pl-8 py-2 text-base bg-gray-100 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent w-full max-w-xs transition-all duration-200"
                        />
                      </div>
        </div>
        <CustomDatatable
          data={filteredData}
          columns={columns}
          searchable={false}
          pagination={true}
          pageSize={10}
          onRowAction={handleRowAction}
          loading={false}
        />
      </div>
    </Layout>
  );
};

export default RoleDetail;