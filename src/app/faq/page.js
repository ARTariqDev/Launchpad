"use client";

import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I get started with Launchpad?",
      answer: "Start by completing your profile in the Dashboard section. Fill in your academic information, test scores, GPA, and extracurricular activities. The more complete your profile, the better our AI can provide personalized college recommendations and insights tailored to your strengths and goals."
    },
    {
      question: "When should I start my college application process?",
      answer: "Ideally, start researching colleges in your junior year (or equivalent). Begin working on your essays and applications in the summer before senior year. Most early decision/action deadlines are in November, while regular decision deadlines are typically in January. Remember: starting early gives you time to craft compelling essays and gather strong recommendation letters."
    },
    {
      question: "What colleges can I explore?",
      answer: "Browse through our curated database of universities and colleges worldwide in the Colleges section. Use our advanced filters to search by location, acceptance rate, tuition, programs, and more. Our AI-powered insights help you understand your fit for each institution based on your profile."
    },
    {
      question: "How many colleges should I apply to?",
      answer: "We recommend applying to 8-12 colleges with a balanced mix: 2-3 reach schools (more competitive), 4-6 target schools (good match for your stats), and 2-3 safety schools (you're likely to be admitted). This strategy maximizes your chances while keeping the workload manageable."
    },
    {
      question: "What is the difference between Early Decision, Early Action, and Regular Decision?",
      answer: "Early Decision (ED) is binding - if accepted, you must attend. Early Action (EA) is non-binding and gives you an early response. Regular Decision (RD) has later deadlines and decisions. ED can improve admission chances at your dream school but commits you financially. EA is great for showing interest without commitment. Consider your financial aid needs before choosing ED."
    },
    {
      question: "How do I track my applications and deadlines?",
      answer: "Use the Dashboard to manage all your application materials, essays, test scores, and deadlines in one centralized place. Our My Lists feature lets you save colleges, scholarships, and activities, with a calendar view showing all upcoming deadlines. Mark items as completed to track your progress throughout the application season."
    },
    {
      question: "What makes a strong college essay?",
      answer: "A strong essay is authentic, specific, and reveals something meaningful about you. Show, don't tell - use concrete examples and stories. Avoid clichés and focus on personal growth or unique perspectives. Start with a compelling hook, maintain your genuine voice, and ensure every sentence adds value. Revise multiple times and get feedback from trusted mentors."
    },
    {
      question: "Can I save multiple essays?",
      answer: "Yes! Save as many essays as you need in different styles (US, UK, or Other). You can manage Common App essays, supplemental essays, and personal statements all in one place. Keep multiple drafts and versions to track your progress and reuse content for different applications where appropriate."
    },
    {
      question: "How important are extracurricular activities?",
      answer: "Very important! Colleges want well-rounded individuals who contribute to their community. Focus on depth over breadth - sustained commitment and leadership in 2-3 activities is better than superficial involvement in many. Use our Extracurriculars section to discover opportunities, and highlight how your activities demonstrate passion, leadership, and impact."
    },
    {
      question: "How can I find scholarships?",
      answer: "Browse our comprehensive Scholarships section featuring opportunities from various organizations. Filter by deadline, amount, and eligibility criteria. Start early - many scholarships have deadlines before college applications. Apply to multiple scholarships, even smaller ones - they add up! Save promising scholarships to your list and track deadlines in the calendar."
    },
    {
      question: "What test scores do I need?",
      answer: "Requirements vary by college. Research each school's average SAT/ACT scores and subject test requirements. Many schools are now test-optional, but strong scores can still strengthen your application. Consider your scores in context with the college's middle 50% range. If below range, focus on highlighting other strong aspects of your application."
    },
    {
      question: "How do I get good recommendation letters?",
      answer: "Ask teachers who know you well and can speak to specific examples of your abilities, at least a month before deadlines. Choose teachers from core subjects (ideally from junior year) who have seen your growth. Provide them with your resume, goals, and specific achievements they might mention. Always send a thank you note after submission."
    },
    {
      question: "Should I visit colleges before applying?",
      answer: "If possible, yes! Campus visits help you gauge fit and can demonstrate interest (important for some schools). If you can't visit in person, take virtual tours, attend online information sessions, and connect with current students. Some colleges track 'demonstrated interest' - engaging with them shows genuine enthusiasm."
    },
    {
      question: "How do I use the AI-powered college insights?",
      answer: "Click on any college in our database to receive personalized AI analysis. Our system evaluates your profile against the college's admission criteria, provides fit analysis, highlights relevant programs and opportunities, and suggests how to strengthen your application for that specific school."
    },
    {
      question: "What if I get waitlisted?",
      answer: "Accept your spot on the waitlist if you're still interested. Send a Letter of Continued Interest (LOCI) reaffirming your enthusiasm and updating the admissions office on new achievements. Submit any new test scores or awards. Have a backup plan but stay hopeful - waitlist acceptances do happen, typically from May to July."
    },
    {
      question: "How do I stay organized during application season?",
      answer: "Use Launchpad's calendar feature to track all deadlines. Create a checklist for each college including essays, supplements, test scores, recommendations, and financial aid forms. Set reminders 2 weeks before each deadline. Break large tasks into smaller steps. Regular updates to your profile ensure you don't miss any requirements."
    }
  ];

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--primary-bg)", fontFamily: "var(--font-body)" }}
    >
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
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
              className="p-6 rounded-lg border-2 animate-fade-in"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
                animationDelay: `${index * 50}ms`
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
          className="mt-8 p-6 rounded-lg border-2 animate-fade-in"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderColor: "var(--card-border)",
            animationDelay: `${faqs.length * 50}ms`
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
            Remember: the college application process is a journey, not a race. Take your time, be authentic, and showcase what makes you unique. Use Launchpad&apos;s tools to stay organized and confident throughout your application journey. You&apos;ve got this!
          </p>
        </div>
      </div>
    </div>
  );
}
