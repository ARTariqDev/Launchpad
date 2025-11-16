"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faGraduationCap, faHome, faTrophy, faBook, faQuestionCircle, faBookmark, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleMenuToggle = () => {
    if (mobileMenuOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setMobileMenuOpen(false);
        setIsClosing(false);
      }, 200); // Match animation duration
    } else {
      setMobileMenuOpen(true);
    }
  };

  const handleLinkClick = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: faHome },
    { name: "Colleges", href: "/colleges", icon: faGraduationCap },
    { name: "Extracurriculars", href: "/extracurriculars", icon: faTrophy },
    { name: "Scholarships", href: "/scholarships", icon: faBook },
    { name: "My Lists", href: "/my-lists", icon: faBookmark },
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
                  className="px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 hover:bg-white/10 hover:scale-105 hover:shadow-lg relative group"
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
                  <FontAwesomeIcon icon={link.icon} className="text-sm transition-transform group-hover:rotate-12" />
                  <span className="relative">
                    {link.name}
                    <span 
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"
                      style={{ backgroundColor: "var(--text-primary)" }}
                    />
                  </span>
                </Link>
              );
            })}
            <div className="ml-4">
              <LogoutButton />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={handleMenuToggle}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "var(--text-primary)" }}
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="text-xl" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div 
            className={`lg:hidden absolute left-0 right-0 top-16 z-50 border-b-2 ${isClosing ? 'animate-slide-up' : 'animate-slide-down'}`}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 w-full hover:bg-white/10 hover:translate-x-2 hover:scale-105 ${isClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}
                    style={{
                      backgroundColor: isActive
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-subtle)",
                      fontFamily: "var(--font-display)",
                      fontWeight: isActive ? "bold" : "500",
                      animationDelay: isClosing ? `${(navLinks.length - index - 1) * 30}ms` : `${index * 50}ms`,
                    }}
                  >
                    <FontAwesomeIcon icon={link.icon} className="text-lg w-5 transition-transform hover:scale-110" />
                    <span className="text-base">{link.name}</span>
                  </Link>
                );
              })}
              <div className={`pt-2 mt-2 border-t ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} style={{ borderColor: "rgba(255, 255, 255, 0.1)", animationDelay: isClosing ? "0ms" : "300ms" }}>
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
