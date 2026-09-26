import React, { useState } from 'react';
import { Language, SchemeMatchResult, Scheme, UserProfile } from '../types';
import { TRANSLATIONS } from '../translations';
import { getSafePortalUrl, openOfficialPortal } from '../utils/portalLink';
import { 
  Building2, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  BadgePercent, 
  HelpCircle,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SchemeDetailsModalProps {
  language: Language;
  scheme: Scheme;
  matchResult?: SchemeMatchResult | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onOpenGuide: () => void;
  onApply: () => void;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  onOpenAuthForApply?: () => void;
  onRecordApplication?: (scheme: Scheme) => void;
}

export const SchemeDetailsModal: React.FC<SchemeDetailsModalProps> = ({
  language,
  scheme,
  matchResult,
  isSaved,
  onClose,
  onToggleSave,
  onOpenGuide,
  onApply,
  userProfile,
  isLoggedIn,
  onOpenAuthForApply,
  onRecordApplication
}) => {
  const t = TRANSLATIONS[language];
  const score = matchResult?.score;
  const reasons = matchResult?.reasons || [];
  const mismatches = matchResult?.mismatches || [];

  const [showRedirectConfirm, setShowRedirectConfirm] = useState<boolean>(false);
  const [checkedEligibility, setCheckedEligibility] = useState<boolean>(false);

  const renderArrayOrString = (val: any) => {
    if (!val) return 'Standard Criteria';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  };

  const toList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val.split(';').map(s => s.trim()).filter(Boolean);
    }
    return [String(val)];
  };

  const portalUrlInfo = getSafePortalUrl(scheme.officialApplicationUrl);
  const infoUrlInfo = getSafePortalUrl(scheme.officialInformationUrl);
  const hasOfficialAppUrl = portalUrlInfo.isValid;

  const handleApplyClick = () => {
    setShowRedirectConfirm(true);
  };

  const handleProceedToOfficialPortal = () => {
    setShowRedirectConfirm(false);
    if (portalUrlInfo.isValid && portalUrlInfo.url) {
      if (isLoggedIn && onRecordApplication) {
        onRecordApplication(scheme);
      }
      openOfficialPortal(portalUrlInfo.url);
    }
  };

  const defaultApplicationSteps = [
    'Step 1: Register on the official portal with Aadhaar e-KYC and mobile verification.',
    'Step 2: Complete the enterprise profile, enter project cost, and choose your preferred lending bank branch.',
    'Step 3: Upload required documents (Caste certificate, Project summary report, Bank passbook).',
    'Step 4: Application is routed to the Task Force Committee / DIC for sanction and bank loan disbursement.'
  ];

  const applicationSteps = scheme.applicationInstructions && scheme.applicationInstructions.length > 0
    ? scheme.applicationInstructions
    : defaultApplicationSteps;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" id="scheme-details-modal">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1 text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {scheme.ministry}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono text-[11px]">
                  Verified {scheme.lastVerifiedDate}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                {scheme.name}
              </h2>

              {/* Match Score and Badges */}
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                {typeof score === 'number' ? (
                  <span className={`px-2.5 py-1 rounded-md font-bold text-xs border flex items-center gap-1.5 ${
                    score >= 80
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : score >= 60
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : score >= 40
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{score}% {score >= 80 ? 'Strong Match' : score >= 60 ? 'Good Match' : score >= 40 ? 'Partial Match' : 'Low Match'}</span>
                  </span>
                ) : (
                  <span className="bg-blue-50 text-blue-800 font-semibold px-2.5 py-0.5 rounded border border-blue-200">
                    Gender: {scheme.genderEligibility}
                  </span>
                )}

                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 font-medium">
                  States: {renderArrayOrString(scheme.statesCovered)}
                </span>
                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 font-medium">
                  Area: {scheme.ruralUrbanEligibility || 'All'}
                </span>
              </div>
            </div>

            <button
              id="scheme-modal-close-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content (Requirement 8 structured sections) */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
            
            {/* Explainable Matching Box */}
            {(reasons.length > 0 || mismatches.length > 0) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    <span>Why This Scheme Fits Your Profile</span>
                  </h3>
                  {typeof score === 'number' && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Score: {score}%
                    </span>
                  )}
                </div>

                {reasons.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                      Criteria Met:
                    </span>
                    <ul className="space-y-1.5 text-xs text-emerald-950">
                      {reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{r.replace(/^✓\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {mismatches.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                      Important Conditions to Note:
                    </span>
                    <ul className="space-y-1.5 text-xs text-amber-950">
                      {mismatches.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span>{m.replace(/^⚠\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 1. Overview */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>1. Scheme Overview</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {scheme.description || scheme.eligibilityCriteria}
              </div>
            </div>

            {/* 2. Key Benefits */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BadgePercent className="w-3.5 h-3.5 text-slate-400" />
                <span>2. Key Benefits & Financial Assistance</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {scheme.keyBenefit && (
                  <div className="sm:col-span-2 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-950 flex items-start gap-2.5">
                    <BadgePercent className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-blue-900 mb-0.5">Primary Incentive:</strong>
                      <span>{scheme.keyBenefit}</span>
                    </div>
                  </div>
                )}
                {toList(scheme.benefits || scheme.benefitType).map((b, i) => (
                  <div key={i} className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span className="text-slate-800">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Eligibility Criteria */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>3. Eligibility Criteria</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px] font-semibold">Gender</span>
                  <span className="font-bold text-slate-900">{scheme.genderEligibility}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px] font-semibold">Age Requirement</span>
                  <span className="font-bold text-slate-900">
                    {scheme.ageCriteria || (scheme.ageEligibility ? scheme.ageEligibility.description : 'Standard (18+ years)')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px] font-semibold">Social Category</span>
                  <span className="font-bold text-slate-900">{renderArrayOrString(scheme.socialCategoryEligibility)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px] font-semibold">Business Status</span>
                  <span className="font-bold text-slate-900">{renderArrayOrString(scheme.businessStage || scheme.businessStatus)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px] font-semibold">Enterprise Type</span>
                  <span className="font-bold text-slate-900">{renderArrayOrString(scheme.businessTypes)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px] font-semibold">Income Limit</span>
                  <span className="font-bold text-slate-900">{scheme.incomeCriteria || 'No upper limit'}</span>
                </div>
              </div>
            </div>

            {/* 4. Required Documents Checklist */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>4. Required Documents Checklist</span>
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {toList(scheme.requiredDocumentsList || scheme.requiredDocuments).map((doc, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                      <span className="font-medium">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5. Official Application Steps */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>5. Official Application Steps</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                {applicationSteps.map((step, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border-l-3 border-blue-700 border border-slate-200 flex items-start gap-2.5">
                    <span className="font-mono font-bold text-blue-700 shrink-0">0{i + 1}</span>
                    <span className="text-slate-700 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Source Link Card */}
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 text-xs space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Official Government Information Source</span>
                <span className="text-emerald-800 font-mono text-[11px]">Last Verified: {scheme.lastVerifiedDate}</span>
              </div>
              <p className="text-slate-600">
                SchemeSaathi is an independent discovery platform. Official applications and final approvals are processed directly by the designated government ministry or partner banks.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {infoUrlInfo.isValid && infoUrlInfo.url && (
                  <a
                    href={infoUrlInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 underline text-xs"
                  >
                    <span>Official Guidelines & Circulars</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {portalUrlInfo.isValid && portalUrlInfo.url ? (
                  <a
                    href={portalUrlInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline text-xs"
                  >
                    <span>Direct Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Official portal link unavailable.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions per Requirement 8 */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                id="btn-modal-save-scheme"
                onClick={onToggleSave}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSaved
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 fill-blue-700 text-blue-700" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSaved ? 'Saved to Profile' : 'Save Scheme'}</span>
              </button>

              <button
                id="btn-modal-app-guide"
                onClick={() => {
                  onClose();
                  onOpenGuide();
                }}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                View Step-by-Step Guide
              </button>
            </div>

            {/* Prominent Proceed to Official Portal Button per Requirement 8 */}
            {portalUrlInfo.isValid && portalUrlInfo.url ? (
              <div className="flex flex-col items-end gap-1">
                <a
                  id="btn-modal-apply-official"
                  href={portalUrlInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open official government portal (opens in a new tab)"
                  onClick={() => {
                    if (isLoggedIn && onRecordApplication) {
                      onRecordApplication(scheme);
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer shadow-xs hover:shadow-sm flex items-center gap-2"
                  title="Opens the official government portal in a new tab."
                >
                  <span>Proceed to Official Portal</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
                <span className="text-[10px] text-slate-500 font-medium">
                  Opens the official government portal in a new tab.
                </span>
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
      </div>

      {/* Confirmation Modal before leaving SchemeSaathi */}
      {showRedirectConfirm && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4" id="redirect-confirm-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
              <ExternalLink className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-950">
                Leaving SchemeSaathi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are proceeding to the official verified government portal:
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-blue-800 break-all border border-slate-200">
                {portalUrlInfo.url || scheme.officialApplicationUrl}
              </div>
              <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-left space-y-1.5">
                <p>• <strong>Official Application:</strong> This application opens in a new tab on the verified government portal.</p>
                <p>• <strong>Free Service:</strong> SchemeSaathi never charges any fee or asks for banking passwords.</p>
                <p>• <strong>Status Tracking:</strong> We will record this application in your "My Applications" dashboard so you can log your reference number.</p>
                <p>• <strong>Browser Note:</strong> Opens the official government portal in a new tab.</p>
              </div>

              {/* Graceful Retry Assistance (Requirement 6) */}
              <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200 text-left">
                <div>
                  <div className="font-semibold text-slate-800">Government portal temporarily unavailable?</div>
                  <div className="text-[11px] text-slate-500">Please try again later.</div>
                </div>
                {portalUrlInfo.isValid && portalUrlInfo.url && (
                  <button
                    type="button"
                    onClick={() => openOfficialPortal(portalUrlInfo.url)}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-blue-700 font-bold rounded border border-slate-300 text-xs transition-colors cursor-pointer shrink-0"
                    title="Try Again (reopens official portal)"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                id="btn-cancel-redirect"
                onClick={() => setShowRedirectConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              {portalUrlInfo.isValid && portalUrlInfo.url ? (
                <a
                  id="btn-continue-redirect"
                  href={portalUrlInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open official government portal (opens in a new tab)"
                  onClick={handleProceedToOfficialPortal}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                  title="Opens the official government portal in a new tab."
                >
                  <span>Continue to Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              ) : (
                <div className="text-right text-xs text-amber-800">
                  <div className="font-semibold">Official portal link is currently unavailable.</div>
                  <div className="text-[10px] text-slate-500">Please check later or visit the concerned department.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
