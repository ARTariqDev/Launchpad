"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSearch, faCalendar, faUniversity, faTrophy, faRunning } from "@fortawesome/free-solid-svg-icons";
import EditModal from "./EditModal";

export default function ManageTab({ type }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let endpoint = "/api/universities";
      if (type === "extracurriculars") {
        endpoint = "/api/extracurriculars";
      } else if (type === "scholarships") {
        endpoint = "/api/scholarships";
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        const itemsKey = type === "universities" ? "universities" : type === "extracurriculars" ? "extracurriculars" : "scholarships";
        const fetchedItems = data[itemsKey] || [];
        
        const transformedItems = fetchedItems.map(item => ({
          id: item._id,
          name: item.name,
          deadline: item.deadline || item.date,
          deadlines: item.deadlines || [],
          description: item.description,
          location: item.location || { city: '', state: '', country: '' },
          thumbnail: item.thumbnail || null,
        }));
        
        setItems(transformedItems);
      } else {
        setError("Failed to load data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (id) => {
    const item = items.find((item) => item.id === id);
    setEditingItem(item);
  };

  const handleSave = async (updatedItem) => {
    try {
      let endpoint = `/api/universities/${updatedItem.id}`;
      if (type === "extracurriculars") {
        endpoint = `/api/extracurriculars/${updatedItem.id}`;
      } else if (type === "scholarships") {
        endpoint = `/api/scholarships/${updatedItem.id}`;
      }

      const formData = new FormData();
      formData.append("name", updatedItem.name);
      
      if (type === "universities") {
        formData.append("deadlines", JSON.stringify(updatedItem.deadlines || []));
        formData.append("location", JSON.stringify(updatedItem.location || { city: '', state: '', country: '' }));
      } else if (type === "extracurriculars") {
        formData.append("date", updatedItem.deadline);
        formData.append("description", updatedItem.description);
      } else {
        formData.append("deadline", updatedItem.deadline);
        formData.append("description", updatedItem.description);
      }
      
      if (updatedItem.thumbnail && updatedItem.thumbnail instanceof File) {
        formData.append("thumbnail", updatedItem.thumbnail);
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert("Failed to update item");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred while updating");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      let endpoint = `/api/universities/${id}`;
      if (type === "extracurriculars") {
        endpoint = `/api/extracurriculars/${id}`;
      } else if (type === "scholarships") {
        endpoint = `/api/scholarships/${id}`;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert("Failed to delete item");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting");
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = () => {
    if (type === "universities") return "Universities";
    if (type === "extracurriculars") return "Extracurriculars";
    return "Scholarships";
  };

  const getTypeIcon = () => {
    if (type === "universities") return faUniversity;
    if (type === "extracurriculars") return faRunning;
    return faTrophy;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
              <FontAwesomeIcon icon={getTypeIcon()} style={{ color: "var(--text-primary)", fontSize: "18px" }} />
            </div>
            <h2
              className="font-bold"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(20px, 4vw, 28px)",
                fontFamily: "var(--font-display)",
              }}
            >
              {getTypeLabel()}
            </h2>
          </div>
          <p style={{ color: "var(--text-subtle)", fontSize: "14px", fontFamily: "var(--font-body)" }}>
            {filteredItems.length} total entries
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
            style={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
            }}
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-subtle)", fontSize: "14px" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
            Loading...
          </div>
        </div>
      ) : error ? (
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div
              className="col-span-full text-center py-16 rounded-lg border-2 border-dashed"
              style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card-bg)" }}
            >
              <FontAwesomeIcon icon={faSearch} style={{ color: "var(--text-subtle)", fontSize: "32px", marginBottom: "12px" }} />
              <p style={{ color: "var(--text-subtle)", fontFamily: "var(--font-body)", fontSize: "16px" }}>
                No {getTypeLabel().toLowerCase()} found
              </p>
            </div>
          ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="group p-5 sm:p-6 rounded-lg border-2 hover:border-white transition-all hover:shadow-lg relative overflow-hidden"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: "var(--text-primary)", transform: "translate(50%, -50%)" }}></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: item.thumbnail ? "transparent" : "rgba(255, 255, 255, 0.05)" }}>
                      {item.thumbnail ? (
                        <img 
                          src={item.thumbnail} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon icon={getTypeIcon()} style={{ color: "var(--text-secondary)", fontSize: "18px" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="font-bold truncate"
                          style={{
                            color: "var(--text-primary)",
                            fontSize: "18px",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {item.name}
                        </h3>
                      </div>
                      <p
                        className="line-clamp-2"
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "14px",
                          fontFamily: "var(--font-body)",
                          lineHeight: "1.5",
                        }}
                      >
                        {type === "universities" && item.location 
                          ? `${item.location.city}, ${item.location.state}, ${item.location.country === "Other" && item.location.customCountry ? item.location.customCountry : item.location.country}`
                          : item.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
                  <div className="flex flex-wrap items-center gap-2">
                    {type === "universities" && item.deadlines && item.deadlines.length > 0 ? (
                      item.deadlines.map((dl, idx) => (
                        <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                          <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontFamily: "var(--font-display)", fontWeight: "bold" }}>
                            {dl.type === "Other" && dl.customType ? dl.customType : dl.type}
                          </span>
                          <span style={{ color: "var(--text-subtle)", fontSize: "11px" }}>
                            {new Date(dl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCalendar} style={{ color: "var(--text-subtle)", fontSize: "12px" }} />
                        <p
                          style={{
                            color: "var(--text-subtle)",
                            fontSize: "13px",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors flex items-center gap-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <FontAwesomeIcon icon={faEdit} style={{ fontSize: "14px" }} />
                      <span style={{ fontSize: "13px", fontFamily: "var(--font-display)" }} className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors flex items-center gap-2"
                      style={{ color: "var(--text-subtle)" }}
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: "14px" }} />
                      <span style={{ fontSize: "13px", fontFamily: "var(--font-display)" }} className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}

      {editingItem && (
        <EditModal
          item={editingItem}
          type={type}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
