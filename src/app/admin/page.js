"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket } from "@fortawesome/free-solid-svg-icons";
import CreateForm from "./AdminComponents/CreateForm";
import ManageTab from "./AdminComponents/ManageTab";
import LogoutButton from "../components/LogoutButton";

export default function Admin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: false,
      easing: "ease-out",
    });

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (!data.authenticated) {
          router.push("/login");
        } else if (data.user.role !== "admin") {
          router.push("/dashboard");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    AOS.refresh();
  }, [activeTab]);

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

  const tabs = [
    { id: "create", label: "Create" },
    { id: "universities", label: "Universities" },
    { id: "extracurriculars", label: "Extracurriculars" },
    { id: "scholarships", label: "Scholarships" },
  ];

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{ backgroundColor: "var(--primary-bg)", fontFamily: "var(--font-body)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4" data-aos="fade-down">
          <div className="flex items-center flex-wrap gap-2">
            <h1
              className="font-black tracking-tight cursor-pointer"
              onClick={() => router.push("/")}
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(24px, 5vw, 48px)",
                lineHeight: "1",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
              }}
            >
              LA
              <FontAwesomeIcon
                icon={faRocket}
                className="mx-1 animate-rocket"
                style={{ fontSize: "clamp(16px, 3vw, 30px)" }}
              />
              NCHPAD
            </h1>
            <span
              className="px-3 py-1 rounded border text-xs sm:text-sm"
              style={{
                color: "var(--text-secondary)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                fontFamily: "var(--font-display)",
              }}
            >
              ADMIN
            </span>
          </div>
          <LogoutButton />
        </div>

        <div 
          className="flex overflow-x-auto border-b mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide" 
          style={{ 
            borderColor: "rgba(255, 255, 255, 0.1)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }} 
          data-aos="fade-up" 
          data-aos-delay="100"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 sm:px-6 py-3 font-bold transition-colors whitespace-nowrap shrink-0"
              style={{
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-subtle)",
                borderBottom: activeTab === tab.id ? "2px solid var(--text-primary)" : "2px solid transparent",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(12px, 2vw, 14px)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div key={activeTab} data-aos="fade-up" data-aos-delay="100">
          {activeTab === "create" && <CreateForm />}
          {activeTab === "universities" && <ManageTab type="universities" />}
          {activeTab === "extracurriculars" && <ManageTab type="extracurriculars" />}
          {activeTab === "scholarships" && <ManageTab type="scholarships" />}
        </div>
      </div>
    </div>
  );
}
