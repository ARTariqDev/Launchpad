"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSpinner, faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

export default function CollegeInsightsModal({ college, onClose }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/college-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeId: college._id,
          forceRefresh
        })
      });

      const data = await response.json();

      if (data.success) {
        setInsights(data.insights);
      } else {
        setError(data.error || "Failed to generate insights");
      }
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError("Failed to load insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [college._id]);

  useEffect(() => {
    fetchInsights();
  }, [college._id, fetchInsights]);

  const getScoreColor = (score) => {
    if (score >= 8) return "#10b981";
    if (score >= 6) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border-2 p-6"
        style={{
          backgroundColor: "var(--primary-bg)",
          borderColor: "rgba(255, 255, 255, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2
              className="font-bold text-2xl mb-1"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
            >
              {college.name}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              AI-Powered Fit Analysis
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <FontAwesomeIcon
              icon={faSpinner}
              className="w-8 h-8 animate-spin mb-4"
              style={{ color: "var(--text-primary)" }}
            />
            <p style={{ color: "var(--text-secondary)" }}>
              Analyzing your fit for {college.name}...
            </p>
          </div>
        )}

        {error && (
          <div
            className="border-2 rounded-lg p-6 mb-6"
            style={{ borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faExclamationCircle} className="w-5 h-5 mt-0.5" style={{ color: "#ef4444" }} />
              <div>
                <p style={{ color: "#ef4444", fontSize: "16px", marginBottom: "8px" }}>
                  {error}
                </p>
                <button
                  onClick={() => fetchInsights(true)}
                  className="px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-colors text-sm"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && insights && (
          <div className="space-y-6">
            <div
              className="border-2 rounded-lg p-6"
              style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-xl"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  Overall Fit Score
                </h3>
                <div
                  className="text-4xl font-bold"
                  style={{ color: getScoreColor(insights.fitScore) }}
                >
                  {insights.fitScore}/10
                </div>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                {insights.fitSummary}
              </p>
            </div>

            {insights.majorMatch !== undefined && (
              <div
                className="border-2 rounded-lg p-6"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={insights.majorMatch ? faCheckCircle : faExclamationCircle}
                    className="w-5 h-5 mt-0.5"
                    style={{ color: insights.majorMatch ? "#10b981" : "#f59e0b" }}
                  />
                  <div>
                    <h3
                      className="font-bold mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Major Availability
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                      {insights.majorInfo}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {insights.efcComparison && (
              <div
                className="border-2 rounded-lg p-6"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <h3
                  className="font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Financial Fit
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  {insights.efcComparison}
                </p>
              </div>
            )}

            {insights.comparisonToAdmits && (
              <div
                className="border-2 rounded-lg p-6"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <h3
                  className="font-bold mb-4 text-lg"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  How You Compare to Admitted Students
                </h3>

                <div className="space-y-4">
                  {insights.comparisonToAdmits.testScores && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        Test Scores
                      </h4>
                      <div style={{ color: "var(--text-secondary)", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                        {typeof insights.comparisonToAdmits.testScores === 'string' 
                          ? insights.comparisonToAdmits.testScores 
                          : JSON.stringify(insights.comparisonToAdmits.testScores)}
                      </div>
                    </div>
                  )}

                  {insights.comparisonToAdmits.academics && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        Academic Performance
                      </h4>
                      <div style={{ color: "var(--text-secondary)", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                        {typeof insights.comparisonToAdmits.academics === 'string' 
                          ? insights.comparisonToAdmits.academics 
                          : JSON.stringify(insights.comparisonToAdmits.academics)}
                      </div>
                    </div>
                  )}

                  {insights.comparisonToAdmits.extracurriculars && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        Extracurriculars
                      </h4>
                      <div style={{ color: "var(--text-secondary)", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                        {typeof insights.comparisonToAdmits.extracurriculars === 'string' 
                          ? insights.comparisonToAdmits.extracurriculars 
                          : JSON.stringify(insights.comparisonToAdmits.extracurriculars)}
                      </div>
                    </div>
                  )}

                  {insights.comparisonToAdmits.essays && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        Essays
                      </h4>
                      <div style={{ color: "var(--text-secondary)", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                        {typeof insights.comparisonToAdmits.essays === 'string' 
                          ? insights.comparisonToAdmits.essays 
                          : JSON.stringify(insights.comparisonToAdmits.essays)}
                      </div>
                    </div>
                  )}

                  {insights.comparisonToAdmits.awards && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        Awards & Recognition
                      </h4>
                      <div style={{ color: "var(--text-secondary)", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                        {typeof insights.comparisonToAdmits.awards === 'string' 
                          ? insights.comparisonToAdmits.awards 
                          : JSON.stringify(insights.comparisonToAdmits.awards)}
                      </div>
                    </div>
                  )}

                  {insights.comparisonToAdmits.financialNeed && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        Financial Aid Match
                      </h4>
                      <div style={{ color: "var(--text-secondary)", fontSize: "14px", whiteSpace: "pre-wrap" }}>
                        {typeof insights.comparisonToAdmits.financialNeed === 'string' 
                          ? insights.comparisonToAdmits.financialNeed 
                          : JSON.stringify(insights.comparisonToAdmits.financialNeed)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* College Information Section */}
            {insights.collegeInfo && (
              <div
                className="border-2 rounded-lg p-6"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <h3
                  className="font-bold mb-4 text-lg"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  About {college.name}
                </h3>

                <div className="space-y-4">
                  {insights.collegeInfo.costOfAttendance && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        Cost of Attendance (COA)
                      </h4>
                      {insights.collegeInfo.costOfAttendance.domestic && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)", opacity: 0.8 }}>
                            Domestic Students:
                          </p>
                          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                            {insights.collegeInfo.costOfAttendance.domestic}
                          </p>
                        </div>
                      )}
                      {insights.collegeInfo.costOfAttendance.international && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)", opacity: 0.8 }}>
                            International Students:
                          </p>
                          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                            {insights.collegeInfo.costOfAttendance.international}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {insights.collegeInfo.needBlind && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Need-Blind Policy
                      </h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {insights.collegeInfo.needBlind}
                      </p>
                    </div>
                  )}

                  {insights.collegeInfo.scholarships && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Scholarships & Financial Aid
                      </h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {insights.collegeInfo.scholarships}
                      </p>
                    </div>
                  )}

                  {insights.collegeInfo.internationalFriendly && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        International Students
                      </h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {insights.collegeInfo.internationalFriendly}
                      </p>
                    </div>
                  )}

                  {insights.collegeInfo.culture && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Campus Culture
                      </h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {insights.collegeInfo.culture}
                      </p>
                    </div>
                  )}

                  {insights.collegeInfo.opportunities && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Opportunities
                      </h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {insights.collegeInfo.opportunities}
                      </p>
                    </div>
                  )}

                  {insights.collegeInfo.admittedStudentProfile && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Typical Admitted Student Profile
                      </h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {insights.collegeInfo.admittedStudentProfile}
                      </p>
                    </div>
                  )}

                  {insights.collegeInfo.supplements && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Supplemental Essays
                      </h4>
                      <div 
                        style={{ color: "var(--text-secondary)", fontSize: "14px" }}
                        dangerouslySetInnerHTML={{
                          __html: insights.collegeInfo.supplements.replace(
                            /(https?:\/\/[^\s]+)/g,
                            '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline; word-break: break-all;">$1</a>'
                          )
                        }}
                      />
                    </div>
                  )}

                  {insights.collegeInfo.requirements && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Application Requirements
                      </h4>
                      <div 
                        style={{ color: "var(--text-secondary)", fontSize: "14px" }}
                        dangerouslySetInnerHTML={{
                          __html: insights.collegeInfo.requirements.replace(
                            /(https?:\/\/[^\s]+)/g,
                            '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline; word-break: break-all;">$1</a>'
                          )
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {insights.strengths && insights.strengths.length > 0 && (
              <div
                className="border-2 rounded-lg p-6"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <h3
                  className="font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Your Strengths for This College
                </h3>
                <ul className="space-y-2">
                  {insights.strengths.map((strength, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <span style={{ color: "#10b981" }}>✓</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {strength}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.concerns && insights.concerns.length > 0 && (
              <div
                className="border-2 rounded-lg p-6"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <h3
                  className="font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Areas to Consider
                </h3>
                <ul className="space-y-2">
                  {insights.concerns.map((concern, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <span style={{ color: "#f59e0b" }}>!</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {concern}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.recommendations && insights.recommendations.length > 0 && (
              <div
                className="border-2 rounded-lg p-6"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <h3
                  className="font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Application Recommendations
                </h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <span style={{ color: "var(--text-primary)" }}>•</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        {rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => fetchInsights(true)}
                className="flex-1 px-6 py-3 rounded-lg border-2 hover:bg-white/10 transition-colors"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "var(--text-primary)",
                }}
              >
                Refresh Analysis
              </button>

              <a
                href={college.applicationLink || `https://www.google.com/search?q=${encodeURIComponent(college.name + ' application')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 rounded-lg border-2 hover:bg-white hover:text-black transition-all text-center flex items-center justify-center gap-2"
                style={{
                  borderColor: "var(--text-primary)",
                  color: "var(--text-primary)",
                }}
              >
                <span>{college.applicationLink ? 'Apply Now' : 'Search Application'}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
