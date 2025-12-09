import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Upload,
  Calendar,
  X,
  User,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/common/Layout";
import { useSetLocationArray } from "@/utils/locationSetter";

const BASE_API_URL =
  "https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev";
const DEFAULT_CONTENT_TYPE = "application/octet-stream";

export default function AddTicket() {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "Medium",
    category: "Technical",
    assignedToName: "",
    status: "Open",
    dueDate: "",
    requester: "",
    department: "",
    attachments: [],
  });

  const { id } = useParams();
  const [isEditMode] = useState(!!id);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return {};
    }
  };

  const getOrganizationId = () => {
    const user = getStoredUser();
    return user?.organization_id || null;
  };

const extractPresignedData = (raw) => {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const upload =
    raw.upload ||
    raw.data?.upload ||
    raw.data ||
    raw.result ||
    raw?.payload;

  if (!upload || typeof upload !== "object") {
    return {};
  }

  return {
    presignedUrl:
      upload.presigned_url ||
      upload.presignedUrl ||
      upload.upload_url ||
      upload.url ||
      null,
    finalUrl:
      upload.final_url ||
      upload.finalUrl ||
      upload.file_url ||
      upload.fileUrl ||
      null,
    s3Key: upload.s3_key || upload.key || upload.object_key || "",
    expiresIn: upload.expires_in || upload.expiresIn || null,
  };
};

const requestPresignedUrl = async (file, organizationId, organizationName) => {
    const payload = {
      organization_id: organizationId,
    organization_name: organizationName || "",
      filename: file.name,
      content_type: file.type || DEFAULT_CONTENT_TYPE,
      file_size: file.size,
    };

    const response = await fetch(`${BASE_API_URL}/tickets/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to request upload URL (status: ${response.status})`
      );
    }

  const rawBody = await response.text();
  let data;

  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch (parseError) {
    console.error(
      "Failed to parse presigned URL response as JSON",
      parseError,
      rawBody
    );
    data = { message: rawBody };
  }

  const presignData = extractPresignedData(data);

  if (!presignData.presignedUrl) {
    console.error(
      "Presigned URL response missing upload destination",
      data
    );
    throw new Error("Upload URL missing in presigned response");
  }

  return presignData;
  };

const uploadFileToStorage = async (file, presignedData) => {
  const uploadUrl = presignedData.presignedUrl;

    if (!uploadUrl) {
      throw new Error("Upload URL not provided by the server");
    }

  // Read file as ArrayBuffer to ensure binary format
  const fileBuffer = await file.arrayBuffer();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || DEFAULT_CONTENT_TYPE,
    },
    body: fileBuffer, // Send as binary ArrayBuffer
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Failed to upload ${file.name} (status: ${uploadResponse.status})`
    );
  }

    const resolvedUrl =
    presignedData.finalUrl ||
    (uploadUrl.includes("?") ? uploadUrl.split("?")[0] : uploadUrl);

    return {
      file_name: file.name,
    file_url: resolvedUrl,
    // s3_key: presignedData.s3Key || "",
      content_type: file.type || DEFAULT_CONTENT_TYPE,
      file_size: file.size,
    };
  };

const uploadAttachmentsWithPresignedUrls = async (
  files,
  organizationId,
  organizationName
) => {
    const uploads = files.map(async (file) => {
    const presignedData = await requestPresignedUrl(
      file,
      organizationId,
      organizationName
    );
      const uploaded = await uploadFileToStorage(file, presignedData);
      return uploaded;
    });

    return Promise.all(uploads);
  };
  // Fetch ticket data for edit mode
  const organizationId = getOrganizationId(); // You might want to get this from context/props
  const fetchTicketData = async (ticketId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/tickets?organization_id=${organizationId}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const ticket = data.tickets?.find((t) => t.id === ticketId);

      if (ticket) {
        setFormData({
          subject: ticket.subject || "",
          description: ticket.description || "",
          priority: ticket.priority || "Medium",
          category: "Technical", // Not in API response, keeping default
          status: ticket.status || "Open",
          dueDate: ticket.created_at
            ? formatDateForInput(ticket.created_at)
            : "",
          requester: ticket.user_name || "",
          department: "IT", // Not in API response, keeping default
          attachments: [],
        });
      } else {
        setError("Ticket not found");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Generate case ID
  const generateCaseId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `CASE-${year}-${random}`;
  };

  useEffect(() => {
    if (isEditMode && id) {
      fetchTicketData(id);
    } else {
      // Set default values for new ticket
      const storedUser = getStoredUser();
      setFormData((prev) => ({
        ...prev,
        subject: "",
        description: "",
        requester: storedUser?.poc_name || "",
        dueDate: "25/05/2025",
      }));
    }
  }, [isEditMode, id]);

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);

      // Create previews for image files
      const newPreviews = files.map((file) =>
        file.type.startsWith("image/") ? URL.createObjectURL(file) : null
      );

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...files],
      }));

      setAttachmentPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    );

    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));

    setAttachmentPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
    setAttachmentPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      attachmentPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    console.log("Cancel clicked");
    navigate("/dispute");
  };

  const validateForm = () => {
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!formData.priority) {
      setError("Priority is required");
      return false;
    }
    if (!formData.status) {
      setError("Status is required");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const storedUser = getStoredUser();

    if (!storedUser?.organization_id) {
      setError("Organization information is missing. Please log in again.");
      setLoading(false);
      return;
    }

    const organizationName =
      storedUser.organization_name ||
      storedUser.organizationName ||
      storedUser?.organization?.name ||
      "";

    if (!organizationName) {
      setError(
        "Organization name is missing. Please re-login or contact support."
      );
      setLoading(false);
      return;
    }

    try {
      const uploadedAttachments =
        formData.attachments.length > 0
          ? await uploadAttachmentsWithPresignedUrls(
              formData.attachments,
              storedUser.organization_id,
              organizationName
            )
          : [];

      const attachmentUrls = uploadedAttachments
        .map((item) => item.file_url)
        .filter(Boolean);

      const ticketPayload = {
        organization_id: storedUser.organization_id,
        organization_name: organizationName,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
      };

      if (formData.status) {
        ticketPayload.status = formData.status;
      }

      if (attachmentUrls.length > 0) {
        if (attachmentUrls.length === 1) {
          ticketPayload.attachment_url = attachmentUrls[0];
        } else {
          ticketPayload.attachment_urls = attachmentUrls;
        }
      }

      const url = isEditMode
        ? `${BASE_API_URL}/tickets/${id}`
        : `${BASE_API_URL}/tickets`;

      const method = isEditMode ? "PUT" : "POST";

      console.log("Sending ticket payload:", ticketPayload);
      console.log("Payload JSON:", JSON.stringify(ticketPayload));

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        console.error("Parsed error data:", errorData);
        throw new Error(
          errorData.message || errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log("Ticket saved:", responseData);

      // Show success message
      alert(
        isEditMode ? "Ticket updated successfully!" : "Ticket created successfully!"
      );

      // Navigate back to dispute list
      navigate("/dispute");
    } catch (error) {
      console.error("Error saving ticket:", error);
      setError(error.message || "Failed to save ticket");
    } finally {
      setLoading(false);
    }
  };

  useSetLocationArray([
    { label: "Raise a Dispute", link: "/dispute" },
    { label: isEditMode ? "Edit Ticket" : "Add Ticket" },
  ]);

  if (loading && isEditMode) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading ticket data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold flex justify-between items-center">
          {isEditMode ? "Edit Ticket" : "Add Ticket"}
          <div className="flex gap-x-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-gray-600 font-normal rounded-sm px-4 py-2 text-base hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base hover:bg-[#ED1C24] disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditMode ? "Update" : "Add"}
            </button>
          </div>
        </h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter ticket subject"
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              rows={4}
              placeholder="Describe the issue in detail"
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent resize-none disabled:opacity-50"
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 disabled:opacity-50"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 disabled:opacity-50"
                >
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="General">General</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Upload Files */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload Files
            </h3>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-[#d41920] bg-[#ED1C2408]"
                  : "border-[#ED1C24] bg-[#ED1C2408]"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                multiple
                disabled={loading}
              />
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[#ED1C24]" />
                </div>
                <div>
                  <p className="text-gray-600">
                    Drag your files or{" "}
                    <span className="text-[#ED1C24] font-medium cursor-pointer">
                      browse
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Dimension 200*200
                  </p>
                </div>
              </div>
            </div>

            {/* Display uploaded files */}
            {attachmentPreviews.some((p) => p) && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {attachmentPreviews.map((preview, idx) =>
                  preview ? (
                    <div
                      key={idx}
                      className="border-2 border-gray-200 rounded-lg p-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={preview}
                            alt={`Attachment ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Attachment {idx + 1}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formData.attachments[idx]?.name || "Image"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}

            {formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Attached Files:
                </p>
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded"
                  >
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
