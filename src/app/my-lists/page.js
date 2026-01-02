"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  faCheck,
  faLink,
  faExternalLinkAlt,
  faPlus,
  faEdit,
  faCopy,
  faSearch
} from "@fortawesome/free-solid-svg-icons";

// Component to render sensitive text with censoring
const SensitiveText = ({ text }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (textToCopy, id) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseText = (input) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let id = 0;

    while ((match = regex.exec(input)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'normal',
          text: input.substring(lastIndex, match.index)
        });
      }

      // Add sensitive text
      parts.push({
        type: 'sensitive',
        text: match[1],
        id: id++
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < input.length) {
      parts.push({
        type: 'normal',
        text: input.substring(lastIndex)
      });
    }

    return parts;
  };

  const parts = parseText(text);

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((part, index) => {
        if (part.type === 'normal') {
          return <span key={index}>{part.text}</span>;
        } else {
          return (
            <span
              key={index}
              onClick={() => handleCopy(part.text, part.id)}
              className="group relative inline-flex items-center cursor-pointer"
              style={{
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.2s"
              }}
              title="Click to copy"
            >
              <span className="group-hover:hidden" style={{ color: "var(--text-secondary)" }}>
                {'•'.repeat(Math.min(part.text.length, 8))}
              </span>
              <span className="hidden group-hover:inline" style={{ color: "var(--text-primary)" }}>
                {part.text}
              </span>
              <FontAwesomeIcon 
                icon={faCopy} 
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: "10px", color: "var(--text-subtle)" }}
              />
              {copiedId === part.id && (
                <span 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap"
                  style={{ backgroundColor: "#10b981", color: "white" }}
                >
                  Copied!
                </span>
              )}
            </span>
          );
        }
      })}
    </span>
  );
};

export default function MyListsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendar");
  const [toast, setToast] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);

  const [savedColleges, setSavedColleges] = useState([]);
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [savedExtracurriculars, setSavedExtracurriculars] = useState([]);
  const [savedLinks, setSavedLinks] = useState([]);
  
  const [completedColleges, setCompletedColleges] = useState([]);
  const [completedScholarships, setCompletedScholarships] = useState([]);
  const [completedExtracurriculars, setCompletedExtracurriculars] = useState([]);
  
  const [dataLoaded, setDataLoaded] = useState({
    colleges: false,
    scholarships: false,
    extracurriculars: false,
    links: false,
    completed: false
  });

  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showCollegeInsights, setShowCollegeInsights] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [showScholarshipDetails, setShowScholarshipDetails] = useState(false);
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkFormData, setLinkFormData] = useState({
    label: '',
    url: '',
    type: 'Applicant Portal',
    customType: '',
    notes: ''
  });
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkTypeFilter, setLinkTypeFilter] = useState('All');
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
      fetchCompletedItems().finally(() => setLoading(false));
      loadTabData(activeTab);
    }
  }, [user]);

  const loadTabData = useCallback(async (tab) => {
    if (!user) return;
    
    setTabLoading(true);
    try {
      if (tab === "colleges" && !dataLoaded.colleges) {
        await fetchSavedColleges();
        setDataLoaded(prev => ({ ...prev, colleges: true }));
      } else if (tab === "scholarships" && !dataLoaded.scholarships) {
        await fetchSavedScholarships();
        setDataLoaded(prev => ({ ...prev, scholarships: true }));
      } else if (tab === "extracurriculars" && !dataLoaded.extracurriculars) {
        await fetchSavedExtracurriculars();
        setDataLoaded(prev => ({ ...prev, extracurriculars: true }));
      } else if (tab === "links" && !dataLoaded.links) {
        await fetchSavedLinks();
        setDataLoaded(prev => ({ ...prev, links: true }));
      } else if (tab === "calendar") {
        const promises = [];
        if (!dataLoaded.colleges) promises.push(fetchSavedColleges().then(() => setDataLoaded(prev => ({ ...prev, colleges: true }))));
        if (!dataLoaded.scholarships) promises.push(fetchSavedScholarships().then(() => setDataLoaded(prev => ({ ...prev, scholarships: true }))));
        if (!dataLoaded.extracurriculars) promises.push(fetchSavedExtracurriculars().then(() => setDataLoaded(prev => ({ ...prev, extracurriculars: true }))));
        if (!dataLoaded.links) promises.push(fetchSavedLinks().then(() => setDataLoaded(prev => ({ ...prev, links: true }))));
        await Promise.all(promises);
      }
    } catch (error) {
      console.error("Error loading tab data:", error);
    } finally {
      setTabLoading(false);
    }
  }, [user, dataLoaded]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const fetchCompletedItems = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.success && data.profile) {
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
      if (data.success) {
        setSavedExtracurriculars(data.extracurriculars || []);
      }
    } catch (error) {
      console.error("Error fetching saved extracurriculars:", error);
    }
  };

  const fetchSavedLinks = async () => {
    try {
      const response = await fetch("/api/links");
      const data = await response.json();
      if (data.success) {
        setSavedLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error fetching saved links:", error);
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
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          field: 'completedColleges',
          value: updatedCompleted
        })
      });

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

  const handleOpenLinkModal = (link = null) => {
    if (link) {
      setEditingLink(link);
      setLinkFormData({
        label: link.label,
        url: link.url,
        type: link.type,
        customType: link.customType || '',
        notes: link.notes || ''
      });
    } else {
      setEditingLink(null);
      setLinkFormData({
        label: '',
        url: '',
        type: 'Applicant Portal',
        customType: '',
        notes: ''
      });
    }
    setShowLinkModal(true);
  };

  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
    setEditingLink(null);
    setLinkFormData({
      label: '',
      url: '',
      type: 'Applicant Portal',
      customType: '',
      notes: ''
    });
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        label: linkFormData.label,
        url: linkFormData.url,
        type: linkFormData.type,
        customType: linkFormData.customType,
        notes: linkFormData.notes
      };

      if (editingLink) {
        payload.linkId = editingLink._id;
        const response = await fetch("/api/links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          await fetchSavedLinks();
          handleCloseLinkModal();
          setToast({ message: "Link updated successfully!", type: "success" });
        } else {
          const data = await response.json();
          setToast({ message: data.error || "Failed to update link", type: "error" });
        }
      } else {
        const response = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          await fetchSavedLinks();
          handleCloseLinkModal();
          setToast({ message: "Link added successfully!", type: "success" });
        } else {
          const data = await response.json();
          setToast({ message: data.error || "Failed to add link", type: "error" });
        }
      }
    } catch (error) {
      console.error("Error saving link:", error);
      setToast({ message: "Failed to save link", type: "error" });
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm("Are you sure you want to delete this link?")) {
      return;
    }

    try {
      const response = await fetch("/api/links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId })
      });

      if (response.ok) {
        setSavedLinks(savedLinks.filter(l => l._id !== linkId));
        setToast({ message: "Link deleted successfully!", type: "success" });
      } else {
        setToast({ message: "Failed to delete link", type: "error" });
      }
    } catch (error) {
      console.error("Error deleting link:", error);
      setToast({ message: "Failed to delete link", type: "error" });
    }
  };

  const getDaysInMonth = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  }, []);

  const getDeadlinesForDate = useCallback((date) => {
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
  }, [savedColleges, savedScholarships, savedExtracurriculars]);

  const getAllDeadlines = useMemo(() => {
    const allDeadlines = [];
    const seenIds = new Set();

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
  }, [savedColleges, savedScholarships, savedExtracurriculars]);

  const getPassedDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getAllDeadlines.filter(deadline => deadline.date < today);
  }, [getAllDeadlines]);

  const getUpcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getAllDeadlines.filter(deadline => deadline.date >= today);
  }, [getAllDeadlines]);

  const previousMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }, [currentDate]);

  const nextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }, [currentDate]);

  const renderCalendar = useMemo(() => {
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
  }, [currentDate, getDeadlinesForDate, getDaysInMonth]);

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
            { id: "calendar", label: "Calendar", shortLabel: "Calendar", icon: faCalendar },
            { id: "colleges", label: "Colleges", shortLabel: "Colleges", icon: faGraduationCap, count: savedColleges.length },
            { id: "scholarships", label: "Scholarships", shortLabel: "Scholar.", icon: faBook, count: savedScholarships.length },
            { id: "extracurriculars", label: "Activities", shortLabel: "Activities", icon: faTrophy, count: savedExtracurriculars.length },
            { id: "links", label: "Links", shortLabel: "Links", icon: faLink, count: savedLinks.length }
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
            {tabLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
                  Loading colleges...
                </div>
              </div>
            ) : savedColleges.length === 0 ? (
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
                      <div className="w-full h-32 overflow-hidden bg-black/50 relative">
                        <Image 
                          src={college.thumbnail} 
                          alt={college.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjwvc3ZnPg=="
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
            {tabLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
                  Loading scholarships...
                </div>
              </div>
            ) : savedScholarships.length === 0 ? (
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
                      <div className="w-full h-32 overflow-hidden bg-black/50 relative">
                        <Image 
                          src={scholarship.thumbnail} 
                          alt={scholarship.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjwvc3ZnPg=="
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
            {tabLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
                  Loading activities...
                </div>
              </div>
            ) : savedExtracurriculars.length === 0 ? (
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
                      <div className="w-full h-32 overflow-hidden bg-black/50 relative">
                        <Image 
                          src={activity.thumbnail} 
                          alt={activity.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjwvc3ZnPg=="
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

        {/* Links Tab */}
        {activeTab === "links" && (
          <div className="animate-fade-in-delay-2">
            <div className="mb-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 
                  className="font-bold text-xl"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  My Links
                </h2>
                <button
                  onClick={() => handleOpenLinkModal()}
                  className="px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-all flex items-center gap-2 whitespace-nowrap"
                  style={{
                    borderColor: "var(--text-primary)",
                    color: "var(--text-primary)"
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} className="w-4" />
                  <span>Add Link</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search links..."
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors text-sm"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "var(--text-primary)"
                    }}
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-subtle)", fontSize: "14px" }}
                  />
                </div>
                <select
                  value={linkTypeFilter}
                  onChange={(e) => setLinkTypeFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer text-sm sm:w-64"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)",
                    backgroundColor: "var(--primary-bg)"
                  }}
                >
                  <option value="All" style={{ backgroundColor: "var(--primary-bg)" }}>All Types</option>
                  <option value="Applicant Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Applicant Portal</option>
                  <option value="Financial Aid Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Financial Aid Portal</option>
                  <option value="Scholarship Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Scholarship Portal</option>
                  <option value="Student Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Student Portal</option>
                  <option value="Application Status" style={{ backgroundColor: "var(--primary-bg)" }}>Application Status</option>
                  <option value="Document Upload" style={{ backgroundColor: "var(--primary-bg)" }}>Document Upload</option>
                  <option value="Test Scores" style={{ backgroundColor: "var(--primary-bg)" }}>Test Scores</option>
                  <option value="Housing Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Housing Portal</option>
                  <option value="Registration" style={{ backgroundColor: "var(--primary-bg)" }}>Registration</option>
                  <option value="Other" style={{ backgroundColor: "var(--primary-bg)" }}>Other</option>
                </select>
              </div>
            </div>

            {tabLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
                  Loading links...
                </div>
              </div>
            ) : savedLinks.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon
                  icon={faLink}
                  className="w-16 h-16 mb-4 opacity-50"
                  style={{ color: "var(--text-secondary)" }}
                />
                <p style={{ color: "var(--text-secondary)", fontSize: "18px" }}>
                  No links saved yet
                </p>
                <p className="mt-2" style={{ color: "var(--text-subtle)", fontSize: "14px" }}>
                  Add important links like applicant portals and financial aid pages
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedLinks
                  .filter(link => {
                    // Apply type filter
                    if (linkTypeFilter !== 'All' && link.type !== linkTypeFilter) {
                      return false;
                    }
                    // Apply search filter
                    if (!linkSearchQuery) return true;
                    const query = linkSearchQuery.toLowerCase();
                    return (
                      link.label.toLowerCase().includes(query) ||
                      link.url.toLowerCase().includes(query) ||
                      link.type.toLowerCase().includes(query) ||
                      (link.customType && link.customType.toLowerCase().includes(query)) ||
                      (link.notes && link.notes.toLowerCase().includes(query))
                    );
                  })
                  .map((link) => (
                  <div
                    key={link._id}
                    className="p-4 rounded-lg border-2 hover:border-white/40 transition-all"
                    style={{
                      backgroundColor: "var(--card-bg)",
                      borderColor: "var(--card-border)"
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 
                          className="font-bold text-lg mb-1"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {link.label}
                        </h3>
                        <p 
                          className="text-sm px-2 py-1 rounded inline-block mb-2"
                          style={{ 
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            color: "var(--text-secondary)" 
                          }}
                        >
                          {link.type === 'Other' && link.customType ? link.customType : link.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm break-all hover:underline"
                        style={{ color: "#60a5fa" }}
                      >
                        {link.url}
                      </a>
                    </div>

                    {link.notes && link.notes.trim() !== '' && (
                      <div
                        className="mb-3 p-3 rounded text-sm"
                        style={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          borderLeft: "3px solid rgba(255, 255, 255, 0.2)"
                        }}
                      >
                        <p className="font-semibold mb-1 text-xs" style={{ color: "var(--text-subtle)" }}>
                          Notes:
                        </p>
                        <div style={{ color: "var(--text-secondary)" }}>
                          <SensitiveText text={link.notes} />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-2"
                        style={{
                          borderColor: "var(--text-primary)",
                          color: "var(--text-primary)"
                        }}
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4" />
                        Open Link
                      </a>
                      <button
                        onClick={() => handleOpenLinkModal(link)}
                        className="px-3 py-2 rounded-lg border-2 hover:bg-white/10 transition-all text-sm"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.3)",
                          color: "var(--text-primary)"
                        }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link._id)}
                        className="px-3 py-2 rounded-lg border-2 hover:bg-red-500/20 transition-all text-sm"
                        style={{
                          borderColor: "#ef4444",
                          color: "#ef4444"
                        }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-4" />
                      </button>
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
              {getUpcomingDeadlines.length === 0 ? (
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
                  {getUpcomingDeadlines.map((deadline) => (
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
              {getPassedDeadlines.length === 0 ? (
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
                  {getPassedDeadlines.slice().reverse().slice(0, 10).map((deadline) => (
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
                {renderCalendar}
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

      {/* Link Modal */}
      {showLinkModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={handleCloseLinkModal}
        >
          <div
            className="w-full max-w-2xl rounded-xl border-2 p-6"
            style={{
              backgroundColor: "var(--primary-bg)",
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="font-bold text-2xl mb-6"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
            >
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </h2>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label
                  htmlFor="label"
                  className="block mb-2 font-semibold"
                  style={{ color: "var(--text-primary)", fontSize: "14px" }}
                >
                  Label / Name *
                </label>
                <input
                  type="text"
                  id="label"
                  value={linkFormData.label}
                  onChange={(e) => setLinkFormData({ ...linkFormData, label: e.target.value })}
                  required
                  placeholder="e.g., Harvard Applicant Portal"
                  className="w-full px-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="url"
                  className="block mb-2 font-semibold"
                  style={{ color: "var(--text-primary)", fontSize: "14px" }}
                >
                  URL *
                </label>
                <input
                  type="url"
                  id="url"
                  value={linkFormData.url}
                  onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })}
                  required
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block mb-2 font-semibold"
                  style={{ color: "var(--text-primary)", fontSize: "14px" }}
                >
                  Type *
                </label>
                <select
                  id="type"
                  value={linkFormData.type}
                  onChange={(e) => setLinkFormData({ ...linkFormData, type: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)",
                    backgroundColor: "var(--primary-bg)"
                  }}
                >
                  <option value="Applicant Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Applicant Portal</option>
                  <option value="Financial Aid Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Financial Aid Portal</option>
                  <option value="Scholarship Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Scholarship Portal</option>
                  <option value="Student Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Student Portal</option>
                  <option value="Application Status" style={{ backgroundColor: "var(--primary-bg)" }}>Application Status</option>
                  <option value="Document Upload" style={{ backgroundColor: "var(--primary-bg)" }}>Document Upload</option>
                  <option value="Test Scores" style={{ backgroundColor: "var(--primary-bg)" }}>Test Scores</option>
                  <option value="Housing Portal" style={{ backgroundColor: "var(--primary-bg)" }}>Housing Portal</option>
                  <option value="Registration" style={{ backgroundColor: "var(--primary-bg)" }}>Registration</option>
                  <option value="Other" style={{ backgroundColor: "var(--primary-bg)" }}>Other</option>
                </select>
              </div>

              {linkFormData.type === 'Other' && (
                <div>
                  <label
                    htmlFor="customType"
                    className="block mb-2 font-semibold"
                    style={{ color: "var(--text-primary)", fontSize: "14px" }}
                  >
                    Custom Type *
                  </label>
                  <input
                    type="text"
                    id="customType"
                    value={linkFormData.customType}
                    onChange={(e) => setLinkFormData({ ...linkFormData, customType: e.target.value })}
                    required
                    placeholder="Enter custom type"
                    className="w-full px-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="notes"
                  className="block mb-2 font-semibold"
                  style={{ color: "var(--text-primary)", fontSize: "14px" }}
                >
                  Notes
                </label>
                <p className="mb-2 text-xs" style={{ color: "var(--text-subtle)" }}>
                  Add any related information (e.g., username, password, important details).
                  Wrap sensitive text in **asterisks** to censor it (e.g., Password: **mypass123**).
                  Hover to reveal, click to copy.
                </p>
                <textarea
                  id="notes"
                  value={linkFormData.notes}
                  onChange={(e) => setLinkFormData({ ...linkFormData, notes: e.target.value })}
                  rows="4"
                  placeholder="Enter notes..."
                  className="w-full px-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors resize-y"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-lg border-2 hover:bg-white hover:text-black transition-all font-semibold"
                  style={{
                    borderColor: "var(--text-primary)",
                    color: "var(--text-primary)",
                    backgroundColor: "transparent"
                  }}
                >
                  {editingLink ? 'Update Link' : 'Add Link'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseLinkModal}
                  className="flex-1 px-6 py-3 rounded-lg border-2 hover:bg-white/10 transition-all font-semibold"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "var(--text-primary)"
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
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
