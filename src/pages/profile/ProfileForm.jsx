import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import toast from "react-hot-toast";
import { ChevronDown, Upload, X } from "lucide-react";
import Layout from "@/components/common/Layout";
import { useSetLocationArray } from "@/utils/locationSetter";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";

export default function ProfileForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    zipcode: "",
    countryCode: "",
  });
  const [orgId, setOrgId] = useState("");
  const [accountType, setAccountType] = useState("staff"); // "staff" or "organization"

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;

      const u = JSON.parse(raw);
      const type = u.accountType || "staff";
      setAccountType(type);
      setOrgId(u.organizationId || u.organization_id || "");

      // For staff: use staff object for address, user level for name/email/phone
      // For organization: use organization object for everything
      if (type === "staff") {
        const staffAddress = u.staff?.address || {};
        setFormData((prev) => ({
          ...prev,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          phone: u.phone || "",
          companyName: u.companyName || u.company_name || "",
          addressLine1: staffAddress.addressLine1 || "",
          addressLine2: staffAddress.addressLine2 || "",
          landmark: staffAddress.landmark || "",
          city: staffAddress.city || "",
          state: staffAddress.state || "",
          zipcode: staffAddress.zipcode || "",
          countryCode: u.countryCode || "",
        }));
        // Use staff image for upload preview (bottom section)
        if (u.image) {
          setUploadPreview(u.image);
        }
        // Use org logo for left-side display
        if (u.organization?.logo) {
          setLogoBase64(u.organization.logo);
        }
      } else {
        // accountType is "organization"
        const org = u.organization || {};
        setFormData((prev) => ({
          ...prev,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: org.email || u.email || "",
          phone: org.phone || u.phone || "",
          companyName: org.name || u.companyName || "",
          addressLine1: org.addressLine1 || "",
          addressLine2: org.addressLine2 || "",
          landmark: org.landmark || "",
          city: org.city || "",
          state: org.state || "",
          zipcode: org.zipcode || "",
          countryCode: org.countryCode || "",
        }));
        // Use org logo for both left display and upload preview
        if (org.logo) {
          setLogoBase64(org.logo);
          setUploadPreview(org.logo);
        }
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
    }
  }, []);

  const [logoFile, setLogoFile] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null); // For left-side org logo display
  const [uploadPreview, setUploadPreview] = useState(null); // For bottom upload section
  const [dragActive, setDragActive] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setLogoFile(f);
      // read base64
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setLogoFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const browse = () => {
    document.getElementById("logoInput").click();
  };

  const handleImageRemove = () => {
    setLogoFile(null);
    setUploadPreview(null);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = () => {
    setSaving(true);

    if (accountType === "organization") {
      // Extract country code from phone number (e.g., "+91 1234567890" -> "+91")
      const extractCountryCode = (phoneStr) => {
        if (!phoneStr) return "+1";
        const match = phoneStr.match(/^(\+\d+)/);
        return match ? match[1] : "+1";
      };

      // PUT /organizations/{id}
      const payload = {
        organizationName: formData.companyName,
        pocOwnerName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        countryCode: formData.countryCode,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,

        zipcode: formData.zipcode,
        logo: uploadPreview || "",
        status: "active",
      };

      axiosPrivate
        .put(`/organizations/${orgId}`, payload)
        .then((res) => {
          toast.success("Organization profile updated");
          // Update localStorage
          try {
            const raw = localStorage.getItem("user");
            if (raw) {
              const u = JSON.parse(raw);
              u.companyName = formData.companyName;
              u.firstName = formData.firstName;
              u.lastName = formData.lastName;
              if (u.organization) {
                u.organization.name = formData.companyName;
                u.organization.email = formData.email;
                u.organization.phone = formData.phone;
                u.organization.countryCode = formData.countryCode;
                u.organization.addressLine1 = formData.addressLine1;
                u.organization.addressLine2 = formData.addressLine2;
                u.organization.landmark = formData.landmark;
                u.organization.city = formData.city;
                u.organization.state = formData.state;
                u.organization.zipcode = formData.zipcode;
                if (uploadPreview) u.organization.logo = uploadPreview;
              }
              localStorage.setItem("user", JSON.stringify(u));
              // notify other components in this tab that user/org data changed
              try {
                window.dispatchEvent(new Event("userUpdated"));
              } catch (e) {
                // ignore
              }
            }
            // Also update orgDetail
            const orgRaw = localStorage.getItem("orgDetail");
            if (orgRaw) {
              const o = JSON.parse(orgRaw);
              o.name = formData.companyName;
              o.email = formData.email;
              o.phone = formData.phone;
              o.countryCode = formData.countryCode;
              o.addressLine1 = formData.addressLine1;
              o.addressLine2 = formData.addressLine2;
              o.landmark = formData.landmark;
              o.city = formData.city;
              o.state = formData.state;
              o.zipcode = formData.zipcode;
              if (uploadPreview && !uploadPreview.startsWith("data:")) {
                // only store if it's a URL, not base64
                o.logo = uploadPreview;
              }
              localStorage.setItem("orgDetail", JSON.stringify(o));
              try {
                window.dispatchEvent(new Event("userUpdated"));
              } catch (e) { }
            }
          } catch (err) {
            console.error("Failed to update localStorage:", err);
          }
        })
        .catch((err) => {
          console.error("Failed to update organization:", err);
          const msg = err.response?.data?.message || "Failed to update organization. Please try again.";
          toast.error(msg);
        })
        .finally(() => setSaving(false));
    } else {
      // accountType is "staff" - PUT /staff/profile
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        countryCode: formData.countryCode,
        gender: formData.gender || "",
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        image: uploadPreview || "",
      };

      axiosPrivate
        .put("/staff/profile", payload)
        .then((res) => {
          toast.success("Profile updated");
          // Update localStorage
          try {
            const raw = localStorage.getItem("user");
            if (raw) {
              const u = JSON.parse(raw);
              u.firstName = formData.firstName;
              u.lastName = formData.lastName;
              u.phone = formData.phone;
              u.countryCode = formData.countryCode;
              if (u.staff) {
                u.staff.firstName = formData.firstName;
                u.staff.lastName = formData.lastName;
                u.staff.phone = formData.phone;
                u.staff.countryCode = formData.countryCode;
                if (!u.staff.address) u.staff.address = {};
                u.staff.address.addressLine1 = formData.addressLine1;
                u.staff.address.addressLine2 = formData.addressLine2;
                u.staff.address.landmark = formData.landmark;
                u.staff.address.city = formData.city;
                u.staff.address.state = formData.state;
                u.staff.address.zipcode = formData.zipcode;
                if (uploadPreview) u.staff.image = uploadPreview;
              }
              if (uploadPreview) u.image = uploadPreview;
              localStorage.setItem("user", JSON.stringify(u));
              try {
                window.dispatchEvent(new Event("userUpdated"));
              } catch (e) { }
            }
          } catch (err) {
            console.error("Failed to update localStorage:", err);
          }
        })
        .catch((err) => {
          console.error("Failed to update profile:", err);
          const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
          toast.error(msg);
        })
        .finally(() => setSaving(false));
    }
  };

  const handleChangePassword = () => {
    console.log("Change Password clicked");
  };
  useSetLocationArray([{ label: "Profile", link: "" }]);
  return (
    <Layout>
      {/* Header */}

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">
          {formData.companyName || "Organization"} {orgId ? `(${orgId})` : null}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#ED1C24] text-white rounded hover:bg-[#d91b22]"
          >
            Save
          </button>
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            setIsOpen={setIsChangePasswordOpen}
          >
            <button className="px-4 py-2 border border-[#ED1C24] bg-[#ED1C2408] rounded text-[#ED1C24]">
              Change Password
            </button>
          </ChangePasswordModal>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Left Side - Logo Section */}
        <div className="col-span-3">
          <div className="bg-white p-3 rounded-lg shadow-lg mt-8 ">
            {/* Logo Display - shows newly uploaded image or existing logo */}
            <div className="mb-6">
              {(uploadPreview || logoBase64) ? (
                <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  <img
                    src={uploadPreview || logoBase64}
                    alt="Organization Logo"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center text-white">
                          <div class="text-center">
                            <div class="text-xs tracking-widest mb-2">LOGO NAME</div>
                            <div class="text-4xl font-light mb-2">LCN</div>
                            <div class="text-xs tracking-widest">ONLINE DESIGNING</div>
                          </div>
                        </div>
                      `;
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-red-900 to-red-700 rounded-lg flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-xs tracking-widest mb-2">LOGO NAME</div>
                    <div className="text-4xl font-light mb-2">LCN</div>
                    <div className="text-xs tracking-widest">ONLINE DESIGNING</div>
                  </div>
                </div>
              )}
            </div>

            {/* POC/Owner Info - populated from user/orgDetail */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">POC/Owner Name:</span>{' '}
                {formData.firstName || formData.lastName
                  ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
                  : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span>{' '}
                {formData.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Phone:</span>{' '}
                {formData.phone ? formData.phone : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Address:</span>{' '}
                {formData.addressLine1 || formData.addressLine2 || formData.city || formData.state || formData.zipcode
                  ? [formData.addressLine1, formData.addressLine2, formData.city, formData.state, formData.zipcode]
                    .filter(Boolean)
                    .join(', ')
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="col-span-9">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name*
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone*
                  </label>
                  <div className="flex">
                    <div className="relative">
                      <select disabled className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-8">
                        <option value={formData.countryCode}>{formData.countryCode}</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    
                      className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name*
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-60"
                />
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1*
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    placeholder="Enter address line 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Enter address line 2 (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="Enter landmark (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City*
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zipcode*
                  </label>
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    placeholder="Enter zipcode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {accountType === "organization" ? "Change Logo" : "Change Profile Image"}
                </h3>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                      ? "border-[#d41920] bg-[#ED1C2408]"
                      : "border-[#ED1C24] bg-[#ED1C2408]"
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="logoInput"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-[#ED1C24]" />
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Update your profile photo or{' '}
                        <button
                          type="button"
                          onClick={browse}
                          className="text-[#ED1C24] font-medium hover:text-blue-700"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Dimension 200*200
                      </p>
                    </div>
                  </div>
                  {/* preview area: show base64 preview if available, else show selected file name */}
                  {uploadPreview ? (
                    <div className="mt-4 flex items-center gap-3">
                      <img src={uploadPreview} alt="preview" className="w-20 h-20 object-cover rounded-md border" />
                      <div className="flex flex-col">
                        <button type="button" onClick={handleImageRemove} className="text-red-500 hover:text-red-700 text-sm">
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : logoFile ? (
                    <div className="mt-4 text-sm text-gray-600">Selected: {logoFile.name}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
