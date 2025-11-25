import Layout from "@/components/common/Layout";
import React, { useEffect, useRef, useState } from "react";
import CustomDatatable from "@/components/common/CustomDatatable";
import { IoSearch } from "react-icons/io5";
import Menu from "@/components/common/Menu";
import { Eye, FilterIcon, Pencil, Trash, UploadCloud } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSetLocationArray } from "@/utils/locationSetter";
import ImportModal from "@/components/assets/ImportModal";
import ReportDamageModal from "@/components/assets/ReportDamageModal";
import DamageDetailModal from "@/components/assets/DamageDetailModal";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useArray } from "@/context/LocationContext";

const DamageReport = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openReportModal, setOpenReportModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const didRun = useRef(false);
  const { setArray } = useArray();
  const asset = location?.state;

  // Get organization_id from localStorage
  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.organization_id;
    } catch (error) {
      console.error("Error getting organization_id:", error);
      return null;
    }
  };
  const { id: assetId } = useParams();

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

  // Fetch damage reports from API
  const fetchDamageReports = async () => {
    const organizationId = getOrganizationId();
    if (!organizationId) {
      console.error("Organization ID not found");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosPrivate.get(
        `/${organizationId}/damage-reports/asset/${assetId}`
      );
      setDataSource(response.data.data || []);
    } catch (error) {
      console.error("Error fetching damage reports:", error);
      // Fallback to empty array or show error message
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDamageReports();
  }, []);

  const columns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (created_at) => {
        // Format date if it's in ISO format
        if (created_at) {
          return new Date(created_at).toLocaleDateString("en-GB");
        }
        return created_at;
      },
    },
    {
      title: "Damage Name",
      dataIndex: "damageName",
      key: "damageName",
    },
    {
      title: "Reported By",
      dataIndex: "reportedBy",
      key: "reportedBy",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Gallery",
      dataIndex: "gallery",
      key: "gallery",
      render: (images) => {
        if (!images || !Array.isArray(images) || images.length === 0) {
          return <span className="text-gray-400">No images</span>;
        }

        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            {images.slice(0, 5).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`damage-${idx}`}
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid white",
                  marginLeft: idx === 0 ? 0 : -10,
                  zIndex: images.length - idx,
                }}
              />
            ))}
            {images.length > 5 && (
              <span className="ml-2 text-xs text-gray-500">
                +{images.length - 5} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "action",
      width: "80px",
      render: (value, record) => (
        <DamageDetailModal
          // open={openDetailModal}
          onOpenChange={setOpenDetailModal}
          reportData={selectedReport}
        >
          <button
            onClick={() => handleRowAction(record)}
            className="text-[#ED1C24] hover:text-blue-900 font-medium"
          >
            <Eye className="w-4 h-4" />
          </button>
        </DamageDetailModal>
      ),
    },
  ];

  const handleRowAction = (record) => {
    setSelectedReport(record);
    setOpenDetailModal(true);
    console.log(`Action clicked for ${record.damageName} (${record.id})`);
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

  // Handle successful report creation
  const handleReportCreated = () => {
    fetchDamageReports(); // Refresh the data
  };

 

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
        { label: "Damage Report", link: "" },
      ]);
    }
  }, [asset.assetName]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">
        Damage Report
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
          <ReportDamageModal
            assetId={assetId}
            open={openReportModal}
            onOpenChange={setOpenReportModal}
            onSuccess={handleReportCreated}
          >
            <button className="text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base">
              Report a Damage
            </button>
          </ReportDamageModal>
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

export default DamageReport;
