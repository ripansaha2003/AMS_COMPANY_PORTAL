import React, { useEffect, useState } from "react";
import Layout from "@/components/common/Layout";
import { useSetLocationArray } from "@/utils/locationSetter";
import { MoreVertical } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  useSetLocationArray([{ label: "Dashboard", link: "" }]);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get organization ID from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const organizationId = user?.organization_id;

      if (!organizationId) {
        console.error("Organization ID not found");
        setLoading(false);
        return;
      }

      const response = await axiosPrivate.get(
        `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/${organizationId}/dashboard`
      );
      
      setDashboardData(response.data);
      console.log("response.data", response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  // Transform API metrics data into stat cards format
  const getStatsFromMetrics = () => {
    if (!dashboardData?.metrics) return [];

    const { organization_assets, clients, vendors } = dashboardData.metrics;

    const stats = [];

    // Organization Assets
    if (organization_assets) {
      stats.push({
        id: 1,
        title: "Total Assets",
        value: organization_assets.total?.toString() || "0",
        change: `${organization_assets.deviation_percentage >= 0 ? '+' : ''}${organization_assets.deviation_percentage || 0}%`,
        changeType: organization_assets.trend || "up",
        period: "vs last month",
      });
    }

    // Clients
    if (clients) {
      stats.push({
        id: 2,
        title: "Total Clients",
        value: clients.total?.toString() || "0",
        active: clients.active,
        change: `${clients.deviation_percentage >= 0 ? '+' : ''}${clients.deviation_percentage || 0}%`,
        changeType: clients.trend || "up",
        period: "vs last month",
      });
    }

    // Vendors
    if (vendors) {
      stats.push({
        id: 3,
        title: "Total Vendors",
        value: vendors.total?.toString() || "0",
        active: vendors.active,
        change: `${vendors.deviation_percentage >= 0 ? '+' : ''}${vendors.deviation_percentage || 0}%`,
        changeType: vendors.trend || "up",
        period: "vs last month",
      });
    }

    return stats;
  };

  // Transform API recent_updates into display format
  const getRecentUpdates = () => {
    if (!dashboardData?.recent_updates) return [];

    const updates = [];
    let idCounter = 1;

    // Clients
    dashboardData.recent_updates.clients?.forEach((client) => {
      updates.push({
        id: idCounter++,
        icon: "👤",
        title: client.clientName || "Client",
        description: "New client added",
        timestamp: new Date(client.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
      });
    });

    // Vendors
    dashboardData.recent_updates.vendors?.forEach((vendor) => {
      updates.push({
        id: idCounter++,
        icon: "🏪",
        title: vendor.vendorName,
        description: `${vendor.pocOwnerName} - ${vendor.email}`,
        timestamp: new Date(vendor.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
      });
    });

    // Assignments
    dashboardData.recent_updates.assignments?.forEach((assignment) => {
      const assignType = assignment.assign_to || "Unknown";
      updates.push({
        id: idCounter++,
        icon: "📋",
        title: `Asset Assignment`,
        description: `Assigned to ${assignType}`,
        timestamp: new Date(assignment.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
      });
    });

    return updates;
  };

  const StatCard = ({ stat }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold text-gray-900 mb-2">
              {stat.active !== undefined ? stat.active : stat.value}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  stat.changeType === "up"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.changeType === "up" ? "↑" : "↓"} {stat.change}
              </span>
              <span className="text-gray-500">{stat.period}</span>
            </div>
          </div>
          
          {/* Graph Image */}
          <div className="ml-4">
            <img
              src={
                stat.changeType === "up"
                  ? "/assets/imgs/organization/up-graph.png"
                  : "/assets/imgs/organization/down-graph.png"
              }
              alt={stat.changeType === "up" ? "Upward trend" : "Downward trend"}
              className="w-16 h-12 object-contain "
            />
          </div>
        </div>
      </div>
    );
  };

  const RecentUpdateItem = ({ update }) => {
    return (
      <div className="flex items-start gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{update.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {update.title}
          </h4>
          <p className="text-sm text-gray-600">{update.description}</p>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {update.timestamp}
        </span>
      </div>
    );
  };

  return (
    <Layout loading={loading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getStatsFromMetrics().map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        {/* Recent Updates */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Updates
            </h2>
            <button
              onClick={() => navigate("/asset")}
              className="px-4 py-2 bg-[#ED1C24] text-white text-sm font-medium rounded-md hover:bg-[#df1a22] transition-colors"
            >
              Add New Assets
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {getRecentUpdates().length > 0 ? (
              getRecentUpdates().map((update) => (
                <RecentUpdateItem key={update.id} update={update} />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent updates available
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
