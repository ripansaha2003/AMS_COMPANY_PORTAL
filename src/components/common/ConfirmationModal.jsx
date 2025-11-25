import React from "react";
import { X, AlertTriangle, Trash2, LogOut, Archive } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default", // 'default', 'danger', 'warning', 'info'
  icon = null,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconColor: "text-red-500",
          confirmBg: "bg-[#ED1C24] hover:bg-red-600",
          confirmText: "text-white",
          defaultIcon: <Trash2 className="w-6 h-6" />,
        };
      case "warning":
        return {
          iconColor: "text-yellow-500",
          confirmBg: "bg-yellow-500 hover:bg-yellow-600",
          confirmText: "text-white",
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
        };
      case "info":
        return {
          iconColor: "text-blue-500",
          confirmBg: "bg-blue-500 hover:bg-blue-600",
          confirmText: "text-white",
          defaultIcon: <LogOut className="w-6 h-6" />,
        };
      default:
        return {
          iconColor: "text-gray-500",
          confirmBg: "bg-[#ED1C24] hover:bg-red-600",
          confirmText: "text-white",
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={typeStyles.iconColor}>
              {icon || typeStyles.defaultIcon}
            </div>
            <h3 className="text-lg font-semibold text-[#1A2947]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-base leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-base font-normal text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-base font-normal rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${typeStyles.confirmBg} ${typeStyles.confirmText}`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;