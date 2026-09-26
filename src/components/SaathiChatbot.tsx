import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Minus, 
  RotateCcw, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  HelpCircle,
  Search,
  CheckSquare,
  DollarSign,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Scheme, UserProfile, UserAccount, DemoApplication, Language } from '../types';
import { SCHEMES_DATABASE } from '../data/schemes';
import { 
  ChatMessage, 
  isPersonalizedQuery, 
  detectLanguage, 
  findSchemesByKeyword, 
  generatePersonalizedRecommendations,
  generateSchemeComparison,
  generateDocumentReadiness,
  generateBenefitEstimate
} from '../services/chatbotEngine';
import { getSafePortalUrl } from '../utils/portalLink';

interface SaathiChatbotProps {
  language: Language;
  currentUser: UserAccount | null;
  userProfile: UserProfile | null;
  applications: DemoApplication[];
  onOpenAuth: (mode?: 'login' | 'register' | 'auth_for_matching' | 'auth_for_apply' | 'auth_for_browse') => void;
  onViewSchemeDetails: (scheme: Scheme) => void;
  onApplyScheme: (scheme: Scheme) => void;
  onSaveScheme?: (scheme: Scheme) => void;
  onNavigateToTab?: (tab: string) => void;
}

const WELCOME_TEXT = `Hi! 👋 I'm Saathi, your Government Scheme Assistant.

I can help you understand government schemes, eligibility, documents and application steps.`;

const INITIAL_QUICK_ACTIONS = [
  '🔎 Find Schemes',
  '🎯 Find Schemes For Me',
  '✅ Check Eligibility',
  '📄 Check Documents',
  '💰 Estimate Benefits',
  '❓ Ask a Question'
];

export const SaathiChatbot: React.FC<SaathiChatbotProps> = ({
  language,
  currentUser,
  userProfile,
  applications,
  onOpenAuth,
  onViewSchemeDetails,
  onApplyScheme,
  onSaveScheme,
  onNavigateToTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: WELCOME_TEXT,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: INITIAL_QUICK_ACTIONS
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, isMinimized]);

  // Reset / clear conversation
  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: WELCOME_TEXT,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: INITIAL_QUICK_ACTIONS
      }
    ]);
  };

  // Process message submission
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: userTimestamp
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const qLower = query.toLowerCase();

      // ==============================================================
      // 1. CHECK IF PERSONALIZED & USER IS NOT LOGGED IN (Requirement 5)
      // ==============================================================
      if (!currentUser && (isPersonalizedQuery(query) || query.includes('🎯') || query.includes('Find Schemes For Me'))) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `🔐 This feature needs your profile information.\n\nPlease Login or Register to continue.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'auth_prompt'
            }
          ]);
          setIsLoading(false);
        }, 400);
        return;
      }

      // ==============================================================
      // 2. PERSONALIZED SCHEME MATCHING IN CHAT (Requirement 7, 8)
      // ==============================================================
      if (currentUser && (query.includes('Find Schemes For Me') || query.includes('for me') || query.includes('for my business') || query.includes('na business ki em schemes'))) {
        setTimeout(() => {
          if (!userProfile) {
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: `Welcome ${currentUser.name}! To give you tailored recommendations with exact match scores, please complete your Entrepreneur Profile questionnaire first.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                quickActions: ['Complete Profile Questionnaire', 'Browse All Schemes']
              }
            ]);
          } else {
            const rec = generatePersonalizedRecommendations(userProfile, SCHEMES_DATABASE, applications);
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: rec.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'scheme_cards',
                data: rec.matchedSchemes,
                quickActions: ['📄 Check Documents', '💰 Estimate Benefits', 'Compare PMEGP and Mudra']
              }
            ]);
          }
          setIsLoading(false);
        }, 450);
        return;
      }

      // ==============================================================
      // 3. DOCUMENT CHECKER IN CHAT (Requirement 10)
      // ==============================================================
      if (query.includes('Check Documents') || qLower.includes('documents') || qLower.includes('document checklist')) {
        setTimeout(() => {
          const targetScheme = SCHEMES_DATABASE.find(s => qLower.includes(s.shortName.toLowerCase())) || SCHEMES_DATABASE[4]; // PMEGP default
          const docData = generateDocumentReadiness(targetScheme, userProfile);
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `📄 Required Documents for **${docData.schemeName}**:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'document_checker',
              data: docData,
              quickActions: ['Check Mudra Documents', 'Check Stand-Up India Documents', '🎯 Find Schemes For Me']
            }
          ]);
          setIsLoading(false);
        }, 400);
        return;
      }

      // ==============================================================
      // 4. BENEFIT ESTIMATOR IN CHAT (Requirement 11)
      // ==============================================================
      if (query.includes('Estimate Benefits') || qLower.includes('benefit') || qLower.includes('subsidy') || qLower.includes('how much')) {
        setTimeout(() => {
          const targetScheme = SCHEMES_DATABASE.find(s => qLower.includes(s.shortName.toLowerCase())) || SCHEMES_DATABASE[4]; // PMEGP default
          const benefitData = generateBenefitEstimate(targetScheme, userProfile);
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `💰 **Estimated Benefit for ${benefitData.schemeName}**\n\n${benefitData.estimateText}\n\n*${benefitData.disclaimer}*`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'benefit_estimate',
              data: benefitData,
              quickActions: ['View PMEGP Details', 'Estimate Mudra Benefits', '🎯 Find Schemes For Me']
            }
          ]);
          setIsLoading(false);
        }, 400);
        return;
      }

      // ==============================================================
      // 5. SCHEME COMPARISON (Requirement 12)
      // ==============================================================
      if (qLower.includes('compare') || query.includes('Comparison')) {
        setTimeout(() => {
          const comp = generateSchemeComparison(
            qLower.includes('stand') ? 'SS-0001' : 'SS-0005',
            qLower.includes('vishwakarma') ? 'SS-0008' : 'SS-0006'
          );
          if (comp) {
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: `Here is a side-by-side comparison between **${comp.schemeA.shortName}** and **${comp.schemeB.shortName}**:`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'comparison',
                data: comp,
                quickActions: ['View PMEGP Details', 'View Mudra Details', '🎯 Find Schemes For Me']
              }
            ]);
          }
          setIsLoading(false);
        }, 400);
        return;
      }

      // ==============================================================
      // 6. QUICK ACTION: FIND SCHEMES (BROWSE)
      // ==============================================================
      if (query === '🔎 Find Schemes' || query === 'Find Schemes') {
        setTimeout(() => {
          const sampleSchemes = SCHEMES_DATABASE.slice(0, 4);
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `Here are popular national government schemes for entrepreneurs across manufacturing, service, and artisan sectors:\n\n${sampleSchemes.map((s, i) => `${i + 1}. **${s.shortName}** (${s.ministry}) - ${s.keyBenefit}`).join('\n\n')}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickActions: [
                'Tell me about PMEGP', 
                'Tell me about Stand-Up India', 
                'Tell me about PM Vishwakarma',
                '🎯 Find Schemes For Me'
              ]
            }
          ]);
          setIsLoading(false);
        }, 350);
        return;
      }

      // ==============================================================
      // 7. QUICK ACTION: CHECK ELIGIBILITY
      // ==============================================================
      if (query === '✅ Check Eligibility') {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `Which scheme's eligibility would you like to evaluate?\n\nSelect a scheme below or ask about any scheme by name:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickActions: [
                'PMEGP Eligibility',
                'Stand-Up India Eligibility',
                'PM Mudra Eligibility',
                'PM Vishwakarma Eligibility'
              ]
            }
          ]);
          setIsLoading(false);
        }, 350);
        return;
      }

      // ==============================================================
      // 8. QUICK ACTION: ASK A QUESTION
      // ==============================================================
      if (query === '❓ Ask a Question') {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'bot',
              text: `You can ask anything about government schemes in English, Telugu (తెలుగు), or Telugu-English! Here are common queries:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickActions: [
                'What is PMEGP?',
                'Na business ki em schemes unnayi?',
                'Women entrepreneurs ki schemes em unnayi?',
                'Compare PMEGP and Mudra'
              ]
            }
          ]);
          setIsLoading(false);
        }, 350);
        return;
      }

      // ==============================================================
      // 9. HYBRID AI ROUTE: CALL SERVER /api/chat WITH BACKEND GEMINI
      // ==============================================================
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history: messages.slice(-6),
            userProfile,
            isAuthenticated: Boolean(currentUser)
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            setMessages(prev => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: data.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                quickActions: ['🎯 Find Schemes For Me', '📄 Check Documents', '💰 Estimate Benefits']
              }
            ]);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Continue to high-accuracy local scheme matching fallback
      }

      // ==============================================================
      // 10. LOCAL ACCURATE SCHEME KNOWLEDGE FALLBACK (ZERO-FAIL ENGINE)
      // ==============================================================
      const matched = findSchemesByKeyword(query);
      const isTe = detectLanguage(query) !== 'en';

      if (matched.length > 0) {
        const topScheme = matched[0];
        let replyText = '';

        if (isTe) {
          replyText = `**${topScheme.name} (${topScheme.shortName})** గురించి వివరాలు:\n\n` +
            `🎯 **లబ్ధిదారులు:** ${topScheme.targetBeneficiary}\n` +
            `💰 **ప్రయోజనాలు:** ${topScheme.keyBenefit} (${topScheme.maximumBenefit})\n` +
            `✓ **అర్హత:** ${topScheme.eligibilityCriteria}\n` +
            `📄 **కావలసిన పత్రాలు:** ${topScheme.requiredDocuments}\n\n` +
            `🔗 **అధికారిక పోర్టల్:** ${topScheme.officialApplicationUrl || topScheme.sourceUrl}`;
        } else {
          replyText = `**${topScheme.name} (${topScheme.shortName})**\n\n` +
            `🏛️ **Ministry/Level:** ${topScheme.ministryDepartment} (${topScheme.governmentLevel})\n` +
            `🎯 **Target Beneficiary:** ${topScheme.targetBeneficiary}\n` +
            `💰 **Key Benefit:** ${topScheme.keyBenefit}\n` +
            `✓ **Eligibility:** ${topScheme.eligibilityCriteria}\n` +
            `📄 **Required Documents:** ${topScheme.requiredDocuments}\n\n` +
            `🔗 **Official Portal:** ${topScheme.officialApplicationUrl || topScheme.sourceUrl}`;
        }

        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: [
              `Check ${topScheme.shortName} Documents`,
              `Estimate ${topScheme.shortName} Benefits`,
              '🎯 Find Schemes For Me'
            ]
          }
        ]);
      } else {
        const notFoundText = isTe 
          ? "క్షమించండి, అభ్యర్థించిన సమాచారం స్కీమ్ సాథీ డేటాబేస్ లో ధృవీకరించబడలేదు. దయచేసి అధికారిక ప్రభుత్వ పోర్టల్ లో తనిఖీ చేయండి."
          : "I couldn't verify that information from the available SchemeSaathi data. Please check the official scheme source.";

        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: notFoundText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: ['🔎 Find Schemes', '🎯 Find Schemes For Me', '❓ Ask a Question']
          }
        ]);
      }

    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `I encountered an unexpected issue. You can explore verified schemes directly or try asking again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: ['🔎 Find Schemes', '🎯 Find Schemes For Me']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="saathi-chatbot-wrapper" className="font-sans">
      {/* Floating Action Button (Requirement 3 & Reference Image) */}
      {!isOpen && (
        <button
          id="btn-ask-saathi-floating"
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-[#122B68] hover:bg-[#0E2254] text-white font-bold rounded-full shadow-2xl hover:shadow-blue-950/40 transform hover:-translate-y-0.5 transition-all cursor-pointer border border-white/25 group"
          title="Ask Saathi - AI Government Scheme Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-[#122B68] animate-pulse"></span>
          </div>
          <span className="text-sm tracking-wide font-bold">Ask Saathi</span>
        </button>
      )}

      {/* Modern Chat Window (Requirement 3 & 18) */}
      {isOpen && (
        <div
          id="saathi-chat-window"
          className={`fixed z-50 transition-all duration-200 ease-out bg-white border border-slate-200 shadow-2xl flex flex-col ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14 rounded-2xl overflow-hidden'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[440px] h-[calc(100vh-80px)] sm:h-[620px] max-h-[88vh] rounded-2xl overflow-hidden'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/10 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-lg shadow-inner">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-white">Saathi AI</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-none mt-0.5">
                  Your Government Scheme Assistant
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 text-slate-300">
              <button
                id="chatbot-reset-btn"
                onClick={handleResetChat}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                id="chatbot-minimize-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                id="chatbot-close-btn"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Auth Status Banner */}
          {!isMinimized && (
            <div className="bg-slate-50 border-b border-slate-200/80 px-3.5 py-1.5 text-[11px] flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                {currentUser ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-medium text-slate-800 truncate">Logged in as {currentUser.name}</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Guest Mode (General scheme queries)</span>
                  </>
                )}
              </div>
              {!currentUser && (
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-blue-700 hover:text-blue-900 font-bold ml-2 underline cursor-pointer shrink-0"
                >
                  Login
                </button>
              )}
            </div>
          )}

          {/* Message List Body */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" id="saathi-messages-container">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Label & Time */}
                  <span className="text-[10px] text-slate-400 mb-1 px-1">
                    {msg.sender === 'user' ? 'You' : 'Saathi AI'} • {msg.timestamp}
                  </span>

                  {/* Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {/* Text formatted with line breaks */}
                    <div className="whitespace-pre-line">
                      {msg.text}
                    </div>

                    {/* Authentication Prompt Buttons (Requirement 5) */}
                    {msg.type === 'auth_prompt' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => onOpenAuth('login')}
                          className="flex-1 px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-md transition-colors text-center cursor-pointer shadow-xs"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => onOpenAuth('register')}
                          className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-md transition-colors text-center cursor-pointer shadow-xs"
                        >
                          Register
                        </button>
                      </div>
                    )}

                    {/* Matching Scheme Cards (Requirement 7 & 8) */}
                    {msg.type === 'scheme_cards' && Array.isArray(msg.data) && (
                      <div className="mt-3 space-y-3 pt-2 border-t border-slate-100">
                        {msg.data.map((item: any, idx: number) => {
                          const s: Scheme = item.scheme;
                          return (
                            <div
                              key={s.id || idx}
                              className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 hover:border-blue-300 transition-colors"
                            >
                              {/* Title & Match Score */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-bold text-blue-950 text-sm">{s.name}</h4>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {s.shortName} • {s.ministryDepartment}
                                  </span>
                                </div>
                                <span className="shrink-0 text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ⭐ {item.matchScore}% Match
                                </span>
                              </div>

                              {/* Key Benefit */}
                              <p className="text-xs text-slate-700 mt-2 bg-white p-2 rounded-md border border-slate-200">
                                <span className="font-semibold text-slate-900">Key Benefit:</span> {s.keyBenefit}
                              </p>

                              {/* Why this scheme (Explainable Criteria) */}
                              <div className="mt-2.5">
                                <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                                  Why this scheme:
                                </span>
                                <ul className="text-[11px] text-slate-600 space-y-0.5">
                                  {item.reasons.map((r: string, rIdx: number) => (
                                    <li key={rIdx} className="flex items-start gap-1">
                                      <span>{r}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Possible Gaps */}
                              {item.mismatches && item.mismatches.length > 0 && (
                                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-start gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <span>{item.mismatches[0]}</span>
                                </div>
                              )}

                              {/* Application status if available */}
                              {item.applicationStatus && (
                                <div className="mt-2 text-[11px] bg-blue-50 text-blue-900 px-2 py-1 rounded border border-blue-200 font-medium">
                                  Application Status: <span className="font-bold">{item.applicationStatus}</span>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                                <button
                                  onClick={() => onViewSchemeDetails(s)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-950 text-xs font-semibold rounded border border-slate-300 transition-colors cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleSendMessage(`Check eligibility for ${s.shortName}`)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-emerald-800 text-xs font-semibold rounded border border-emerald-300 transition-colors cursor-pointer"
                                >
                                  Check Eligibility
                                </button>
                                {getSafePortalUrl(s.officialApplicationUrl).isValid && getSafePortalUrl(s.officialApplicationUrl).url ? (
                                  <div className="ml-auto flex flex-col items-end gap-0.5">
                                    <a
                                      href={getSafePortalUrl(s.officialApplicationUrl).url!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label="Open official government portal (opens in a new tab)"
                                      onClick={() => onApplyScheme(s)}
                                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                                      title="Opens the official government portal in a new tab."
                                    >
                                      <span>Apply on Official Portal</span>
                                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                    </a>
                                    <span className="text-[9px] text-slate-500 font-medium">
                                      Opens in a new tab
                                    </span>
                                  </div>
                                ) : (
                                  <div className="ml-auto text-right text-[11px] text-amber-800 max-w-[210px] leading-snug">
                                    <div className="font-semibold">Official portal link is currently unavailable.</div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">Please check the scheme details later or visit the concerned government department.</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Document Checker Display (Requirement 10) */}
                    {msg.type === 'document_checker' && msg.data && (
                      <div className="mt-3 pt-2 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">Document Readiness:</span>
                          <span className="font-extrabold text-blue-900">
                            {msg.data.readyCount} / {msg.data.totalCount} Ready
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${(msg.data.readyCount / (msg.data.totalCount || 1)) * 100}%` }}
                          ></div>
                        </div>

                        {/* Ready Documents */}
                        {msg.data.readyDocuments.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-emerald-800 block mb-0.5">Ready:</span>
                            <ul className="text-xs text-slate-700 space-y-0.5">
                              {msg.data.readyDocuments.map((doc: string, dIdx: number) => (
                                <li key={dIdx} className="flex items-center gap-1.5 text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing Documents */}
                        {msg.data.missingDocuments.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] font-bold text-amber-800 block mb-0.5">Needs Verification / Missing:</span>
                            <ul className="text-xs text-slate-700 space-y-0.5">
                              {msg.data.missingDocuments.map((doc: string, dIdx: number) => (
                                <li key={dIdx} className="flex items-center gap-1.5 text-amber-700">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scheme Comparison Table (Requirement 12) */}
                    {msg.type === 'comparison' && msg.data && (
                      <div className="mt-3 pt-2 border-t border-slate-100 overflow-x-auto">
                        <table className="w-full text-xs text-left border border-slate-200 rounded-md overflow-hidden">
                          <thead className="bg-slate-100 text-slate-800">
                            <tr>
                              <th className="p-2 border-b border-r border-slate-200 font-bold">Feature</th>
                              <th className="p-2 border-b border-r border-slate-200 font-bold text-blue-900">
                                {msg.data.schemeA.shortName}
                              </th>
                              <th className="p-2 border-b border-slate-200 font-bold text-emerald-800">
                                {msg.data.schemeB.shortName}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold bg-slate-50 text-[11px]">Level</td>
                              <td className="p-2 border-r border-slate-200">{msg.data.schemeA.governmentLevel}</td>
                              <td className="p-2">{msg.data.schemeB.governmentLevel}</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold bg-slate-50 text-[11px]">Benefit</td>
                              <td className="p-2 border-r border-slate-200">{msg.data.schemeA.maximumBenefit}</td>
                              <td className="p-2">{msg.data.schemeB.maximumBenefit}</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold bg-slate-50 text-[11px]">Eligibility</td>
                              <td className="p-2 border-r border-slate-200">{msg.data.schemeA.targetBeneficiary}</td>
                              <td className="p-2">{msg.data.schemeB.targetBeneficiary}</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold bg-slate-50 text-[11px]">Action</td>
                              <td className="p-2 border-r border-slate-200">
                                <button
                                  onClick={() => onViewSchemeDetails(msg.data.schemeA)}
                                  className="text-blue-800 font-bold hover:underline"
                                >
                                  View Scheme
                                </button>
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() => onViewSchemeDetails(msg.data.schemeB)}
                                  className="text-emerald-800 font-bold hover:underline"
                                >
                                  View Scheme
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons (Requirement 4 & 14) */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                      {msg.quickActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSendMessage(action)}
                          className="text-xs px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-900 font-medium rounded-full border border-blue-200 shadow-2xs transition-all hover:border-blue-400 cursor-pointer"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-tl-none shadow-2xs">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[11px] text-slate-500 ml-1">Saathi is reviewing schemes...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Trust & Safety Disclaimer Footer (Requirement 17) */}
          {!isMinimized && (
            <div className="bg-slate-100/90 border-t border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 italic text-center">
              Saathi provides guidance based on available scheme information. Final eligibility, approval and benefits are determined by the official government authority.
            </div>
          )}

          {/* Input Box and Send Button */}
          {!isMinimized && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask in English, తెలుగు, or mixed..."
                className="flex-1 text-sm bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2.5 outline-none transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="p-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
