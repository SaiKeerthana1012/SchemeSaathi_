import React from 'react';
import { Language, UserProfile, UserAccount } from '../types';
import { TRANSLATIONS } from '../translations';
import { AuthModalMode } from './AuthModal';
import { HomeHeroIllustration } from './HomeHeroIllustration';
import {
  ShieldCheck,
  Search,
  List,
  Target,
  FileText,
  CheckCircle2,
  LogIn,
  UserPlus
} from 'lucide-react';

interface HomeViewProps {
  language: Language;
  onNavigate: (tab: string, initialSchemeTab?: 'all' | 'recommended') => void;
  userProfile: UserProfile | null;
  currentUser: UserAccount | null;
  onOpenAuth: (mode?: AuthModalMode) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  language,
  onNavigate,
  userProfile,
  currentUser,
  onOpenAuth
}) => {
  const t = TRANSLATIONS[language];

  // Action 1: Find My Scheme
  const handleFindMyScheme = () => {
    if (!currentUser) {
      onOpenAuth('auth_for_matching');
    } else if (userProfile) {
      // If user already completed profile, go to recommended schemes or edit profile
      onNavigate('profile');
    } else {
      onNavigate('profile');
    }
  };

  // Action 2: Browse Schemes
  const handleBrowseSchemes = () => {
    if (!currentUser) {
      onOpenAuth('auth_for_browse');
    } else {
      onNavigate('find-schemes', 'all');
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-140px)] flex flex-col justify-between" id="home-page-view">
      
      {/* ======================================================== */}
      {/* HERO SECTION: Two-Column Layout on Soft Light Blue Canvas */}
      {/* ======================================================== */}
      <section className="relative bg-gradient-to-b from-[#EFF6FF] via-[#F4F9FF] to-[#E8F2FC] pt-10 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-10 overflow-hidden" id="home-hero-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          
          {/* LEFT SIDE: Information, Headlines & Action Buttons */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            
            {/* Small Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#1E3A8A] text-xs font-semibold shadow-2xs"
              id="hero-official-badge"
            >
              <ShieldCheck className="w-4 h-4 text-[#1D4ED8] shrink-0" />
              <span>Government Scheme Discovery & Application Assistance</span>
            </div>

            {/* Large Heading */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#0B1E48] tracking-tight leading-[1.05]"
              id="hero-main-brand-heading"
            >
              SchemeSaathi
            </h1>

            {/* Main Tagline in Vibrant Royal Blue */}
            <div
              className="text-2xl sm:text-3xl font-bold text-[#1D4ED8] tracking-tight leading-snug"
              id="hero-main-tagline"
            >
              Discover government schemes with confidence.
            </div>

            {/* Description */}
            <p
              className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal"
              id="hero-main-description"
            >
              Get personalized eligibility matching, relevant scheme recommendations, and official application assistance — all in one place.
            </p>

            {/* Primary and Secondary Action Buttons matching reference image */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2" id="home-main-actions">
              {/* Primary Button: Solid Royal Blue */}
              <button
                id="home-btn-find-my-scheme"
                onClick={handleFindMyScheme}
                className="px-7 py-3.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <Search className="w-5 h-5 text-white shrink-0" strokeWidth={2.5} />
                <span>Find My Scheme →</span>
              </button>

              {/* Secondary Button: White with Royal Blue border */}
              <button
                id="home-btn-browse-schemes"
                onClick={handleBrowseSchemes}
                className="px-7 py-3.5 bg-white hover:bg-blue-50/60 text-[#0B1E48] border-2 border-[#1D4ED8] font-bold text-sm sm:text-base rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xs"
              >
                <List className="w-5 h-5 text-[#1D4ED8] shrink-0" strokeWidth={2.5} />
                <span>Browse Schemes →</span>
              </button>
            </div>

            {/* Auth status bar if logged in or out */}
            {!currentUser ? (
              <div className="pt-2 flex items-center gap-3 text-xs text-slate-500" id="home-auth-section">
                <span>Already registered?</span>
                <button
                  id="home-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="font-bold text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log in</span>
                </button>
                <span>or</span>
                <button
                  id="home-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="font-bold text-slate-900 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-700" id="home-logged-in-badge">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Signed in as <strong className="text-slate-950">{currentUser.name}</strong></span>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => onNavigate('profile')}
                  className="text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Go to Profile Wizard →
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Digital India Map Blueprint & Floating Cards */}
          <div className="lg:col-span-6 w-full relative" id="hero-illustration-column">
            <HomeHeroIllustration />
          </div>

        </div>

        {/* Soft undulating bottom wave curve matching reference image */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden leading-none z-0">
          <svg
            viewBox="0 0 1440 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-10 sm:h-16 text-white preserve-3d"
          >
            <path
              d="M0,25 C360,55 960,-5 1440,30 L1440,70 L0,70 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3 BOTTOM TRUST BADGES (Matching Reference Image Exactly) */}
      {/* ======================================================== */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 lg:px-10 bg-white" id="home-trust-badges-bar">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          
          {/* Badge 1: Verified Schemes */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-start">
            <div className="w-12 h-12 rounded-full bg-blue-100/70 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-700" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 leading-snug">Verified Schemes</div>
              <div className="text-xs text-slate-500 font-medium">From Government Ministries</div>
            </div>
          </div>

          {/* Divider line */}
          <div className="hidden md:block w-px h-10 bg-slate-200" />

          {/* Badge 2: Smart Matching */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-start">
            <div className="w-12 h-12 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-emerald-700" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 leading-snug">Smart Matching</div>
              <div className="text-xs text-slate-500 font-medium">Based on Your Profile</div>
            </div>
          </div>

          {/* Divider line */}
          <div className="hidden md:block w-px h-10 bg-slate-200" />

          {/* Badge 3: Official Portals */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-start">
            <div className="w-12 h-12 rounded-full bg-purple-100/70 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-purple-700" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 leading-snug">Official Portals</div>
              <div className="text-xs text-slate-500 font-medium">Direct Application Links</div>
            </div>
          </div>

        </div>

        {/* Minimal Official Discretion Note */}
        <div className="mt-8 text-center max-w-3xl mx-auto border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            SchemeSaathi compiles official notifications published by the Government of India. Sanctions, approvals, and fund disbursements are managed exclusively by respective ministries and nodal agencies.
          </p>
        </div>
      </section>

    </div>
  );
};

