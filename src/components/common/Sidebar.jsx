import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Package,
  Users,
  Building2,
  CreditCard,
  Bell,
  Gift,
  MessageSquare,
  Wallet,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TbReport } from "react-icons/tb";
import { useArray } from "@/context/LocationContext";
import { useSubscription } from "@/context/SubscriptionContext";

const Sidebar = () => {
  const location = useLocation();
  // const [collapsed, setCollapsed] = useState(false);
  const {setCollapsed, collapsed} = useArray();
  const { hasSubscription } = useSubscription();
  const navigate = useNavigate();
  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "dashboard" },
    { icon: Users, label: "Staffs", path: "staff" },
    { icon: Package, label: "Assets", path: "asset" },
    { icon: Building2, label: "Clients", path: "client" },
    { icon: Users, label: "Vendors", path: "vendor" },
    { icon: CreditCard, label: "Subscriptions", path: "subscription" },
    { icon: MessageSquare, label: "Raise a Disputes", path: "dispute" },
    { icon: TrendingUp, label: "Reports", path: "report" },
    { icon: TbReport, label: "Logs", path: "log" },
    
    
  ];
 function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("roleDetail");
    localStorage.removeItem("user");
    localStorage.removeItem("orgDetail");

    navigate('/')
  }
  return (
    <div
      className={`sticky top-0 h-screen bg-[#F8F8F8] overflow-y-auto overflow-x-hidden flex flex-col transition-all duration-300 ${
        collapsed ? "min-w-[4.5rem] w-[4.5rem]" : "min-w-[17rem] w-[17rem]"
      }`}
    >
      <div className="relative p-6 flex items-center justify-between">
        {!collapsed ? (
          <img
            src="/assets/imgs/auth/logo.png"
            alt="logo"
            className="w-[11rem] transition-all duration-300"
          />
        ) : (
          <div className="flex items-center justify-center w-10 h-10 absolute top-5 right-4 rounded-lg">
            <img
            src="/assets/imgs/auth/logo2.png"
            alt="logo"
            className="w-[11rem] transition-all duration-300"
          />
          </div>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className={`absolute -right-3 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-full shadow p-1 transition-transform duration-300 `}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="flex-1 py-6">
        <nav className="px-2 space-y-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = new RegExp(`/${item.path}(/|$)`, "i").test(
              location.pathname
            );
            // disable these routes visually and functionally
            // keep "log" enabled — only disable heavier report page when subscription missing
            const disabledPaths = ["report"];
            // If no subscription, disable all menu items except subscription page
            const isDisabled = disabledPaths.includes(item.path) || (!hasSubscription && item.path !== "subscription");

            const baseClasses = `flex items-center ${collapsed ? "justify-center" : ""} px-4 py-3 rounded-lg transition-colors duration-200 `;

            if (isDisabled) {
              // Render non-interactive disabled item
              return (
                <div
                  key={index}
                  title="Disabled"
                  aria-disabled="true"
                  className={`${baseClasses} text-gray-400 bg-transparent cursor-not-allowed opacity-60`}
                >
                  <IconComponent className={collapsed ? "w-5 h-5 mx-auto" : "w-5 h-5 mr-0"} />
                  <span
                    className={`font-medium ml-3 transition-all duration-200 ${
                      collapsed ? "opacity-0 hidden w-0 overflow-hidden" : "opacity-100 w-auto"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <Link
                to={`/${item.path}`}
                key={index}
                className={`${baseClasses} ${
                  isActive
                    ? "bg-[#ED1C240F] text-[#ED1C24] border border-[#ED1C24]"
                    : "text-gray-600 hover:bg-[#ED1C240F] cursor-pointer"
                }`}
              >
                <IconComponent className={collapsed ? "w-5 h-5 mx-auto" : "w-5 h-5 mr-0"} />
                <span
                  className={`font-medium ml-3 transition-all duration-200 ${
                    collapsed ? "opacity-0 hidden w-0 overflow-hidden" : "opacity-100 w-auto"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div onClick={logout} className="p-2 border-t border-gray-200">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : ""
          } px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:bg-[#ED1C240F] transition-colors duration-200`}
        >
          <LogOut className="w-5 h-5 mr-0" />
          <span
            className={`font-medium ml-3 transition-all duration-200 ${
              collapsed ? "opacity-0 hidden w-0 overflow-hidden" : "opacity-100 w-auto"
            }`}
          >
            Logout
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
