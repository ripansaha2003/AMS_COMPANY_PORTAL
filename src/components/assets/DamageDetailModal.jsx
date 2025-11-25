import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";

const DamageDetailModal = ({ children, open, onOpenChange, reportData }) => {
  // if (!reportData) return null;

  // Convert base64 images to displayable format
  const images = reportData?.damageImages || [];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="text-sm text-[#ED1C24] hover:underline">
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-white p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl text-gray-800 mb-6">
            {reportData?.damageName || "Damage Report"}
          </DialogTitle>
          
          <div className="space-y-4 text-left">
            <div>
              <span className="font-semibold text-gray-700">Date: </span>
              <span className="text-gray-600">
                {formatDate(reportData?.reportDate || reportData?.created_at)}
              </span>
            </div>
            
            <div>
              <span className="font-semibold text-gray-700">Reported By: </span>
              <span className="text-gray-600">
                {reportData?.damageReportedBy || reportData?.reportedBy || "N/A"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-700">Asset Number: </span>
              <span className="text-gray-600">
                {reportData?.assetNumber || "N/A"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-700">Department: </span>
              <span className="text-gray-600">
                {reportData?.department || "N/A"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-700">Status: </span>
              <span className={`px-2 py-1 rounded text-sm ${
                reportData?.status === 'reported' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : reportData?.status === 'in-progress'
                  ? 'bg-blue-100 text-blue-800'
                  : reportData?.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {reportData?.status || "N/A"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-700">Severity: </span>
              <span className={`px-2 py-1 rounded text-sm ${
                reportData?.severity === 'high'
                  ? 'bg-red-100 text-red-800'
                  : reportData?.severity === 'medium'
                  ? 'bg-orange-100 text-orange-800'
                  : reportData?.severity === 'low'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {reportData?.severity || "N/A"}
              </span>
            </div>

            {reportData?.estimatedCost && (
              <div>
                <span className="font-semibold text-gray-700">Estimated Cost: </span>
                <span className="text-gray-600">${reportData?.estimatedCost}</span>
              </div>
            )}

            {reportData?.actualCost && (
              <div>
                <span className="font-semibold text-gray-700">Actual Cost: </span>
                <span className="text-gray-600">${reportData?.actualCost}</span>
              </div>
            )}
            
            <div>
              <span className="font-semibold text-gray-700">Description:</span>
              <div className="mt-2">
                <p className="text-gray-600 leading-relaxed">
                  {reportData?.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {images.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-4">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {images.map((image, idx) => (
                <div key={idx} className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={image.data}
                    alt={image.name || `Damage image ${idx + 1}`}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => {
                      // Open image in new tab for full view
                      const newWindow = window.open();
                      newWindow.document.write(`<img src="${image.data}" style="max-width: 100%; max-height: 100vh; object-fit: contain;">`);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length === 0 && (
          <div className="mt-8 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No images available for this damage report</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DamageDetailModal;