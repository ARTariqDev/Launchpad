"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket } from "@fortawesome/free-solid-svg-icons";
import Button from "./components/Button";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out",
    });

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (data.authenticated) {
          const redirectTo = data.user.role === "admin" ? "/admin" : "/dashboard";
          router.push(redirectTo);
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'var(--primary-bg)', fontFamily: 'var(--font-body)' }}>
      <div className="relative z-10 w-full px-6 text-center flex flex-col items-center justify-evenly" style={{ height: '45vh' }}>
        <div data-aos="fade-down">
          <h1 className="font-black tracking-tight hidden md:block" style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-logo)', lineHeight: '1', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            LA
            <span className="inline-block relative mx-2">
              <span className="opacity-0">U</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <FontAwesomeIcon 
                  icon={faRocket} 
                  className="animate-rocket" 
                  style={{ fontSize: 'calc(var(--font-size-logo) * 0.6)' }}
                />
              </span>
            </span>
            NCHPAD
          </h1>
          <h1 className="font-black tracking-tight md:hidden" style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-logo)', lineHeight: '1.1', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            LA
            <span className="inline-block relative mx-2">
              <span className="opacity-0">U</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <FontAwesomeIcon 
                  icon={faRocket} 
                  className="animate-rocket" 
                  style={{ fontSize: 'calc(var(--font-size-logo) * 0.6)' }}
                />
              </span>
            </span>
            NCH
            <br />
            PAD
          </h1>
        </div>
      </div>

      <div className="relative z-10 w-full px-6 text-center flex flex-col items-center justify-start" style={{ height: '35vh', paddingTop: '2rem' }}>
        <p className="max-w-4xl mx-auto mb-8 font-normal" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-body)', lineHeight: '1.6' }} data-aos="fade-up" data-aos-delay="200">
          AI-powered platform for global university applications <br /> streamline essays, deadlines, and documents worldwide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch w-full max-w-md sm:max-w-none" data-aos="fade-up" data-aos-delay="300">
          <Button 
            text="Sign Up" 
            color="#ffffff"
            textColor="#000000"
            glowColor="#000000"
            onClick={() => router.push("/signup")}
          />
          <Button 
            text="Login" 
            color="#1a1a1a"
            textColor="#ffffff"
            glowColor="#ffffff"
            onClick={() => router.push("/login")}
          />
        </div>
      </div>
    </div>
  );
}
