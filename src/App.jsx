import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import { usePermissions } from "./hooks/usePermissions";
import { isAuthenticated } from "./utils/permissions";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import SubscriptionGuard from "./components/SubscriptionGuard";
import FreeTrialModal from "./components/common/FreeTrialModal";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Terms from "./pages/legal/Terms";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import Staff from "./pages/staffs/Staff";
import AddStaff from "./pages/staffs/AddStaff";
import StaffDetail from "./pages/staffs/StaffDetail";
import Roles from "./pages/roles/Roles";
import RoleDetail from "./pages/roles/RoleDetail";
import Department from "./pages/department/Department";
import DepartmentDetail from "./pages/department/DepartmentDetail";
import Location from "./pages/location/Location";
import Rooms from "./pages/location/Rooms";
import RoomDetail from "./pages/location/RoomDetail";
import WorkingHours from "./pages/working-hours/WorkingHours";
import Holidays from "./pages/working-hours/Holiday";
import Assets from "./pages/assets/Assets";
import Brands from "./pages/assets/Brands";
import BrandDetail from "./pages/assets/BrandDetail";
import AddAsset from "./pages/assets/AddAsset";
import AssetDetail from "./pages/assets/AssetDetail";
import AssigningHistory from "./pages/assets/AssignHistory";
import CustomStatus from "./pages/assets/CustomStatus";
import DamageReport from "./pages/assets/DamageReport";
import Clients from "./pages/client/Clients";
import ClientDetail from "./pages/client/ClientDetail";
import Vendors from "./pages/vendor/Vendor";
import VendorDetail from "./pages/vendor/VendorDetail";
import Dispute from "./pages/dispute/Dispute";
import DisputeDetail from "./pages/dispute/DisputeDetail";
import AddTicket from "./pages/dispute/AddTicket";
import Subscription from "./pages/subscription/Subscription";
import SubscriptionHistory from "./pages/subscription/SubscriptionHistory";
import PaymentSuccess from "./pages/subscription/PaymentSuccess";
// import Logs from "./pages/log/Logs";
import ProfileForm from "./pages/profile/ProfileForm";
import Dashboard from "./pages/dashboard/Dashboard";
import Logs from "./pages/log/Logs";

const AppRoutes = () => {
  const { loading, hasAnyPermission, isSuperAdmin } = usePermissions();

  // Show loading only when checking permissions for authenticated users
  if (loading && isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // Only check permissions for authenticated users (skip for login/signup)
  const authenticated = isAuthenticated();
  console.log("Is authenticated:", authenticated);
  console.log("Has any permissions:", hasAnyPermission());
  console.log("Is superadmin:", isSuperAdmin);

  // If user is authenticated but has no permissions and is not superadmin
  if (authenticated && !hasAnyPermission() && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Permissions
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have any permissions assigned to your role.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator to get proper access.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('roleDetail');
              window.location.href = '/';
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    hi
      <Routes>
        {/* Auth routes - public routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute publicRoute={true}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <ProtectedRoute publicRoute={true}>
              <Signup />
            </ProtectedRoute>
          }
        />

        {/* Public legal pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Subscription routes - accessible without subscription but requires authentication */}
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription/history"
          element={
            <ProtectedRoute>
              <SubscriptionHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* Profile route - accessible to all authenticated users */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileForm />
            </ProtectedRoute>
          }
        />

        {/* Dashboard route - accessible to all authenticated users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* All other routes require active subscription */}
        <Route
          path="/*"
          element={
            <SubscriptionGuard>
              <Routes>
                {/* Staff routes - protected */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <Staff />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/add-staff"
                  element={
                    <ProtectedRoute module="staff" action="add">
                      <AddStaff />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/add-staff/:id"
                  element={
                    <ProtectedRoute module="staff" action="edit">
                      <AddStaff />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/staff-detail/:id"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <StaffDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Roles routes - protected */}
                <Route
                  path="/staff/roles"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <Roles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/roles/role-detail/:id"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <RoleDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Department routes - protected */}
                <Route
                  path="/staff/department"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <Department />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/department/department-detail/:id"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <DepartmentDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Location routes - protected */}
                <Route
                  path="/staff/location"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <Location />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/location/:id"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <Rooms />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/location/:id/room/:roomId"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <RoomDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Working Hours routes - protected */}
                <Route
                  path="/staff/working-hours"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <WorkingHours />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/working-hours/holiday"
                  element={
                    <ProtectedRoute module="staff" action="view">
                      <Holidays />
                    </ProtectedRoute>
                  }
                />

                {/* Asset routes - protected */}
                <Route
                  path="/asset"
                  element={
                    <ProtectedRoute module="assets" action="view">
                      <Assets />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/brand"
                  element={
                    <ProtectedRoute module="assets" action="view">
                      <Brands />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/brand/brand-detail/:id"
                  element={
                    <ProtectedRoute module="assets" action="view">
                      <BrandDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/add-asset"
                  element={
                    <ProtectedRoute module="assets" action="add">
                      <AddAsset />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/add-asset/:id"
                  element={
                    <ProtectedRoute module="assets" action="edit">
                      <AddAsset />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/asset-detail/:id"
                  element={
                    <ProtectedRoute module="assets" action="view">
                      <AssetDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/asset-detail/:id/assign-history"
                  element={
                    <ProtectedRoute module="assets" action="view">
                      <AssigningHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/asset-detail/:id/custom-status"
                  element={
                    <ProtectedRoute module="assets" action="view">
                      <CustomStatus />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/asset/asset-detail/:id/damage-report"
                  element={
                    <ProtectedRoute module="assets" action="view">
                      <DamageReport />
                    </ProtectedRoute>
                  }
                />

                {/* Client routes - protected */}
                <Route
                  path="/client"
                  element={
                    <ProtectedRoute module="clients" action="view">
                      <Clients />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/client/client-detail/:clientId"
                  element={
                    <ProtectedRoute module="clients" action="view">
                      <ClientDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Vendor routes - protected */}
                <Route
                  path="/vendor"
                  element={
                    <ProtectedRoute module="vendors" action="view">
                      <Vendors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vendor/vendor-detail/:id"
                  element={
                    <ProtectedRoute module="vendors" action="view">
                      <VendorDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Dispute/Support Ticket routes - protected */}
                <Route
                  path="/dispute"
                  element={
                    <ProtectedRoute module="support_tickets" action="view">
                      <Dispute />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dispute/dispute-detail/:id"
                  element={
                    <ProtectedRoute module="support_tickets" action="view">
                      <DisputeDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dispute/add-ticket"
                  element={
                    <ProtectedRoute module="support_tickets" action="add">
                      <AddTicket />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dispute/add-ticket/:id"
                  element={
                    <ProtectedRoute module="support_tickets" action="edit">
                      <AddTicket />
                    </ProtectedRoute>
                  }
                />

                {/* Logs routes - protected */}
                <Route
                  path="/log"
                  element={
                    <ProtectedRoute module="logs" action="view">
                      <Logs />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Page */}
                <Route path="*" element={<div>Page Not Found</div>} />
              </Routes>
            </SubscriptionGuard>
          }
        />
      </Routes>
      <FreeTrialModal />
    </>
  );
};

function App() {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  return (
    <Router>
      <PayPalScriptProvider
        options={{
          "client-id": paypalClientId || "test",
          currency: "USD",
        }}
      >
        <SubscriptionProvider>
          <AppRoutes />
        </SubscriptionProvider>

        {/* React Hot Toast Container */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            className: "",
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              padding: "12px 16px",
              borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            },
            success: {
              duration: 3000,
              style: {
                background: "#10B981",
                color: "#fff",
              },
              iconTheme: {
                primary: "#fff",
                secondary: "#10B981",
              },
            },
            error: {
              duration: 5000,
              style: {
                background: "#EF4444",
                color: "#fff",
              },
              iconTheme: {
                primary: "#fff",
                secondary: "#EF4444",
              },
            },
            loading: {
              style: {
                background: "#3B82F6",
                color: "#fff",
              },
              iconTheme: {
                primary: "#fff",
                secondary: "#3B82F6",
              },
            },
          }}
        />
      </PayPalScriptProvider>
    </Router>
  );
}

export default App;