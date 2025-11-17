"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import CollegeCard from "../components/CollegeCard";
import CollegeInsightsModal from "../components/CollegeInsightsModal";
import Toast from "../components/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

export default function CollegesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    type: "",
    acceptanceRate: ""
  });
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [toast, setToast] = useState(null);

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
      fetchColleges();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...colleges];

    if (searchTerm) {
      filtered = filtered.filter(college => {
        const nameMatch = college.name.toLowerCase().includes(searchTerm.toLowerCase());
        const locationMatch = typeof college.location === 'string'
          ? college.location.toLowerCase().includes(searchTerm.toLowerCase())
          : [college.location?.city, college.location?.state, college.location?.country]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
        return nameMatch || locationMatch;
      });
    }

    if (filters.country) {
      filtered = filtered.filter(college => {
        let country;
        if (typeof college.location === 'string') {
          country = college.location;
        } else {
          // If country is "Other", use customCountry, otherwise use country
          country = college.location?.country === "Other" && college.location?.customCountry
            ? college.location.customCountry
            : college.location?.country;
        }
        
        return country?.toLowerCase() === filters.country.toLowerCase();
      });
    }

    if (filters.type) {
      filtered = filtered.filter(college => college.type === filters.type);
    }

    if (filters.acceptanceRate) {
      filtered = filtered.filter(college => {
        const rate = parseFloat(college.acceptanceRate);
        if (filters.acceptanceRate === "high") return rate > 50;
        if (filters.acceptanceRate === "medium") return rate >= 20 && rate <= 50;
        if (filters.acceptanceRate === "low") return rate < 20;
        return true;
      });
    }

    setFilteredColleges(filtered);
  }, [searchTerm, filters, colleges]);

  const fetchColleges = async () => {
    try {
      const response = await fetch("/api/colleges");
      const data = await response.json();
      
      if (data.colleges) {
        setColleges(data.colleges);
        setFilteredColleges(data.colleges);
        
        // Extract unique countries from colleges
        const countries = new Set();
        data.colleges.forEach(college => {
          if (college.location) {
            let country;
            if (typeof college.location === 'string') {
              country = college.location;
            } else {
              // If country is "Other", use customCountry, otherwise use country
              country = college.location.country === "Other" && college.location.customCountry
                ? college.location.customCountry
                : college.location.country;
            }
            if (country) countries.add(country);
          }
        });
        
        setAvailableCountries(Array.from(countries).sort());
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInsights = (college) => {
    setSelectedCollege(college);
    setShowInsightsModal(true);
  };

  const handleAddToList = async (collegeId) => {
    try {
      const response = await fetch("/api/user-colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId })
      });

      const data = await response.json();

      if (response.ok) {
        const college = colleges.find(c => c._id === collegeId);
        
        if (data.alreadySaved) {
          setToast({
            message: `${college?.name || "College"} is already in your list!`,
            type: "info"
          });
        } else {
          setToast({
            message: `${college?.name || "College"} added to your list!`,
            type: "success"
          });
        }
      } else {
        setToast({
          message: data.error || "Failed to add college to list",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error adding college:", error);
      setToast({
        message: "Failed to add college to list",
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
          Loading colleges...
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
            Explore Colleges
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Discover and save colleges that match your profile
          </p>
        </div>

        <div className="mb-8 space-y-4 animate-fade-in-delay-1">
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 transform -translate-y-1/2"
              style={{ color: "var(--text-secondary)" }}
            />
            <input
              type="text"
              placeholder="Search colleges by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="px-4 py-2 rounded-lg border-2 bg-black focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Countries</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 rounded-lg border-2 bg-black focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Types</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>

            <select
              value={filters.acceptanceRate}
              onChange={(e) => setFilters({ ...filters, acceptanceRate: e.target.value })}
              className="px-4 py-2 rounded-lg border-2 bg-black focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">All Acceptance Rates</option>
              <option value="low">Highly Selective (&lt;20%)</option>
              <option value="medium">Moderately Selective (20-50%)</option>
              <option value="high">Less Selective (&gt;50%)</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({ country: "", type: "", acceptanceRate: "" });
              }}
              className="px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-secondary)",
              }}
            >
              Clear Filters
            </button>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Showing {filteredColleges.length} of {colleges.length} colleges
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((college, index) => (
            <div key={college._id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <CollegeCard
                college={college}
                onViewInsights={handleViewInsights}
                onAddToList={handleAddToList}
              />
            </div>
          ))}
        </div>

        {filteredColleges.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
              No colleges found matching your criteria
            </p>
          </div>
        )}
      </div>

      {showInsightsModal && selectedCollege && (
        <CollegeInsightsModal
          college={selectedCollege}
          onClose={() => {
            setShowInsightsModal(false);
            setSelectedCollege(null);
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
