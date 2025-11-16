"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faTimes } from "@fortawesome/free-solid-svg-icons";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return faCheckCircle;
      case "error":
        return faExclamationCircle;
      case "info":
        return faCheckCircle;
      default:
        return faCheckCircle;
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "info":
        return "#60a5fa";
      default:
        return "#10b981";
    }
  };

  return (
    <div
      className="fixed top-6 right-6 z-100 animate-slide-in-right flex items-center gap-3 px-6 py-4 rounded-lg border-2 shadow-lg backdrop-blur-sm"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: getColor(),
        minWidth: "300px",
        maxWidth: "500px",
      }}
    >
      <FontAwesomeIcon
        icon={getIcon()}
        className="w-5 h-5"
        style={{ color: getColor() }}
      />
      <p
        className="flex-1"
        style={{ color: "var(--text-primary)", fontSize: "14px" }}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
      </button>
    </div>
  );
}
