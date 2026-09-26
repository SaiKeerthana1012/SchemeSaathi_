import React, { useState, useMemo } from 'react';
import { Language, SchemeMatchResult, Scheme, UserProfile, UserAccount } from '../types';
import { TRANSLATIONS } from '../translations';
import { getSafePortalUrl, openOfficialPortal } from '../utils/portalLink';
import { 
  Search, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  BadgePercent, 
  ArrowRight,
  Filter
} from 'lucide-react';

interface RecommendedSchemesProps {
  language: Language;
  currentUser: UserAccount | null;
  userProfile: UserProfile | null;
  allSchemes: Scheme[];
  matchResults: SchemeMatchResult[];
  savedSchemeIds: Set<string>;
  onToggleSaveScheme: (scheme: Scheme) => void;
  onViewDetails: (scheme: Scheme, matchResult?: SchemeMatchResult | null) => void;
  onApply: (scheme: Scheme) => void;
  onEditProfile: () => void;
  onOpenAuth: (mode?: 'login' | 'register' | 'auth_for_apply' | 'auth_for_save' | 'auth_for_matching', pendingScheme?: { id: string; name: string }) => void;
  initialTab?: 'all' | 'recommended';
}

export const RecommendedSchemes: React.FC<RecommendedSchemesProps> = ({
  language,
  currentUser,
  userProfile,
  allSchemes,
  matchResults,
  savedSchemeIds,
  onToggleSaveScheme,
  onViewDetails,
  onApply,
  onEditProfile,
  onOpenAuth,
  initialTab = 'all'
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [troublePortalId, setTroublePortalId] = useState<string | null>(null);

  // Map of scheme ID to match result
  const matchMap = useMemo(() => {
    const map = new Map<string, SchemeMatchResult>();
    matchResults.forEach(r => map.set(r.scheme.id, r));
    return map;
  }, [matchResults]);

  // List of schemes based on tab
  const baseSchemes = useMemo(() => {
    if (activeTab === 'recommended' && currentUser && userProfile) {
      return matchResults.map(r => r.scheme);
    }
    return allSchemes;
  }, [activeTab, currentUser, userProfile, matchResults, allSchemes]);

  // Filtered schemes
  const filteredSchemes = useMemo(() => {
    if (!searchQuery.trim()) return baseSchemes;
    const q = searchQuery.toLowerCase().trim();
    return baseSchemes.filter((scheme) => {
      const matchesName = (scheme.name || scheme.schemeName || '').toLowerCase().includes(q) || (scheme.shortName || '').toLowerCase().includes(q);
      const matchesMinistry = (scheme.ministry || scheme.ministryDepartment || '').toLowerCase().includes(q);
      const matchesDesc = (scheme.description || scheme.eligibilityCriteria || '').toLowerCase().includes(q);
      const beneficiaryStr = Array.isArray(scheme.targetBeneficiaries) ? scheme.targetBeneficiaries.join(' ') : String(scheme.targetBeneficiary || '');
      const matchesBeneficiary = beneficiaryStr.toLowerCase().includes(q);
      const typesStr = Array.isArray(scheme.businessTypes) ? scheme.businessTypes.join(' ') : String(scheme.businessTypes || '');
      const matchesType = typesStr.toLowerCase().includes(q);
      const matchesKeyBenefit = (scheme.keyBenefit || scheme.benefitType || '').toLowerCase().includes(q);
      return matchesName || matchesMinistry || matchesDesc || matchesBeneficiary || matchesType || matchesKeyBenefit;
    });
  }, [baseSchemes, searchQuery]);

  const handleApplyClick = (scheme: Scheme) => {
    // Open the verified official portal URL directly in a new tab synchronously
    const portalUrlInfo = getSafePortalUrl(scheme.officialApplicationUrl);
    if (portalUrlInfo.isValid && portalUrlInfo.url) {
      openOfficialPortal(portalUrlInfo.url);
    }
    // If signed in, also register application progress
    if (currentUser) {
      onApply(scheme);
    }
  };

  const handleSaveClick = (scheme: Scheme) => {
    if (!currentUser) {
      onOpenAuth('auth_for_save', { id: scheme.id, name: scheme.name });
    } else {
      onToggleSaveScheme(scheme);
    }
  };

  const handleRecommendedTabClick = () => {
    if (!currentUser) {
      onOpenAuth('auth_for_matching');
    } else {
      setActiveTab('recommended');
    }
  };

  // Match score bands:
  // 80–100 = Strong Match
  // 60–79 = Good Match
  // 40–59 = Partial Match
  // Below 40 = Low Match
  const renderMatchScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>{score}% Strong Match</span>
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>{score}% Good Match</span>
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          <span>{score}% Partial Match</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        <span>{score}% Low Match</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8" id="schemes-directory-page">
      
      {/* Top Banner when viewing recommended schemes */}
      {activeTab === 'recommended' && currentUser && userProfile ? (
        <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 mb-8 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" id="recommended-banner">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 text-blue-200 text-xs font-mono font-medium mb-3 border border-blue-700/50">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Personalized Eligibility Results</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Your Top Eligible Schemes
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Found <strong>{matchResults.length} schemes</strong> matching your profile: <strong>{userProfile.personal.fullName}</strong> • {userProfile.personal.gender} • {userProfile.personal.socialCategory} • {userProfile.personal.areaType} ({userProfile.personal.state}) • {userProfile.business.enterpriseType}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Browse All ({allSchemes.length})
            </button>
            <button
              onClick={onEditProfile}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Edit Profile Inputs →
            </button>
          </div>
        </div>
      ) : (
        <div className="border-b border-slate-200 pb-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight" id="explore-schemes-heading">
                Explore Government Schemes
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1" id="explore-schemes-subheading">
                Browse verified Central and State programs with transparent eligibility guidelines and official portals.
              </p>
            </div>

            {/* Tab Selector */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 self-start md:self-auto shadow-2xs">
              <button
                id="tab-all-schemes"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Schemes ({allSchemes.length})
              </button>
              <button
                id="tab-recommended-schemes"
                onClick={handleRecommendedTabClick}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'recommended'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>★ Matched For You</span>
                {currentUser && userProfile && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {matchResults.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="mb-6" id="search-container">
        <div className="relative">
          <input
            type="text"
            id="search-schemes-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scheme name, ministry, benefits, or keywords (e.g., PMEGP, Mudra, Handloom, Subsidy)..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 shadow-2xs transition-all"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* SCHEME CARDS GRID */}
      <div>
        {filteredSchemes.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-6 shadow-xs" id="schemes-empty-state">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No matching government schemes found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Try searching with broader terms such as "loan", "subsidy", "weaver", or "msme".
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="schemes-grid">
            {filteredSchemes.map((scheme) => {
              const matchResult = matchMap.get(scheme.id);
              const score = matchResult?.score;
              const reasons = matchResult?.reasons || [];
              const mismatches = matchResult?.mismatches || [];
              const isSaved = savedSchemeIds.has(scheme.id);
              const portalUrlInfo = getSafePortalUrl(scheme.officialApplicationUrl);
              const hasOfficialAppUrl = portalUrlInfo.isValid;

              return (
                <div
                  key={scheme.id}
                  id={`scheme-card-${scheme.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Top Ministry Bar & Match Badge */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{scheme.ministry}</span>
                      </div>
                      {typeof score === 'number' ? (
                        renderMatchScoreBadge(score)
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Verified {scheme.lastVerifiedDate}
                        </span>
                      )}
                    </div>

                    {/* Scheme Name */}
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-950 leading-snug">
                        {scheme.name}
                      </h3>
                      {scheme.shortName && scheme.shortName !== scheme.name && (
                        <span className="text-xs font-bold text-blue-700 mt-0.5 block">
                          ({scheme.shortName})
                        </span>
                      )}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {scheme.description}
                      </p>
                    </div>

                    {/* Key Benefit Highlight Box per Requirement 7 */}
                    {scheme.keyBenefit && (
                      <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-2 text-xs">
                        <BadgePercent className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-950">Key Benefit: </span>
                          <span className="text-blue-900">{scheme.keyBenefit}</span>
                        </div>
                      </div>
                    )}

                    {/* "Why This Scheme Matches You" Box per Requirement 7 */}
                    {typeof score === 'number' && reasons.length > 0 && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-2">
                        <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Why This Scheme Matches You:</span>
                        </div>
                        <ul className="text-xs text-emerald-950 space-y-1 pl-1">
                          {reasons.slice(0, 3).map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                              <span className="text-emerald-700 font-bold shrink-0">•</span>
                              <span>{r.replace(/^✓\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>

                        {mismatches.length > 0 && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 flex items-start gap-1.5 mt-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <span>{mismatches[0].replace(/^⚠\s*/, '')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta Tags: Target Beneficiaries & Geography */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                        Gender: {scheme.genderEligibility}
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                        {scheme.ruralUrbanEligibility} Area
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                        States: {Array.isArray(scheme.statesCovered) ? (scheme.statesCovered[0] || 'All India') : (scheme.statesCovered || 'All India')}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar per Requirement 7 */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      {/* Secondary: View Full Details */}
                      <button
                        id={`btn-details-${scheme.id}`}
                        onClick={() => onViewDetails(scheme, matchResult)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        View Full Details
                      </button>

                      {/* Icon Button: Save Scheme (heart/bookmark) */}
                      <button
                        id={`btn-save-${scheme.id}`}
                        onClick={() => handleSaveClick(scheme)}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                          isSaved
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={isSaved ? 'Scheme saved' : 'Save scheme'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 fill-blue-700 text-blue-700" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Primary: Apply on Official Portal */}
                    {portalUrlInfo.isValid && portalUrlInfo.url ? (
                      <div className="flex flex-col items-end gap-1">
                        <a
                          id={`btn-apply-${scheme.id}`}
                          href={portalUrlInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open official government portal (opens in a new tab)"
                          onClick={() => {
                            if (currentUser) {
                              onApply(scheme);
                            }
                          }}
                          className="px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs bg-blue-700 hover:bg-blue-800 text-white"
                          title="Opens the official government portal in a new tab."
                        >
                          <span>Apply on Official Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <span>Opens the official government portal in a new tab.</span>
                          <button
                            type="button"
                            onClick={() => setTroublePortalId(troublePortalId === scheme.id ? null : scheme.id)}
                            className="text-blue-700 hover:underline cursor-pointer ml-1"
                          >
                            {troublePortalId === scheme.id ? 'Hide help' : 'Trouble connecting?'}
                          </button>
                        </div>
                        {troublePortalId === scheme.id && (
                          <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs max-w-xs space-y-1">
                            <div className="font-semibold text-slate-800">Government portal is temporarily unavailable.</div>
                            <div className="text-[11px] text-slate-500">Please try again later.</div>
                            <button
                              type="button"
                              onClick={() => openOfficialPortal(portalUrlInfo.url)}
                              className="mt-1 px-3 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 rounded font-bold text-xs cursor-pointer shadow-2xs"
                              title="Try Again (reopens official portal)"
                            >
                              Try Again
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-right max-w-xs">
                        <p className="text-xs font-semibold text-amber-800">
                          Official portal link is currently unavailable.
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          Please check the scheme details later or visit the concerned government department.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
