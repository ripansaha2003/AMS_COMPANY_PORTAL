import CustomDatatable from "@/components/common/CustomDatatable";
import Layout from "@/components/common/Layout";
import { Eye } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import ViewLogs from "@/components/staff/ViewLogs";
import { useLocation } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import { useArray } from "@/context/LocationContext";

const getStoredOrganizationInfo = () => {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return { id: "", name: "" };
    const parsedUser = JSON.parse(rawUser);
    const organization = parsedUser.organization || {};
    return {
      id:
        parsedUser.organization_id ||
        parsedUser.organizationId ||
        organization.id ||
        organization.organization_id ||
        "",
      name:
        organization.name ||
        parsedUser.organization_name ||
        parsedUser.organizationName ||
        "",
    };
  } catch (error) {
    console.error("ERR::PARSE_ORG", error);
    return { id: "", name: "" };
  }
};

const Logs = () => {
  const [data, setData] = useState([]);
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium">{record.user}</span>
          {record.userId && (
            <span style={{ fontSize: 12, color: "#888" }}>{record.userId}</span>
          )}
        </div>
      ),
    },
    {
      title: "Activity",
      dataIndex: "activity",
      key: "activity",
      render: (text) => (
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block",
            maxWidth: 200,
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "View",
      key: "view",
      render: (_, record) => (
        <ViewLogs log={record}>
          <button
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Eye className="w-5 h-5 text-[#4B5FFA]" />
          </button>
        </ViewLogs>
      ),
    },
  ];
  const [loading, setLoading] = useState(false);

  const { setArray } = useArray();
  const location = useLocation();
  const organizationNameFromState = location.state?.organizationName;
  const storedOrgInfo = useMemo(() => getStoredOrganizationInfo(), []);
  const organizationId = storedOrgInfo.id;
  const organizationName = organizationNameFromState || storedOrgInfo.name;

  const getOrganizationLogs = async () => {
    if (!organizationId) {
      console.warn("No organization id found for logs request");
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosPrivate.get(`/${organizationId}/logs`);
      const rawLogs = Array.isArray(res.data?.logs)
        ? res.data.logs
        : Array.isArray(res.data)
        ? res.data
        : [];
      const normalized = rawLogs.map((log) => {
        const timestampValue =
          log.timestamp ||
          log.log_timestamp ||
          (log.log_date || log.logDate
            ? `${log.log_date || log.logDate}T${log.log_time || log.logTime || "00:00:00"}`
            : null);
        const timestamp = timestampValue ? new Date(timestampValue) : null;
        const date = timestamp ? timestamp.toLocaleDateString("en-GB") : log.log_date || "-";
        const time = timestamp
          ? timestamp.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : log.log_time || "-";

        const firstName =
          log.metadata?.firstName ||
          log.user_first_name ||
          log.userFirstName ||
          log.firstName ||
          "";
        const lastName =
          log.metadata?.lastName ||
          log.user_last_name ||
          log.userLastName ||
          log.lastName ||
          "";
        const userIdValue = log.userId || log.user_id || log.user || "";
        const fullName = `${firstName} ${lastName}`.trim();

        return {
          id:
            log.id ||
            log.log_id ||
            `${userIdValue || "log"}-${timestampValue || Date.now()}`,
          organizationId: log.organizationId || log.organization_id || organizationId,
          date,
          time,
          user: fullName || log.user_name || log.userName || userIdValue || "Unknown user",
          userId: userIdValue || "",
          activity: log.description || log.activity || log.action || "-",
          action: log.action || "",
          status: log.metadata?.status || "",
          metadata: log.metadata || {},
          raw: log,
        };
      });

      setData(normalized);
    } catch (error) {
      console.error("ERR::GET_LOGS", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const crumbs = [{ label: "Logs", link: "" }];
    if (organizationName) {
      crumbs.unshift({
        label: organizationName,
        link: "/profile",
      });
    }
    setArray(crumbs);
  }, [organizationName, setArray]);

  useEffect(() => {
    if (organizationId) {
      getOrganizationLogs();
    }
  }, [organizationId]);

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between">Logs</h1>
      <div className="bg-white rounded-lg mt-10 shadow-sm">
        <CustomDatatable
          columns={columns}
          data={data}
          pagination={false}
          loading={loading}
        />
      </div>
    </Layout>
  );
};

export default Logs;
