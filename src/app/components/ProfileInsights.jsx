"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChartLine, 
  faLightbulb, 
  faExclamationTriangle,
  faTrophy,
  faSpinner,
  faComments,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

export default function ProfileInsights({ profile }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFeedback, setCategoryFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [abortController, setAbortController] = useState(null);

  const analyzeProfile = async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);

    setLoading(true);
    setError(null);
    setUpdateMessage('');
    
    try {
      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile, forceRefresh }),
        signal: controller.signal
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          setError('Rate limit exceeded. Please wait 10-15 seconds and try again.');
        } else {
          setError(data.error || 'Failed to analyze profile');
        }
        return;
      }

      const analysisData = {
        ...data.analysis,
        overallScore: typeof data.analysis.overallScore === 'number' 
          ? data.analysis.overallScore 
          : parseFloat(data.analysis.overallScore) || 0
      };
      
      setAnalysis(analysisData);
      
      if (data.cached) {
        setUpdateMessage('Using cached analysis - no changes detected');
      } else if (data.partial) {
        setUpdateMessage('✓ Updated only the changed categories');
      }
      
      if (data.cached || data.partial) {
        setTimeout(() => setUpdateMessage(''), 3000);
      }
      
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

  const getCategoryFeedback = async (category) => {
    setSelectedCategory(category);
    setLoadingFeedback(true);
    setCategoryFeedback(null);

    try {
      const response = await fetch('/api/category-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile, 
          category,
          currentScore: analysis.scores[category]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get feedback');
      }

      setCategoryFeedback(data.feedback);
    } catch (err) {
      console.error('Feedback error:', err);
      setCategoryFeedback({
        assessment: 'Unable to load detailed feedback at this time.',
        strengths: [],
        weaknesses: [],
        recommendations: ['Please try again later.']
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const closeFeedbackModal = () => {
    setSelectedCategory(null);
    setCategoryFeedback(null);
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
          onClick={() => analyzeProfile()}
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
    essays: 'Essay Quality'
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
        {updateMessage && (
          <div className="mt-3 p-2 rounded-lg" style={{ 
            backgroundColor: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid rgba(16, 185, 129, 0.3)" 
          }}>
            <p style={{ color: "#10b981", fontSize: "14px" }}>
              {updateMessage}
            </p>
          </div>
        )}
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
          {typeof analysis.overallScore === 'number' 
            ? analysis.overallScore.toFixed(1) 
            : parseFloat(analysis.overallScore || 0).toFixed(1)}
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
                <div className="flex items-center gap-3">
                  <span 
                    className="font-bold"
                    style={{ 
                      color: getScoreColor(score),
                      fontFamily: "var(--font-display)"
                    }}
                  >
                    {score}/10
                  </span>
                  <button
                    onClick={() => getCategoryFeedback(category)}
                    className="px-3 py-1 rounded-lg border transition-all hover:scale-105"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-primary)",
                      fontSize: "12px"
                    }}
                    title="Get detailed feedback"
                  >
                    <FontAwesomeIcon icon={faComments} className="w-3 mr-1" />
                    Feedback
                  </button>
                </div>
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

      {/* Feedback Modal */}
      {selectedCategory && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={closeFeedbackModal}
        >
          <div 
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-xl border-2 p-6"
            style={{
              backgroundColor: "var(--primary-bg)",
              borderColor: "var(--card-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 
                  className="font-bold mb-2"
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "24px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {categoryLabels[selectedCategory]} Feedback
                </h3>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl font-bold"
                    style={{ 
                      color: getScoreColor(analysis.scores[selectedCategory]),
                      fontFamily: "var(--font-display)"
                    }}
                  >
                    {analysis.scores[selectedCategory]}/10
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {getScoreLabel(analysis.scores[selectedCategory])}
                  </span>
                </div>
              </div>
              <button
                onClick={closeFeedbackModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>

            {loadingFeedback ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FontAwesomeIcon 
                  icon={faSpinner} 
                  className="animate-spin text-4xl mb-4"
                  style={{ color: "var(--text-primary)" }}
                />
                <p style={{ color: "var(--text-secondary)" }}>
                  Generating detailed feedback...
                </p>
              </div>
            ) : categoryFeedback && (
              <div className="space-y-6">
                {/* Assessment */}
                <div>
                  <h4 
                    className="font-bold mb-3 flex items-center gap-2"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "18px",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    <FontAwesomeIcon icon={faChartLine} style={{ color: "#3b82f6" }} />
                    Overall Assessment
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.6" }}>
                    {categoryFeedback.assessment}
                  </p>
                </div>

                {/* Strengths */}
                {categoryFeedback.strengths && categoryFeedback.strengths.length > 0 && (
                  <div>
                    <h4 
                      className="font-bold mb-3 flex items-center gap-2"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "18px",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      <FontAwesomeIcon icon={faTrophy} style={{ color: "#10b981" }} />
                      What You&apos;re Doing Well
                    </h4>
                    <ul className="space-y-2">
                      {categoryFeedback.strengths.map((strength, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-2 p-3 rounded-lg"
                          style={{ 
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            color: "var(--text-secondary)",
                            fontSize: "14px"
                          }}
                        >
                          <span style={{ color: "#10b981", minWidth: "20px" }}>✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {categoryFeedback.weaknesses && categoryFeedback.weaknesses.length > 0 && (
                  <div>
                    <h4 
                      className="font-bold mb-3 flex items-center gap-2"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "18px",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "#f59e0b" }} />
                      Areas of Concern
                    </h4>
                    <ul className="space-y-2">
                      {categoryFeedback.weaknesses.map((weakness, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-2 p-3 rounded-lg"
                          style={{ 
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            color: "var(--text-secondary)",
                            fontSize: "14px"
                          }}
                        >
                          <span style={{ color: "#f59e0b", minWidth: "20px" }}>!</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {categoryFeedback.recommendations && categoryFeedback.recommendations.length > 0 && (
                  <div>
                    <h4 
                      className="font-bold mb-3 flex items-center gap-2"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "18px",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      <FontAwesomeIcon icon={faLightbulb} style={{ color: "#3b82f6" }} />
                      Specific Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {categoryFeedback.recommendations.map((rec, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-2 p-3 rounded-lg"
                          style={{ 
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            color: "var(--text-secondary)",
                            fontSize: "14px"
                          }}
                        >
                          <span style={{ color: "#3b82f6", minWidth: "20px" }}>→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
