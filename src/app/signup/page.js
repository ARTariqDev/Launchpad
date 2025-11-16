"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Button";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 600,
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(data.redirectTo);
        router.refresh();
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-6"
      style={{ backgroundColor: "var(--primary-bg)", fontFamily: "var(--font-body)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8" data-aos="fade-down">
          <div className="flex items-center justify-center mb-4">
            <h1
              className="font-black tracking-tight cursor-pointer"
              onClick={() => router.push("/")}
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(40px, 8vw, 60px)",
                lineHeight: "1",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
              }}
            >
              LA
              <FontAwesomeIcon
                icon={faRocket}
                className="mx-1 animate-rocket"
                style={{ fontSize: "clamp(24px, 5vw, 36px)" }}
              />
              NCHPAD
            </h1>
          </div>
          <h2
            className="font-bold mb-2"
            style={{
              color: "var(--text-primary)",
              fontSize: "var(--font-size-heading)",
              fontFamily: "var(--font-display)",
            }}
          >
            Create Account
          </h2>
          <p style={{ color: "var(--text-subtle)", fontSize: "14px" }}>
            Join thousands of students worldwide
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-aos="fade-up" data-aos-delay="100">
          {error && (
            <div
              className="px-4 py-3 rounded-md border-2"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "rgba(239, 68, 68, 0.5)",
                color: "#ef4444",
              }}
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block mb-2 font-medium"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  fontFamily: "var(--font-display)",
                }}
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block mb-2 font-medium"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  fontFamily: "var(--font-display)",
                }}
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block mb-2 font-medium"
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontFamily: "var(--font-display)",
              }}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block mb-2 font-medium"
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontFamily: "var(--font-display)",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 font-medium"
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontFamily: "var(--font-display)",
              }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors pr-12"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-subtle)" }}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block mb-2 font-medium"
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontFamily: "var(--font-display)",
              }}
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-md border-2 bg-transparent focus:outline-none focus:border-white transition-colors pr-12"
                style={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-subtle)" }}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          <div className="pt-4 w-full">
            <div className="w-full">
              <Button
                text={loading ? "Creating Account..." : "Create Account"}
                color="#ffffff"
                textColor="#000000"
                glowColor="#000000"
                onClick={handleSubmit}
              />
            </div>
          </div>

          <div className="text-center pt-4">
            <p style={{ color: "var(--text-subtle)", fontSize: "14px" }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-bold hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                Log In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
