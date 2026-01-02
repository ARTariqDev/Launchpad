"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full py-4 border-t"
      style={{
        backgroundColor: "var(--primary-bg)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
            }}
          >
            © {currentYear} Launchpad. All rights reserved.
          </p>
          <span
            className="hidden sm:inline"
            style={{ color: "rgba(255, 255, 255, 0.3)" }}
          >
            |
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              Made by
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <a
                href="https://github.com/devplotlib"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "14px",
                }}
              >
                Muhammad Abubakar
                <FontAwesomeIcon
                  icon={faGithub}
                  className="w-4 h-4"
                />
              </a>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                &
              </span>
              <a
                href="https://github.com/Abdul-Wasiq-Khan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "14px",
                }}
              >
                Abdul Wasiq Khan
                <FontAwesomeIcon
                  icon={faGithub}
                  className="w-4 h-4"
                />
              </a>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                &
              </span>
              <a
                href="https://github.com/ARTariqDev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "14px",
                }}
              >
                Abdur Rehman Tariq
                <FontAwesomeIcon
                  icon={faGithub}
                  className="w-4 h-4"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
