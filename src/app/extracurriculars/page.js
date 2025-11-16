"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import ExtracurricularDetailsModal from "../components/ExtracurricularDetailsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCalendar, faInfoCircle, faBookmark } from "@fortawesome/free-solid-svg-icons";

export default function ExtracurricularsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [extracurriculars, setExtracurriculars] = useState([]);
  const [filteredExtracurriculars, setFilteredExtracurriculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (!data.authenticated) {
          router.push("/login");
        } else {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchExtracurriculars();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...extracurriculars];

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExtracurriculars(filtered);
  }, [searchTerm, extracurriculars]);

  const fetchExtracurriculars = async () => {
    try {
      const response = await fetch("/api/extracurriculars");
      const data = await response.json();
      
      if (data.extracurriculars) {
        setExtracurriculars(data.extracurriculars);
        setFilteredExtracurriculars(data.extracurriculars);
      }
    } catch (error) {
      console.error("Error fetching extracurriculars:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSaveActivity = async (activityId, activityName) => {
    try {
      const response = await fetch("/api/user-extracurriculars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadySaved) {
          setToast({
            message: `${activityName} is already in your list!`,
            type: "info"
          });
        } else {
          setToast({
            message: `${activityName} saved to your list!`,
            type: "success"
          });
        }
      } else {
        setToast({
          message: data.error || "Failed to save activity",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      setToast({
        message: "Failed to save activity",
        type: "error"
      });
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "var(--primary-bg)" }}
      >
        <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
          Loading extracurriculars...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--primary-bg)", fontFamily: "var(--font-body)" }}
    >
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8 animate-fade-in">
          <h1
            className="font-bold mb-2"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontFamily: "var(--font-display)",
            }}
          >
            Extracurricular Activities
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Explore opportunities to enhance your college applications
          </p>
        </div>

        <div className="mb-8 animate-fade-in-delay-1">
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 transform -translate-y-1/2"
              style={{ color: "var(--text-secondary)" }}
            />
            <input
              type="text"
              placeholder="Search activities by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <p className="mt-4" style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Showing {filteredExtracurriculars.length} of {extracurriculars.length} activities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExtracurriculars.map((activity, index) => (
            <div
              key={activity._id}
              className="border-2 rounded-lg overflow-hidden hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 flex flex-col animate-fade-in"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                animationDelay: `${index * 50}ms`
              }}
            >
              {activity.thumbnail && (
                <div className="w-full h-48 overflow-hidden bg-black/50">
                  <img 
                    src={activity.thumbnail} 
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <h3
                  className="font-bold mb-3 text-xl"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  {activity.name}
                </h3>

                {activity.date && (
                  <div className="flex items-center gap-2 mb-3">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      style={{ color: "var(--text-secondary)" }}
                      className="w-4"
                    />
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                      {formatDate(activity.date)}
                    </span>
                  </div>
                )}

                {activity.description && (
                  <p
                    className="mb-4 flex-1"
                    style={{ 
                      color: "var(--text-secondary)", 
                      fontSize: "14px",
                      display: "-webkit-box",
                      WebkitLineClamp: "4",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {activity.description}
                  </p>
                )}

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleSaveActivity(activity._id, activity.name)}
                    className="flex-1 px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <FontAwesomeIcon icon={faBookmark} className="w-4" />
                    <span className="text-sm font-semibold">Save</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedActivity(activity);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      borderColor: "var(--text-primary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <FontAwesomeIcon icon={faInfoCircle} className="w-4" />
                    <span className="text-sm font-semibold">Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredExtracurriculars.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
              No activities found matching your criteria
            </p>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showDetailsModal && selectedActivity && (
        <ExtracurricularDetailsModal
          activity={selectedActivity}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
}
