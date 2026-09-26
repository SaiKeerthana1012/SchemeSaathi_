import React from 'react';
import { Language, UserAccount, UserProfile, SavedSchemeItem, DemoApplication } from '../types';
import { TRANSLATIONS } from '../translations';

interface DashboardViewProps {
  language: Language;
  currentUser: UserAccount;
  userProfile: UserProfile | null;
  recommendedCount: number;
  savedSchemes: SavedSchemeItem[];
  applications: DemoApplication[];
  onNavigate: (tab: string) => void;
  onStartMatching: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  currentUser,
  userProfile,
  recommendedCount,
  savedSchemes,
  applications,
  onNavigate,
  onStartMatching
}) => {
  const t = TRANSLATIONS[language];
  const isProfileComplete = !!(userProfile?.personal?.fullName && userProfile?.business?.businessStatus);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8" id="dashboard-view">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 mb-1">
            Entrepreneur Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.dashboardWelcome} {currentUser.name}!
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-xl">
            {isProfileComplete
              ? `Your profile is active (${userProfile?.personal.socialCategory}, ${userProfile?.business.enterpriseType}). Intelligent scheme matching is ready.`
              : 'Complete your personal and business details to calculate personalized prototype match scores.'}
          </p>
        </div>

        {/* Prominent Button: Find My Scheme */}
        <div className="shrink-0">
          <button
            id="dashboard-btn-find-my-scheme"
            onClick={onStartMatching}
            className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base rounded-md transition-all shadow-md cursor-pointer text-center"
          >
            {t.btnFindMyScheme} →
          </button>
        </div>
      </div>

      {/* Four Core Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" id="dashboard-four-cards">
        {/* Card 1: Profile Completion */}
        <div 
          onClick={() => onNavigate('profile')}
          className="bg-white border border-gray-200 hover:border-blue-900 rounded-lg p-5 transition-all shadow-xs cursor-pointer group"
          id="dash-card-profile"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t.cardProfileCompletion}
            </span>
            <span className={`w-3 h-3 rounded-full ${isProfileComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <div className="text-xl font-extrabold text-blue-950 mt-3">
            {isProfileComplete ? t.profileComplete : t.profileIncomplete}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isProfileComplete 
              ? `${userProfile?.business.businessStatus}` 
              : 'Click to fill Step 1 & 2'}
          </p>
          <div className="mt-4 text-xs font-semibold text-blue-900 group-hover:underline">
            View / Edit Profile →
          </div>
        </div>

        {/* Card 2: Recommended Schemes */}
        <div 
          onClick={() => onNavigate('find-schemes')}
          className="bg-white border border-gray-200 hover:border-blue-900 rounded-lg p-5 transition-all shadow-xs cursor-pointer group"
          id="dash-card-recommended"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t.cardRecommended}
            </span>
            <span className="text-lg">🎯</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 mt-3">
            {recommendedCount} Schemes
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Scored by prototype matching algorithm
          </p>
          <div className="mt-4 text-xs font-semibold text-blue-900 group-hover:underline">
            Browse Recommendations →
          </div>
        </div>

        {/* Card 3: Saved Schemes */}
        <div 
          onClick={() => onNavigate('saved')}
          className="bg-white border border-gray-200 hover:border-blue-900 rounded-lg p-5 transition-all shadow-xs cursor-pointer group"
          id="dash-card-saved"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t.cardSaved}
            </span>
            <span className="text-lg">⭐</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 mt-3">
            {savedSchemes.length} Saved
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Bookmarked for easy access
          </p>
          <div className="mt-4 text-xs font-semibold text-blue-900 group-hover:underline">
            View Bookmarks →
          </div>
        </div>

        {/* Card 4: Active Applications */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white border border-gray-200 hover:border-blue-900 rounded-lg p-5 transition-all shadow-xs cursor-pointer group"
          id="dash-card-applications"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t.cardActiveApps}
            </span>
            <span className="text-lg">📋</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 mt-3">
            {applications.length} Active
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {applications.length > 0 ? `Latest: ${applications[0].status}` : 'No applications yet'}
          </p>
          <div className="mt-4 text-xs font-semibold text-blue-900 group-hover:underline">
            Track Applications →
          </div>
        </div>
      </div>

      {/* Quick Action Guides & Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-bold text-blue-950 mb-2">
            Ready to apply for government financial assistance?
          </h3>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Read our verified 5-step application roadmap, review document checklists, and prepare DPRs before visiting banking branches.
          </p>
          <button
            onClick={() => onNavigate('guide')}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            Open 5-Step Application Guide →
          </button>
        </div>

        <div className="bg-slate-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-bold text-blue-950 mb-2">
            Have questions about subsidy or eligibility rules?
          </h3>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Use the SchemeSaathi Assistant to query PMEGP subsidy rates, Mudra eligibility thresholds, or SC/ST hub concessions.
          </p>
          <button
            onClick={() => onNavigate('help')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            Ask Scheme Assistant →
          </button>
        </div>
      </div>
    </div>
  );
};
