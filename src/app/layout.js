import { Space_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  fallback: ["monospace"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["monospace"],
});

export const metadata = {
  title: "Launchpad - AI-Powered College Applications",
  description: "Your all-in-one platform for global university applications",
  icons: {
    icon: "/assets/fav.png",
  },
  keywords: [
    "college applications",
    "university applications",
    "apply to college",
    "AI-powered",
    "Launchpad",
  ],
  metadataBase: new URL("https://launchpad-for-college.vercel.app"),
  openGraph: {
    title: "Launchpad - AI-Powered College Applications",
    description: "Your all-in-one platform for global university applications",
    url: "https://launchpad-for-college.vercel.app",
    images: [
      {
        url: "https://launchpad-for-college.vercel.app/og.png",
        width: 1200,
        height: 630,
        alt: "Launchpad - AI-Powered College Applications",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Launchpad - AI-Powered College Applications",
    description: "Your all-in-one platform for global university applications",
    images: ["https://launchpad-for-college.vercel.app/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://launchpad-for-college.vercel.app",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="NowvXA1Cnoi8Ddi97wi-WcKhIYp5PxCVOyN7C7fJTFo" />
        <meta name="description" content="Your all-in-one platform for global university applications" />
        <meta name="keywords" content="college applications, university applications, AI-powered, Launchpad, scholarships" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://launchpad-for-college.vercel.app" />

        <meta property="og:title" content="Launchpad - AI-Powered College Applications" />
        <meta property="og:description" content="Your all-in-one platform for global university applications" />
        <meta property="og:image" content="https://launchpad-for-college.vercel.app/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://launchpad-for-college.vercel.app/og.png" />
      </head>
      <body
        className={`${spaceMono.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <main style={{ flex: '1 0 auto' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
