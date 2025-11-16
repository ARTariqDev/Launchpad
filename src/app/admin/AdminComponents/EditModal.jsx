"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faTimes } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/Button";

export default function EditModal({ item, type, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    deadline: item?.deadline || "",
    description: item?.description || "",
    thumbnail: null,
  });
  const [deadlines, setDeadlines] = useState(
    item?.deadlines && item.deadlines.length > 0 
      ? item.deadlines 
      : [{ type: "REA", date: "" }]
  );
  const [location, setLocation] = useState(
    item?.location || { city: "", state: "", country: "" }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (field, value) => {
    setLocation({ ...location, [field]: value });
  };

  const handleDeadlineChange = (index, field, value) => {
    const newDeadlines = [...deadlines];
    newDeadlines[index][field] = value;
    setDeadlines(newDeadlines);
  };

  const addDeadline = () => {
    setDeadlines([...deadlines, { type: "EA", date: "" }]);
  };

  const removeDeadline = (index) => {
    if (deadlines.length > 1) {
      setDeadlines(deadlines.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, thumbnail: e.target.files[0] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedItem = { 
      ...item, 
      ...formData 
    };
    
    // For universities, include deadlines array and location
    if (type === "universities") {
      updatedItem.deadlines = deadlines.filter(d => d.date);
      updatedItem.location = location;
      // Remove description for universities
      delete updatedItem.description;
    }
    
    onSave(updatedItem);
    onClose();
  };

  const getDateLabel = () => {
    if (type === "extracurriculars") return "Date";
    return "Deadline";
  };

  const getTypeLabel = () => {
    if (type === "universities") return "University";
    if (type === "extracurriculars") return "Extracurricular";
    return "Scholarship";
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border-2 p-4 sm:p-6 md:p-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: "var(--primary-bg)", 
          borderColor: "var(--card-border)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex-1 min-w-0">
            <h2
              className="font-bold mb-1"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(18px, 4vw, 28px)",
                fontFamily: "var(--font-display)",
              }}
            >
              Edit {getTypeLabel()}
            </h2>
            <p className="hidden sm:block" style={{ color: "var(--text-subtle)", fontSize: "14px", fontFamily: "var(--font-body)" }}>
              Update the information below
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
            style={{ color: "var(--text-subtle)" }}
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: "18px" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block mb-2 sm:mb-3 font-bold"
              style={{
                color: "var(--text-primary)",
                fontSize: "13px",
                fontFamily: "var(--font-display)",
              }}
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors text-sm sm:text-base"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          {type !== "universities" && (
            <div>
              <label
                htmlFor="deadline"
                className="block mb-2 sm:mb-3 font-bold"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                }}
              >
                {getDateLabel()} *
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors text-sm sm:text-base"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>
          )}

          {type === "universities" && (
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <label
                  className="block font-bold"
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Application Deadlines *
                </label>
                <button
                  type="button"
                  onClick={addDeadline}
                  className="px-2 py-1 rounded-md border-2 hover:bg-white/10 transition-colors text-xs font-bold"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {deadlines.map((deadline, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select
                        value={deadline.type}
                        onChange={(e) => handleDeadlineChange(index, "type", e.target.value)}
                        className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer text-sm"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        <option value="REA" style={{ backgroundColor: "var(--primary-bg)" }}>REA</option>
                        <option value="EA" style={{ backgroundColor: "var(--primary-bg)" }}>EA</option>
                        <option value="ED1" style={{ backgroundColor: "var(--primary-bg)" }}>ED1</option>
                        <option value="ED2" style={{ backgroundColor: "var(--primary-bg)" }}>ED2</option>
                        <option value="RD" style={{ backgroundColor: "var(--primary-bg)" }}>RD</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={deadline.date}
                        onChange={(e) => handleDeadlineChange(index, "date", e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors text-sm"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-body)",
                        }}
                      />
                    </div>
                    {deadlines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDeadline(index)}
                        className="px-3 py-2 rounded-md border-2 hover:bg-white/10 transition-colors text-sm"
                        style={{
                          borderColor: "rgba(239, 68, 68, 0.5)",
                          color: "#ef4444",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === "universities" ? (
            <div>
              <label
                className="block mb-2 sm:mb-3 font-bold"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                }}
              >
                Location *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <input
                    type="text"
                    value={location.city}
                    onChange={(e) => handleLocationChange("city", e.target.value)}
                    required
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors text-sm"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={location.state}
                    onChange={(e) => handleLocationChange("state", e.target.value)}
                    required
                    placeholder="State/Province"
                    className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors text-sm"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                </div>
                <div>
                  <select
                    value={location.country}
                    onChange={(e) => handleLocationChange("country", e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer text-sm"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <option value="" style={{ backgroundColor: "var(--primary-bg)" }}>Select Country</option>
                    <option value="USA" style={{ backgroundColor: "var(--primary-bg)" }}>United States</option>
                    <option value="Canada" style={{ backgroundColor: "var(--primary-bg)" }}>Canada</option>
                    <option value="UK" style={{ backgroundColor: "var(--primary-bg)" }}>United Kingdom</option>
                    <option value="Australia" style={{ backgroundColor: "var(--primary-bg)" }}>Australia</option>
                    <option value="Germany" style={{ backgroundColor: "var(--primary-bg)" }}>Germany</option>
                    <option value="France" style={{ backgroundColor: "var(--primary-bg)" }}>France</option>
                    <option value="Netherlands" style={{ backgroundColor: "var(--primary-bg)" }}>Netherlands</option>
                    <option value="Switzerland" style={{ backgroundColor: "var(--primary-bg)" }}>Switzerland</option>
                    <option value="Singapore" style={{ backgroundColor: "var(--primary-bg)" }}>Singapore</option>
                    <option value="Japan" style={{ backgroundColor: "var(--primary-bg)" }}>Japan</option>
                    <option value="South Korea" style={{ backgroundColor: "var(--primary-bg)" }}>South Korea</option>
                    <option value="China" style={{ backgroundColor: "var(--primary-bg)" }}>China</option>
                    <option value="Other" style={{ backgroundColor: "var(--primary-bg)" }}>Other</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="description"
                className="block mb-2 sm:mb-3 font-bold"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                }}
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors resize-y text-sm sm:text-base"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  minHeight: "80px",
                }}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="thumbnail"
              className="block mb-2 sm:mb-3 font-bold"
              style={{
                color: "var(--text-primary)",
                fontSize: "13px",
                fontFamily: "var(--font-display)",
              }}
            >
              Update Thumbnail
            </label>
            <div
              className="w-full px-3 py-4 sm:px-4 sm:py-8 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all"
              style={{
                borderColor: formData.thumbnail ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.2)",
                backgroundColor: formData.thumbnail ? "rgba(255, 255, 255, 0.03)" : "transparent",
              }}
              onClick={() => document.getElementById("thumbnail-edit").click()}
            >
              <FontAwesomeIcon
                icon={faUpload}
                className="mb-2 sm:mb-3"
                style={{ color: formData.thumbnail ? "var(--text-secondary)" : "var(--text-subtle)", fontSize: "20px" }}
              />
              <p className="text-center px-2 font-medium text-sm" style={{ color: formData.thumbnail ? "var(--text-secondary)" : "var(--text-subtle)", fontFamily: "var(--font-display)" }}>
                {formData.thumbnail ? formData.thumbnail.name : "Click to upload new image"}
              </p>
              {!formData.thumbnail && (
                <p className="text-center px-2 mt-1 text-xs" style={{ color: "var(--text-subtle)" }}>
                  Optional
                </p>
              )}
            </div>
            <input
              type="file"
              id="thumbnail-edit"
              name="thumbnail"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
            <div className="flex-1">
              <Button
                text="Save Changes"
                color="#ffffff"
                textColor="#000000"
                glowColor="#000000"
                onClick={handleSubmit}
              />
            </div>
            <div className="flex-1">
              <Button
                text="Cancel"
                color="#000000"
                textColor="#ffffff"
                glowColor="#ffffff"
                onClick={onClose}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
