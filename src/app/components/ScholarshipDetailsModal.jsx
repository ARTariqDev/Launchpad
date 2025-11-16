"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCalendar, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

export default function ScholarshipDetailsModal({ scholarship, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const renderDescriptionWithLinks = (text) => {
    if (!text) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline; word-break: break-all;">$1</a>'
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border-2 p-6"
        style={{
          backgroundColor: "var(--primary-bg)",
          borderColor: "rgba(255, 255, 255, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2
              className="font-bold text-2xl mb-3"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
            >
              {scholarship.name}
            </h2>
            
            {scholarship.deadline && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCalendar}
                  style={{ color: "var(--text-secondary)" }}
                  className="w-4"
                />
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  Application Deadline: {formatDate(scholarship.deadline)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-4"
            style={{ color: "var(--text-secondary)" }}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {scholarship.thumbnail && (
          <div className="w-full h-64 mb-6 rounded-lg overflow-hidden bg-black/50">
            <img 
              src={scholarship.thumbnail} 
              alt={scholarship.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {scholarship.description && (
          <div
            className="border-2 rounded-lg p-6 mb-6"
            style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
          >
            <h3
              className="font-bold mb-3 text-lg"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
            >
              About This Scholarship
            </h3>
            <div
              style={{ 
                color: "var(--text-secondary)", 
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap"
              }}
              dangerouslySetInnerHTML={{
                __html: renderDescriptionWithLinks(scholarship.description)
              }}
            />
          </div>
        )}

        <div className="flex gap-3">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(scholarship.name + ' scholarship application')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-6 py-3 rounded-lg border-2 hover:bg-white/10 transition-all text-center flex items-center justify-center gap-2"
            style={{
              borderColor: "var(--text-primary)",
              color: "var(--text-primary)",
            }}
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4" />
            <span>Search Application Info</span>
          </a>
        </div>
      </div>
    </div>
  );
}
