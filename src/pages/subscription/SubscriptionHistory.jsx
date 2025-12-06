import Layout from "@/components/common/Layout";
import React, { useEffect, useState } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
import { Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import { axiosPrivate } from "@/axios/axiosInstance";

const SubscriptionHistory = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();

  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.organization_id;
  };

  const fetchSubscriptionHistory = async () => {
    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      const res = await axiosPrivate.get(`/organizations/${organizationId}/subscriptions/history`);
      
      if (res.data && Array.isArray(res.data.data)) {
        const merged = res.data.data.flatMap(record => {
          // Map both old and new data with transaction ID, price, and plan limits
          return [
            // { 
            //   ...record.old_data, 
            //   paypal_transaction_id: record.paypal_transaction_id,
            //   price: record?.price || record.old_data?.price || record.old_data?.salePrice,
            //   no_staff: record.no_staff,
            //   no_assets: record.no_assets,
            //   no_clients: record.no_clients,
            //   no_vendors: record.no_vendors,
            //   durationInDays: record.durationInDays,
            //   action: 'Old' 
            // },
            { 
              ...record.new_data, 
              paypal_transaction_id: record.paypal_transaction_id,
              price: record?.price || record.new_data?.price || record.new_data?.salePrice,
              no_staff: record.no_staff,
              no_assets: record.no_assets,
              no_clients: record.no_clients,
              no_vendors: record.no_vendors,
              durationInDays: record.durationInDays,
              action: 'New' 
            }
          ];
        });

        setSubscriptionHistory(merged);
      }
    } catch (error) {
      console.error("Failed to fetch subscription history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedSubscription(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubscription(null);
  };

  const columns = [
    {
      title: "Subscription Name",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div className="flex flex-col">
          <div className="font-medium text-gray-900 truncate max-w-[180px]" title={record.subscription_name}>
            {record.subscription_name || "N/A"}
          </div>
          <div className="text-sm text-gray-500 truncate">#{record.subscription_number}</div>
        </div>
      ),
      width: "200px",
    },
    {
      title: "Date",
      dataIndex: "start_date",
      key: "start_date",
      render: (value) => new Date(value).toLocaleDateString(),
      width: "120px",
    },
    {
      title: "Renewal Date",
      dataIndex: "renewal_date",
      key: "renewal_date",
      render: (value) => value ? new Date(value).toLocaleDateString() : "N/A",
      width: "140px",
    },
    {
      title: "Status",
      dataIndex: "subscription_status",
      key: "subscription_status",
      render: (value, record) => {
        const status = value || record.status || "Inactive";
        const statusColor = status.toLowerCase() === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {status}
          </span>
        );
      },
      width: "120px",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (value, record) => {
        const price = value || record.salePrice || record.price || "N/A";
        return (
          <div className="text-sm text-gray-900 font-medium">
            {price !== "N/A" ? `$${price}` : "N/A"}
          </div>
        );
      },
      width: "100px",
    },
    {
      title: "Transaction ID",
      dataIndex: "paypal_transaction_id",
      key: "paypal_transaction_id",
      render: (value) => (
        <div className="text-sm text-gray-600 truncate max-w-[130px]" title={value || "N/A"}>
          {value || "N/A"}
        </div>
      ),
      width: "150px",
    },
    {
      title: "View",
      key: "view",
      width: "80px",
      render: (value, record) => (
        <button
          onClick={() => handleViewDetails(record)}
          className="text-[#ED1C24] hover:text-blue-800 p-1"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const handleRowAction = (record) => {
    handleViewDetails(record);
  };

  const filteredData = subscriptionHistory.filter((row) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    // Search across all values in the row (handles renamed or nested fields)
    return Object.values(row).some((val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === "object") {
        try {
          return JSON.stringify(val).toLowerCase().includes(q);
        } catch (e) {
          return false;
        }
      }
      return String(val).toLowerCase().includes(q);
    });
  });

  useEffect(() => {
    fetchSubscriptionHistory();
  }, []);

  useSetLocationArray([
    { label: "Subscription", link: "/subscription" },
    { label: "Subscription History", link: "" },
  ]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between items-center">
        Subscription History
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
      
      <div className="bg-white rounded-lg mt-10 shadow-sm overflow-x-auto">
        <div className="min-w-[900px]">
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
      </div>

      {/* Modal */}
      {modalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {selectedSubscription?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {selectedSubscription.subscription_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    #{selectedSubscription?.id?.substring(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedSubscription?.created_at)?.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Duration in Days:</label>
                  <p className="text-sm text-gray-600">{selectedSubscription?.durationInDays} days</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Price:</label>
                  <p className="text-sm text-gray-600">
                    ${selectedSubscription.salePrice || selectedSubscription.price}
                    {selectedSubscription.originalPrice && selectedSubscription.originalPrice !== selectedSubscription.salePrice && (
                      <span className="ml-2 line-through text-gray-400">
                        ${selectedSubscription.originalPrice}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <p className="text-sm text-gray-600">
                    {selectedSubscription.subscription_status || selectedSubscription.status || "Inactive"}
                  </p>
                </div>

                {selectedSubscription.paypal_transaction_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Transaction ID:</label>
                    <p className="text-sm text-gray-600">
                      {selectedSubscription.paypal_transaction_id}
                    </p>
                  </div>
                )}

                {selectedSubscription.start_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Date:</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedSubscription.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {selectedSubscription.renewal_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Renewal Date:</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedSubscription.renewal_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Description:</label>
                  <p className="text-sm text-gray-600">{selectedSubscription.description}</p>
                </div>

                <div className="pt-3">
                  <label className="text-sm font-medium text-gray-700">Plan Limits:</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                    <div>Staff: {selectedSubscription.no_staff}</div>
                    <div>Assets: {selectedSubscription.no_assets}</div>
                    <div>Clients: {selectedSubscription.no_clients}</div>
                    <div>Vendors: {selectedSubscription.no_vendors}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SubscriptionHistory;