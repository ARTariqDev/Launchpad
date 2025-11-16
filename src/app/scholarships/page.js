"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import ScholarshipDetailsModal from "../components/ScholarshipDetailsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCalendar, faInfoCircle, faBookmark } from "@fortawesome/free-solid-svg-icons";

export default function ScholarshipsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [filteredScholarships, setFilteredScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
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
      fetchScholarships();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...scholarships];

    if (searchTerm) {
      filtered = filtered.filter(scholarship =>
        scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scholarship.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredScholarships(filtered);
  }, [searchTerm, scholarships]);

  const fetchScholarships = async () => {
    try {
      const response = await fetch("/api/scholarships");
      const data = await response.json();
      
      if (data.scholarships) {
        setScholarships(data.scholarships);
        setFilteredScholarships(data.scholarships);
      }
    } catch (error) {
      console.error("Error fetching scholarships:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSaveScholarship = async (scholarshipId, scholarshipName) => {
    try {
      const response = await fetch("/api/user-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadySaved) {
          setToast({
            message: `${scholarshipName} is already in your list!`,
            type: "info"
          });
        } else {
          setToast({
            message: `${scholarshipName} saved to your list!`,
            type: "success"
          });
        }
      } else {
        setToast({
          message: data.error || "Failed to save scholarship",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error saving scholarship:", error);
      setToast({
        message: "Failed to save scholarship",
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
          Loading scholarships...
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
            Scholarships
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Discover scholarship opportunities to fund your education
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
              placeholder="Search scholarships by name or description..."
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
            Showing {filteredScholarships.length} of {scholarships.length} scholarships
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships.map((scholarship, index) => (
            <div
              key={scholarship._id}
              className="border-2 rounded-lg overflow-hidden hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 flex flex-col animate-fade-in"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                animationDelay: `${index * 50}ms`
              }}
            >
              {scholarship.thumbnail && (
                <div className="w-full h-48 overflow-hidden bg-black/50">
                  <img 
                    src={scholarship.thumbnail} 
                    alt={scholarship.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <h3
                  className="font-bold mb-3 text-xl"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  {scholarship.name}
                </h3>

                {scholarship.deadline && (
                  <div className="flex items-center gap-2 mb-3">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      style={{ color: "var(--text-secondary)" }}
                      className="w-4"
                    />
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                      Deadline: {formatDate(scholarship.deadline)}
                    </span>
                  </div>
                )}

                {scholarship.description && (
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
                    {scholarship.description}
                  </p>
                )}

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleSaveScholarship(scholarship._id, scholarship.name)}
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
                      setSelectedScholarship(scholarship);
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

        {filteredScholarships.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
              No scholarships found matching your criteria
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

      {showDetailsModal && selectedScholarship && (
        <ScholarshipDetailsModal
          scholarship={selectedScholarship}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedScholarship(null);
          }}
        />
      )}
    </div>
  );
}
