"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faGraduationCap, 
  faFileAlt, 
  faTrophy, 
  faAward, 
  faPencilAlt, 
  faBook,
  faPlus,
  faTrash,
  faArrowLeft,
  faArrowUp,
  faArrowDown,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import ProfileInsights from "../components/ProfileInsights";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  
  // Profile data
  const [profile, setProfile] = useState({
    majors: [],
    nationality: '',
    efc: null,
    essays: [],
    extracurriculars: [],
    awards: [],
    testScores: [],
    academics: {
      type: '',
      gpa: '',
      subjects: []
    },
    sectionCompletion: {
      majors: false,
      essays: false,
      extracurriculars: false,
      awards: false,
      testScores: false,
      academics: false
    },
    profileAnalysis: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (!data.authenticated) {
          router.push("/login");
        } else {
          setUser(data.user);
          fetchProfile();
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.profile) {
        // Merge with defaults to ensure all arrays exist and migrate old essays
        const migratedEssays = (data.profile.essays || []).map(essay => ({
          ...essay,
          maxWordCount: essay.maxWordCount || (essay.essayType === 'Personal Statement' ? 650 : 300),
          maxCharCount: essay.maxCharCount || 4000,
          sections: essay.sections || []
        }));
        
        // Migrate old subjects to include gradeType and curriculumType fields
        const globalCurriculumType = data.profile.academics?.type || '';
        const migratedSubjects = (data.profile.academics?.subjects || []).map(subject => ({
          ...subject,
          gradeType: subject.gradeType || (subject.predicted ? 'Predicted' : 'Actual'),
          curriculumType: subject.curriculumType || globalCurriculumType
        }));
        
        setProfile({
          majors: data.profile.majors || [],
          essays: migratedEssays,
          extracurriculars: data.profile.extracurriculars || [],
          awards: data.profile.awards || [],
          testScores: data.profile.testScores || [],
          academics: {
            type: data.profile.academics?.type || '',
            gpa: data.profile.academics?.gpa || '',
            subjects: migratedSubjects
          },
          sectionCompletion: data.profile.sectionCompletion || {
            majors: false,
            essays: false,
            extracurriculars: false,
            awards: false,
            testScores: false,
            academics: false
          },
          profileAnalysis: data.profile.profileAnalysis || null
        });
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: profile })
      });

      if (response.ok) {
        setSaveMessage("Profile saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Failed to save profile");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      setSaveMessage("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  // Major functions
  const addMajor = () => {
    const currentMajors = Array.isArray(profile.majors) ? profile.majors : [];
    setProfile({
      ...profile,
      majors: [...currentMajors, { name: '', rank: currentMajors.length + 1 }]
    });
  };

  const updateMajor = (index, value) => {
    const currentMajors = Array.isArray(profile.majors) ? profile.majors : [];
    const newMajors = [...currentMajors];
    newMajors[index].name = value;
    setProfile({ ...profile, majors: newMajors });
  };

  const moveMajor = (index, direction) => {
    const currentMajors = Array.isArray(profile.majors) ? profile.majors : [];
    const newMajors = [...currentMajors];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newMajors.length) {
      [newMajors[index], newMajors[newIndex]] = [newMajors[newIndex], newMajors[index]];
      newMajors.forEach((major, i) => major.rank = i + 1);
      setProfile({ ...profile, majors: newMajors });
    }
  };

  const removeMajor = (index) => {
    const currentMajors = Array.isArray(profile.majors) ? profile.majors : [];
    const newMajors = currentMajors.filter((_, i) => i !== index);
    newMajors.forEach((major, i) => major.rank = i + 1);
    setProfile({ ...profile, majors: newMajors });
  };

  const updateEFC = (value) => {
    if (value === '') {
      setProfile({ ...profile, efc: null });
    } else {
      const numValue = parseInt(value);
      setProfile({ ...profile, efc: isNaN(numValue) ? 0 : numValue });
    }
  };

  const updateNationality = (value) => {
    setProfile({ ...profile, nationality: value });
  };

  // Essay functions
  const addEssay = () => {
    const currentEssays = Array.isArray(profile.essays) ? profile.essays : [];
    setProfile({
      ...profile,
      essays: [...currentEssays, { 
        title: '', 
        essayType: 'Personal Statement', 
        styleType: 'US', 
        content: '',
        maxWordCount: 650, // Default for US Personal Statement
        maxCharCount: 4000, // Default for UK
        sections: [] // For UK-style essays with multiple questions
      }]
    });
  };

  const updateEssay = (index, field, value) => {
    const currentEssays = Array.isArray(profile.essays) ? profile.essays : [];
    const newEssays = [...currentEssays];
    newEssays[index][field] = value;
    setProfile({ ...profile, essays: newEssays });
  };

  const removeEssay = (index) => {
    const currentEssays = Array.isArray(profile.essays) ? profile.essays : [];
    setProfile({
      ...profile,
      essays: currentEssays.filter((_, i) => i !== index)
    });
  };

  // Essay section functions (for UK-style essays)
  const addEssaySection = (essayIndex) => {
    const currentEssays = Array.isArray(profile.essays) ? profile.essays : [];
    const newEssays = [...currentEssays];
    if (!newEssays[essayIndex].sections) {
      newEssays[essayIndex].sections = [];
    }
    newEssays[essayIndex].sections.push({ question: '', answer: '' });
    setProfile({ ...profile, essays: newEssays });
  };

  const updateEssaySection = (essayIndex, sectionIndex, field, value) => {
    const currentEssays = Array.isArray(profile.essays) ? profile.essays : [];
    const newEssays = [...currentEssays];
    newEssays[essayIndex].sections[sectionIndex][field] = value;
    setProfile({ ...profile, essays: newEssays });
  };

  const removeEssaySection = (essayIndex, sectionIndex) => {
    const currentEssays = Array.isArray(profile.essays) ? profile.essays : [];
    const newEssays = [...currentEssays];
    newEssays[essayIndex].sections = newEssays[essayIndex].sections.filter((_, i) => i !== sectionIndex);
    setProfile({ ...profile, essays: newEssays });
  };

  // Extracurricular functions
  const addExtracurricular = () => {
    const currentECs = Array.isArray(profile.extracurriculars) ? profile.extracurriculars : [];
    if (currentECs.length >= 10) {
      alert("Maximum 10 extracurriculars allowed");
      return;
    }
    setProfile({
      ...profile,
      extracurriculars: [...currentECs, { name: '', role: '', description: '' }]
    });
  };

  const updateExtracurricular = (index, field, value) => {
    const currentECs = Array.isArray(profile.extracurriculars) ? profile.extracurriculars : [];
    const newECs = [...currentECs];
    newECs[index][field] = value;
    setProfile({ ...profile, extracurriculars: newECs });
  };

  const removeExtracurricular = (index) => {
    const currentECs = Array.isArray(profile.extracurriculars) ? profile.extracurriculars : [];
    setProfile({
      ...profile,
      extracurriculars: currentECs.filter((_, i) => i !== index)
    });
  };

  // Award functions
  const addAward = () => {
    const currentAwards = Array.isArray(profile.awards) ? profile.awards : [];
    if (currentAwards.length >= 5) {
      alert("Maximum 5 awards allowed");
      return;
    }
    setProfile({
      ...profile,
      awards: [...currentAwards, { name: '', level: '', description: '' }]
    });
  };

  const updateAward = (index, field, value) => {
    const currentAwards = Array.isArray(profile.awards) ? profile.awards : [];
    const newAwards = [...currentAwards];
    newAwards[index][field] = value;
    setProfile({ ...profile, awards: newAwards });
  };

  const removeAward = (index) => {
    const currentAwards = Array.isArray(profile.awards) ? profile.awards : [];
    setProfile({
      ...profile,
      awards: currentAwards.filter((_, i) => i !== index)
    });
  };

  // Test Score functions
  const addTestScore = () => {
    const currentTestScores = Array.isArray(profile.testScores) ? profile.testScores : [];
    setProfile({
      ...profile,
      testScores: [...currentTestScores, { testType: '', scores: {} }]
    });
  };

  const updateTestScore = (index, field, value) => {
    const currentTestScores = Array.isArray(profile.testScores) ? profile.testScores : [];
    const newScores = [...currentTestScores];
    if (field === 'testType') {
      newScores[index].testType = value;
      newScores[index].scores = {};
    } else {
      newScores[index].scores[field] = value;
    }
    setProfile({ ...profile, testScores: newScores });
  };

  const removeTestScore = (index) => {
    const currentTestScores = Array.isArray(profile.testScores) ? profile.testScores : [];
    setProfile({
      ...profile,
      testScores: currentTestScores.filter((_, i) => i !== index)
    });
  };

  // Academic functions
  const addAcademicSubject = (subject) => {
    const currentSubjects = Array.isArray(profile.academics?.subjects) ? profile.academics.subjects : [];
    setProfile({
      ...profile,
      academics: {
        ...profile.academics,
        subjects: [...currentSubjects, { 
          name: subject.name, 
          grade: subject.grade, 
          gradeType: subject.gradeType || 'Actual',
          curriculumType: subject.curriculumType || ''
        }]
      }
    });
  };

  const updateAcademicSubject = (index, field, value) => {
    const currentSubjects = Array.isArray(profile.academics?.subjects) ? profile.academics.subjects : [];
    const newSubjects = [...currentSubjects];
    newSubjects[index][field] = value;
    setProfile({
      ...profile,
      academics: { ...profile.academics, subjects: newSubjects }
    });
  };

  const removeAcademicSubject = (index) => {
    const currentSubjects = Array.isArray(profile.academics?.subjects) ? profile.academics.subjects : [];
    setProfile({
      ...profile,
      academics: {
        ...profile.academics,
        subjects: currentSubjects.filter((_, i) => i !== index)
      }
    });
  };

  const getTestScoreFields = (testType) => {
    switch(testType) {
      case 'SAT':
        return ['total', 'math', 'verbal'];
      case 'ACT':
        return ['composite'];
      case 'TMUA':
      case 'ESAT':
      case 'LNAT':
      case 'BMAT':
      case 'UCAT':
        return ['score'];
      case 'IELTS':
      case 'TOEFL':
        return ['overall', 'reading', 'writing', 'listening', 'speaking'];
      case 'AP':
        return ['subject', 'score'];
      default:
        return ['score'];
    }
  };

  const toggleSectionCompletion = (sectionId) => {
    setProfile(prev => ({
      ...prev,
      sectionCompletion: {
        ...prev.sectionCompletion,
        [sectionId]: !prev.sectionCompletion[sectionId]
      }
    }));
  };

  const calculateProgress = () => {
    const completion = profile.sectionCompletion || {};
    const completed = Object.values(completion).filter(Boolean).length;
    const total = Object.keys(completion).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const cards = [
    { id: 'majors', title: 'Intended Majors and Finances', icon: faGraduationCap, color: '#8b5cf6' },
    { id: 'essays', title: 'Essays', icon: faFileAlt, color: '#ec4899' },
    { id: 'extracurriculars', title: 'Extracurriculars', icon: faTrophy, color: '#f59e0b' },
    { id: 'awards', title: 'Awards & Honors', icon: faAward, color: '#10b981' },
    { id: 'testScores', title: 'Test Scores', icon: faPencilAlt, color: '#3b82f6' },
    { id: 'academics', title: 'Academics', icon: faBook, color: '#6366f1' },
  ];

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "var(--primary-bg)" }}
      >
        <div className="animate-pulse" style={{ color: "var(--text-primary)" }}>
          Loading...
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header with Progress */}
        {!activeCard && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <h1
                  className="font-bold mb-2"
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "clamp(28px, 5vw, 42px)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Welcome, {user?.username}!
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                  Complete your profile to get personalized recommendations
                </p>
              </div>
              
              {/* Circular Progress */}
              <CircularProgress percentage={calculateProgress()} />
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div
            className="mb-6 px-4 py-3 rounded-lg border-2 animate-fade-in"
            style={{
              backgroundColor: saveMessage.includes("successfully") 
                ? "rgba(34, 197, 94, 0.1)" 
                : "rgba(239, 68, 68, 0.1)",
              borderColor: saveMessage.includes("successfully")
                ? "rgba(34, 197, 94, 0.5)"
                : "rgba(239, 68, 68, 0.5)",
              color: saveMessage.includes("successfully") ? "#22c55e" : "#ef4444",
            }}
          >
            {saveMessage}
          </div>
        )}

        {/* Card Grid or Active Card */}
        {!activeCard ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {cards.map((card, index) => (
                <DashboardCard
                  key={card.id}
                  card={card}
                  onClick={() => setActiveCard(card.id)}
                  index={index}
                  count={
                    card.id === 'majors' ? (profile.majors?.length || 0) :
                    card.id === 'essays' ? (profile.essays?.length || 0) :
                    card.id === 'extracurriculars' ? (profile.extracurriculars?.length || 0) :
                    card.id === 'awards' ? (profile.awards?.length || 0) :
                    card.id === 'testScores' ? (profile.testScores?.length || 0) :
                    (profile.academics?.subjects?.length || 0)
                  }
                  isComplete={profile.sectionCompletion?.[card.id] || false}
                />
              ))}
            </div>

            {/* Profile Insights - Show only when 100% complete */}
            {calculateProgress() === 100 && (
              <ProfileInsights profile={profile} />
            )}
          </>
        ) : (
          <div className="animate-fade-in">
            <button
              onClick={() => setActiveCard(null)}
              className="mb-6 px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-all flex items-center gap-2"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Dashboard
            </button>

            {/* Active Card Content */}
            {activeCard === 'majors' && (
              <MajorsSection 
                profile={profile}
                addMajor={addMajor}
                updateMajor={updateMajor}
                moveMajor={moveMajor}
                removeMajor={removeMajor}
                updateEFC={updateEFC}
                updateNationality={updateNationality}
                isComplete={profile.sectionCompletion?.majors}
                toggleComplete={() => toggleSectionCompletion('majors')}
              />
            )}

            {activeCard === 'essays' && (
              <EssaysSection
                profile={profile}
                addEssay={addEssay}
                updateEssay={updateEssay}
                removeEssay={removeEssay}
                addEssaySection={addEssaySection}
                updateEssaySection={updateEssaySection}
                removeEssaySection={removeEssaySection}
                isComplete={profile.sectionCompletion?.essays}
                toggleComplete={() => toggleSectionCompletion('essays')}
              />
            )}

            {activeCard === 'extracurriculars' && (
              <ExtracurricularsSection
                profile={profile}
                addExtracurricular={addExtracurricular}
                updateExtracurricular={updateExtracurricular}
                removeExtracurricular={removeExtracurricular}
                isComplete={profile.sectionCompletion?.extracurriculars}
                toggleComplete={() => toggleSectionCompletion('extracurriculars')}
              />
            )}

            {activeCard === 'awards' && (
              <AwardsSection
                profile={profile}
                addAward={addAward}
                updateAward={updateAward}
                removeAward={removeAward}
                isComplete={profile.sectionCompletion?.awards}
                toggleComplete={() => toggleSectionCompletion('awards')}
              />
            )}

            {activeCard === 'testScores' && (
              <TestScoresSection
                profile={profile}
                addTestScore={addTestScore}
                updateTestScore={updateTestScore}
                removeTestScore={removeTestScore}
                getTestScoreFields={getTestScoreFields}
                isComplete={profile.sectionCompletion?.testScores}
                toggleComplete={() => toggleSectionCompletion('testScores')}
              />
            )}

            {activeCard === 'academics' && (
              <AcademicsSection
                profile={profile}
                setProfile={setProfile}
                addAcademicSubject={addAcademicSubject}
                updateAcademicSubject={updateAcademicSubject}
                removeAcademicSubject={removeAcademicSubject}
                isComplete={profile.sectionCompletion?.academics}
                toggleComplete={() => toggleSectionCompletion('academics')}
              />
            )}

            {/* Save Button for Active Card */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full max-w-md px-8 py-4 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 rounded-lg text-white text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Save All Button (only show when no active card) */}
        {!activeCard && (
          <div className="mt-8 flex justify-center animate-fade-in-delay-3">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full max-w-md px-8 py-4 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 rounded-lg text-white text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ card, onClick, index, count, isComplete }) {
  const animationClass = `animate-fade-in-delay-${Math.min(index, 3)}`;
  
  return (
    <div
      onClick={onClick}
      className={`group relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${animationClass}`}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-2xl"
        style={{ backgroundColor: card.color }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${card.color}15`,
            }}
          >
            <FontAwesomeIcon
              icon={card.icon}
              style={{ color: card.color, fontSize: "28px" }}
            />
          </div>
          
          {/* Completion Checkmark Badge */}
          {isComplete && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 4L6 11L3 8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
        
        <h3
          className="font-bold mb-2"
          style={{
            color: "var(--text-primary)",
            fontSize: "20px",
            fontFamily: "var(--font-display)",
          }}
        >
          {card.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <p style={{ color: "var(--text-subtle)", fontSize: "14px" }}>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ color: "var(--text-primary)", fontSize: "18px" }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Majors Section
function MajorsSection({ profile, addMajor, updateMajor, moveMajor, removeMajor, updateEFC, updateNationality, isComplete, toggleComplete }) {
  return (
    <SectionWrapper icon={faGraduationCap} title="Intended Majors and Finances" subtitle="Rank your major choices and enter your expected family contribution">
      {/* Mark as Complete Checkbox */}
      <div className="mb-4 pb-4 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isComplete}
            onChange={toggleComplete}
            className="w-5 h-5 rounded border-2 cursor-pointer appearance-none checked:bg-green-500 checked:border-green-500 transition-all relative"
            style={{
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <span className="text-sm font-medium group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
            Mark section as complete
          </span>
        </label>
      </div>

      {/* Nationality */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Nationality / Country of Citizenship
        </label>
        <select
          value={profile.nationality || ''}
          onChange={(e) => updateNationality(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
          style={{
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: profile.nationality ? "var(--text-primary)" : "var(--text-secondary)",
            fontFamily: "var(--font-body)",
          }}
        >
          <option value="" style={{ backgroundColor: "var(--primary-bg)" }}>Select your nationality</option>
          <option value="United States" style={{ backgroundColor: "var(--primary-bg)" }}>United States</option>
          <option value="United Kingdom" style={{ backgroundColor: "var(--primary-bg)" }}>United Kingdom</option>
          <option value="Canada" style={{ backgroundColor: "var(--primary-bg)" }}>Canada</option>
          <option value="Australia" style={{ backgroundColor: "var(--primary-bg)" }}>Australia</option>
          <option value="India" style={{ backgroundColor: "var(--primary-bg)" }}>India</option>
          <option value="China" style={{ backgroundColor: "var(--primary-bg)" }}>China</option>
          <option value="Pakistan" style={{ backgroundColor: "var(--primary-bg)" }}>Pakistan</option>
          <option value="Bangladesh" style={{ backgroundColor: "var(--primary-bg)" }}>Bangladesh</option>
          <option value="Nigeria" style={{ backgroundColor: "var(--primary-bg)" }}>Nigeria</option>
          <option value="South Africa" style={{ backgroundColor: "var(--primary-bg)" }}>South Africa</option>
          <option value="Other" style={{ backgroundColor: "var(--primary-bg)" }}>Other</option>
        </select>
        <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          This helps determine if you&apos;re a domestic or international applicant
        </p>
      </div>

      {/* Expected Family Contribution */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Expected Family Contribution (EFC)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg" style={{ color: "var(--text-secondary)" }}>
            $
          </span>
          <input
            type="number"
            value={profile.efc || ''}
            onChange={(e) => updateEFC(e.target.value)}
            placeholder="0 means full financial aid required"
            min="0"
            step="1000"
            className="w-full pl-8 pr-4 py-3 rounded-lg border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
            style={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          Enter 0 if you require full financial aid. This helps match you with colleges based on your financial needs.
        </p>
      </div>

      <div className="space-y-3">
        {(Array.isArray(profile.majors) ? profile.majors : []).map((major, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border-2 flex items-center gap-3"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveMajor(index, 'up')}
                disabled={index === 0}
                className="w-8 h-8 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: "var(--text-secondary)" }}
              >
                <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
              </button>
              <button
                onClick={() => moveMajor(index, 'down')}
                disabled={index === profile.majors.length - 1}
                className="w-8 h-8 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: "var(--text-secondary)" }}
              >
                <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
              </button>
            </div>
            
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                color: "#8b5cf6",
                fontFamily: "var(--font-display)",
              }}
            >
              #{major.rank}
            </div>
            
            <input
              type="text"
              value={major.name}
              onChange={(e) => updateMajor(index, e.target.value)}
              placeholder="e.g., Computer Science"
              className="flex-1 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
            
            <button
              onClick={() => removeMajor(index)}
              className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
              style={{ color: "#ef4444" }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
        
        <button
          onClick={addMajor}
          className="w-full px-4 py-3 rounded-lg border-2 border-dashed hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          style={{
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Major
        </button>
      </div>
    </SectionWrapper>
  );
}

// Essays Section - PART 1
function EssaysSection({ profile, addEssay, updateEssay, removeEssay, addEssaySection, updateEssaySection, removeEssaySection, isComplete, toggleComplete }) {
  const getWordCount = (text) => text.split(/\s+/).filter(w => w).length;
  const getCharCount = (text) => text.length;

  return (
    <SectionWrapper icon={faFileAlt} title="Essays" subtitle="Write and organize your application essays">
      {/* Mark as Complete Checkbox */}
      <div className="mb-4 pb-4 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isComplete}
            onChange={toggleComplete}
            className="w-5 h-5 rounded border-2 cursor-pointer appearance-none checked:bg-green-500 checked:border-green-500 transition-all relative"
            style={{
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <span className="text-sm font-medium group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
            Mark section as complete
          </span>
        </label>
      </div>

      <div className="space-y-4">
        {(Array.isArray(profile.essays) ? profile.essays : []).map((essay, index) => {
          const isUKStyle = essay.styleType === 'UK';
          const totalContent = isUKStyle 
            ? (essay.sections || []).map(s => s.answer).join(' ')
            : essay.content;
          const currentCount = isUKStyle ? getCharCount(totalContent) : getWordCount(totalContent);
          const maxCount = isUKStyle ? (essay.maxCharCount || 4000) : (essay.maxWordCount || 650);
          const countLabel = isUKStyle ? 'characters' : 'words';
          const isOverLimit = currentCount > maxCount;

          return (
            <div
              key={index}
              className="p-5 rounded-lg border-2"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <input
                  type="text"
                  value={essay.title}
                  onChange={(e) => updateEssay(index, 'title', e.target.value)}
                  placeholder="Essay Title"
                  className="flex-1 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors font-bold"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    fontSize: "18px"
                  }}
                />
                <button
                  onClick={() => removeEssay(index)}
                  className="ml-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                  style={{ color: "#ef4444" }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              
              {/* Essay Type and Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <select
                  value={essay.essayType}
                  onChange={(e) => {
                    updateEssay(index, 'essayType', e.target.value);
                    // Update default word count based on essay type for US style
                    if (essay.styleType === 'US') {
                      updateEssay(index, 'maxWordCount', e.target.value === 'Personal Statement' ? 650 : 300);
                    }
                  }}
                  className="px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <option value="Personal Statement" style={{ backgroundColor: "var(--primary-bg)" }}>Personal Statement</option>
                  <option value="Supplemental Essay" style={{ backgroundColor: "var(--primary-bg)" }}>Supplemental Essay</option>
                </select>
                
                <select
                  value={essay.styleType}
                  onChange={(e) => updateEssay(index, 'styleType', e.target.value)}
                  className="px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <option value="US" style={{ backgroundColor: "var(--primary-bg)" }}>US Style</option>
                  <option value="UK" style={{ backgroundColor: "var(--primary-bg)" }}>UK Style</option>
                  <option value="Other" style={{ backgroundColor: "var(--primary-bg)" }}>Other</option>
                </select>
              </div>

              {/* Word/Character Limit Input */}
              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  Max {isUKStyle ? 'Character' : 'Word'} Count
                </label>
                <input
                  type="number"
                  value={isUKStyle ? essay.maxCharCount : essay.maxWordCount}
                  onChange={(e) => updateEssay(index, isUKStyle ? 'maxCharCount' : 'maxWordCount', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
              
              {/* US Style - Single Essay */}
              {!isUKStyle && (
                <>
                  <textarea
                    value={essay.content}
                    onChange={(e) => updateEssay(index, 'content', e.target.value)}
                    placeholder="Write your essay here..."
                    rows="10"
                    className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors resize-y"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-body)",
                      lineHeight: "1.6"
                    }}
                  />
                  
                  <div className="mt-2 text-sm flex items-center gap-2" style={{ color: isOverLimit ? "#ef4444" : "var(--text-subtle)" }}>
                    <span>{currentCount} / {maxCount} {countLabel}</span>
                    {isOverLimit && <span className="font-semibold">(Over limit!)</span>}
                  </div>
                </>
              )}

              {/* UK Style - Sectioned Questions */}
              {isUKStyle && (
                <div className="space-y-4">
                  <div className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                    Break your essay into sections based on questions (e.g., UCAS personal statement prompts)
                  </div>
                  
                  {(essay.sections || []).map((section, sectionIndex) => (
                    <div key={sectionIndex} className="p-4 rounded-lg border" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
                      <div className="flex justify-between items-start mb-3">
                        <input
                          type="text"
                          value={section.question}
                          onChange={(e) => updateEssaySection(index, sectionIndex, 'question', e.target.value)}
                          placeholder="Question/Prompt (e.g., Why do you want to study this course?)"
                          className="flex-1 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors text-sm"
                          style={{
                            borderColor: "rgba(255, 255, 255, 0.2)",
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-body)",
                          }}
                        />
                        <button
                          onClick={() => removeEssaySection(index, sectionIndex)}
                          className="ml-3 px-2 py-2 rounded-md hover:bg-white/10 transition-colors text-sm"
                          style={{ color: "#ef4444" }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      
                      <textarea
                        value={section.answer}
                        onChange={(e) => updateEssaySection(index, sectionIndex, 'answer', e.target.value)}
                        placeholder="Your response..."
                        rows="6"
                        className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors resize-y"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-body)",
                          lineHeight: "1.6",
                          fontSize: "14px"
                        }}
                      />
                      
                      <div className="mt-2 text-xs" style={{ color: "var(--text-subtle)" }}>
                        {getCharCount(section.answer)} characters
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => addEssaySection(index)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-dashed hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Section
                  </button>
                  
                  {/* Total character count for UK essays */}
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
                    <div className="text-sm flex items-center gap-2" style={{ color: isOverLimit ? "#ef4444" : "var(--text-subtle)" }}>
                      <span className="font-semibold">Total: {currentCount} / {maxCount} {countLabel}</span>
                      {isOverLimit && <span className="font-semibold">(Over limit!)</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        <button
          onClick={addEssay}
          className="w-full px-4 py-3 rounded-lg border-2 border-dashed hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          style={{
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Essay
        </button>
      </div>
    </SectionWrapper>
  );
}

// Continue with remaining sections in next message due to length...
// Extracurriculars Section
function ExtracurricularsSection({ profile, addExtracurricular, updateExtracurricular, removeExtracurricular, isComplete, toggleComplete }) {
  return (
    <SectionWrapper 
      icon={faTrophy} 
      title={`Extracurriculars (${profile.extracurriculars.length}/10)`}
      subtitle="List your activities and leadership roles"
    >
      {/* Mark as Complete Checkbox */}
      <div className="mb-4 pb-4 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isComplete}
            onChange={toggleComplete}
            className="w-5 h-5 rounded border-2 cursor-pointer appearance-none checked:bg-green-500 checked:border-green-500 transition-all relative"
            style={{
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <span className="text-sm font-medium group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
            Mark section as complete
          </span>
        </label>
      </div>

      <div className="space-y-4">
        {(Array.isArray(profile.extracurriculars) ? profile.extracurriculars : []).map((ec, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border-2"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                value={ec.name}
                onChange={(e) => updateExtracurricular(index, 'name', e.target.value)}
                placeholder="Activity Name"
                className="flex-1 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                onClick={() => removeExtracurricular(index)}
                className="ml-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: "#ef4444" }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            <input
              type="text"
              value={ec.role}
              onChange={(e) => updateExtracurricular(index, 'role', e.target.value)}
              placeholder="Your Role/Position"
              className="w-full mb-3 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
            <textarea
              value={ec.description}
              onChange={(e) => updateExtracurricular(index, 'description', e.target.value)}
              placeholder="Description"
              rows="2"
              className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors resize-y"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
        ))}
        
        <button
          onClick={addExtracurricular}
          disabled={profile.extracurriculars.length >= 10}
          className="w-full px-4 py-3 rounded-lg border-2 border-dashed hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Extracurricular
        </button>
      </div>
    </SectionWrapper>
  );
}

// Awards Section
function AwardsSection({ profile, addAward, updateAward, removeAward, isComplete, toggleComplete }) {
  return (
    <SectionWrapper 
      icon={faAward} 
      title={`Awards & Honors (${profile.awards.length}/5)`}
      subtitle="Showcase your achievements and recognition"
    >
      {/* Mark as Complete Checkbox */}
      <div className="mb-4 pb-4 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isComplete}
            onChange={toggleComplete}
            className="w-5 h-5 rounded border-2 cursor-pointer appearance-none checked:bg-green-500 checked:border-green-500 transition-all relative"
            style={{
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <span className="text-sm font-medium group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
            Mark section as complete
          </span>
        </label>
      </div>

      <div className="space-y-4">
        {(Array.isArray(profile.awards) ? profile.awards : []).map((award, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border-2"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                value={award.name}
                onChange={(e) => updateAward(index, 'name', e.target.value)}
                placeholder="Award Name"
                className="flex-1 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                onClick={() => removeAward(index)}
                className="ml-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: "#ef4444" }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            <input
              type="text"
              value={award.level}
              onChange={(e) => updateAward(index, 'level', e.target.value)}
              placeholder="Level (e.g., National, International, School)"
              className="w-full mb-3 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
            <textarea
              value={award.description}
              onChange={(e) => updateAward(index, 'description', e.target.value)}
              placeholder="Description"
              rows="2"
              className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors resize-y"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
        ))}
        
        <button
          onClick={addAward}
          disabled={profile.awards.length >= 5}
          className="w-full px-4 py-3 rounded-lg border-2 border-dashed hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Award
        </button>
      </div>
    </SectionWrapper>
  );
}

// Test Scores Section
function TestScoresSection({ profile, addTestScore, updateTestScore, removeTestScore, getTestScoreFields, isComplete, toggleComplete }) {
  const testTypes = ['SAT', 'ACT', 'TMUA', 'ESAT', 'LNAT', 'BMAT', 'UCAT', 'IELTS', 'TOEFL', 'AP', 'Other'];
  
  const getFieldLabel = (testType, field) => {
    if (testType === 'SAT') {
      if (field === 'total') return 'Total Score (400-1600)';
      if (field === 'math') return 'Math (200-800)';
      if (field === 'verbal') return 'Reading & Writing (200-800)';
    }
    if (testType === 'ACT' && field === 'composite') return 'Composite Score (1-36)';
    if (testType === 'IELTS' || testType === 'TOEFL') {
      return field.charAt(0).toUpperCase() + field.slice(1);
    }
    if (testType === 'AP' && field === 'subject') return 'Subject Name';
    return field.charAt(0).toUpperCase() + field.slice(1);
  };

  return (
    <SectionWrapper icon={faPencilAlt} title="Test Scores" subtitle="Add your standardized test results">
      {/* Mark as Complete Checkbox */}
      <div className="mb-4 pb-4 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isComplete}
            onChange={toggleComplete}
            className="w-5 h-5 rounded border-2 cursor-pointer appearance-none checked:bg-green-500 checked:border-green-500 transition-all relative"
            style={{
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <span className="text-sm font-medium group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
            Mark section as complete
          </span>
        </label>
      </div>

      <div className="space-y-4">
        {(Array.isArray(profile.testScores) ? profile.testScores : []).map((test, index) => (
          <div
            key={index}
            className="p-5 rounded-lg border-2"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <select
                value={test.testType}
                onChange={(e) => updateTestScore(index, 'testType', e.target.value)}
                className="flex-1 px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors cursor-pointer font-bold"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "16px"
                }}
              >
                <option value="" style={{ backgroundColor: "var(--primary-bg)" }}>Select Test Type</option>
                {testTypes.map(type => (
                  <option key={type} value={type} style={{ backgroundColor: "var(--primary-bg)" }}>{type}</option>
                ))}
              </select>
              <button
                onClick={() => removeTestScore(index)}
                className="ml-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: "#ef4444" }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            
            {test.testType && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getTestScoreFields(test.testType).map(field => (
                  <div key={field}>
                    <label className="block mb-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {getFieldLabel(test.testType, field)}
                    </label>
                    <input
                      type={field === 'subject' ? 'text' : 'number'}
                      value={test.scores[field] || ''}
                      onChange={(e) => updateTestScore(index, field, e.target.value)}
                      placeholder={field === 'subject' ? 'e.g., Calculus BC' : 'Score'}
                      className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-body)",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <button
          onClick={addTestScore}
          className="w-full px-4 py-3 rounded-lg border-2 border-dashed hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          style={{
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Test Score
        </button>
      </div>
    </SectionWrapper>
  );
}

// Academics Section
function AcademicsSection({ profile, setProfile, addAcademicSubject, updateAcademicSubject, removeAcademicSubject, isComplete, toggleComplete }) {
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [modalData, setModalData] = useState({ name: '', grade: '', gradeType: 'Actual', curriculumType: '' });
  
  const showGPA = !['A-Levels', 'IGCSE', 'O-Levels', 'IB'].includes(profile.academics.type);
  
  const openAddModal = () => {
    setModalData({ name: '', grade: '', gradeType: 'Actual', curriculumType: profile.academics.type || '' });
    setEditingIndex(null);
    setShowModal(true);
  };
  
  const openEditModal = (index) => {
    const subject = profile.academics.subjects[index];
    setModalData({ 
      name: subject.name,
      grade: subject.grade,
      gradeType: subject.gradeType || 'Actual',
      curriculumType: subject.curriculumType || profile.academics.type || ''
    });
    setEditingIndex(index);
    setShowModal(true);
  };
  
  const handleSave = () => {
    if (!modalData.name || !modalData.grade || !modalData.curriculumType) {
      alert('Please fill in all fields');
      return;
    }
    
    if (editingIndex !== null) {
      // Update existing
      updateAcademicSubject(editingIndex, 'name', modalData.name);
      updateAcademicSubject(editingIndex, 'grade', modalData.grade);
      updateAcademicSubject(editingIndex, 'gradeType', modalData.gradeType);
      updateAcademicSubject(editingIndex, 'curriculumType', modalData.curriculumType);
    } else {
      // Add new
      addAcademicSubject(modalData);
    }
    
    setShowModal(false);
  };
  
  return (
    <SectionWrapper icon={faBook} title="Academics" subtitle="Record your academic curriculum and grades">
      {/* Mark as Complete Checkbox */}
      <div className="mb-4 pb-4 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isComplete}
            onChange={toggleComplete}
            className="w-5 h-5 rounded border-2 cursor-pointer appearance-none checked:bg-green-500 checked:border-green-500 transition-all relative"
            style={{
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
          <span className="text-sm font-medium group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
            Mark section as complete
          </span>
        </label>
      </div>

      <div className="space-y-6">
        {showGPA && (
          <div>
            <label
              className="block mb-2 font-bold text-sm"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              GPA
            </label>
            <input
              type="text"
              value={profile.academics.gpa}
              onChange={(e) => setProfile({
                ...profile,
                academics: { ...profile.academics, gpa: e.target.value }
              })}
              placeholder="e.g., 3.85 or 4.0"
              className="w-full px-3 py-2 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4
              className="font-bold"
              style={{
                color: "var(--text-primary)",
                fontSize: "16px",
                fontFamily: "var(--font-display)",
              }}
            >
              Subjects & Grades
            </h4>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
              Set curriculum type when adding/editing subjects
            </p>
          </div>
          <div className="space-y-3">
            {(Array.isArray(profile.academics?.subjects) ? profile.academics.subjects : []).map((subject, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border-2 flex items-center justify-between"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                      {subject.name || 'Untitled Subject'}
                    </div>
                    <div className="text-sm mt-1" style={{ color: "var(--text-subtle)" }}>
                      {subject.curriculumType || 'No curriculum'} • Grade: {subject.grade} • {subject.gradeType || 'Actual'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(index)}
                    className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                    style={{ color: "var(--accent-color)" }}
                  >
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAcademicSubject(index);
                    }}
                    className="px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                    style={{ color: "#ef4444" }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={openAddModal}
              className="w-full px-4 py-3 rounded-lg border-2 border-dashed hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-display)",
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Subject
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="rounded-xl p-8 max-w-md w-full shadow-2xl"
            style={{
              backgroundColor: "#000000",
              border: "2px solid #333333",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 
              className="text-xl font-bold mb-6"
              style={{
                color: "#FFFFFF",
                fontFamily: "var(--font-display)",
              }}
            >
              {editingIndex !== null ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                  Curriculum Type
                </label>
                <select
                  value={modalData.curriculumType}
                  onChange={(e) => setModalData({ ...modalData, curriculumType: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border-2 focus:outline-none focus:border-gray-400 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderColor: "#333333",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <option value="" style={{ backgroundColor: "#1a1a1a" }}>Select Type</option>
                  <option value="AP" style={{ backgroundColor: "#1a1a1a" }}>AP (Advanced Placement)</option>
                  <option value="IB" style={{ backgroundColor: "#1a1a1a" }}>IB (International Baccalaureate)</option>
                  <option value="A-Levels" style={{ backgroundColor: "#1a1a1a" }}>A-Levels</option>
                  <option value="IGCSE" style={{ backgroundColor: "#1a1a1a" }}>IGCSE</option>
                  <option value="O-Levels" style={{ backgroundColor: "#1a1a1a" }}>O-Levels</option>
                  <option value="Other" style={{ backgroundColor: "#1a1a1a" }}>Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                  Subject Name
                </label>
                <input
                  type="text"
                  value={modalData.name}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                  className="w-full px-3 py-2 rounded-md border-2 focus:outline-none focus:border-gray-400 transition-colors"
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderColor: "#333333",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                  Grade
                </label>
                <input
                  type="text"
                  value={modalData.grade}
                  onChange={(e) => setModalData({ ...modalData, grade: e.target.value })}
                  placeholder={['A-Levels', 'IGCSE', 'O-Levels'].includes(modalData.curriculumType) ? 'e.g., A*' : modalData.curriculumType === 'IB' ? 'e.g., 7' : 'e.g., A'}
                  className="w-full px-3 py-2 rounded-md border-2 focus:outline-none focus:border-gray-400 transition-colors"
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderColor: "#333333",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                  Grade Type
                </label>
                <select
                  value={modalData.gradeType}
                  onChange={(e) => setModalData({ ...modalData, gradeType: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border-2 focus:outline-none focus:border-gray-400 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "#1a1a1a",
                    borderColor: "#333333",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <option value="Actual" style={{ backgroundColor: "#1a1a1a" }}>Actual</option>
                  <option value="Predicted" style={{ backgroundColor: "#1a1a1a" }}>Predicted</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                text="Cancel"
                color="#333333"
                glowColor="#666666"
                textColor="#FFFFFF"
                onClick={() => setShowModal(false)}
              />
              {editingIndex !== null ? (
                <Button
                  text="Update"
                  color="#FFFFFF"
                  glowColor="#CCCCCC"
                  textColor="#000000"
                  onClick={handleSave}
                />
              ) : (
                <Button
                  text="Add Subject"
                  color="#FFFFFF"
                  glowColor="#CCCCCC"
                  textColor="#000000"
                  onClick={handleSave}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}

// Section Wrapper Component
function SectionWrapper({ icon, title, subtitle, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <FontAwesomeIcon
            icon={icon}
            style={{ color: "var(--text-primary)", fontSize: "20px" }}
          />
        </div>
        <div>
          <h2
            className="font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontFamily: "var(--font-display)",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: "var(--text-subtle)", fontSize: "14px" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div
        className="p-6 rounded-xl border-2"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Circular Progress Component
function CircularProgress({ percentage }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-white/60">Complete</span>
      </div>
    </div>
  );
}
