"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faGraduationCap, faHome, faTrophy, faBook, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: faHome },
    { name: "Colleges", href: "/colleges", icon: faGraduationCap },
    { name: "Extracurriculars", href: "/extracurriculars", icon: faTrophy },
    { name: "Scholarships", href: "/scholarships", icon: faBook },
    { name: "FAQ's/Guide", href: "/faq", icon: faQuestionCircle },
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b-2 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span
              className="text-xl sm:text-2xl font-bold flex items-center"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              LA
              <span className="relative inline-block mx-1">
                <FontAwesomeIcon
                  icon={faRocket}
                  className="text-xl sm:text-2xl transition-all duration-500 animate-bounce-slow"
                  style={{ color: "var(--text-primary)" }}
                />
              </span>
              NCHPAD
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-subtle)",
                    fontFamily: "var(--font-display)",
                    fontSize: "14px",
                    fontWeight: isActive ? "bold" : "500",
                  }}
                >
                  <FontAwesomeIcon icon={link.icon} className="text-sm" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <div className="ml-4">
              <LogoutButton />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <LogoutButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.03)",
                    color: isActive ? "var(--text-primary)" : "var(--text-subtle)",
                    fontFamily: "var(--font-display)",
                    fontWeight: isActive ? "bold" : "500",
                  }}
                >
                  <FontAwesomeIcon icon={link.icon} className="text-xs" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
