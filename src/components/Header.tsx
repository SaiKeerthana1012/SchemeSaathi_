import React, { useState, useRef, useEffect } from 'react';
import { Language, UserAccount, AppNotification } from '../types';
import { TRANSLATIONS } from '../translations';
import { AuthModalMode } from './AuthModal';
import { 
  Bell, 
  Home, 
  Search, 
  User, 
  UserPlus, 
  ClipboardList, 
  Bookmark, 
  HelpCircle, 
  ChevronDown, 
  LogOut, 
  Cloud 
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  currentUser: UserAccount | null;
  onOpenAuth: (mode?: AuthModalMode) => void;
  onLogout: () => void;
  savedCount: number;
  appsCount: number;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onReminderAction?: (appId: string, action: 'interested' | 'snooze' | 'dismiss' | 'complete', notifId?: string) => void;
  onOpenNotifications?: () => void;
  firestoreStatus?: {
    checked: boolean;
    isPopulated: boolean;
    count: number;
    loading: boolean;
    error: string | null;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  language,
  onSelectLanguage,
  currentUser,
  onOpenAuth,
  onLogout,
  savedCount,
  appsCount,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onReminderAction,
  onOpenNotifications,
  firestoreStatus
}) => {
  const t = TRANSLATIONS[language];
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const isFirestoreConnected = firestoreStatus?.checked && !firestoreStatus?.error;
  const isFirestoreLoading = firestoreStatus?.loading;

  // Real authenticated user name or neutral fallback
  const displayName = currentUser?.name || 'Entrepreneur';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs select-none" id="schemesaathi-header">
      
      {/* ======================================================== */}
      {/* 1. TOP GOVERNMENT BAR (Dark Navy with Emblem & Status) */}
      {/* ======================================================== */}
      <div 
        className="bg-[#0B1A30] text-white text-xs px-4 sm:px-6 lg:px-8 py-2 font-medium flex items-center justify-between border-b border-[#1E293B]" 
        id="top-government-bar"
      >
        {/* Left Side: State Emblem of India + Text */}
        <div className="flex items-center gap-2.5 text-xs text-slate-200">
          <svg className="w-5 h-6 text-white shrink-0" viewBox="0 0 24 30" fill="currentColor">
            <path d="M12 2 C13 2 14 3 14 4 C15 4 16 5 16 6 C17 6 18 7 18 9 C18 11 17 12 16 13 C16.5 14 16.5 15 16 16 L17 19 L15 20 L14.5 18 C13.7 18.5 12.8 18.8 12 18.8 C11.2 18.8 10.3 18.5 9.5 18 L9 20 L7 19 L8 16 C7.5 15 7.5 14 8 13 C7 12 6 11 6 9 C6 7 7 6 8 6 C8 5 9 4 10 4 C10 3 11 2 12 2 Z" opacity="0.95" />
            <rect x="5" y="21" width="14" height="2.5" rx="1" opacity="0.9" />
            <circle cx="12" cy="22.25" r="1.2" fill="#0B1A30" />
            <rect x="4" y="24" width="16" height="2" rx="0.5" opacity="0.8" />
          </svg>

          <span className="font-bold text-white whitespace-nowrap">
            Government of India
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden md:inline text-[11px] sm:text-xs">
            Access verified government schemes and official application portals for your business and livelihood.
          </span>
        </div>

        {/* Right Side: Language switcher + Real Firestore Connection Status */}
        <div className="flex items-center gap-4 text-xs ml-auto">
          {/* Language Selector */}
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400" id="language-selector">
            <button
              id="lang-btn-en"
              onClick={() => onSelectLanguage('en')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                language === 'en' ? 'text-white font-bold bg-blue-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <span className="text-slate-600">|</span>
            <button
              id="lang-btn-te"
              onClick={() => onSelectLanguage('te')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                language === 'te' ? 'text-white font-bold bg-blue-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
            <span className="text-slate-600">|</span>
            <button
              id="lang-btn-hi"
              onClick={() => onSelectLanguage('hi')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                language === 'hi' ? 'text-white font-bold bg-blue-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Real Firestore Status Indicator from Reference Image */}
          <div
            id="firestore-status-badge"
            className="flex items-center gap-1.5 text-xs text-slate-200 font-medium"
            title={
              isFirestoreConnected
                ? `Cloud Firestore Connected (schemes: ${firestoreStatus?.count ?? 20} documents)`
                : isFirestoreLoading
                ? 'Connecting to Firestore...'
                : 'Firestore Offline'
            }
          >
            <Cloud className="w-4 h-4 text-white shrink-0" />
            <span className="whitespace-nowrap">
              Firestore: {isFirestoreConnected ? 'Connected' : isFirestoreLoading ? 'Connecting...' : 'Offline'}
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isFirestoreConnected
                  ? 'bg-emerald-400'
                  : isFirestoreLoading
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN NAVIGATION (White with SchemeSaathi Brand & Links) */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
            onClick={() => onSelectTab('home')}
            id="brand-logo-container"
          >
            {/* SchemeSaathi Emblem: Two blue hands holding three-leaf sprout */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 drop-shadow-xs" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Green leaves sprout */}
                <path d="M24 6 C24 6, 29 13, 29 20 C29 25, 26 27, 24 28 C22 27, 19 25, 19 20 C19 13, 24 6, 24 6 Z" fill="#16A34A" />
                <path d="M19 16 C14 13, 8 16, 8 22 C8 27, 13 28, 18 26 C20 25, 20 22, 19 16 Z" fill="#22C55E" />
                <path d="M29 16 C34 13, 40 16, 40 22 C40 27, 35 28, 30 26 C28 25, 28 22, 29 16 Z" fill="#22C55E" />
                {/* Blue cupped hands */}
                <path d="M12 36 C14 31, 18 29, 23 31 C22 33, 19 35, 15 37 L12 36 Z" fill="#1E3A8A" />
                <path d="M36 36 C34 31, 30 29, 25 31 C26 33, 29 35, 33 37 L36 36 Z" fill="#1E3A8A" />
                <path d="M10 39 C14 42, 20 43, 24 43 C28 43, 34 42, 38 39 C36 43, 30 45, 24 45 C18 45, 12 43, 10 39 Z" fill="#1E40AF" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E48] group-hover:text-blue-800 transition-colors leading-none" id="brand-logo-text">
                SchemeSaathi
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-normal mt-1 leading-tight">
                Scheme Matching for Marginalized Entrepreneurs
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links with Clean Line Icons */}
          <nav className="hidden xl:flex items-center space-x-1" id="main-navigation">
            {/* Home */}
            <button
              id="nav-home-btn"
              onClick={() => onSelectTab('home')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                currentTab === 'home'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4 text-blue-700" />
              <span>Home</span>
            </button>

            {/* Find Schemes */}
            <button
              id="nav-find-schemes-btn"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('auth_for_browse');
                } else {
                  onSelectTab('find-schemes');
                }
              }}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                currentTab === 'find-schemes'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Find Schemes</span>
            </button>

            {/* My Profile */}
            <button
              id="nav-my-profile-btn"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  onSelectTab('profile');
                }
              }}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                currentTab === 'profile'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>My Profile</span>
            </button>

            {/* My Applications */}
            <button
              id="nav-my-applications-btn"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  onSelectTab('applications');
                }
              }}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 relative ${
                currentTab === 'applications'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>My Applications</span>
              {appsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-emerald-600 text-white rounded-full font-bold leading-none">
                  {appsCount}
                </span>
              )}
            </button>

            {/* Saved Schemes */}
            <button
              id="nav-saved-schemes-btn"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  onSelectTab('saved');
                }
              }}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 relative ${
                currentTab === 'saved'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-4 h-4 text-slate-500" />
              <span>Saved Schemes</span>
              {savedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-blue-600 text-white rounded-full font-bold leading-none">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Help */}
            <button
              id="nav-help-btn"
              onClick={() => onSelectTab('help')}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                currentTab === 'help'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Help</span>
            </button>
          </nav>

          {/* User Account / Notifications / Profile / Logout Section */}
          <div className="flex items-center space-x-3 shrink-0" id="user-auth-section">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="header-notification-btn"
                type="button"
                onClick={() => {
                  const nextState = !showNotifications;
                  setShowNotifications(nextState);
                  if (nextState && onOpenNotifications) {
                    onOpenNotifications();
                  }
                }}
                className="p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {showNotifications && (
                <div 
                  id="notifications-dropdown-menu"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-xs"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded-full text-[10px]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && onMarkAllNotificationsAsRead && (
                      <button
                        id="mark-all-notifications-read-btn"
                        type="button"
                        onClick={() => onMarkAllNotificationsAsRead()}
                        className="text-[11px] text-blue-800 hover:text-blue-950 font-semibold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationAsRead && onMarkNotificationAsRead(notif.id)}
                          className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notif.isRead ? 'bg-blue-50/40' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                              )}
                              <span>{notif.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(notif.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                            {notif.message}
                          </p>

                          {/* Requirement 4 & 10: In-App Reminder Follow-up Card */}
                          {notif.type === 'application_reminder' && notif.applicationId && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReminderAction?.(notif.applicationId || '', 'interested', notif.id);
                                  }}
                                  className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Yes, I'm interested
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReminderAction?.(notif.applicationId || '', 'snooze', notif.id);
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Snooze
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReminderAction?.(notif.applicationId || '', 'dismiss', notif.id);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium cursor-pointer transition-colors"
                                >
                                  Dismiss
                                </button>
                              </div>
                              <div className="pt-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReminderAction?.(notif.applicationId || '', 'complete', notif.id);
                                  }}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                >
                                  ✓ I completed my application
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth Actions per Part A & B */}
            {currentUser ? (
              <>
                <div 
                  className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors"
                  onClick={() => onSelectTab('profile')}
                  title="View your profile"
                  id="user-profile-widget"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1 leading-tight">
                      <span className="truncate max-w-[150px]">{displayName}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                      Entrepreneur
                    </div>
                  </div>
                </div>

                <button
                  id="user-logout-btn"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-600" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="header-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
                <button
                  id="header-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                  <span>Create Account</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="xl:hidden flex overflow-x-auto py-2.5 space-x-2 border-t border-slate-100 text-xs no-scrollbar">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'home' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth('auth_for_browse');
              } else {
                onSelectTab('find-schemes');
              }
            }}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'find-schemes' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Schemes</span>
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth('login');
              } else {
                onSelectTab('profile');
              }
            }}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth('login');
              } else {
                onSelectTab('applications');
              }
            }}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'applications' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Applications</span>
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth('login');
              } else {
                onSelectTab('saved');
              }
            }}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'saved' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>
          <button
            onClick={() => onSelectTab('help')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'help' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </button>
        </div>
      </div>
    </header>
  );
};
