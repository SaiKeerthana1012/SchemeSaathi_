import React, { useState } from 'react';
import { Language, DemoApplication, ApplicationStatus, ReminderStatus } from '../types';
import { TRANSLATIONS } from '../translations';
import { formatTimelineDate } from '../services/firebase';
import { getSafePortalUrl, openOfficialPortal } from '../utils/portalLink';

interface MyApplicationsViewProps {
  language: Language;
  applications: DemoApplication[];
  onUpdateAppDetails?: (appId: string, updates: Partial<DemoApplication>) => void;
  onReminderAction?: (appId: string, action: 'interested' | 'snooze' | 'dismiss' | 'complete') => void;
  onAddUserApplication?: (data: {
    schemeName: string;
    userEnteredApplicationId: string;
    officialPortal: string;
    date: string;
    status?: ApplicationStatus;
    notes?: string;
  }) => void;
  onBrowseSchemes: () => void;
  onViewDetailsById: (schemeId: string) => void;
}

export const MyApplicationsView: React.FC<MyApplicationsViewProps> = ({
  language,
  applications,
  onUpdateAppDetails,
  onReminderAction,
  onAddUserApplication,
  onBrowseSchemes,
  onViewDetailsById
}) => {
  const t = TRANSLATIONS[language];

  // Helper for relative time (e.g. Started: 3 days ago)
  const getRelativeStarted = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const getReminderBadge = (reminderStatus?: ReminderStatus) => {
    switch (reminderStatus) {
      case 'interested':
        return { label: 'Interested', cls: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
      case 'snoozed':
        return { label: 'Snoozed', cls: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'completed':
        return { label: 'Completed', cls: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'dismissed':
        return { label: 'Dismissed', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'initiated':
      default:
        return { label: 'Application Initiated', cls: 'bg-blue-100 text-blue-900 border-blue-200' };
    }
  };

  // State for recording an external application
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [troubleAppId, setTroubleAppId] = useState<string | null>(null);
  const [newSchemeName, setNewSchemeName] = useState<string>('');
  const [newAppId, setNewAppId] = useState<string>('');
  const [newPortal, setNewPortal] = useState<string>('https://www.kviconline.gov.in/pmegpep');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState<string>('');

  // Editing existing application ID
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [tempEnteredId, setTempEnteredId] = useState<string>('');

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Application Started':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Application Submitted':
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Under Review':
      case 'Under Verification':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Documents Required':
      case 'Additional Information Required':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Documents Verified':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleSaveNewApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeName.trim()) return;
    if (onAddUserApplication) {
      onAddUserApplication({
        schemeName: newSchemeName.trim(),
        userEnteredApplicationId: newAppId.trim() || `PORTAL-REF-${Math.floor(100000 + Math.random() * 900000)}`,
        officialPortal: newPortal.trim() || 'Official Government Portal',
        date: newDate,
        status: 'Application Started',
        notes: newNotes.trim()
      });
    }
    setShowAddModal(false);
    setNewSchemeName('');
    setNewAppId('');
    setNewNotes('');
  };

  const handleStartEditId = (app: DemoApplication) => {
    setEditingAppId(app.id);
    setTempEnteredId(app.userEnteredApplicationId || app.id);
  };

  const handleSaveEditedId = (appId: string) => {
    if (onUpdateAppDetails) {
      onUpdateAppDetails(appId, { userEnteredApplicationId: tempEnteredId });
    }
    setEditingAppId(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6" id="my-applications-page">
      
      {/* Heading & Subheading */}
      <div className="border-b border-gray-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-950">
            {t.appsHeading}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track applications initiated on official government portals with step-by-step guidance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="btn-add-external-app"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-2xs"
          >
            + Add External Application
          </button>
          <button
            id="btn-apps-browse-more"
            onClick={onBrowseSchemes}
            className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            {t.btnBrowseSchemes}
          </button>
        </div>
      </div>

      {/* Mandatory Transparency Notice */}
      <div className="mb-6 p-4 bg-blue-50/90 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-start gap-3 shadow-2xs" id="application-status-transparency-notice">
        <span className="text-base text-blue-800 shrink-0 mt-0.5">ℹ</span>
        <div>
          <div className="font-bold text-blue-900">Official Government Application Notice</div>
          <div className="mt-0.5 text-blue-900/90 leading-relaxed">
            Actual government application verification and decision status updates require official government portal or API integration. Applications initiated here are recorded in Firestore as "Application Started" for your tracking and preparation.
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg p-6 shadow-xs" id="applications-empty-state">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl font-bold mb-3">
            📋
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {t.appsEmpty}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            You haven't initiated any government scheme applications yet. Browse schemes to discover opportunities and apply directly on official government portals.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={onBrowseSchemes}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              {t.btnBrowseSchemes} →
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              + Record External Application
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6" id="applications-list">
          {applications.map((app) => {
            const isSubmitted = app.status === 'Submitted' || app.status === 'Under Verification' || app.status === 'Approved' || app.status === 'Rejected';
            const isVerified = app.status === 'Under Verification' || app.status === 'Approved' || app.status === 'Rejected';
            const isApproved = app.status === 'Approved';
            const isRejected = app.status === 'Rejected';
            const isDecision = isApproved || isRejected;

            const startedDate = formatTimelineDate(app.timeline?.startedAt || app.date || app.timestamp, '05 Sep 2026');
            const submittedDate = isSubmitted ? formatTimelineDate(app.timeline?.submittedAt, '06 Sep 2026') : 'Pending';
            const verifiedDate = isVerified ? formatTimelineDate(app.timeline?.verifiedAt, '08 Sep 2026') : 'Pending';
            const decisionDate = isDecision ? formatTimelineDate(app.timeline?.decisionAt, '12 Sep 2026') : 'Awaiting Decision';

            return (
              <div
                key={app.id}
                id={`application-card-${app.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
                      Application ID: {app.id}
                    </span>

                    {/* Editable Application Portal Ref */}
                    {editingAppId === app.id ? (
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempEnteredId}
                          onChange={(e) => setTempEnteredId(e.target.value)}
                          className="text-xs font-mono font-bold bg-white border border-blue-900 px-2 py-0.5 rounded"
                          placeholder="Govt Application ID"
                        />
                        <button
                          onClick={() => handleSaveEditedId(app.id)}
                          className="px-2 py-0.5 bg-blue-900 text-white text-xs rounded font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-sm border border-slate-300 flex items-center gap-1.5">
                        <span>Portal Ref: {app.userEnteredApplicationId || app.id}</span>
                        <button
                          onClick={() => handleStartEditId(app)}
                          className="text-blue-700 hover:text-blue-900 text-[11px] underline cursor-pointer"
                          title="Edit official application number"
                        >
                          ✎
                        </button>
                      </span>
                    )}

                    <span className="text-xs text-gray-500 ml-2">
                      Started: <strong>{getRelativeStarted(app.initiatedAt || app.timeline?.startedAt || app.date)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getReminderBadge(app.reminderStatus).cls}`}>
                      {getReminderBadge(app.reminderStatus).label}
                    </span>
                  </div>
                </div>

                {/* Scheme Title & Portal Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      Target Scheme:
                    </div>
                    <h3 className="text-base font-bold text-blue-950 mt-0.5">
                      {app.schemeName}
                    </h3>
                    {app.officialPortal && (
                      <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-gray-700">Official Portal:</span>
                        {getSafePortalUrl(app.officialPortal).isValid && getSafePortalUrl(app.officialPortal).url ? (
                          <>
                            <a
                              href={getSafePortalUrl(app.officialPortal).url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open official government portal (opens in a new tab)"
                              className="text-blue-800 hover:underline font-mono text-[11px]"
                              title="Opens the official government portal in a new tab."
                            >
                              {getSafePortalUrl(app.officialPortal).url} ↗
                            </a>
                            <span className="text-[10px] text-slate-500">
                              (Opens the official government portal in a new tab)
                            </span>
                            <button
                              type="button"
                              onClick={() => setTroubleAppId(troubleAppId === app.id ? null : app.id)}
                              className="text-[10px] text-blue-700 hover:underline cursor-pointer ml-1"
                            >
                              {troubleAppId === app.id ? 'Hide help' : 'Trouble connecting?'}
                            </button>
                            {troubleAppId === app.id && (
                              <div className="w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded text-left text-xs space-y-1">
                                <div className="font-semibold text-slate-800">Government portal is temporarily unavailable.</div>
                                <div className="text-[11px] text-slate-500">Please try again later.</div>
                                <button
                                  type="button"
                                  onClick={() => openOfficialPortal(app.officialPortal)}
                                  className="mt-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 rounded font-bold text-xs cursor-pointer shadow-2xs"
                                  title="Try Again (reopens official portal)"
                                >
                                  Try Again
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-amber-800 text-[11px]">
                            <span>Official portal link is currently unavailable.</span>
                            <span className="text-slate-500 ml-1">Please check later or visit the concerned department.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {app.schemeId && app.schemeId !== 'custom-scheme' && (
                      <button
                        onClick={() => onViewDetailsById(app.schemeId)}
                        className="self-start sm:self-auto text-xs text-blue-900 font-bold hover:underline cursor-pointer"
                      >
                        View Scheme Guidelines →
                      </button>
                    )}
                  </div>
                </div>

                {/* Follow-up / Completion Actions Bar (Requirements 3, 5, 6, 7, 8, 9) */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="text-slate-700">
                    {app.reminderStatus === 'completed' ? (
                      <span className="text-emerald-800 font-semibold">✓ You manually confirmed completion of this application.</span>
                    ) : app.reminderStatus === 'dismissed' ? (
                      <span className="text-slate-500">Reminders dismissed for this application.</span>
                    ) : app.reminderStatus === 'snoozed' ? (
                      <span className="text-amber-800 font-medium">Reminder snoozed. Next follow-up: {formatTimelineDate(app.nextReminderAt)}.</span>
                    ) : app.reminderStatus === 'interested' ? (
                      <span className="text-indigo-900 font-medium">Marked as active & interested. Follow-up reminder active.</span>
                    ) : (
                      <span className="text-slate-600">Application initiated on official portal. Have you continued or submitted?</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {app.reminderStatus !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => onReminderAction?.(app.id, 'complete')}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Explicitly confirm that you submitted on official portal"
                      >
                        ✓ I completed my application
                      </button>
                    )}
                    {app.reminderStatus !== 'completed' && app.reminderStatus !== 'interested' && (
                      <button
                        type="button"
                        onClick={() => onReminderAction?.(app.id, 'interested')}
                        className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Still interested
                      </button>
                    )}
                    {app.reminderStatus !== 'completed' && app.reminderStatus !== 'snoozed' && (
                      <button
                        type="button"
                        onClick={() => onReminderAction?.(app.id, 'snooze')}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Snooze (7d)
                      </button>
                    )}
                    {app.reminderStatus !== 'completed' && app.reminderStatus !== 'dismissed' && (
                      <button
                        type="button"
                        onClick={() => onReminderAction?.(app.id, 'dismiss')}
                        className="px-2 py-1 text-slate-500 hover:text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                {/* READ-ONLY APPLICATION TIMELINE */}
                <div className="bg-slate-50/90 p-4 sm:p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <div className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Application Timeline</span>
                      <span className="text-[10px] text-gray-500 font-normal normal-case">(Official Application Milestones)</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Current Milestone: <strong className="text-blue-950">{app.status}</strong>
                    </div>
                  </div>

                  {/* 4-Stage Status Milestone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Stage 1: Application Started */}
                    <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">Application Started</span>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          ✓
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-600">
                        {startedDate}
                      </div>
                    </div>

                    {/* Stage 2: Submitted */}
                    <div className={`p-3.5 rounded-lg border space-y-1.5 transition-colors ${
                      isSubmitted ? 'bg-white border-gray-200 shadow-2xs' : 'bg-slate-100/60 border-gray-200 text-gray-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSubmitted ? 'text-gray-900' : 'text-gray-500'}`}>Submitted</span>
                        {isSubmitted ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400 text-base font-bold">
                            •
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-semibold ${isSubmitted ? 'text-gray-600' : 'text-gray-400'}`}>
                        {submittedDate}
                      </div>
                    </div>

                    {/* Stage 3: Under Verification */}
                    <div className={`p-3.5 rounded-lg border space-y-1.5 transition-colors ${
                      isVerified ? 'bg-white border-gray-200 shadow-2xs' : 'bg-slate-100/60 border-gray-200 text-gray-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isVerified ? 'text-gray-900' : 'text-gray-500'}`}>Under Verification</span>
                        {isVerified ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400 text-base font-bold">
                            •
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-semibold ${isVerified ? 'text-gray-600' : 'text-gray-400'}`}>
                        {verifiedDate}
                      </div>
                    </div>

                    {/* Stage 4: Decision */}
                    <div className={`p-3.5 rounded-lg border space-y-1.5 transition-colors ${
                      isDecision ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-100/60 border-gray-200 text-gray-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isDecision ? 'text-emerald-950' : 'text-gray-500'}`}>
                          {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Decision'}
                        </span>
                        {isDecision ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-700 text-white text-xs font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400 text-base font-bold">
                            •
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-semibold ${isDecision ? 'text-emerald-800' : 'text-gray-400'}`}>
                        {decisionDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional User Notes or Snapshot Information */}
                {app.notes && (
                  <div className="text-xs text-gray-600 italic bg-gray-50 px-3.5 py-2 rounded-md border border-gray-200 flex items-center gap-1.5">
                    <span className="font-semibold not-italic text-gray-700">Remarks:</span>
                    <span>{app.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record External Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-extrabold text-blue-950">
                Record External Government Application
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewApp} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSchemeName}
                  onChange={(e) => setNewSchemeName(e.target.value)}
                  placeholder="e.g., PMEGP, MUDRA, Stand-Up India, PM Vishwakarma"
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Official Application / Acknowledgment ID
                </label>
                <input
                  type="text"
                  value={newAppId}
                  onChange={(e) => setNewAppId(e.target.value)}
                  placeholder="e.g., KVIC-PMEGP-2026-9912 or Bank Ref #"
                  className="w-full p-2 border border-gray-300 rounded-md font-mono text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Official Government Portal / Website URL
                </label>
                <input
                  type="text"
                  value={newPortal}
                  onChange={(e) => setNewPortal(e.target.value)}
                  placeholder="e.g., https://www.kviconline.gov.in"
                  className="w-full p-2 border border-gray-300 rounded-md font-mono text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Initial Status
                  </label>
                  <div className="p-2 bg-slate-100 border border-gray-300 rounded-md text-slate-800 font-semibold text-xs flex items-center justify-between">
                    <span>Application Started</span>
                    <span className="text-[10px] text-gray-500 font-normal">(System set)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Notes / Next Steps
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g., Physical document verification scheduled at DIC next Tuesday."
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 rounded text-white font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
