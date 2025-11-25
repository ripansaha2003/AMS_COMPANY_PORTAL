import Layout from "@/components/common/Layout";
import AddLocationModal from "@/components/staff/AddLocationModal";
import { useSetLocationArray } from "@/utils/locationSetter";
import React, { useState, useEffect } from "react";
import { CiLocationOn } from "react-icons/ci";
import { Edit, Pencil, Trash, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import Menu from "@/components/common/Menu";
import { checkPermission } from "@/utils/permissions";
import PermissionWrapper from "@/components/PermissionWrapper";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const Location = () => {
  useSetLocationArray([
    { label: "Staff", link: "/staff" },
    { label: "Locations", link: "" },
  ]);

  const [openModal, setOpenModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [editLocation, setEditLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const hasEditPermission = checkPermission("staff", "edit");
  const hasDeletePermission = checkPermission("staff", "delete");
  const navigate = useNavigate();
  // Get organization ID from localStorage
  const getOrganizationId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.organization_id;
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const organizationId = getOrganizationId();
      if (!organizationId) {
        console.error("Organization ID not found");
        setLoading(false);
        return;
      }

      const response = await axiosPrivate.get(
        `/organizations/${organizationId}/locations`
      );
      setLocations(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      alert("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  // Delete location
  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    
    setDeleteLoading(true);
    try {
      const organizationId = getOrganizationId();
      await axiosPrivate.delete(
        `/organizations/${organizationId}/locations/${locationToDelete.id}`
      );

      // Remove from local state
      setLocations((prev) => prev.filter((loc) => loc.id !== locationToDelete.id));
      alert("Location deleted successfully!");
      setOpenDeleteModal(false);
      setLocationToDelete(null);
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location");
    } finally {
      setDeleteLoading(false);
    }
  };

  const menuItems = (location) => [
    hasEditPermission && {
      icon: <Pencil className="w-4 h-4" />,
      label: "Edit",
      onClick: (e) => {
        e.stopPropagation();
        handleEditLocation(location);
      },
    },
    hasDeletePermission && {
      icon: <Trash className="w-4 h-4 text-red-500" />,
      label: "Delete",
      onClick: (e) => {
        e.stopPropagation();
        setLocationToDelete(location);
        setOpenDeleteModal(true);
      },
    },
  ];

  // Handle edit location
  const handleEditLocation = (location) => {
    setEditLocation(location);
    setOpenModal(true);
  };

  // Handle add location
  const handleAddLocation = () => {
    setEditLocation(null);
    setOpenModal(true);
  };

  // Handle modal close
  const handleModalClose = (open) => {
    setOpenModal(open);
    if (!open) {
      setEditLocation(null);
    }
  };

  // Handle location saved
  const handleLocationSaved = () => {
    fetchLocations();
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="flex gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-40 h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-semibold flex justify-between mb-6">
        Location
        <PermissionWrapper module="staff" action="add">
          <button
            onClick={handleAddLocation}
            className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base"
          >
            Add New Location
          </button>
        </PermissionWrapper>
      </h1>

      <div className="flex gap-6 flex-wrap">
        {locations.map((location) => (
          <div key={location.id} className="relative group">
            <div
              onClick={() =>
                navigate(`/staff/location/${location.id}`, { state: location })
              }
            >
              <div className="flex flex-col items-center border border-gray-300 rounded-lg p-6 w-40 bg-white shadow-sm hover:shadow-md transition">
                <Menu items={menuItems(location)}>
                  <button className="text-[#ED1C24] hover:text-blue-900 font-medium absolute top-2 right-2 flex flex-col">
                    •••
                  </button>
                </Menu>
                <CiLocationOn size={40} className="mb-4 text-gray-600" />
                <span className="text-base font-medium text-center">
                  {location.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {location.city && location.state
                    ? `${location.city}, ${location.state}`
                    : location.address1}
                </span>
              </div>
            </div>

            {/* Action buttons
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleEditLocation(location);
                }}
                className="p-1 bg-white text-blue-600 hover:bg-blue-50 rounded shadow"
                title="Edit Location"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteLocation(location.id);
                }}
                className="p-1 bg-white text-red-600 hover:bg-red-50 rounded shadow"
                title="Delete Location"
              >
                <Trash2 size={14} />
              </button>
            </div> */}
          </div>
        ))}

        {locations.length === 0 && (
          <div className="text-center py-12 w-full">
            <CiLocationOn size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              No locations found. Add your first location!
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Location Modal */}
      <AddLocationModal
        open={openModal}
        onOpenChange={handleModalClose}
        editLocation={editLocation}
        onLocationSaved={handleLocationSaved}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setLocationToDelete(null);
        }}
        onConfirm={handleDeleteLocation}
        title="Delete Location"
        message={`Are you sure you want to delete ${locationToDelete?.location_name}? This action cannot be undone.`}
        confirmText="Delete Location"
        type="danger"
        isLoading={deleteLoading}
      />
    </Layout>
  );
};

export default Location;
