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
          <a
            href="https://github.com/ARTariqDev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{
              color: "var(--text-primary)",
              fontSize: "14px",
            }}
          >
            Made by Abdur Rehman Tariq
            <FontAwesomeIcon
              icon={faGithub}
              className="w-4 h-4"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
