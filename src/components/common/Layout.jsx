import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { BellDot, ShoppingCart, ArrowLeft } from "lucide-react";
import { axiosPrivate } from "@/axios/axiosInstance";
import LocationBreadcrumb from "./LocationBreadcrumb";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const defaultAvatar = "https://img.freepik.com/free-photo/close-up-portrait-curly-handsome-european-male_176532-8133.jpg?semt=ais_hybrid&w=100";
  const [avatarSrc, setAvatarSrc] = useState(defaultAvatar);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const loadAvatar = () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) return;
        const u = JSON.parse(raw);
        // If organization account, prefer organization.logo
        if (u && (u.accountType === "organization")) {
          const orgLogo = u.organization?.logo || JSON.parse(localStorage.getItem("orgDetail") || "null")?.logo;
          if (orgLogo) {
            setAvatarSrc(orgLogo);
            return;
          }
        }

        // For staff, prefer staff.image then user.image
        const staffImg = u.staff?.image || u.image;
        if (staffImg) {
          setAvatarSrc(staffImg);
          return;
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    };

    loadAvatar();

  const handleUserUpdate = () => loadAvatar();
  window.addEventListener("userUpdated", handleUserUpdate);
  window.addEventListener("storage", handleUserUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  // Track whether user can go back in history and provide a back arrow
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.history) {
      setCanGoBack(window.history.length > 1);
    }

    const onPop = () => {
      if (typeof window !== "undefined" && window.history) {
        setCanGoBack(window.history.length > 1);
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const getOrganizationId = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u.organizationId || u.organization_id || u.organizationId;
    } catch (e) {
      return null;
    }
  };

  const fetchNotifications = async () => {
    const orgId = getOrganizationId();
    if (!orgId) return;
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await axiosPrivate.get(`/organizations/${orgId}/notification`);
      // assume API returns array in res.data.notifications or res.data
      const payload = res.data?.notifications ?? res.data ?? [];
      setNotifications(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifError(err?.response?.data?.message || err.message || "Failed to load notifications");
    } finally {
      setNotifLoading(false);
    }
  };

  const handleBellClick = () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);
    if (willOpen && notifications.length === 0) {
      fetchNotifications();
    }
  };
  return (
    <div className="flex">
      <Sidebar />
      <div className="mx-8 mb-5 flex flex-col w-full">
        <div className="flex gap-x-2 mt-5 mb-4 justify-end min-w-full">
          <div className="relative">
            <div className="bg-gray-100 p-2 rounded-md w-fit cursor-pointer" onClick={handleBellClick}>
              <BellDot />
            </div>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[480px] bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="text-2xl font-semibold text-gray-900">Notifications</div>
                </div>
                <div className="h-96 overflow-auto">
                  {notifLoading ? (
                    <div className="p-6 text-sm text-gray-500">Loading...</div>
                  ) : notifError ? (
                    <div className="p-6 text-sm text-red-500">{notifError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((n, idx) => {
                      const isNotification = (n.announcementType || "").toLowerCase() === "notification";
                      const title = n.title || n.subject || "Notification";
                      const subtitle = n.description || n.message || n.body || "";

                      const created =  n.createdAt || null;

                      const getRelative = (dateStr) => {
                        if (!dateStr) return "";
                        const d = new Date(dateStr);
                        if (isNaN(d)) return "";
                        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
                        if (diff < 60) return `${diff}s ago`;
                        const mins = Math.floor(diff / 60);
                        if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
                        const days = Math.floor(hrs / 24);
                        if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
                        const months = Math.floor(days / 30);
                        if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
                        const years = Math.floor(months / 12);
                        return `${years} year${years > 1 ? 's' : ''} ago`;
                      };

                      return (
                        <div key={idx} className="px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors">
                          <div className="flex gap-4">
                            {/* Icon */}
                           
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                                    {title}
                                  </h4>
                                  {!isNotification && subtitle && (
                                    <p className="text-sm text-gray-500 line-clamp-1">
                                      {subtitle}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Timestamp and Action */}
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {getRelative(created)}
                                  </span>
                                  <button
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                                    onClick={() => {
                                      if (isNotification) {
                                        try {
                                          const route = (n.description || "").trim();
                                          if (route) {
                                            navigate(route);
                                            setNotifOpen(false);
                                          }
                                        } catch (e) {
                                          console.error("Navigation error for notification", e);
                                        }
                                      } else {
                                        setSelectedAnnouncement(n);
                                        setDetailModalOpen(true);
                                        setNotifOpen(false);
                                      }
                                    }}
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Announcement Detail Modal */}
          <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) { setSelectedAnnouncement(null); } setDetailModalOpen(open); }}>
            <DialogContent className="sm:max-w-lg bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {selectedAnnouncement?.title || selectedAnnouncement?.subject || "Announcement"}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedAnnouncement?.description || selectedAnnouncement?.message || ""}
                </div>
                {selectedAnnouncement && (selectedAnnouncement.attachment || (selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0)) && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Attachments</div>
                    {(selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0) ? (
                      selectedAnnouncement.attachments.map((a, i) => (
                        <a 
                          key={i} 
                          className="inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors mb-2"
                          href={a} 
                          target="_blank" 
                          rel="noreferrer"
                          download
                        >
                          Download
                        </a>
                      ))
                    ) : (
                      <a 
                        className="inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                        href={selectedAnnouncement.attachment} 
                        target="_blank" 
                        rel="noreferrer"
                        download
                      >
                        Download
                      </a>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <img
            onClick={() => navigate("/profile")}
            className="w-10 h-10 object-cover rounded-md cursor-pointer"
            src={avatarSrc}
            alt="User avatar"
            onError={(e) => {
              e.currentTarget.src = defaultAvatar;
            }}
          />
        </div>
        <div className="flex gap-x-5 items-center">
          {canGoBack && (
            <ArrowLeft onClick={() => navigate(-1)} className="w-5 h-5 cursor-pointer" />
          )}
          <LocationBreadcrumb />
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Layout;
