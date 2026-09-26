import React, { useState } from 'react';
import { Database, Key, Terminal, CheckCircle2, Copy, Check, ExternalLink, X } from 'lucide-react';

interface FirestoreSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  onCheckAgain: () => void;
  isChecking: boolean;
}

export const FirestoreSeedModal: React.FC<FirestoreSeedModalProps> = ({
  isOpen,
  onClose,
  count,
  onCheckAgain,
  isChecking
}) => {
  const [copiedCommand, setCopiedCommand] = useState(false);

  if (!isOpen) return null;

  const commandText = 'node scripts/import-schemes-admin.mjs';

  const handleCopy = () => {
    navigator.clipboard.writeText(commandText);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4" id="firestore-seed-modal">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cloud Firestore One-Time Seed Guide</h3>
              <p className="text-xs text-slate-300">Populate the 'schemes' collection with all 50 records from SchemeSaathi_Schemes.csv</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm text-gray-700 max-h-[75vh] overflow-y-auto">
          {/* Current Status Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Firestore Status</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                Collection: <span className="font-mono text-blue-700">schemes</span> ({count} / 50 Documents)
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Security Rule: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">allow write: if false;</code> (Read-only for public safety)
              </div>
            </div>
            <button
              onClick={onCheckAgain}
              disabled={isChecking}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-md font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : 'Check Firestore'}
            </button>
          </div>

          {/* Why Server-Side Admin SDK */}
          <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <strong className="text-amber-900">Why Admin SDK is Required:</strong> Because client-side writes are strictly blocked by Firestore security rules (<code className="font-mono text-amber-800">allow write: if false;</code>), writing official government records requires elevated Admin SDK credentials rather than browser requests.
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <span>Follow these 3 simple steps to seed your database:</span>
            </h4>

            {/* Step 1 */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="font-semibold text-gray-900 flex items-center justify-between">
                    <span>Generate Firebase Admin Service Account Key</span>
                    <a
                      href="https://console.firebase.google.com/project/schemesaathi-f16c9/settings/serviceaccounts/adminsdk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-normal underline"
                    >
                      Open Firebase Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-600">
                    In Firebase Console &gt; Project Settings &gt; <strong>Service accounts</strong> &gt; Click <strong>"Generate new private key"</strong>. A JSON file will download.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="font-semibold text-gray-900">Save the Key in Project Root</div>
                  <p className="text-xs text-gray-600">
                    Rename the downloaded JSON file to <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-800">serviceAccountKey.json</code> and place it in the project root folder.
                  </p>
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Already protected in <code className="font-mono">.gitignore</code> so your secret key can never be committed.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-2 flex-1">
                  <div className="font-semibold text-gray-900">Run the One-Time Seed Script</div>
                  <p className="text-xs text-gray-600">
                    Execute the automated script in your terminal to batch-insert all 20 records and verify the documents:
                  </p>
                  <div className="bg-slate-900 text-slate-100 rounded-md p-3 flex items-center justify-between font-mono text-xs">
                    <code>{commandText}</code>
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                      title="Copy to clipboard"
                    >
                      {copiedCommand ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    The script preserves documents <code className="font-mono">SS-0001</code> to <code className="font-mono">SS-0020</code> and batch-inserts the 30 new records <code className="font-mono">SS-0021</code> to <code className="font-mono">SS-0050</code> into the <code className="font-mono">schemes</code> collection, preserving all CSV columns and csvSchemeId.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            See <code className="font-mono text-gray-700">README_FIRESTORE_SEED.md</code> for full details
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={onCheckAgain}
              disabled={isChecking}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : 'Check Firestore Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
