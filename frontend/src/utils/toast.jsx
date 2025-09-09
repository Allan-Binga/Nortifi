// src/utils/toast.js
import { toast } from "sonner";
import { Check, AlertTriangle, Info } from "lucide-react";

// Base styles
const baseButton = {
  borderRadius: "6px",
  padding: "8px 16px",
  fontSize: "14px",
  cursor: "pointer",
};

export const notify = {
  success: (message, description, action) =>
    toast.success(message, {
      description,
      duration: 4000,
      className: "border-l-4 border-l-green-500 bg-white shadow-lg",
      icon: <Check className="h-5 w-5 text-green-600" />,
      action,
      actionButtonStyle: {
        ...baseButton,
        backgroundColor: "#8b5cf6",
        color: "white",
        fontWeight: "500",
        transition: "all 0.2s ease",
      },
      cancelButtonStyle: {
        ...baseButton,
        backgroundColor: "transparent",
        color: "#6b7280",
        border: "1px solid #d1d5db",
      },
    }),

  error: (message, description, action) =>
    toast.error(message, {
      description,
      duration: 6000,
      className: "border-l-4 border-l-red-500 bg-white shadow-lg",
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      action,
      actionButtonStyle: {
        ...baseButton,
        backgroundColor: "#ef4444",
        color: "white",
        fontWeight: "500",
        transition: "all 0.2s ease",
      },
      cancelButtonStyle: {
        ...baseButton,
        backgroundColor: "transparent",
        color: "#6b7280",
        border: "1px solid #d1d5db",
      },
    }),

  info: (message, description, action) =>
    toast.info(message, {
      description,
      duration: 5000,
      className: "border-l-4 border-l-purple-500 bg-white shadow-lg",
      icon: <Info className="h-5 w-5 text-purple-600" />,
      action,
      actionButtonStyle: {
        ...baseButton,
        backgroundColor: "#8b5cf6",
        color: "white",
        fontWeight: "500",
        transition: "all 0.2s ease",
      },
      cancelButtonStyle: {
        ...baseButton,
        backgroundColor: "transparent",
        color: "#6b7280",
        border: "1px solid #d1d5db",
      },
    }),

  dismissAll: () => toast.dismiss(),
};