import React, { useState } from 'react';
import { Language, Scheme, DemoApplication } from '../types';
import { TRANSLATIONS } from '../translations';
import { getSafePortalUrl, openOfficialPortal } from '../utils/portalLink';

interface ApplicationGuideViewProps {
  language: Language;
  activeScheme?: Scheme | null;
  activeApplication?: DemoApplication | null;
  onBrowseSchemes: () => void;
  onViewApplications: () => void;
}

export const ApplicationGuideView: React.FC<ApplicationGuideViewProps> = ({
  language,
  activeScheme,
  activeApplication,
  onBrowseSchemes,
  onViewApplications
}) => {
  const t = TRANSLATIONS[language];

  // Redirect confirmation modal
  const [showRedirectModal, setShowRedirectModal] = useState<boolean>(false);

  // Interactive checklist state
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    id: true,
    address: true,
    bank: true,
    business: false,
    income: false,
    caste: false,
    photos: false
  });

  const toggleDoc = (key: string) => {
    setCheckedDocs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checkedDocs).filter(Boolean).length;
  const totalCount = Object.keys(checkedDocs).length;

  const portalUrlInfo = getSafePortalUrl(activeScheme?.officialApplicationUrl || activeScheme?.officialInformationUrl);
  const officialUrl = portalUrlInfo.url;

  const handleContinueToPortal = () => {
    setShowRedirectModal(false);
    if (portalUrlInfo.isValid && portalUrlInfo.url) {
      openOfficialPortal(portalUrlInfo.url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6" id="application-guide-page">
      {/* Active Application Milestone Card (if created) */}
      {activeApplication && activeScheme && (
        <div className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-500 rounded-lg shadow-sm" id="active-application-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Application Successfully Initiated
              </div>
              <h2 className="text-lg font-bold text-emerald-950 mt-0.5">
                {activeScheme.name}
              </h2>
            </div>
            <div className="text-right self-start sm:self-auto">
              <div className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-emerald-300 text-emerald-900 inline-block">
                ID: {activeApplication.userEnteredApplicationId || activeApplication.id}
              </div>
              <div className="text-xs font-bold text-emerald-800 mt-1">
                Status: <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">{activeApplication.status}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <p className="text-emerald-900 leading-relaxed max-w-xl">
              Your application draft and checklist have been recorded. Follow the 5 guidance steps below and prepare required documents before submitting on the official portal.
            </p>
            {portalUrlInfo.isValid && portalUrlInfo.url ? (
              <div className="flex flex-col items-end gap-1">
                <a
                  href={portalUrlInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-continue-official-portal"
                  aria-label="Open official government portal (opens in a new tab)"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-md transition-colors whitespace-nowrap text-center inline-block cursor-pointer text-xs"
                  title="Opens the official government portal in a new tab."
                >
                  {t.btnContinueToOfficialPortal} ↗
                </a>
                <span className="text-[10px] text-emerald-800 font-medium">
                  Opens the official government portal in a new tab.
                </span>
              </div>
            ) : (
              <div className="text-right max-w-xs">
                <p className="text-xs font-semibold text-amber-800">
                  Official portal link is currently unavailable.
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                  Please check the scheme details later or visit the concerned government department.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Heading */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950" id="guide-heading">
          {t.guideHeading}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t.guideSubheading}
        </p>

        {/* Mandatory Explicit Disclaimer */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 font-medium">
          <strong>Important Note:</strong> {t.guideDisclaimer}
        </div>
      </div>

      {/* 5-Step Application Roadmap Required by Requirement 8 */}
      <div className="space-y-4 mb-10" id="five-step-guide">
        {/* Step 1 */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-start gap-4">
          <div className="w-9 h-9 rounded-md bg-blue-900 text-white font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">
              {t.guideStep1Title}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {t.guideStep1Desc}
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-start gap-4">
          <div className="w-9 h-9 rounded-md bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">
              {t.guideStep2Title}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {t.guideStep2Desc}
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-start gap-4">
          <div className="w-9 h-9 rounded-md bg-purple-900 text-white font-bold flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">
              {t.guideStep3Title}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {t.guideStep3Desc}
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-start gap-4">
          <div className="w-9 h-9 rounded-md bg-amber-700 text-white font-bold flex items-center justify-center shrink-0">
            4
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">
              {t.guideStep4Title}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {t.guideStep4Desc}
            </p>
          </div>
        </div>

        {/* Step 5 */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-start gap-4">
          <div className="w-9 h-9 rounded-md bg-slate-800 text-white font-bold flex items-center justify-center shrink-0">
            5
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">
              {t.guideStep5Title}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {t.guideStep5Desc}
            </p>
          </div>
        </div>
      </div>

      {/* Universal Document Checklist */}
      <div className="bg-slate-50 border border-gray-200 rounded-lg p-6 shadow-xs" id="document-checklist-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-2">
          <div>
            <h2 className="text-lg font-bold text-blue-950">
              {t.checklistHeading}
            </h2>
            <p className="text-xs text-gray-500">
              Self-audit your readiness before initiating portal submission.
            </p>
          </div>
          <div className="text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            {completedCount} of {totalCount} Prepared
          </div>
        </div>

        <div className="mt-4 space-y-2.5 text-xs">
          {[
            { id: 'id', title: 'Identity Proof', desc: 'Aadhaar Card, Voter ID, or PAN Card' },
            { id: 'address', title: 'Address Proof', desc: 'Ration card, Electricity bill, Domicile certificate' },
            { id: 'bank', title: 'Bank Details', desc: 'Active savings account passbook copy & cancelled cheque' },
            { id: 'business', title: 'Business-related Documents', desc: 'Detailed Project Report (DPR), machinery quotation, Udyam certificate' },
            { id: 'income', title: 'Income Certificate (if applicable)', desc: 'Issued by competent Revenue Authority for BPL/EWS verification' },
            { id: 'caste', title: 'Caste / Category Certificate', desc: 'Mandatory for SC, ST, OBC, or Minority subsidy allocations' },
            { id: 'photos', title: 'Photographs & Signature', desc: 'Recent passport sized color photographs and clear specimen sign' }
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                checkedDocs[item.id]
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <input
                type="checkbox"
                checked={!!checkedDocs[item.id]}
                onChange={() => toggleDoc(item.id)}
                className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-700"
              />
              <div>
                <div className="font-bold text-xs">
                  {item.title}
                </div>
                <div className="text-[11px] text-gray-500">
                  {item.desc}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <button
            id="guide-btn-browse-schemes"
            onClick={onBrowseSchemes}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            ← {t.btnBrowseSchemes}
          </button>

          <button
            id="guide-btn-track-applications"
            onClick={onViewApplications}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            Track in My Applications →
          </button>
        </div>
      </div>

      {/* Redirect Confirmation Modal */}
      {showRedirectModal && officialUrl && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-bold mx-auto">
              ↗
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-blue-950">
                Leaving SchemeSaathi
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                You are leaving SchemeSaathi and entering the official government portal:
              </p>
              <div className="p-2.5 bg-slate-100 rounded text-xs font-mono text-blue-900 break-all border border-slate-300">
                {officialUrl}
              </div>
              <div className="text-xs text-amber-900 bg-amber-50 p-3 rounded border border-amber-200 text-left space-y-1">
                <p>• SchemeSaathi is an independent guidance platform and does not submit the application itself.</p>
                <p>• The official portal will open in a new browser tab.</p>
                <p>• Opens the official government portal in a new tab.</p>
              </div>

              {/* Graceful Retry Assistance (Requirement 6) */}
              <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200 text-left">
                <div>
                  <div className="font-semibold text-slate-800">Government portal is temporarily unavailable.</div>
                  <div className="text-[11px] text-slate-500">Please try again later.</div>
                </div>
                {portalUrlInfo.isValid && portalUrlInfo.url && (
                  <button
                    type="button"
                    onClick={() => openOfficialPortal(portalUrlInfo.url)}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-emerald-800 font-bold rounded border border-slate-300 text-xs transition-colors cursor-pointer shrink-0"
                    title="Try Again (reopens official portal)"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowRedirectModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              {portalUrlInfo.isValid && portalUrlInfo.url ? (
                <a
                  href={portalUrlInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open official government portal (opens in a new tab)"
                  onClick={() => setShowRedirectModal(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md cursor-pointer shadow-xs inline-block text-center"
                  title="Opens the official government portal in a new tab."
                >
                  Continue to Official Portal ↗
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
    </div>
  );
};
