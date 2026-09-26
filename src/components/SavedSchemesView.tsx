import React from 'react';
import { Language, SavedSchemeItem, SchemeMatchResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { SCHEMES_DATABASE } from '../data/schemes';

interface SavedSchemesViewProps {
  language: Language;
  savedSchemes: SavedSchemeItem[];
  onRemoveSaved: (schemeId: string) => void;
  onViewDetailsById: (schemeId: string) => void;
  onBrowseSchemes: () => void;
}

export const SavedSchemesView: React.FC<SavedSchemesViewProps> = ({
  language,
  savedSchemes,
  onRemoveSaved,
  onViewDetailsById,
  onBrowseSchemes
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6" id="saved-schemes-page">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-blue-950">
          {t.savedHeading}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Bookmarks associated securely with your personal account.
        </p>
      </div>

      {savedSchemes.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg p-6 shadow-xs" id="saved-empty-state">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl font-bold mb-3">
            ☆
          </div>
          {/* Specified text */}
          <h3 className="text-base font-bold text-gray-800">
            {t.savedEmpty}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            {t.savedEmptySub}
          </p>
          <button
            onClick={onBrowseSchemes}
            className="mt-5 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            {t.btnBrowseSchemes} →
          </button>
        </div>
      ) : (
        <div className="space-y-3" id="saved-schemes-list">
          {savedSchemes.map((item) => {
            const schemeObj = SCHEMES_DATABASE.find(s => s.id === item.schemeId);

            return (
              <div
                key={item.id}
                id={`saved-item-${item.schemeId}`}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-blue-300 transition-colors"
              >
                <div className="space-y-1">
                  {/* Saved Scheme Name */}
                  <h3 className="text-base font-bold text-blue-950">
                    {item.schemeName}
                  </h3>
                  {/* Date Saved */}
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{t.dateSaved} <strong>{item.savedDate}</strong></span>
                    {schemeObj && (
                      <span className="text-emerald-700 font-medium">
                        • {schemeObj.ministry}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <div className="text-xs text-gray-600 italic">
                      Note: {item.notes}
                    </div>
                  )}
                </div>

                {/* Actions: View Details & Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onViewDetailsById(item.schemeId)}
                    className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    {t.btnViewDetails}
                  </button>

                  <button
                    onClick={() => onRemoveSaved(item.schemeId)}
                    className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 hover:border-red-300 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    {t.btnRemove}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
