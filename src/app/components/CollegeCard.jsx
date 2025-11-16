"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faGraduationCap, faDollarSign, faExternalLinkAlt, faPlus, faLightbulb, faCalendar } from "@fortawesome/free-solid-svg-icons";

export default function CollegeCard({ college, onViewInsights, onAddToList }) {
  const formatDeadline = (deadline) => {
    if (!deadline.date) return null;
    const date = new Date(deadline.date);
    return `${deadline.type}: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const sortedDeadlines = college.deadlines?.length > 0 
    ? [...college.deadlines].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  return (
    <div
      className="border-2 rounded-lg overflow-hidden hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
      style={{
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Thumbnail */}
      {college.thumbnail && (
        <div className="w-full h-48 overflow-hidden bg-black/50">
          <img 
            src={college.thumbnail} 
            alt={college.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1 mb-4">
          <h3
            className="font-bold mb-3 text-xl"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
          >
            {college.name}
          </h3>

          <div className="space-y-2 mb-4">
            {college.location && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ color: "var(--text-secondary)" }}
                  className="w-4"
                />
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  {typeof college.location === 'string' 
                    ? college.location 
                    : [college.location.city, college.location.state, college.location.country]
                        .filter(Boolean)
                        .join(', ')
                  }
                </span>
              </div>
            )}

            {sortedDeadlines.length > 0 && (
              <div className="flex items-start gap-2">
                <FontAwesomeIcon
                  icon={faCalendar}
                  style={{ color: "var(--text-secondary)" }}
                  className="w-4 mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-1">
                  {sortedDeadlines.map((deadline, index) => (
                    <span key={index} style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                      {formatDeadline(deadline)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {college.type && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  style={{ color: "var(--text-secondary)" }}
                  className="w-4"
                />
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  {college.type} University
                </span>
              </div>
            )}

            {college.acceptanceRate && (
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "var(--text-primary)",
                  }}
                >
                  {college.acceptanceRate}% Acceptance Rate
                </span>
              </div>
            )}

            {college.tuition && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  style={{ color: "var(--text-secondary)" }}
                  className="w-4"
                />
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  ${college.tuition.toLocaleString()}/year
                </span>
              </div>
            )}
          </div>

          {college.majors && college.majors.length > 0 && (
            <div className="mb-4">
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Popular Majors:
              </p>
              <div className="flex flex-wrap gap-1">
                {college.majors.slice(0, 3).map((major, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-secondary)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {major}
                  </span>
                ))}
                {college.majors.length > 3 && (
                  <span
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    +{college.majors.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {college.efc && (
            <div className="mb-4">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Average EFC: ${college.efc.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewInsights(college)}
            className="flex-1 px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              borderColor: "rgba(255, 255, 255, 0.3)",
              color: "var(--text-primary)",
            }}
          >
            <FontAwesomeIcon icon={faLightbulb} className="w-4" />
            <span className="text-sm font-semibold">View Insights</span>
          </button>

          <button
            onClick={() => onAddToList(college._id)}
            className="flex-1 px-4 py-2 rounded-lg border-2 hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              borderColor: "var(--text-primary)",
              color: "var(--text-primary)",
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="w-4" />
            <span className="text-sm font-semibold">Add to List</span>
          </button>
        </div>

        <a
          href={college.applicationLink || `https://www.google.com/search?q=${encodeURIComponent(college.name + ' application')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 py-2 hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-secondary)", fontSize: "13px" }}
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3" />
          <span>{college.applicationLink ? 'Visit Application Portal' : 'Search Application Info'}</span>
        </a>
      </div>
    </div>
  );
}
