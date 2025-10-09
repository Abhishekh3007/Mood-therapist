import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "MoodTherapist - Your AI Mental Health Companion",
  description: "Experience personalized therapy sessions with our AI-powered mood therapist. Track your emotions, stay informed, and build healthy mental habits in a private, supportive environment.",
  keywords: ["mental health", "AI therapist", "mood tracking", "emotional support", "therapy", "wellness"],
  authors: [{ name: "MoodTherapist Team" }],
  openGraph: {
    title: "MoodTherapist - Your AI Mental Health Companion",
    description: "AI-powered mental health support available 24/7",
    type: "website",
  },
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: "#6366f1",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 min-h-screen`}
      >
        <div className="relative">
          {/* Ambient Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
          </div>
          
          {children}
        </div>
      </body>
    </html>
  );
}
