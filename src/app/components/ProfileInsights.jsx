"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChartLine, 
  faLightbulb, 
  faExclamationTriangle,
  faTrophy,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

export default function ProfileInsights({ profile }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const analyzeProfile = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile, forceRefresh })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle rate limit specifically
        if (response.status === 429) {
          setError('Rate limit exceeded. Please wait 10-15 seconds and try again.');
        } else {
          setError(data.error || 'Failed to analyze profile');
        }
        return;
      }

      setAnalysis(data.analysis);
      
      // Save analysis to profile if it's new (not cached)
      if (data.shouldCache && !data.cached) {
        await saveAnalysisToProfile(data.analysis);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred while analyzing your profile');
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysisToProfile = async (analysis) => {
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileData: {
            ...profile,
            profileAnalysis: analysis
          }
        })
      });
      console.log('Analysis cached to profile');
    } catch (err) {
      console.error('Failed to cache analysis:', err);
    }
  };

  useEffect(() => {
    analyzeProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981'; // green
    if (score >= 6) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return 'Exceptional';
    if (score >= 8) return 'Strong';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Average';
    if (score >= 5) return 'Below Average';
    return 'Needs Work';
  };

  if (loading) {
    return (
      <div className="mt-8 p-8 rounded-xl border-2 animate-fade-in" style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}>
        <div className="flex flex-col items-center justify-center gap-4">
          <FontAwesomeIcon 
            icon={faSpinner} 
            className="animate-spin text-4xl"
            style={{ color: "var(--text-primary)" }}
          />
          <p style={{ color: "var(--text-secondary)" }}>
            Analyzing your profile with AI...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-8 rounded-xl border-2 animate-fade-in" style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "#ef4444",
      }}>
        <div className="flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "#ef4444", fontSize: "24px" }} />
          <h3 className="text-xl font-bold" style={{ color: "#ef4444" }}>
            Analysis Error
          </h3>
        </div>
        <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        <button
          onClick={analyzeProfile}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const categoryLabels = {
    academics: 'Academic Excellence',
    testScores: 'Test Scores',
    extracurriculars: 'Extracurricular Impact',
    awards: 'Awards & Recognition',
    essays: 'Essay Quality',
    coherence: 'Profile Coherence'
  };

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FontAwesomeIcon icon={faChartLine} style={{ color: "var(--text-primary)", fontSize: "32px" }} />
          <h2 
            className="font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontFamily: "var(--font-display)",
            }}
          >
            Profile Insights
          </h2>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
          AI-powered analysis of your application profile
        </p>
      </div>

      {/* Overall Score */}
      <div 
        className="p-8 rounded-xl border-2 text-center"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
          Overall Score
        </p>
        <div 
          className="text-6xl font-bold mb-2"
          style={{ 
            color: getScoreColor(analysis.overallScore),
            fontFamily: "var(--font-display)"
          }}
        >
          {analysis.overallScore.toFixed(1)}
        </div>
        <p className="text-xl" style={{ color: "var(--text-primary)" }}>
          out of 10
        </p>
        <p className="mt-2 text-sm" style={{ color: getScoreColor(analysis.overallScore) }}>
          {getScoreLabel(analysis.overallScore)}
        </p>
      </div>

      {/* Category Scores */}
      <div 
        className="p-6 rounded-xl border-2"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <h3 
          className="font-bold mb-6 text-center"
          style={{
            color: "var(--text-primary)",
            fontSize: "20px",
            fontFamily: "var(--font-display)",
          }}
        >
          Category Breakdown
        </h3>
        <div className="space-y-4">
          {Object.entries(analysis.scores).map(([category, score]) => (
            <div key={category}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>
                  {categoryLabels[category]}
                </span>
                <span 
                  className="font-bold"
                  style={{ 
                    color: getScoreColor(score),
                    fontFamily: "var(--font-display)"
                  }}
                >
                  {score}/10
                </span>
              </div>
              <div 
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              >
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${score * 10}%`,
                    backgroundColor: getScoreColor(score)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div 
        className="p-6 rounded-xl border-2"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faTrophy} style={{ color: "#10b981", fontSize: "20px" }} />
          <h3 
            className="font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "18px",
              fontFamily: "var(--font-display)",
            }}
          >
            Strengths
          </h3>
        </div>
        <ul className="space-y-2">
          {analysis.strengths.map((strength, index) => (
            <li 
              key={index}
              className="flex items-start gap-2"
              style={{ color: "var(--text-secondary)", fontSize: "14px" }}
            >
              <span style={{ color: "#10b981" }}>✓</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}
      <div 
        className="p-6 rounded-xl border-2"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "#f59e0b", fontSize: "20px" }} />
          <h3 
            className="font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "18px",
              fontFamily: "var(--font-display)",
            }}
          >
            Weaknesses
          </h3>
        </div>
        <ul className="space-y-2">
          {analysis.weaknesses.map((weakness, index) => (
            <li 
              key={index}
              className="flex items-start gap-2"
              style={{ color: "var(--text-secondary)", fontSize: "14px" }}
            >
              <span style={{ color: "#f59e0b" }}>!</span>
              <span>{weakness}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Improvement Areas */}
      <div 
        className="p-6 rounded-xl border-2"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <FontAwesomeIcon icon={faLightbulb} style={{ color: "#3b82f6", fontSize: "20px" }} />
          <h3 
            className="font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "18px",
              fontFamily: "var(--font-display)",
            }}
          >
            Areas for Improvement
          </h3>
        </div>
        <ul className="space-y-2">
          {analysis.improvements.map((improvement, index) => (
            <li 
              key={index}
              className="flex items-start gap-2"
              style={{ color: "var(--text-secondary)", fontSize: "14px" }}
            >
              <span style={{ color: "#3b82f6" }}>→</span>
              <span>{improvement}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={() => analyzeProfile(true)}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          Refresh Analysis
        </button>
      </div>
    </div>
  );
}
