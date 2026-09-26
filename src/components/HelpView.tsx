import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateAssistantReply, AssistantMessage } from '../services/aiAssistant';

interface HelpViewProps {
  language: Language;
  onViewSchemeDetailsById: (schemeId: string) => void;
}

export const HelpView: React.FC<HelpViewProps> = ({
  language,
  onViewSchemeDetailsById
}) => {
  const t = TRANSLATIONS[language];

  // FAQ Accordion states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Assistant Chat States
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init_msg',
      sender: 'assistant',
      text: language === 'hi' 
        ? 'नमस्ते! मैं SchemeSaathi सहायक हूँ। आप मुझसे सरकारी योजनाओं, सब्सिडी, ऋण या आवश्यक दस्तावेजों के बारे में पूछ सकते हैं।' 
        : language === 'te' 
        ? 'నమస్కారం! నేను SchemeSaathi సహాయకుడిని. ప్రభుత్వ పథకాలు, సబ్సిడీలు లేదా అవసరమైన పత్రాల గురించి మీరు నన్ను అడగవచ్చు.' 
        : 'Hello! I am your SchemeSaathi Assistant. Ask me anything about government schemes, subsidies, loans, or required documents.',
      timestamp: 'Just now'
    }
  ]);
  const [queryInput, setQueryInput] = useState<string>('');

  const faqs = [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
    { q: t.faqQ5, a: t.faqA5 }
  ];

  const quickPrompts = [
    'What schemes offer high subsidies for women?',
    'What are the requirements for PMEGP loan?',
    'How do I get loans without collateral under CGTMSE?',
    'What benefits does PM Vishwakarma provide to artisans?'
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || queryInput;
    if (!q.trim()) return;

    const userMsg: AssistantMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: q.trim(),
      timestamp: 'Now'
    };

    const { reply, matchedSchemes } = generateAssistantReply(q, language);

    const assistantMsg: AssistantMessage = {
      id: 'ast_' + Date.now(),
      sender: 'assistant',
      text: reply,
      timestamp: 'Now',
      relatedSchemes: matchedSchemes
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setQueryInput('');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6" id="help-page">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950">
          {t.helpHeading}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {t.helpSubheading}
        </p>
      </div>

      {/* AI Scheme Assistant Interface */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden mb-10" id="ai-assistant-card">
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h2 className="text-base font-bold">
                {t.aiAssistantTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {t.aiAssistantDesc}
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-emerald-400 font-mono px-2 py-1 rounded-sm border border-slate-700 hidden sm:inline">
            Grounded Scheme Knowledge
          </span>
        </div>

        {/* Chat History Box */}
        <div className="p-4 sm:p-5 max-h-96 overflow-y-auto space-y-3 bg-slate-50/60" id="assistant-chat-history">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-900 text-white font-medium'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Related Schemes Chips */}
                {m.relatedSchemes && m.relatedSchemes.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Relevant Schemes:</span>
                    {m.relatedSchemes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onViewSchemeDetailsById(s.id)}
                        className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold px-2 py-0.5 rounded-sm border border-blue-200 cursor-pointer"
                      >
                        {s.name} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-gray-100/70 border-t border-gray-200 flex flex-wrap gap-1.5 items-center text-xs">
          <span className="text-[11px] font-bold text-gray-600 shrink-0">{t.quickQuestions}</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[11px] bg-white hover:bg-blue-50 text-blue-900 border border-gray-300 hover:border-blue-300 px-2 py-1 rounded-sm cursor-pointer transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
          <input
            id="assistant-query-input"
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={t.aiInputPlaceholder}
            className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
          />
          <button
            id="assistant-send-btn"
            onClick={() => handleSend()}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-md transition-colors cursor-pointer"
          >
            {t.btnAsk}
          </button>
        </div>

        {/* Assistant Specific Disclaimer */}
        <div className="px-4 py-2 bg-slate-50 text-[11px] text-gray-500 italic border-t border-gray-100">
          {t.aiDisclaimer}
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs" id="faq-accordion-section">
        <h2 className="text-xl font-bold text-blue-950 mb-4 pb-2 border-b border-gray-100">
          {t.faqTitle}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-md overflow-hidden"
                id={`faq-item-${index}`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-xs sm:text-sm text-gray-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-gray-500 text-base font-bold ml-2">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-4 bg-white text-xs sm:text-sm text-gray-700 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
