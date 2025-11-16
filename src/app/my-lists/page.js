"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import CollegeInsightsModal from "../components/CollegeInsightsModal";
import ScholarshipDetailsModal from "../components/ScholarshipDetailsModal";
import ExtracurricularDetailsModal from "../components/ExtracurricularDetailsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faGraduationCap, 
  faBook, 
  faTrophy, 
  faCalendar,
  faTrash,
  faEye,
  faChevronLeft,
  faChevronRight,
  faCheck
} from "@fortawesome/free-solid-svg-icons";

export default function MyListsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendar"); // colleges, scholarships, extracurriculars, calendar
  const [toast, setToast] = useState(null);

  const [savedColleges, setSavedColleges] = useState([]);
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [savedExtracurriculars, setSavedExtracurriculars] = useState([]);
  
  const [completedColleges, setCompletedColleges] = useState([]);
  const [completedScholarships, setCompletedScholarships] = useState([]);
  const [completedExtracurriculars, setCompletedExtracurriculars] = useState([]);

  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showCollegeInsights, setShowCollegeInsights] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [showScholarshipDetails, setShowScholarshipDetails] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

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
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchSavedColleges(),
        fetchSavedScholarships(),
        fetchSavedExtracurriculars(),
        fetchCompletedItems()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedItems = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      console.log("Fetched profile for completed items:", data);
      if (data.success && data.profile) {
        console.log("Completed colleges:", data.profile.completedColleges || []);
        console.log("Completed scholarships:", data.profile.completedScholarships || []);
        console.log("Completed extracurriculars:", data.profile.completedExtracurriculars || []);
        setCompletedColleges(data.profile.completedColleges || []);
        setCompletedScholarships(data.profile.completedScholarships || []);
        setCompletedExtracurriculars(data.profile.completedExtracurriculars || []);
      }
    } catch (error) {
      console.error("Error fetching completed items:", error);
    }
  };

  const fetchSavedColleges = async () => {
    try {
      const response = await fetch("/api/user-colleges");
      const data = await response.json();
      console.log("Fetched colleges data:", data);
      if (data.success) {
        setSavedColleges(data.colleges || []);
      }
    } catch (error) {
      console.error("Error fetching saved colleges:", error);
    }
  };

  const fetchSavedScholarships = async () => {
    try {
      const response = await fetch("/api/user-scholarships");
      const data = await response.json();
      console.log("Fetched scholarships data:", data);
      if (data.success) {
        setSavedScholarships(data.scholarships || []);
      }
    } catch (error) {
      console.error("Error fetching saved scholarships:", error);
    }
  };

  const fetchSavedExtracurriculars = async () => {
    try {
      const response = await fetch("/api/user-extracurriculars");
      const data = await response.json();
      console.log("Fetched extracurriculars data:", data);
      if (data.success) {
        setSavedExtracurriculars(data.extracurriculars || []);
      }
    } catch (error) {
      console.error("Error fetching saved extracurriculars:", error);
    }
  };

  const handleRemoveCollege = async (collegeId) => {
    try {
      const response = await fetch("/api/user-colleges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId })
      });

      if (response.ok) {
        setSavedColleges(savedColleges.filter(c => c._id !== collegeId));
        setToast({ message: "College removed from your list", type: "success" });
      }
    } catch (error) {
      console.error("Error removing college:", error);
      setToast({ message: "Failed to remove college", type: "error" });
    }
  };

  const handleRemoveScholarship = async (scholarshipId) => {
    try {
      const response = await fetch("/api/user-scholarships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId })
      });

      if (response.ok) {
        setSavedScholarships(savedScholarships.filter(s => s._id !== scholarshipId));
        setToast({ message: "Scholarship removed from your list", type: "success" });
      }
    } catch (error) {
      console.error("Error removing scholarship:", error);
      setToast({ message: "Failed to remove scholarship", type: "error" });
    }
  };

  const handleRemoveExtracurricular = async (activityId) => {
    try {
      const response = await fetch("/api/user-extracurriculars", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId })
      });

      if (response.ok) {
        setSavedExtracurriculars(savedExtracurriculars.filter(a => a._id !== activityId));
        setToast({ message: "Activity removed from your list", type: "success" });
      }
    } catch (error) {
      console.error("Error removing activity:", error);
      setToast({ message: "Failed to remove activity", type: "error" });
    }
  };

  const handleMarkCollegeAsDone = async (college) => {
    try {
      const updatedCompleted = [...completedColleges, college];
      console.log("Marking college as done:", college.name);
      console.log("Updated completed colleges array:", updatedCompleted);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          field: 'completedColleges',
          value: updatedCompleted
        })
      });

      const result = await response.json();
      console.log("PUT response:", result);

      if (response.ok) {
        setSavedColleges(savedColleges.filter(c => c._id !== college._id));
        setCompletedColleges(updatedCompleted);
        setToast({ message: "College application marked as completed!", type: "success" });
      } else {
        setToast({ message: "Failed to mark as completed", type: "error" });
      }
    } catch (error) {
      console.error("Error marking college as done:", error);
      setToast({ message: "Failed to mark as completed", type: "error" });
    }
  };

  const handleMarkScholarshipAsDone = async (scholarship) => {
    try {
      const updatedCompleted = [...completedScholarships, scholarship];
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          field: 'completedScholarships',
          value: updatedCompleted
        })
      });

      if (response.ok) {
        setSavedScholarships(savedScholarships.filter(s => s._id !== scholarship._id));
        setCompletedScholarships(updatedCompleted);
        setToast({ message: "Scholarship application marked as completed!", type: "success" });
      } else {
        setToast({ message: "Failed to mark as completed", type: "error" });
      }
    } catch (error) {
      console.error("Error marking scholarship as done:", error);
      setToast({ message: "Failed to mark as completed", type: "error" });
    }
  };

  const handleMarkExtracurricularAsDone = async (activity) => {
    try {
      const updatedCompleted = [...completedExtracurriculars, activity];
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          field: 'completedExtracurriculars',
          value: updatedCompleted
        })
      });

      if (response.ok) {
        setSavedExtracurriculars(savedExtracurriculars.filter(a => a._id !== activity._id));
        setCompletedExtracurriculars(updatedCompleted);
        setToast({ message: "Activity marked as completed!", type: "success" });
      } else {
        setToast({ message: "Failed to mark as completed", type: "error" });
      }
    } catch (error) {
      console.error("Error marking activity as done:", error);
      setToast({ message: "Failed to mark as completed", type: "error" });
    }
  };

  const handleUndoCollegeCompletion = async (college) => {
    try {
      const updatedCompleted = completedColleges.filter(c => c._id !== college._id);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          field: 'completedColleges',
          value: updatedCompleted
        })
      });

      if (response.ok) {
        setCompletedColleges(updatedCompleted);
        setSavedColleges([...savedColleges, college]);
        setToast({ message: "Moved back to active list", type: "info" });
      } else {
        setToast({ message: "Failed to undo completion", type: "error" });
      }
    } catch (error) {
      console.error("Error undoing college completion:", error);
      setToast({ message: "Failed to undo completion", type: "error" });
    }
  };

  const handleUndoScholarshipCompletion = async (scholarship) => {
    try {
      const updatedCompleted = completedScholarships.filter(s => s._id !== scholarship._id);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          field: 'completedScholarships',
          value: updatedCompleted
        })
      });

      if (response.ok) {
        setCompletedScholarships(updatedCompleted);
        setSavedScholarships([...savedScholarships, scholarship]);
        setToast({ message: "Moved back to active list", type: "info" });
      } else {
        setToast({ message: "Failed to undo completion", type: "error" });
      }
    } catch (error) {
      console.error("Error undoing scholarship completion:", error);
      setToast({ message: "Failed to undo completion", type: "error" });
    }
  };

  const handleUndoExtracurricularCompletion = async (activity) => {
    try {
      const updatedCompleted = completedExtracurriculars.filter(a => a._id !== activity._id);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          field: 'completedExtracurriculars',
          value: updatedCompleted
        })
      });

      if (response.ok) {
        setCompletedExtracurriculars(updatedCompleted);
        setSavedExtracurriculars([...savedExtracurriculars, activity]);
        setToast({ message: "Moved back to active list", type: "info" });
      } else {
        setToast({ message: "Failed to undo completion", type: "error" });
      }
    } catch (error) {
      console.error("Error undoing activity completion:", error);
      setToast({ message: "Failed to undo completion", type: "error" });
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getDeadlinesForDate = (date) => {
    const deadlines = [];
    const seenIds = new Set();
    const dateStr = date.toISOString().split('T')[0];

    savedColleges.forEach(college => {
      if (college.deadlines && Array.isArray(college.deadlines)) {
        college.deadlines.forEach((deadline, idx) => {
          if (deadline.date) {
            const deadlineDate = new Date(deadline.date).toISOString().split('T')[0];
            if (deadlineDate === dateStr) {
              const uniqueId = `college-${college._id}-${idx}`;
              if (!seenIds.has(uniqueId)) {
                seenIds.add(uniqueId);
                deadlines.push({
                  type: 'college',
                  name: college.name,
                  detail: deadline.type,
                  color: '#60a5fa',
                  date: new Date(deadline.date),
                  id: uniqueId
                });
              }
            }
          }
        });
      }
    });

    savedScholarships.forEach(scholarship => {
      if (scholarship.deadline) {
        const deadlineDate = new Date(scholarship.deadline).toISOString().split('T')[0];
        if (deadlineDate === dateStr) {
          const uniqueId = `scholarship-${scholarship._id}`;
          if (!seenIds.has(uniqueId)) {
            seenIds.add(uniqueId);
            deadlines.push({
              type: 'scholarship',
              name: scholarship.name,
              detail: 'Application Due',
              color: '#10b981',
              date: new Date(scholarship.deadline),
              id: uniqueId
            });
          }
        }
      }
    });

    savedExtracurriculars.forEach(activity => {
      if (activity.date) {
        const activityDate = new Date(activity.date).toISOString().split('T')[0];
        if (activityDate === dateStr) {
          const uniqueId = `extracurricular-${activity._id}`;
          if (!seenIds.has(uniqueId)) {
            seenIds.add(uniqueId);
            deadlines.push({
              type: 'extracurricular',
              name: activity.name,
              detail: 'Event Date',
              color: '#f59e0b',
              date: new Date(activity.date),
              id: uniqueId
            });
          }
        }
      }
    });

    return deadlines;
  };

  const getAllDeadlines = () => {
    const allDeadlines = [];
    const seenIds = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    savedColleges.forEach(college => {
      if (college.deadlines && Array.isArray(college.deadlines)) {
        college.deadlines.forEach((deadline, idx) => {
          if (deadline.date) {
            const uniqueId = `college-${college._id}-${idx}`;
            if (!seenIds.has(uniqueId)) {
              seenIds.add(uniqueId);
              allDeadlines.push({
                type: 'college',
                name: college.name,
                detail: deadline.type,
                color: '#60a5fa',
                date: new Date(deadline.date),
                id: uniqueId
              });
            }
          }
        });
      }
    });

    savedScholarships.forEach(scholarship => {
      if (scholarship.deadline) {
        const uniqueId = `scholarship-${scholarship._id}`;
        if (!seenIds.has(uniqueId)) {
          seenIds.add(uniqueId);
          allDeadlines.push({
            type: 'scholarship',
            name: scholarship.name,
            detail: 'Application Due',
            color: '#10b981',
            date: new Date(scholarship.deadline),
            id: uniqueId
          });
        }
      }
    });

    savedExtracurriculars.forEach(activity => {
      if (activity.date) {
        const uniqueId = `extracurricular-${activity._id}`;
        if (!seenIds.has(uniqueId)) {
          seenIds.add(uniqueId);
          allDeadlines.push({
            type: 'extracurricular',
            name: activity.name,
            detail: 'Event Date',
            color: '#f59e0b',
            date: new Date(activity.date),
            id: uniqueId
          });
        }
      }
    });

    return allDeadlines.sort((a, b) => a.date - b.date);
  };

  const getPassedDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getAllDeadlines().filter(deadline => deadline.date < today);
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getAllDeadlines().filter(deadline => deadline.date >= today);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const weeks = [];
    let days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-20 p-1" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const deadlines = getDeadlinesForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className="min-h-20 p-1 border transition-colors"
          style={{
            borderColor: isToday ? "var(--text-primary)" : "rgba(255, 255, 255, 0.1)",
            backgroundColor: isToday ? "rgba(255, 255, 255, 0.05)" : "transparent"
          }}
        >
          <div className="h-full flex flex-col">
            <span
              className="text-xs font-semibold mb-1"
              style={{ color: isToday ? "var(--text-primary)" : "var(--text-secondary)" }}
            >
              {day}
            </span>
            <div className="flex-1 space-y-0.5 overflow-y-auto">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="text-xs px-1 py-0.5 rounded truncate"
                  style={{
                    backgroundColor: deadline.color + "20",
                    borderLeft: `2px solid ${deadline.color}`,
                    color: deadline.color,
                    fontSize: "9px",
                    lineHeight: "1.2"
                  }}
                  title={`${deadline.name} - ${deadline.detail}`}
                >
                  {deadline.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      if (days.length === 7) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-0">
            {days}
          </div>
        );
        days = [];
      }
    }

    if (days.length > 0) {
      while (days.length < 7) {
        days.push(<div key={`empty-end-${days.length}`} className="min-h-20 p-1" />);
      }
      weeks.push(
        <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
    }

    return weeks;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "var(--primary-bg)" }}
      >
        <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
          Loading your lists...
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
            My Lists
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Manage your saved colleges, scholarships, and activities
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:flex gap-2 mb-8 animate-fade-in-delay-1">
          {[
            { id: "colleges", label: "Colleges", shortLabel: "Colleges", icon: faGraduationCap, count: savedColleges.length },
            { id: "scholarships", label: "Scholarships", shortLabel: "Scholar.", icon: faBook, count: savedScholarships.length },
            { id: "extracurriculars", label: "Activities", shortLabel: "Activities", icon: faTrophy, count: savedExtracurriculars.length },
            { id: "calendar", label: "Calendar", shortLabel: "Calendar", icon: faCalendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2"
              style={{
                backgroundColor: activeTab === tab.id ? "rgba(255, 255, 255, 0.1)" : "transparent",
                borderWidth: "2px",
                borderColor: activeTab === tab.id ? "var(--text-primary)" : "rgba(255, 255, 255, 0.2)",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)"
              }}
            >
              <FontAwesomeIcon icon={tab.icon} className="w-3 sm:w-4" />
              <span className="font-semibold text-xs sm:text-sm hidden sm:inline">{tab.label}</span>
              <span className="font-semibold text-xs sm:hidden">{tab.shortLabel}</span>
              {tab.count !== undefined && (
                <span
                  className="px-1.5 sm:px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)"
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Colleges Tab */}
        {activeTab === "colleges" && (
          <div className="animate-fade-in-delay-2">
            {savedColleges.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  className="w-16 h-16 mb-4 opacity-50"
                  style={{ color: "var(--text-secondary)" }}
                />
                <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
                  No saved colleges yet. Visit the Colleges page to add some!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedColleges.map(college => (
                  <div
                    key={college._id}
                    className="border-2 rounded-lg overflow-hidden hover:border-white/40 transition-all"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    {college.thumbnail && (
                      <div className="w-full h-32 overflow-hidden bg-black/50">
                        <img 
                          src={college.thumbnail} 
                          alt={college.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3
                        className="font-bold mb-2"
                        style={{ color: "var(--text-primary)", fontSize: "18px" }}
                      >
                        {college.name}
                      </h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "12px" }}>
                        {typeof college.location === 'string' 
                          ? college.location 
                          : [college.location?.city, college.location?.state, college.location?.country]
                              .filter(Boolean)
                              .join(', ')
                        }
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCollege(college);
                            setShowCollegeInsights(true);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm"
                          style={{
                            borderColor: "rgba(255, 255, 255, 0.3)",
                            color: "var(--text-primary)"
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 mr-2" />
                          View
                        </button>
                        <button
                          onClick={() => handleMarkCollegeAsDone(college)}
                          className="px-3 py-2 rounded-lg border-2 hover:bg-green-500/20 transition-all text-sm"
                          style={{
                            borderColor: "#10b981",
                            color: "#10b981"
                          }}
                          title="Mark as done"
                        >
                          <FontAwesomeIcon icon={faCheck} className="w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveCollege(college._id)}
                          className="px-3 py-2 rounded-lg border-2 hover:bg-red-500/20 transition-all text-sm"
                          style={{
                            borderColor: "#ef4444",
                            color: "#ef4444"
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scholarships Tab */}
        {activeTab === "scholarships" && (
          <div className="animate-fade-in-delay-2">
            {savedScholarships.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon
                  icon={faBook}
                  className="w-16 h-16 mb-4 opacity-50"
                  style={{ color: "var(--text-secondary)" }}
                />
                <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
                  No saved scholarships yet. Visit the Scholarships page to add some!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedScholarships.map(scholarship => (
                  <div
                    key={scholarship._id}
                    className="border-2 rounded-lg overflow-hidden hover:border-white/40 transition-all"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    {scholarship.thumbnail && (
                      <div className="w-full h-32 overflow-hidden bg-black/50">
                        <img 
                          src={scholarship.thumbnail} 
                          alt={scholarship.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3
                        className="font-bold mb-2"
                        style={{ color: "var(--text-primary)", fontSize: "18px" }}
                      >
                        {scholarship.name}
                      </h3>
                      {scholarship.deadline && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "12px" }}>
                          Deadline: {new Date(scholarship.deadline).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedScholarship(scholarship);
                            setShowScholarshipDetails(true);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm"
                          style={{
                            borderColor: "rgba(255, 255, 255, 0.3)",
                            color: "var(--text-primary)"
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 mr-2" />
                          View
                        </button>
                        <button
                          onClick={() => handleMarkScholarshipAsDone(scholarship)}
                          className="px-3 py-2 rounded-lg border-2 hover:bg-green-500/20 transition-all text-sm"
                          style={{
                            borderColor: "#10b981",
                            color: "#10b981"
                          }}
                          title="Mark as done"
                        >
                          <FontAwesomeIcon icon={faCheck} className="w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveScholarship(scholarship._id)}
                          className="px-3 py-2 rounded-lg border-2 hover:bg-red-500/20 transition-all text-sm"
                          style={{
                            borderColor: "#ef4444",
                            color: "#ef4444"
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Extracurriculars Tab */}
        {activeTab === "extracurriculars" && (
          <div className="animate-fade-in-delay-2">
            {savedExtracurriculars.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon
                  icon={faTrophy}
                  className="w-16 h-16 mb-4 opacity-50"
                  style={{ color: "var(--text-secondary)" }}
                />
                <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
                  No saved activities yet. Visit the Extracurriculars page to add some!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedExtracurriculars.map(activity => (
                  <div
                    key={activity._id}
                    className="border-2 rounded-lg overflow-hidden hover:border-white/40 transition-all"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    {activity.thumbnail && (
                      <div className="w-full h-32 overflow-hidden bg-black/50">
                        <img 
                          src={activity.thumbnail} 
                          alt={activity.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3
                        className="font-bold mb-2"
                        style={{ color: "var(--text-primary)", fontSize: "18px" }}
                      >
                        {activity.name}
                      </h3>
                      {activity.date && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "12px" }}>
                          Date: {new Date(activity.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowActivityDetails(true);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm"
                          style={{
                            borderColor: "rgba(255, 255, 255, 0.3)",
                            color: "var(--text-primary)"
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 mr-2" />
                          View
                        </button>
                        <button
                          onClick={() => handleMarkExtracurricularAsDone(activity)}
                          className="px-3 py-2 rounded-lg border-2 hover:bg-green-500/20 transition-all text-sm"
                          style={{
                            borderColor: "#10b981",
                            color: "#10b981"
                          }}
                          title="Mark as done"
                        >
                          <FontAwesomeIcon icon={faCheck} className="w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveExtracurricular(activity._id)}
                          className="px-3 py-2 rounded-lg border-2 hover:bg-red-500/20 transition-all text-sm"
                          style={{
                            borderColor: "#ef4444",
                            color: "#ef4444"
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="space-y-6 animate-fade-in-delay-2">
            {/* Upcoming Deadlines */}
            <div>
              <h2 
                className="font-bold text-xl mb-4"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
              >
                Upcoming Deadlines
              </h2>
              {getUpcomingDeadlines().length === 0 ? (
                <div 
                  className="border-2 rounded-lg p-6 text-center"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <p style={{ color: "var(--text-secondary)" }}>No upcoming deadlines</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getUpcomingDeadlines().map((deadline) => (
                    <div
                      key={deadline.id}
                      className="border-2 rounded-lg p-4 flex items-center justify-between hover:border-white/40 transition-all"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        backgroundColor: "rgba(0, 0, 0, 0.3)"
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-2 h-12 rounded"
                          style={{ backgroundColor: deadline.color }}
                        />
                        <div>
                          <h3 
                            className="font-bold"
                            style={{ color: "var(--text-primary)", fontSize: "16px" }}
                          >
                            {deadline.name}
                          </h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                            {deadline.detail}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p 
                          className="font-semibold"
                          style={{ color: "var(--text-primary)", fontSize: "14px" }}
                        >
                          {deadline.date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                          {Math.ceil((deadline.date - new Date()) / (1000 * 60 * 60 * 24))} days left
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Passed Deadlines */}
            <div>
              <h2 
                className="font-bold text-xl mb-4"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
              >
                Passed Deadlines
              </h2>
              {getPassedDeadlines().length === 0 ? (
                <div 
                  className="border-2 rounded-lg p-6 text-center"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <p style={{ color: "var(--text-secondary)" }}>No passed deadlines</p>
                </div>
              ) : (
                <div className="space-y-2 opacity-60">
                  {getPassedDeadlines().reverse().slice(0, 10).map((deadline) => (
                    <div
                      key={deadline.id}
                      className="border-2 rounded-lg p-4 flex items-center justify-between"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        backgroundColor: "rgba(0, 0, 0, 0.3)"
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-2 h-12 rounded"
                          style={{ backgroundColor: deadline.color }}
                        />
                        <div>
                          <h3 
                            className="font-bold"
                            style={{ color: "var(--text-primary)", fontSize: "16px" }}
                          >
                            {deadline.name}
                          </h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                            {deadline.detail}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p 
                          className="font-semibold"
                          style={{ color: "var(--text-primary)", fontSize: "14px" }}
                        >
                          {deadline.date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p style={{ color: "#ef4444", fontSize: "12px" }}>
                          Passed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Applications & Activities */}
            <div>
              <h2 
                className="font-bold text-xl mb-4"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
              >
                Completed Applications & Activities
              </h2>
              {completedColleges.length === 0 && completedScholarships.length === 0 && completedExtracurriculars.length === 0 ? (
                <div 
                  className="border-2 rounded-lg p-6 text-center"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <p style={{ color: "var(--text-secondary)" }}>No completed items yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Completed Colleges */}
                  {completedColleges.map((college, idx) => (
                    <div
                      key={`college-${idx}`}
                      className="border-2 rounded-lg p-4 flex items-center justify-between hover:border-white/40 transition-all"
                      style={{
                        borderColor: "rgba(96, 165, 250, 0.3)",
                        backgroundColor: "rgba(96, 165, 250, 0.05)"
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-12 rounded" style={{ backgroundColor: "#60a5fa" }} />
                        <div>
                          <h3 className="font-bold" style={{ color: "var(--text-primary)", fontSize: "16px" }}>
                            {college.name}
                          </h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                            College Application
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUndoCollegeCompletion(college)}
                        className="px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.3)",
                          color: "var(--text-primary)"
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ))}

                  {/* Completed Scholarships */}
                  {completedScholarships.map((scholarship, idx) => (
                    <div
                      key={`scholarship-${idx}`}
                      className="border-2 rounded-lg p-4 flex items-center justify-between hover:border-white/40 transition-all"
                      style={{
                        borderColor: "rgba(16, 185, 129, 0.3)",
                        backgroundColor: "rgba(16, 185, 129, 0.05)"
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-12 rounded" style={{ backgroundColor: "#10b981" }} />
                        <div>
                          <h3 className="font-bold" style={{ color: "var(--text-primary)", fontSize: "16px" }}>
                            {scholarship.name}
                          </h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                            Scholarship Application
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUndoScholarshipCompletion(scholarship)}
                        className="px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.3)",
                          color: "var(--text-primary)"
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ))}

                  {/* Completed Extracurriculars */}
                  {completedExtracurriculars.map((activity, idx) => (
                    <div
                      key={`activity-${idx}`}
                      className="border-2 rounded-lg p-4 flex items-center justify-between hover:border-white/40 transition-all"
                      style={{
                        borderColor: "rgba(245, 158, 11, 0.3)",
                        backgroundColor: "rgba(245, 158, 11, 0.05)"
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-12 rounded" style={{ backgroundColor: "#f59e0b" }} />
                        <div>
                          <h3 className="font-bold" style={{ color: "var(--text-primary)", fontSize: "16px" }}>
                            {activity.name}
                          </h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                            Activity
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUndoExtracurricularCompletion(activity)}
                        className="px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.3)",
                          color: "var(--text-primary)"
                        }}
                      >
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar View */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="font-bold text-xl"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  Calendar View
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>
                  
                  <span
                    className="font-semibold text-lg px-4"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                  >
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className="border-2 rounded-lg overflow-hidden max-w-4xl mx-auto"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(0, 0, 0, 0.3)"
                }}
              >
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div
                      key={day}
                      className="p-1 sm:p-2 text-center font-semibold"
                      style={{ color: "var(--text-primary)", fontSize: "12px" }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                {renderCalendar()}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#60a5fa" }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Colleges</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Scholarships</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Activities</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCollegeInsights && selectedCollege && (
        <CollegeInsightsModal
          college={selectedCollege}
          onClose={() => {
            setShowCollegeInsights(false);
            setSelectedCollege(null);
          }}
        />
      )}

      {showScholarshipDetails && selectedScholarship && (
        <ScholarshipDetailsModal
          scholarship={selectedScholarship}
          onClose={() => {
            setShowScholarshipDetails(false);
            setSelectedScholarship(null);
          }}
        />
      )}

      {showActivityDetails && selectedActivity && (
        <ExtracurricularDetailsModal
          activity={selectedActivity}
          onClose={() => {
            setShowActivityDetails(false);
            setSelectedActivity(null);
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
