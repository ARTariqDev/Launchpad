"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/Button";

export default function CreateForm() {
  const [formData, setFormData] = useState({
    type: "university",
    name: "",
    deadline: "",
    description: "",
    thumbnail: null,
  });
  const [deadlines, setDeadlines] = useState([
    { type: "REA", date: "" }
  ]);
  const [location, setLocation] = useState({
    city: "",
    state: "",
    country: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleLocationChange = (field, value) => {
    setLocation({ ...location, [field]: value });
    setError("");
    setSuccess("");
  };

  const handleDeadlineChange = (index, field, value) => {
    const newDeadlines = [...deadlines];
    newDeadlines[index][field] = value;
    setDeadlines(newDeadlines);
    setError("");
    setSuccess("");
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
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Determine the API endpoint based on type
      let endpoint = "/api/universities";
      if (formData.type === "extracurricular") {
        endpoint = "/api/extracurriculars";
      } else if (formData.type === "scholarship") {
        endpoint = "/api/scholarships";
      }

      // Create FormData for file upload
      const data = new FormData();
      data.append("name", formData.name);
      
      // Handle deadlines based on type
      if (formData.type === "university") {
        // For universities, send array of deadlines and location
        data.append("deadlines", JSON.stringify(deadlines.filter(d => d.date)));
        data.append("location", JSON.stringify(location));
      } else if (formData.type === "extracurricular") {
        data.append("date", formData.deadline);
        data.append("description", formData.description);
      } else {
        data.append("deadline", formData.deadline);
        data.append("description", formData.description);
      }
      
      if (formData.thumbnail) {
        data.append("thumbnail", formData.thumbnail);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} created successfully!`);
        // Reset form
        setFormData({
          type: "university",
          name: "",
          deadline: "",
          description: "",
          thumbnail: null,
        });
        setDeadlines([{ type: "REA", date: "" }]);
        setLocation({ city: "", state: "", country: "" });
      } else {
        setError(result.error || "Failed to create entry");
      }
    } catch (error) {
      console.error("Create error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = () => {
    if (formData.type === "extracurricular") return "Date";
    return "Deadline";
  };

  return (
    <div className="max-w-full sm:max-w-3xl">
      <div className="mb-8">
        <h2
          className="font-bold mb-2"
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(24px, 4vw, 32px)",
            fontFamily: "var(--font-display)",
          }}
        >
          Create New Entry
        </h2>
        <p style={{ color: "var(--text-subtle)", fontSize: "14px", fontFamily: "var(--font-body)" }}>
          Add a new university, extracurricular, or scholarship to the platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="px-4 py-3 rounded-md border-2"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.5)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="px-4 py-3 rounded-md border-2"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderColor: "rgba(34, 197, 94, 0.5)",
              color: "#22c55e",
            }}
          >
            {success}
          </div>
        )}

        <div className="p-4 sm:p-6 rounded-lg border-2" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="type"
                className="block mb-3 font-bold"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontFamily: "var(--font-display)",
                }}
              >
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <option value="university" style={{ backgroundColor: "var(--primary-bg)" }}>
                  University/College
                </option>
                <option value="extracurricular" style={{ backgroundColor: "var(--primary-bg)" }}>
                  Extracurricular
                </option>
                <option value="scholarship" style={{ backgroundColor: "var(--primary-bg)" }}>
                  Scholarship
                </option>
              </select>
            </div>

            {formData.type !== "university" && (
              <div>
                <label
                  htmlFor="deadline"
                  className="block mb-3 font-bold"
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "14px",
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
                  className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {formData.type === "university" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className="block font-bold"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontFamily: "var(--font-display)",
                }}
              >
                Application Deadlines *
              </label>
              <button
                type="button"
                onClick={addDeadline}
                className="px-3 py-1 rounded-md border-2 hover:bg-white/10 transition-colors text-sm font-bold"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                + Add Deadline
              </button>
            </div>
            <div className="space-y-3">
              {deadlines.map((deadline, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select
                      value={deadline.type}
                      onChange={(e) => handleDeadlineChange(index, "type", e.target.value)}
                      className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <option value="REA" style={{ backgroundColor: "var(--primary-bg)" }}>REA (Restrictive Early Action)</option>
                      <option value="EA" style={{ backgroundColor: "var(--primary-bg)" }}>EA (Early Action)</option>
                      <option value="ED1" style={{ backgroundColor: "var(--primary-bg)" }}>ED1 (Early Decision 1)</option>
                      <option value="ED2" style={{ backgroundColor: "var(--primary-bg)" }}>ED2 (Early Decision 2)</option>
                      <option value="RD" style={{ backgroundColor: "var(--primary-bg)" }}>RD (Regular Decision)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={deadline.date}
                      onChange={(e) => handleDeadlineChange(index, "date", e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
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
                      className="px-4 py-3 rounded-md border-2 hover:bg-white/10 transition-colors"
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

        <div>
          <label
            htmlFor="name"
            className="block mb-3 font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "14px",
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
            placeholder={`Enter ${formData.type} name`}
            className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
            style={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>

        {formData.type === "university" ? (
          <div>
            <label
              className="block mb-3 font-bold"
              style={{
                color: "var(--text-primary)",
                fontSize: "14px",
                fontFamily: "var(--font-display)",
              }}
            >
              Location *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  required
                  placeholder="City"
                  className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
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
                  className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
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
                  className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer"
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
              className="block mb-3 font-bold"
              style={{
                color: "var(--text-primary)",
                fontSize: "14px",
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
              rows="6"
              placeholder="Enter a detailed description..."
              className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors resize-y"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                minHeight: "120px",
              }}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="thumbnail"
            className="block mb-3 font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "14px",
              fontFamily: "var(--font-display)",
            }}
          >
            Thumbnail
          </label>
          <div
            className="w-full px-4 py-8 sm:py-12 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all"
            style={{ 
              borderColor: formData.thumbnail ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.2)",
              backgroundColor: formData.thumbnail ? "rgba(255, 255, 255, 0.03)" : "transparent"
            }}
            onClick={() => document.getElementById("thumbnail").click()}
          >
            <FontAwesomeIcon
              icon={faUpload}
              className="mb-3"
              style={{ color: formData.thumbnail ? "var(--text-secondary)" : "var(--text-subtle)", fontSize: "28px" }}
            />
            <p className="text-center px-2 font-medium" style={{ color: formData.thumbnail ? "var(--text-secondary)" : "var(--text-subtle)", fontSize: "14px", fontFamily: "var(--font-display)" }}>
              {formData.thumbnail ? formData.thumbnail.name : "Click to upload image"}
            </p>
            {!formData.thumbnail && (
              <p className="text-center px-2 mt-1" style={{ color: "var(--text-subtle)", fontSize: "12px" }}>
                Optional
              </p>
            )}
          </div>
          <input
            type="file"
            id="thumbnail"
            name="thumbnail"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="pt-6 flex gap-4">
          <div className="flex-1">
            <Button
              text={loading ? "Creating..." : "Create Entry"}
              color="#ffffff"
              textColor="#000000"
              glowColor="#000000"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
