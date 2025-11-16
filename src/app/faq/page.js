"use client";

import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I get started with Launchpad?",
      answer: "Complete your profile in the Dashboard section to receive personalized college recommendations."
    },
    {
      question: "What colleges can I explore?",
      answer: "Browse through our curated list of universities and colleges in the Colleges section."
    },
    {
      question: "How do I track my applications?",
      answer: "Use the Dashboard to manage all your application materials, essays, and deadlines in one place."
    },
    {
      question: "Can I save multiple essays?",
      answer: "Yes! You can save as many essays as you need in different styles (US, UK, or Other)."
    }
  ];

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--primary-bg)", fontFamily: "var(--font-body)" }}
    >
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <FontAwesomeIcon
              icon={faQuestionCircle}
              style={{ color: "var(--text-primary)", fontSize: "24px" }}
            />
          </div>
          <h1
            className="font-bold"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontFamily: "var(--font-display)",
            }}
          >
            FAQ&apos;s & Guide
          </h1>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border-2"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <h3
                className="font-bold mb-3"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "18px",
                  fontFamily: "var(--font-display)",
                }}
              >
                {faq.question}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.6" }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-8 p-6 rounded-lg border-2"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderColor: "var(--card-border)",
          }}
        >
          <h3
            className="font-bold mb-2"
            style={{
              color: "var(--text-primary)",
              fontSize: "20px",
              fontFamily: "var(--font-display)",
            }}
          >
            Need More Help?
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Contact our support team or check out our comprehensive guides in the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
