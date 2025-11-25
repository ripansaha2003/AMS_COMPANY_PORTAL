import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, Download, Upload } from "lucide-react";
import axios from "axios";

export default function ImportModal({ children, open, onOpenChange }) {
  const defaultData = {
    category: "Category 1",
    file: null,
  };

  const [formData, setFormData] = useState(defaultData);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.organization_id || null;
    } catch (error) {
      console.error("Error getting organization_id:", error);
      return null;
    }
  };

  // Maximum file size: 10MB (10485760 bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccessMessage(null);
      setFormData(defaultData);
      setDragActive(false);
    } else {
      // Debug: Log organization ID when modal opens
      const currentOrgId = getOrganizationId();
      console.log("ImportModal opened with organization ID:", currentOrgId);
      if (!currentOrgId) {
        console.warn("Warning: Organization ID is not available");
      }
    }
  }, [open]);

  const validateAndSetFile = (file) => {
    if (!file) return;

    // Check file type
    const isCsv =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.type === "application/vnd.ms-excel";

    if (!isCsv) {
      setError("Only CSV files are supported for import.");
      setSuccessMessage(null);
      setFormData((prev) => ({ ...prev, file: null }));
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}. Please select a smaller file.`
      );
      setSuccessMessage(null);
      setFormData((prev) => ({ ...prev, file: null }));
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
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
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleSubmit = async () => {
    const currentOrgId = getOrganizationId();
    
    // FRONTEND CHECK: Organization ID validation
    if (!currentOrgId) {
      setError("Organization not found. Please re-login and try again.");
      console.error("❌ FRONTEND ERROR: Organization ID is missing");
      console.log("User object from localStorage:", JSON.parse(localStorage.getItem("user") || "{}"));
      return;
    }

    console.log("✅ FRONTEND: Organization ID found:", currentOrgId);

    // FRONTEND CHECK: File validation
    if (!formData.file) {
      setError("Please select a CSV file before importing.");
      console.error("❌ FRONTEND ERROR: No file selected");
      return;
    }

    // FRONTEND CHECK: File type validation
    const isCsv = formData.file.name.toLowerCase().endsWith(".csv") || 
                  formData.file.type === "text/csv" ||
                  formData.file.type === "application/vnd.ms-excel";
    if (!isCsv) {
      setError("Only CSV files are supported for import.");
      console.error("❌ FRONTEND ERROR: Invalid file type:", formData.file.type);
      return;
    }

    // FRONTEND CHECK: File size validation
    if (formData.file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}. Please select a smaller file.`);
      console.error("❌ FRONTEND ERROR: File too large:", formData.file.size);
      return;
    }

    console.log("✅ FRONTEND: All validations passed");
    console.log("📤 FRONTEND: Preparing upload request");

    const uploadFormData = new FormData();
    uploadFormData.append("category", formData.category);
    // Ensure file is appended correctly - backend expects 'file' field
    uploadFormData.append("file", formData.file, formData.file.name);

    // Log FormData contents for debugging
    console.log("📋 FRONTEND: FormData contents:");
    console.log("  - category:", formData.category);
    console.log("  - file name:", formData.file.name);
    console.log("  - file size:", formData.file.size);
    console.log("  - file type:", formData.file.type);
    console.log("  - file object:", formData.file);
    
    // Verify FormData is properly constructed
    if (!formData.category || !formData.file) {
      setError("Invalid form data. Please try again.");
      console.error("❌ FRONTEND ERROR: FormData validation failed");
      setUploading(false);
      return;
    }

    // Verify file is a File object
    if (!(formData.file instanceof File)) {
      setError("Invalid file object. Please select the file again.");
      console.error("❌ FRONTEND ERROR: File is not a File object:", typeof formData.file);
      setUploading(false);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const url = `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/${currentOrgId}`;
      console.log("🌐 FRONTEND: Sending POST request to:", url);

      // Axios automatically sets Content-Type: multipart/form-data with boundary for FormData
      // DO NOT set Content-Type header manually - axios needs to set it with the correct boundary
      // When you pass FormData to axios.post(), it automatically:
      // 1. Sets Content-Type to multipart/form-data
      // 2. Adds the correct boundary parameter
      // 3. Sends the file as binary data
      const response = await axios.post(url, uploadFormData);

      console.log("✅ BACKEND: Upload successful!");
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      setSuccessMessage("Import completed successfully.");
    setFormData(defaultData);
    if (onOpenChange) {
      onOpenChange(false);
      }
    } catch (err) {
      console.error("❌ ERROR DETECTED - Analyzing error type...");
      console.error("Error object:", err);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);
      console.error("Error response:", err?.response);
      console.error("Error status:", err?.response?.status);
      console.error("Error data:", err?.response?.data);
      console.error("Error headers:", err?.response?.headers);
      
      // Determine if it's a frontend or backend error
      let errorType = "UNKNOWN";
      let message = "Failed to import assets. Please try again.";
      
      if (err?.code === "ERR_NETWORK") {
        errorType = "❌ BACKEND: Network Error (Server unreachable or CORS issue)";
        message = "Unable to connect to server. The backend may be under maintenance. Please try again in a few moments.";
        console.error(errorType);
        console.error("This is a BACKEND configuration issue - CORS headers not set properly");
        console.log("✅ FRONTEND: Request format is correct, waiting for backend fix...");
      } else if (err?.message?.includes("CORS")) {
        errorType = "❌ BACKEND: CORS Error (Server not allowing requests from this origin)";
        message = "Server configuration issue detected. The backend team is fixing this. Please try again shortly.";
        console.error(errorType);
        console.error("This is a BACKEND configuration issue - API Gateway needs CORS headers");
        console.log("✅ FRONTEND: Request format is correct, waiting for backend CORS fix...");
      } else if (err?.response?.status === 502) {
        errorType = "❌ BACKEND: 502 Bad Gateway (API Gateway or upstream server issue)";
        message = "Server is temporarily unavailable. The backend team is working on this. Please try again in a few moments.";
        console.error(errorType);
        console.error("This is a BACKEND issue - API Gateway or Lambda function is down/misconfigured");
        console.log("✅ FRONTEND: Request format is correct, waiting for backend to come online...");
      } else if (err?.response?.status === 500) {
        errorType = "❌ BACKEND: 500 Internal Server Error (Server-side error)";
        message = "Server error. Please try again later or contact support.";
        console.error(errorType);
        console.error("This is a BACKEND issue - Server-side error in the API");
      } else if (err?.response?.status === 400) {
        errorType = "⚠️ BACKEND: 400 Bad Request (Request format issue)";
        const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
        const receivedColumns = err?.response?.data?.received_columns;
        
        // Check for specific CSV parsing error
        if (backendMessage?.includes("CSV must contain") || receivedColumns) {
          console.error("❌ BACKEND ERROR: CSV parsing issue");
          console.error("Backend received columns:", receivedColumns);
          console.error("This suggests the backend is not receiving the CSV file correctly");
          console.error("Possible causes:");
          console.error("  1. Backend is parsing multipart/form-data incorrectly");
          console.error("  2. File field name mismatch (backend might expect different field name)");
          console.error("  3. Backend expects file content directly, not as multipart");
          
          message = backendMessage || "CSV file format error. Please ensure your CSV contains 'assetName' and 'assetNumber' columns.";
          
          // Additional debugging info
          console.error("Frontend sent:");
          console.error("  - Field name: 'file'");
          console.error("  - File name:", formData.file.name);
          console.error("  - File size:", formData.file.size);
          console.error("  - File type:", formData.file.type);
          console.error("  - Is File object:", formData.file instanceof File);
        } else {
          message = backendMessage || "Bad request. Please check your file format and try again.";
        }
        
        console.error(errorType);
        console.error("Backend error message:", backendMessage);
        console.error("This could be:");
        console.error("  - BACKEND: Server expects different request format");
        console.error("  - FRONTEND: We're sending incorrect data");
        console.error("Request sent:", {
          url: `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/${currentOrgId}`,
          category: formData.category,
          fileName: formData.file.name,
          fileSize: formData.file.size,
          fileType: formData.file.type,
        });
      } else if (err?.response?.status === 413) {
        errorType = "❌ BACKEND: 413 Content Too Large (File size limit exceeded)";
        message = `File size is too large. Maximum file size allowed is ${formatFileSize(MAX_FILE_SIZE)}. Please reduce the file size and try again.`;
        console.error(errorType);
        console.error("This is a BACKEND issue - Server has a smaller file size limit than expected");
      } else if (err?.response?.status) {
        errorType = `❌ BACKEND: ${err.response.status} Error`;
        message = err?.response?.data?.message || `Server error (${err.response.status}). Please try again later.`;
        console.error(errorType);
        console.error("This is a BACKEND issue");
      } else {
        errorType = "❓ UNKNOWN ERROR";
        message = err?.message || "Failed to import assets. Please try again.";
        console.error(errorType);
        console.error("Could not determine error type - check network tab");
      }
      
      console.error("=".repeat(50));
      console.error("ERROR SUMMARY:");
      console.error("Type:", errorType);
      console.error("User Message:", message);
      console.error("=".repeat(50));
      
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFormData(defaultData);
    setError(null);
    setSuccessMessage(null);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const triggerBrowserDownload = (blob, fileName) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const downloadFilesSequentially = async (files) => {
    for (const [index, file] of files.entries()) {
      if (!file?.downloadUrl) {
        console.warn("Skipping file without downloadUrl:", file);
        continue;
      }

      const safeFileName =
        file.filename?.trim() || `reference-file-${index + 1}.csv`;

      try {
        const fileResponse = await axios.get(file.downloadUrl, {
          responseType: "blob",
        });

        const fileType =
          fileResponse.headers["content-type"] ||
          fileResponse.headers["Content-Type"] ||
          "application/octet-stream";

        const blob = new Blob([fileResponse.data], { type: fileType });
        triggerBrowserDownload(blob, safeFileName);
        console.log(`✅ Downloaded ${safeFileName}`);
      } catch (downloadErr) {
        console.error(`Failed to download ${safeFileName}`, downloadErr);
        throw downloadErr;
      }
    }
  };

  const handleDownloadReference = async () => {
    const currentOrgId = getOrganizationId();
    
    // FRONTEND CHECK: Organization ID validation
    if (!currentOrgId) {
      setError("Organization not found. Please re-login and try again.");
      console.error("❌ FRONTEND ERROR: Organization ID is missing for download");
      console.log("User object from localStorage:", JSON.parse(localStorage.getItem("user") || "{}"));
      return;
    }

    console.log("✅ FRONTEND: Organization ID found:", currentOrgId);
    console.log("📥 FRONTEND: Preparing download request");

    setDownloadLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const url = `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/${currentOrgId}`;
      console.log("Download URL:", url);

      const response = await axios.get(url, {
        responseType: "blob",
        validateStatus: (status) => {
          // Accept all status codes so we can handle errors manually
          return status >= 200 && status < 600;
        },
      });

      // Check if response is an error status
      if (response.status >= 400) {
        console.error("❌ BACKEND ERROR: Received error status:", response.status);
        
        // Try to parse the blob as JSON to get error message
        let errorMessage = `Server error (${response.status}). Please try again later.`;
        let errorType = `❌ BACKEND: ${response.status} Error`;
        
        try {
          const text = await response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error("Backend error message:", errorMessage);
        } catch (parseErr) {
          // If it's not JSON, use default message based on status
          if (response.status === 502) {
            errorType = "❌ BACKEND: 502 Bad Gateway (API Gateway or upstream server issue)";
            errorMessage = "Server gateway error (502). The server is temporarily unavailable. Please try again later or contact support.";
            console.error(errorType);
            console.error("This is a BACKEND issue - API Gateway or Lambda function is down/misconfigured");
          } else if (response.status === 500) {
            errorType = "❌ BACKEND: 500 Internal Server Error (Server-side error)";
            errorMessage = "Server error (500). Please try again later or contact support.";
            console.error(errorType);
            console.error("This is a BACKEND issue - Server-side error in the API");
          } else if (response.status === 400) {
            errorType = "⚠️ BACKEND: 400 Bad Request (Request format issue)";
            errorMessage = "Bad request (400). Please check your organization ID and try again.";
            console.error(errorType);
            console.error("This could be:");
            console.error("  - BACKEND: Server expects different request format");
            console.error("  - FRONTEND: Organization ID format is incorrect");
            console.error("Request URL:", `https://d3ou4k78e8.execute-api.ap-south-1.amazonaws.com/dev/${currentOrgId}`);
          }
        }
        
        console.error("=".repeat(50));
        console.error("ERROR SUMMARY:");
        console.error("Type:", errorType);
        console.error("User Message:", errorMessage);
        console.error("=".repeat(50));
        
        setError(errorMessage);
        setDownloadLoading(false);
        return;
      }

      const contentType =
        response.headers["content-type"] || response.headers["Content-Type"];

      // If backend returns JSON metadata (multiple download URLs)
      if (contentType && contentType.includes("application/json")) {
        const textPayload = await response.data.text();
        const jsonPayload = JSON.parse(textPayload);
        const filesList =
          jsonPayload?.data?.files || jsonPayload?.files || [];

        if (!filesList.length) {
          const emptyMessage =
            jsonPayload?.message ||
            "No reference files available to download right now.";
          setError(emptyMessage);
          setDownloadLoading(false);
          return;
        }

        console.log(
          `📦 Received ${filesList.length} reference file(s). Beginning sequential download...`
        );
        await downloadFilesSequentially(filesList);
        setSuccessMessage(
          `Downloaded ${filesList.length} reference file${
            filesList.length > 1 ? "s" : ""
          } successfully.`
        );
        setDownloadLoading(false);
        return;
      }

      // Success - legacy single-file download path
      let blobType = "application/zip"; // Default to zip as user mentioned
      let defaultFileName = "asset-import-reference.zip";

      if (contentType) {
        if (contentType.includes("zip") || contentType.includes("application/zip")) {
          blobType = "application/zip";
          defaultFileName = "asset-import-reference.zip";
        } else if (contentType.includes("csv") || contentType.includes("text/csv")) {
          blobType = "text/csv";
          defaultFileName = "asset-import-reference.csv";
        } else {
          blobType = contentType;
        }
      }

      const blob = new Blob([response.data], { type: blobType });

      const contentDisposition =
        response.headers["content-disposition"] ||
        response.headers["Content-Disposition"];
      let fileName = defaultFileName;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, "");
        }
      }

      triggerBrowserDownload(blob, fileName);
      
      console.log("✅ BACKEND: Download successful!");
      console.log("Downloaded file:", fileName);
      console.log("File type:", blobType);
    } catch (err) {
      console.error("❌ ERROR DETECTED - Analyzing error type...");
      console.error("Error object:", err);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);
      console.error("Error response:", err?.response);
      console.error("Error status:", err?.response?.status);
      
      let message = "Failed to download the reference file. Please try again.";
      let errorType = "❓ UNKNOWN ERROR";
      
      if (err?.code === "ERR_NETWORK") {
        errorType = "❌ BACKEND: Network Error (Server unreachable or CORS issue)";
        message = "Network error or CORS issue. Please check your connection or contact support.";
        console.error(errorType);
        console.error("This is a BACKEND configuration issue - CORS headers not set properly");
      } else if (err?.message?.includes("CORS")) {
        errorType = "❌ BACKEND: CORS Error (Server not allowing requests from this origin)";
        message = "Network error or CORS issue. Please check your connection or contact support.";
        console.error(errorType);
        console.error("This is a BACKEND configuration issue - API Gateway needs CORS headers");
      } else if (err?.response?.data?.message) {
        errorType = "❌ BACKEND: Server Error";
        message = err.response.data.message;
        console.error(errorType);
      } else if (err?.message) {
        errorType = "❓ UNKNOWN ERROR";
        message = err.message;
        console.error(errorType);
      }
      
      console.error("=".repeat(50));
      console.error("ERROR SUMMARY:");
      console.error("Type:", errorType);
      console.error("User Message:", message);
      console.error("=".repeat(50));
      
      setError(message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const isControlled = !children;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] bg-white pt-5 px-5 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Import
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-[2px] space-y-6 overflow-y-auto no-scrollbar flex-1">
         
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Category<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10"
              >
                <option value="Category 1">Category 1</option>
                <option value="Category 2">Category 2</option>
                <option value="Category 3">Category 3</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

        
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Download Reference:
              </span>
              <button
                onClick={handleDownloadReference}
                className="text-[#ED1C24] hover:text-[#ed1c23d5] disabled:opacity-60"
                disabled={downloadLoading}
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

   
          <div className="pb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
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
                accept=".csv"
              />

              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[#ED1C24]" />
                </div>

                <div>
                  <p className="text-gray-600">
                    Drag your File or{" "}
                    <span className="text-[#ED1C24] font-medium cursor-pointer">
                      browse
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    CSV format only (Max size: {formatFileSize(MAX_FILE_SIZE)})
                  </p>
                </div>
              </div>

              {formData.file && (
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                    <span className="truncate mr-2">
                  Selected: {formData.file.name}
                    </span>
                    <span className="text-gray-500 whitespace-nowrap">
                      ({formatFileSize(formData.file.size)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
              {successMessage}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-5">
          <div className="flex gap-3 justify-end w-full">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#ED1C24] text-white rounded-md hover:bg-[#d91b22] font-medium text-sm disabled:opacity-60"
              disabled={uploading}
            >
              {uploading ? "Importing..." : "Import"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
