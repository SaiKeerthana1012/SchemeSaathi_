import React, { useState, useMemo, useEffect } from 'react';
import { 
  Language, 
  UserAccount, 
  UserProfile, 
  SavedSchemeItem, 
  DemoApplication, 
  SchemeMatchResult, 
  Scheme, 
  ApplicationStatus,
  AppNotification,
  NotificationType
} from './types';
import { StorageService } from './services/storage';
import { matchSchemesForProfile } from './services/matchingEngine';
import { SCHEMES_DATABASE } from './data/schemes';
import { getSafePortalUrl, openOfficialPortal } from './utils/portalLink';
import { 
  onFirebaseAuthStateChanged, 
  firebaseLogout, 
  fetchSchemesFromFirestore,
  checkFirestoreSchemesStatus,
  saveUserProfileToFirestore, 
  getUserProfileFromFirestore, 
  getSavedSchemesFromFirestore, 
  saveSchemeToFirestore, 
  removeSavedSchemeFromFirestore, 
  getApplicationsFromFirestore, 
  saveApplicationToFirestore,
  getNotificationsFromFirestore,
  saveNotificationToFirestore,
  markNotificationAsReadInFirestore,
  markAllNotificationsAsReadInFirestore
} from './services/firebase';

import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ProfileForm } from './components/ProfileForm';
import { RecommendedSchemes } from './components/RecommendedSchemes';
import { SchemeDetailsModal } from './components/SchemeDetailsModal';
import { SavedSchemesView } from './components/SavedSchemesView';
import { ApplicationGuideView } from './components/ApplicationGuideView';
import { MyApplicationsView } from './components/MyApplicationsView';
import { HelpView } from './components/HelpView';
import { AuthModal, AuthModalMode } from './components/AuthModal';
import { FirestoreSeedModal } from './components/FirestoreSeedModal';
import { SaathiChatbot } from './components/SaathiChatbot';
import { Footer } from './components/Footer';

export default function App() {
  // Navigation & Language State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [schemeDirectoryTab, setSchemeDirectoryTab] = useState<'all' | 'recommended'>('all');
  const [language, setLanguage] = useState<Language>('en');

  // Schemes from Firestore (with initial fallback to baseline database)
  const [schemes, setSchemes] = useState<Scheme[]>(SCHEMES_DATABASE);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => StorageService.getCurrentUser());
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: AuthModalMode;
    pendingScheme?: { id: string; name: string } | null;
  }>({
    isOpen: false,
    mode: 'login',
    pendingScheme: null
  });

  // User Profile State (isolated per user)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const user = StorageService.getCurrentUser();
    return user ? StorageService.getUserProfile(user.id) : null;
  });

  // Saved Schemes & Applications (isolated per user)
  const [savedSchemes, setSavedSchemes] = useState<SavedSchemeItem[]>(() => {
    const user = StorageService.getCurrentUser();
    return user ? StorageService.getSavedSchemes(user.id) : [];
  });

  const [applications, setApplications] = useState<DemoApplication[]>(() => {
    const user = StorageService.getCurrentUser();
    return user ? StorageService.getApplications(user.id) : [];
  });

  // Persistent User Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const user = StorageService.getCurrentUser();
    return user ? StorageService.getNotifications(user.id) : [];
  });

  // Active scheme and application context for guide & tracking
  const [activeScheme, setActiveScheme] = useState<Scheme | null>(null);
  const [activeApplication, setActiveApplication] = useState<DemoApplication | null>(null);

  // Notification creation helper (persisted to Firestore & local storage)
  const triggerNotification = async (
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    applicationId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      message,
      type,
      applicationId,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    StorageService.saveNotification(userId, newNotif);
    setNotifications(StorageService.getNotifications(userId));

    try {
      await saveNotificationToFirestore(userId, newNotif);
    } catch (err) {
      console.warn('Firestore save notification fallback to local:', err);
    }
  };

  const handleMarkNotificationAsRead = async (notifId: string) => {
    if (!currentUser) return;
    StorageService.markNotificationAsRead(currentUser.id, notifId);
    setNotifications(StorageService.getNotifications(currentUser.id));
    try {
      await markNotificationAsReadInFirestore(currentUser.id, notifId);
    } catch (err) {
      console.warn('Firestore mark read fallback to local:', err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    StorageService.markAllNotificationsAsRead(currentUser.id);
    setNotifications(StorageService.getNotifications(currentUser.id));
    try {
      await markAllNotificationsAsReadInFirestore(currentUser.id);
    } catch (err) {
      console.warn('Firestore mark all read fallback to local:', err);
    }
  };

  // Details Modal State
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [selectedSchemeMatch, setSelectedSchemeMatch] = useState<SchemeMatchResult | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cloud Firestore Schemes Status
  const [firestoreStatus, setFirestoreStatus] = useState<{
    checked: boolean;
    count: number;
    isPopulated: boolean;
    loading: boolean;
    error?: string;
  }>({
    checked: false,
    count: 0,
    isPopulated: false,
    loading: true
  });
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  const checkFirestoreDatabase = async () => {
    setFirestoreStatus(prev => ({ ...prev, loading: true }));
    try {
      const status = await checkFirestoreSchemesStatus();
      setFirestoreStatus({
        checked: true,
        count: status.count,
        isPopulated: status.isPopulated,
        loading: false,
        error: status.error
      });
      if (status.schemes.length > 0) {
        setSchemes(status.schemes);
        if (status.isPopulated && status.count >= 50) {
          showToast(`Loaded all ${status.count} schemes directly from Cloud Firestore!`);
        }
      }
    } catch (err: any) {
      setFirestoreStatus({
        checked: true,
        count: 0,
        isPopulated: false,
        loading: false,
        error: err?.message || String(err)
      });
    }
  };

  // 1. Check Cloud Firestore status & action links on mount
  useEffect(() => {
    checkFirestoreDatabase();

    // Check if user opened the page from a password reset email link
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const modeParam = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');
      if (modeParam === 'resetPassword' && oobCode) {
        setAuthModalState({
          isOpen: true,
          mode: 'reset_password',
          pendingScheme: null
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Attach Firebase Auth listener for persistent sessions across page reloads
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        StorageService.saveUserAccount(user);
        StorageService.setCurrentUser(user);

        // Fetch User Profile from Firestore
        try {
          const firestoreProfile = await getUserProfileFromFirestore(user.id);
          if (firestoreProfile) {
            setUserProfile(firestoreProfile);
            StorageService.saveUserProfile(user.id, firestoreProfile);
          } else {
            const localProfile = StorageService.getUserProfile(user.id);
            if (localProfile) {
              setUserProfile(localProfile);
              saveUserProfileToFirestore(user.id, localProfile).catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Firestore profile sync notice:', err);
        }

        // Fetch Saved Schemes from Firestore
        try {
          const firestoreSaved = await getSavedSchemesFromFirestore(user.id);
          if (firestoreSaved && firestoreSaved.length > 0) {
            setSavedSchemes(firestoreSaved);
          } else {
            setSavedSchemes(StorageService.getSavedSchemes(user.id));
          }
        } catch (err) {
          console.warn('Firestore saved schemes sync notice:', err);
        }

        // Fetch Applications from Firestore
        try {
          const firestoreApps = await getApplicationsFromFirestore(user.id);
          if (firestoreApps && firestoreApps.length > 0) {
            setApplications(firestoreApps);
          } else {
            setApplications(StorageService.getApplications(user.id));
          }
        } catch (err) {
          console.warn('Firestore applications sync notice:', err);
        }

        // Fetch Notifications from Firestore
        try {
          const firestoreNotifs = await getNotificationsFromFirestore(user.id);
          if (firestoreNotifs && firestoreNotifs.length > 0) {
            setNotifications(firestoreNotifs);
            StorageService.setNotifications(user.id, firestoreNotifs);
          } else {
            setNotifications(StorageService.getNotifications(user.id));
          }
        } catch (err) {
          console.warn('Firestore notifications sync notice:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Synchronize state on user login / switch / logout
  const handleUserChange = (user: UserAccount | null) => {
    setCurrentUser(user);
    if (user) {
      const p = StorageService.getUserProfile(user.id);
      setUserProfile(p);
      setSavedSchemes(StorageService.getSavedSchemes(user.id));
      setApplications(StorageService.getApplications(user.id));
      setNotifications(StorageService.getNotifications(user.id));

      // Asynchronously synchronize with Firestore
      getApplicationsFromFirestore(user.id).then(remoteApps => {
        if (remoteApps && remoteApps.length > 0) {
          setApplications(remoteApps);
        }
      }).catch(() => {});

      getSavedSchemesFromFirestore(user.id).then(remoteSaved => {
        if (remoteSaved && remoteSaved.length > 0) {
          setSavedSchemes(remoteSaved);
        }
      }).catch(() => {});

      getNotificationsFromFirestore(user.id).then(remoteNotifs => {
        if (remoteNotifs && remoteNotifs.length > 0) {
          setNotifications(remoteNotifs);
          StorageService.setNotifications(user.id, remoteNotifs);
        }
      }).catch(() => {});

      showToast(`Logged in as ${user.name}`);
    } else {
      setUserProfile(null);
      setSavedSchemes([]);
      setApplications([]);
      setNotifications([]);
      setActiveApplication(null);
      setActiveScheme(null);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.warn('Firebase logout notice:', err);
    }
    StorageService.logout();
    handleUserChange(null);
    setCurrentTab('home');
    setSchemeDirectoryTab('all');
    showToast('Logged out successfully. You are now browsing as a guest.');
  };

  // Open Auth Modal with custom mode and context
  const handleOpenAuth = (
    mode: AuthModalMode = 'login', 
    pendingScheme: { id: string; name: string } | null = null
  ) => {
    setAuthModalState({
      isOpen: true,
      mode,
      pendingScheme
    });
  };

  // Handle successful login with post-login redirect (Requirement 8)
  const handleLoginSuccess = (
    user: UserAccount,
    mode?: AuthModalMode,
    pendingScheme?: { id: string; name: string } | null
  ) => {
    handleUserChange(user);

    if (mode === 'auth_for_apply' && pendingScheme) {
      const scheme = schemes.find(s => s.id === pendingScheme.id);
      if (scheme) {
        // Return user to the same scheme details or open application guide
        const profile = StorageService.getUserProfile(user.id);
        const profileSnapshot = profile ? {
          fullName: profile.personal.fullName,
          socialCategory: profile.personal.socialCategory,
          enterpriseType: profile.business.enterpriseType,
          businessStatus: profile.business.businessStatus,
          estimatedInvestment: profile.business.estimatedInvestment || profile.business.currentInvestment
        } : undefined;

        const portalUrlInfo = getSafePortalUrl(scheme.officialApplicationUrl);
        const newApp = StorageService.createApplication(user.id, scheme.id, scheme.name, portalUrlInfo.url || scheme.officialApplicationUrl, profileSnapshot);
        setApplications(StorageService.getApplications(user.id));
        saveApplicationToFirestore(user.id, newApp).catch(() => {});
        setActiveScheme(scheme);
        setActiveApplication(newApp);
        setSelectedScheme(scheme);

        if (newApp) {
          triggerNotification(
            user.id,
            'Application Initiated',
            `Application initiated successfully for ${scheme.shortName || scheme.name}.`,
            'application_initiated',
            newApp.id
          );
        }

        // Open official application portal in a new tab
        if (portalUrlInfo.isValid && portalUrlInfo.url) {
          openOfficialPortal(portalUrlInfo.url);
        }

        setCurrentTab('applications');
        showToast(`Signed in! Application record created for ${scheme.shortName}: initial status "Application Started" (Saved to Firestore)`);
        return;
      }
    }

    if (mode === 'auth_for_save' && pendingScheme) {
      const scheme = schemes.find(s => s.id === pendingScheme.id);
      if (scheme) {
        StorageService.saveScheme(user.id, scheme.id, scheme.name);
        setSavedSchemes(StorageService.getSavedSchemes(user.id));
        saveSchemeToFirestore(user.id, scheme.id, scheme.name).catch(() => {});
        showToast(`Saved "${scheme.shortName}" to your bookmarks`);
        return;
      }
    }

    if (mode === 'auth_for_browse') {
      setSchemeDirectoryTab('all');
      setCurrentTab('find-schemes');
      showToast('Signed in! Welcome to Browse Schemes.');
      return;
    }

    if (mode === 'auth_for_matching') {
      const profile = StorageService.getUserProfile(user.id);
      if (profile) {
        setSchemeDirectoryTab('recommended');
        setCurrentTab('find-schemes');
        showToast('Signed in! Viewing your matched schemes.');
      } else {
        setCurrentTab('profile');
        showToast('Signed in! Please fill out your profile to view recommendations.');
      }
      return;
    }

    if (mode === 'auth_for_chatbot') {
      showToast('Signed in! Saathi AI personalized features are now active.');
      return;
    }

    // Default flow
    if (currentTab === 'home') {
      setCurrentTab('home');
    }
  };

  // Navigation Guard: restrict private routes to logged-in users (Requirement 2 & 22)
  const handleSelectTab = (tab: string, initialSchemeTab?: 'all' | 'recommended') => {
    if (initialSchemeTab) {
      setSchemeDirectoryTab(initialSchemeTab);
    }

    const privateTabs = ['profile', 'applications', 'saved', 'find-schemes'];
    if (privateTabs.includes(tab) && !currentUser) {
      const targetMode: AuthModalMode = 
        tab === 'find-schemes' && (initialSchemeTab === 'all' || schemeDirectoryTab === 'all')
          ? 'auth_for_browse'
          : 'auth_for_matching';
      handleOpenAuth(targetMode);
      return;
    }

    setCurrentTab(tab);
  };

  // Run matching engine whenever user profile updates
  const matchResults = useMemo<SchemeMatchResult[]>(() => {
    if (userProfile) {
      return matchSchemesForProfile(userProfile, schemes);
    }
    return [];
  }, [userProfile, schemes]);

  const savedSchemeIds = useMemo(() => {
    return new Set(savedSchemes.map(s => s.schemeId));
  }, [savedSchemes]);

  // Profile Save Action
  const handleSaveProfile = async (profile: UserProfile) => {
    if (!currentUser) {
      handleOpenAuth('auth_for_matching');
      return;
    }
    StorageService.saveUserProfile(currentUser.id, profile);
    setUserProfile(profile);
    try {
      await saveUserProfileToFirestore(currentUser.id, profile);
    } catch (err) {
      console.warn('Firestore profile save synced to local storage:', err);
    }
    showToast('Profile saved successfully! Matching schemes updated.');
    setSchemeDirectoryTab('recommended');
    setCurrentTab('find-schemes');
  };

  // Save / Unsave Scheme Action
  const handleToggleSaveScheme = async (scheme: Scheme) => {
    if (!currentUser) {
      handleOpenAuth('auth_for_save', { id: scheme.id, name: scheme.name });
      return;
    }

    const uid = currentUser.id;
    const isSaved = savedSchemeIds.has(scheme.id);

    if (isSaved) {
      StorageService.removeSavedScheme(uid, scheme.id);
      setSavedSchemes(StorageService.getSavedSchemes(uid));
      try {
        await removeSavedSchemeFromFirestore(uid, scheme.id);
      } catch (err) {
        console.warn('Firestore remove saved synced to local storage:', err);
      }
      showToast(`Removed "${scheme.shortName}" from Saved Schemes`);
    } else {
      StorageService.saveScheme(uid, scheme.id, scheme.name);
      setSavedSchemes(StorageService.getSavedSchemes(uid));
      try {
        await saveSchemeToFirestore(uid, scheme.id, scheme.name);
      } catch (err) {
        console.warn('Firestore save scheme synced to local storage:', err);
      }
      showToast(`Saved "${scheme.shortName}" to your bookmarks`);
    }
  };

  // Start Application Action (Requirement 4 & 8)
  const handleStartApplication = async (scheme: Scheme) => {
    // Open verified official portal immediately and synchronously within click event
    const portalUrlInfo = getSafePortalUrl(scheme.officialApplicationUrl);
    if (portalUrlInfo.isValid && portalUrlInfo.url) {
      openOfficialPortal(portalUrlInfo.url);
    }

    if (!currentUser) {
      handleOpenAuth('auth_for_apply', { id: scheme.id, name: scheme.name });
      return;
    }

    const uid = currentUser.id;
    const profileSnapshot = userProfile ? {
      fullName: userProfile.personal.fullName,
      socialCategory: userProfile.personal.socialCategory,
      enterpriseType: userProfile.business.enterpriseType,
      businessStatus: userProfile.business.businessStatus,
      estimatedInvestment: userProfile.business.estimatedInvestment || userProfile.business.currentInvestment
    } : undefined;

    // Automatically create application with initial status "Application Started"
    const newApp = StorageService.createApplication(
      uid, 
      scheme.id, 
      scheme.name, 
      portalUrlInfo.url || scheme.officialApplicationUrl,
      profileSnapshot
    );
    setApplications(StorageService.getApplications(uid));
    try {
      await saveApplicationToFirestore(uid, newApp);
    } catch (err) {
      console.warn('Firestore save application synced to local storage:', err);
    }
    setActiveScheme(scheme);
    setActiveApplication(newApp);

    if (newApp) {
      await triggerNotification(
        uid,
        'Application Initiated',
        `Application initiated successfully for ${scheme.shortName || scheme.name}.`,
        'application_initiated',
        newApp.id
      );
    }

    setCurrentTab('applications');
    showToast(`Application record created for ${scheme.shortName}: initial status "Application Started" (Saved to Firestore)`);
  };

  // Record application from official redirect (Requirement 4 & 5)
  const handleRecordApplication = async (scheme: Scheme) => {
    if (!currentUser) return;
    const profileSnapshot = userProfile ? {
      fullName: userProfile.personal.fullName,
      socialCategory: userProfile.personal.socialCategory,
      enterpriseType: userProfile.business.enterpriseType,
      businessStatus: userProfile.business.businessStatus,
      estimatedInvestment: userProfile.business.estimatedInvestment || userProfile.business.currentInvestment
    } : undefined;

    const portalUrlInfo = getSafePortalUrl(scheme.officialApplicationUrl);
    const newApp = StorageService.createApplication(
      currentUser.id,
      scheme.id,
      scheme.name,
      portalUrlInfo.url || scheme.officialApplicationUrl,
      profileSnapshot
    );
    setApplications(StorageService.getApplications(currentUser.id));
    try {
      await saveApplicationToFirestore(currentUser.id, newApp);
    } catch (err) {
      console.warn('Firestore record application synced to local storage:', err);
    }
    setActiveApplication(newApp);
    setActiveScheme(scheme);

    if (newApp) {
      await triggerNotification(
        currentUser.id,
        'Application Initiated',
        `Application initiated successfully for ${scheme.shortName || scheme.name}.`,
        'application_initiated',
        newApp.id
      );
    }

    setCurrentTab('applications');
    showToast(`Recorded application for ${scheme.shortName}: initial status "Application Started" (Saved to Firestore)`);
  };

  // Update Application custom fields (Requirement 10)
  const handleUpdateAppDetails = async (appId: string, updates: Partial<DemoApplication>) => {
    if (!currentUser) return;
    const currentApp = applications.find(a => a.id === appId);
    const oldStatus = currentApp?.status;

    const updated = StorageService.updateApplication(currentUser.id, appId, updates);
    if (updated) {
      setApplications(StorageService.getApplications(currentUser.id));
      try {
        await saveApplicationToFirestore(currentUser.id, updated);
      } catch (err) {
        console.warn('Firestore update application details synced to local storage:', err);
      }

      // Requirement 4: Whenever the application's REAL status changes in the backend, create a notification.
      if (updates.status && oldStatus && updates.status !== oldStatus) {
        await triggerNotification(
          currentUser.id,
          `Status Update: ${updated.schemeName}`,
          `Your application (${updated.id}) status has changed to "${updates.status}".`,
          'status_change',
          updated.id
        );
      }

      showToast('Updated official application record');
    }
  };

  // Add Manual Application (Requirement 10)
  const handleAddUserApplication = async (data: {
    schemeName: string;
    userEnteredApplicationId: string;
    officialPortal: string;
    date: string;
    status?: ApplicationStatus;
    notes?: string;
  }) => {
    if (!currentUser) return;
    const newApp = StorageService.saveUserEnteredApplication(currentUser.id, data);
    setApplications(StorageService.getApplications(currentUser.id));
    try {
      await saveApplicationToFirestore(currentUser.id, newApp);
    } catch (err) {
      console.warn('Firestore manual application synced to local storage:', err);
    }
    showToast('External application recorded with initial status "Application Started" (Saved to Firestore)');
  };

  // Open Scheme Details helper
  const handleOpenSchemeDetails = (scheme: Scheme, matchResult?: SchemeMatchResult | null) => {
    setSelectedScheme(scheme);
    if (matchResult) {
      setSelectedSchemeMatch(matchResult);
    } else {
      const match = matchResults.find(r => r.scheme.id === scheme.id);
      setSelectedSchemeMatch(match || null);
    }
  };

  const handleViewDetailsById = (schemeId: string) => {
    const scheme = schemes.find(s => s.id === schemeId);
    if (scheme) {
      const match = matchResults.find(r => r.scheme.id === schemeId);
      handleOpenSchemeDetails(scheme, match || null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900" id="schemesaathi-root-app">
      {/* Main Header with text-only logo "SchemeSaathi", language selector, and navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        language={language}
        onSelectLanguage={setLanguage}
        currentUser={currentUser}
        onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
        onLogout={handleLogout}
        savedCount={savedSchemes.length}
        appsCount={applications.length}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        firestoreStatus={firestoreStatus}
      />

      {/* Cloud Firestore Status Banner */}
      {firestoreStatus.checked && !firestoreStatus.isPopulated && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900" id="firestore-status-notice">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-semibold">Cloud Firestore Status:</span>
              <span>
                Collection <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">schemes</code> contains <strong>{firestoreStatus.count}</strong> / 20 documents.
                Client writes are blocked by security rules (<code className="font-mono">allow write: if false;</code>).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsSeedModalOpen(true)}
                className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded font-medium shadow-xs transition-colors cursor-pointer"
                id="btn-view-seed-guide"
              >
                One-Time Seed Instructions
              </button>
              <button
                onClick={checkFirestoreDatabase}
                disabled={firestoreStatus.loading}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded font-medium transition-colors cursor-pointer disabled:opacity-50"
                id="btn-refresh-firestore"
              >
                {firestoreStatus.loading ? 'Checking...' : 'Check Firestore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {firestoreStatus.checked && firestoreStatus.isPopulated && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-xs text-emerald-900" id="firestore-status-active">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-semibold">Cloud Firestore Live:</span>
              <span>All <strong>{firestoreStatus.count} schemes</strong> ({firestoreStatus.count} documents) verified and loaded from Firestore collection <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">schemes</code>.</span>
            </div>
            <button
              onClick={checkFirestoreDatabase}
              disabled={firestoreStatus.loading}
              className="text-emerald-700 hover:text-emerald-900 font-medium underline ml-2 cursor-pointer"
              id="btn-recheck-firestore"
            >
              {firestoreStatus.loading ? 'Syncing...' : 'Sync Check'}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div 
          className="fixed bottom-5 right-5 z-50 bg-blue-950 text-white text-xs px-4 py-3 rounded-md shadow-lg border border-blue-800 flex items-center gap-3 animate-slideUp"
          id="system-toast-alert"
        >
          <span className="text-emerald-400 font-bold text-sm">✓</span>
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white font-bold ml-2 cursor-pointer"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            language={language}
            onNavigate={handleSelectTab}
            userProfile={userProfile}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'profile' && currentUser && (
          <ProfileForm
            language={language}
            initialProfile={userProfile}
            onSaveProfile={handleSaveProfile}
            onCancel={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'find-schemes' && (
          <RecommendedSchemes
            language={language}
            currentUser={currentUser}
            userProfile={userProfile}
            allSchemes={schemes}
            matchResults={matchResults}
            savedSchemeIds={savedSchemeIds}
            onToggleSaveScheme={handleToggleSaveScheme}
            onViewDetails={handleOpenSchemeDetails}
            onApply={handleStartApplication}
            onEditProfile={() => setCurrentTab('profile')}
            onOpenAuth={handleOpenAuth}
            initialTab={schemeDirectoryTab}
          />
        )}

        {currentTab === 'saved' && currentUser && (
          <SavedSchemesView
            language={language}
            savedSchemes={savedSchemes}
            onRemoveSaved={(id) => {
              StorageService.removeSavedScheme(currentUser.id, id);
              setSavedSchemes(StorageService.getSavedSchemes(currentUser.id));
              showToast('Removed from Saved Schemes');
            }}
            onViewDetailsById={handleViewDetailsById}
            onBrowseSchemes={() => {
              setSchemeDirectoryTab('all');
              setCurrentTab('find-schemes');
            }}
          />
        )}

        {currentTab === 'guide' && (
          <ApplicationGuideView
            language={language}
            activeScheme={activeScheme}
            activeApplication={activeApplication}
            onBrowseSchemes={() => {
              setSchemeDirectoryTab('all');
              setCurrentTab('find-schemes');
            }}
            onViewApplications={() => setCurrentTab('applications')}
          />
        )}

        {currentTab === 'applications' && currentUser && (
          <MyApplicationsView
            language={language}
            applications={applications}
            onUpdateAppDetails={handleUpdateAppDetails}
            onAddUserApplication={handleAddUserApplication}
            onBrowseSchemes={() => {
              setSchemeDirectoryTab('all');
              setCurrentTab('find-schemes');
            }}
            onViewDetailsById={handleViewDetailsById}
          />
        )}

        {currentTab === 'help' && (
          <HelpView
            language={language}
            onViewSchemeDetailsById={handleViewDetailsById}
          />
        )}
      </main>

      {/* Scheme Details Modal */}
      {selectedScheme && (
        <SchemeDetailsModal
          language={language}
          scheme={selectedScheme}
          matchResult={selectedSchemeMatch}
          isSaved={savedSchemeIds.has(selectedScheme.id)}
          onClose={() => {
            setSelectedScheme(null);
            setSelectedSchemeMatch(null);
          }}
          onToggleSave={() => handleToggleSaveScheme(selectedScheme)}
          onOpenGuide={() => {
            setActiveScheme(selectedScheme);
            setCurrentTab('guide');
          }}
          onApply={() => handleStartApplication(selectedScheme)}
          userProfile={userProfile}
          isLoggedIn={currentUser !== null}
          onOpenAuthForApply={() => handleOpenAuth('auth_for_apply', { id: selectedScheme.id, name: selectedScheme.name })}
          onRecordApplication={handleRecordApplication}
        />
      )}

      {/* Auth Modal with Contextual Modes */}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
        language={language}
        mode={authModalState.mode}
        pendingScheme={authModalState.pendingScheme}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Cloud Firestore One-Time Seed Guide Modal */}
      <FirestoreSeedModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        count={firestoreStatus.count}
        onCheckAgain={checkFirestoreDatabase}
        isChecking={firestoreStatus.loading}
      />

      {/* Floating Saathi AI Chatbot (Requirements 3 - 19) */}
      <SaathiChatbot
        language={language}
        currentUser={currentUser}
        userProfile={userProfile}
        applications={applications}
        onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
        onViewSchemeDetails={(scheme) => setSelectedScheme(scheme)}
        onApplyScheme={(scheme) => handleStartApplication(scheme)}
        onSaveScheme={(scheme) => handleToggleSaveScheme(scheme)}
        onNavigateToTab={(tab) => handleSelectTab(tab)}
      />

      {/* Footer */}
      <Footer onNavigate={handleSelectTab} />
    </div>
  );
}
