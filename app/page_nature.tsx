"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-50">
      {/* Animated Nature Background */}
      <div className="fixed inset-0 -z-10">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/30 via-emerald-100/20 to-transparent"></div>
        
        {/* Floating clouds */}
        <div className="absolute top-10 left-10 w-64 h-24 bg-white/40 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-32 right-20 w-80 h-32 bg-white/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-48 left-1/3 w-72 h-28 bg-white/35 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle nature elements */}
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-emerald-200/30 via-green-100/20 to-transparent"></div>
        
        {/* Soft light rays */}
        <div className="absolute top-0 right-1/4 w-1 h-96 bg-gradient-to-b from-yellow-200/20 to-transparent blur-xl rotate-12 animate-pulse-slow"></div>
        <div className="absolute top-0 right-1/3 w-1 h-80 bg-gradient-to-b from-yellow-100/15 to-transparent blur-xl rotate-6 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'backdrop-blur-md bg-white/70 shadow-lg shadow-emerald-500/5' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🌿</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                MoodTherapist
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link 
                href="/login" 
                className="px-6 py-2.5 rounded-full bg-white/80 text-emerald-700 font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-emerald-200"
              >
                Sign In
              </Link>
              <Link 
                href="/chat" 
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Start Journey
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/80 backdrop-blur-sm border border-emerald-200">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-emerald-800">Your peaceful space, always here</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-gray-800 font-serif">Find Your</span>
                <span className="block bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent animate-gradient">
                  Inner Peace
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Take a mindful breath. Connect with an AI companion that understands. 
                Discover calm, clarity, and emotional wellness in a safe, serene space designed just for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  href="/chat"
                  className="group px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Begin Your Journey
                  <span className="group-hover:translate-x-1 transition-transform">🌱</span>
                </Link>
                <Link 
                  href="/dashboard"
                  className="px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm text-emerald-700 font-semibold text-lg hover:bg-white hover:shadow-xl transition-all duration-300 border border-emerald-200 flex items-center justify-center"
                >
                  Explore Features
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">24/7</div>
                  <div className="text-sm text-gray-600">Always Available</div>
                </div>
                <div className="w-px h-12 bg-emerald-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">100%</div>
                  <div className="text-sm text-gray-600">Private & Secure</div>
                </div>
                <div className="w-px h-12 bg-emerald-200"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">AI</div>
                  <div className="text-sm text-gray-600">Powered Support</div>
                </div>
              </div>
            </div>
            
            {/* Right: Visual Element */}
            <div className="relative animate-slide-in-right">
              <div className="relative w-full h-[500px]">
                {/* Meditation figure illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Glowing aura */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/30 to-teal-300/30 rounded-full blur-3xl animate-pulse-slow"></div>
                    
                    {/* Main visual */}
                    <div className="relative backdrop-blur-sm bg-white/40 rounded-3xl p-12 shadow-2xl border border-white/50">
                      <div className="text-center space-y-6">
                        <div className="text-8xl animate-float">🧘‍♀️</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-emerald-600">
                            <span className="text-2xl">🌸</span>
                            <span className="text-2xl">🍃</span>
                            <span className="text-2xl">🌿</span>
                            <span className="text-2xl">🦋</span>
                          </div>
                          <p className="text-gray-600 italic">&quot;Breathe in peace, breathe out stress&quot;</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className="absolute -top-6 -right-6 text-4xl animate-float" style={{ animationDelay: '0.5s' }}>🌸</div>
                    <div className="absolute -bottom-6 -left-6 text-4xl animate-float" style={{ animationDelay: '1s' }}>🍃</div>
                    <div className="absolute top-1/2 -right-12 text-3xl animate-float" style={{ animationDelay: '1.5s' }}>🦋</div>
                    <div className="absolute top-1/4 -left-8 text-3xl animate-float" style={{ animationDelay: '2s' }}>☘️</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
              Your Wellness Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nurture your mind, body, and spirit with our gentle approach to mental wellness
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-emerald-100 hover:bg-white/80 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">AI Companion</h3>
              <p className="text-gray-600 leading-relaxed">
                Like a trusted friend, our AI listens without judgment. Share your feelings freely in a safe, supportive environment.
              </p>
              <div className="mt-6 flex items-center text-emerald-600 font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Explore</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-emerald-100 hover:bg-white/80 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-5xl mb-4">🎵</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Mood Music</h3>
              <p className="text-gray-600 leading-relaxed">
                Discover calming melodies tailored to your emotions. Let music be your guide to tranquility and balance.
              </p>
              <div className="mt-6 flex items-center text-teal-600 font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Listen</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-emerald-100 hover:bg-white/80 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Track Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Watch your emotional garden grow. Visualize patterns, celebrate growth, and understand your journey better.
              </p>
              <div className="mt-6 flex items-center text-cyan-600 font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Discover</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
              Simple Steps to Serenity
            </h2>
            <p className="text-xl text-gray-600">
              Your path to peace is just three breaths away
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start group">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="flex-1 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-emerald-100 group-hover:bg-white/80 transition-all">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Start Your Session</h3>
                <p className="text-gray-600 leading-relaxed">
                  Begin with a simple check-in. No appointments, no pressure—just you and a moment of peace whenever you need it.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start group">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="flex-1 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-teal-100 group-hover:bg-white/80 transition-all">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Share & Reflect</h3>
                <p className="text-gray-600 leading-relaxed">
                  Express what&apos;s on your mind. Our AI companion listens with empathy, offering gentle guidance and understanding.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start group">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="flex-1 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-cyan-100 group-hover:bg-white/80 transition-all">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Grow & Flourish</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track your emotional growth over time. Celebrate progress, discover patterns, and cultivate lasting inner peace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-12 md:p-16 text-center shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Ready to Begin?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Take the first step towards a calmer, more balanced you. Your journey to inner peace starts now.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link 
                  href="/chat"
                  className="px-8 py-4 rounded-full bg-white text-emerald-600 font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Start Free Session Now
                </Link>
                <Link 
                  href="/dashboard"
                  className="px-8 py-4 rounded-full border-2 border-white text-white font-semibold text-lg hover:bg-white hover:text-emerald-600 transition-all duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-emerald-200/50 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-white">🌿</span>
                </div>
                <span className="text-xl font-bold text-gray-800">MoodTherapist</span>
              </div>
              <p className="text-gray-600 text-sm">
                Your peaceful companion for mental wellness and emotional growth.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/chat" className="text-gray-600 hover:text-emerald-600 transition-colors">AI Chat</Link></li>
                <li><Link href="/dashboard" className="text-gray-600 hover:text-emerald-600 transition-colors">Dashboard</Link></li>
                <li><Link href="/login" className="text-gray-600 hover:text-emerald-600 transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-emerald-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                  <span className="text-xl">🐦</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                  <span className="text-xl">📘</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                  <span className="text-xl">📷</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} MoodTherapist. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs text-center max-w-2xl">
                <strong>Disclaimer:</strong> MoodTherapist is not a substitute for professional medical advice. 
                If you&apos;re experiencing a mental health emergency, please contact emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
