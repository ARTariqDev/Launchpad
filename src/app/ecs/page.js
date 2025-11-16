"use client";

import Navbar from "../components/Navbar";

export default function ExtracurricularsPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--primary-bg)", fontFamily: "var(--font-body)" }}
    >
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1
          className="font-bold mb-4"
          style={{
            color: "var(--text-primary)",
            fontSize: "clamp(28px, 5vw, 42px)",
            fontFamily: "var(--font-display)",
          }}
        >
          Extracurricular Activities
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
          Discover extracurricular opportunities to enhance your profile. Coming soon!
        </p>
      </div>
    </div>
  );
}
