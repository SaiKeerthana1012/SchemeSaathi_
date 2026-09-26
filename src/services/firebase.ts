import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  Auth,
  sendPasswordResetEmail,
  updatePassword,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';

import appletConfig from '../../firebase-applet-config.json';
import { UserAccount, UserProfile, SavedSchemeItem, DemoApplication, ApplicationStatus, Scheme, AppNotification } from '../types';
import { SCHEMES_DATABASE, transformRawCsvToScheme, RawCsvScheme } from '../data/schemes';

// Error handling according to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth;
  const currentUser = currentAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Configuration resolving
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // fallback
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || appletConfig.apiKey || '',
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || appletConfig.authDomain || 'schemesaathi-f16c9.firebaseapp.com',
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || appletConfig.projectId || 'schemesaathi-f16c9',
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || appletConfig.storageBucket || 'schemesaathi-f16c9.firebasestorage.app',
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || appletConfig.messagingSenderId || '',
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || appletConfig.appId || '',
};

let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let isFirebaseAvailable = false;
export let firebaseInitError: string | null = null;

// Initialize Firebase SDK defensively
try {
  if (firebaseConfig.projectId) {
    if (!getApps().length) {
      // If no apiKey is set, provide a dummy key format so initializeApp doesn't throw synchronously
      const initConfig = {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey || 'AIzaSyDummyKeyForSchemeSaathiInit'
      };
      app = initializeApp(initConfig);
    } else {
      app = getApps()[0];
    }
    
    if (app) {
      auth = getAuth(app);
      const configuredDbId = getEnvVar('VITE_FIRESTORE_DATABASE_ID') || (appletConfig as any)?.firestoreDatabaseId;
      // Connect to the (default) database where schemes and user data collections reside
      const customDbId = (configuredDbId && configuredDbId !== '(default)' && !configuredDbId.startsWith('ai-studio-schemesaathi-'))
        ? configuredDbId
        : undefined;
      const settings = {
        experimentalAutoDetectLongPolling: true
      };
      try {
        db = customDbId 
          ? initializeFirestore(app, settings, customDbId) 
          : initializeFirestore(app, settings);
      } catch {
        db = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
      }
      isFirebaseAvailable = true;
    }
  }
} catch (err: any) {
  console.warn('Firebase initialization notice:', err?.message || err);
  firebaseInitError = err?.message || String(err);
}

// Validate connection to Firestore as mandated by skill
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore notice: client is offline or database is provisioning.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// FIREBASE AUTHENTICATION SERVICES
// -------------------------------------------------------------

export async function firebaseRegister(name: string, email: string, password?: string): Promise<UserAccount> {
  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedName = name.trim();
  const pass = password || '';

  if (!pass) {
    throw new Error('Password is required.');
  }

  if (pass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  if (!auth || !isFirebaseAvailable) {
    throw new Error('Firebase Auth is not initialized. Check your Firebase credentials.');
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, sanitizedEmail, pass);
    if (cred.user) {
      if (sanitizedName) {
        try {
          await updateProfile(cred.user, { displayName: sanitizedName });
        } catch {
          // ignore display name update failure
        }
      }
      
      const userAccount: UserAccount = {
        id: cred.user.uid,
        name: sanitizedName || cred.user.displayName || 'Entrepreneur',
        email: sanitizedEmail
      };

      // Save user to 'users' collection in Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'users', cred.user.uid), {
            id: cred.user.uid,
            name: sanitizedName,
            email: sanitizedEmail,
            createdAt: new Date().toISOString(),
            role: 'entrepreneur'
          });
        } catch (dbErr) {
          console.warn('Could not save user metadata to Firestore:', dbErr);
        }
      }

      return userAccount;
    }
    throw new Error('Failed to register user.');
  } catch (error: any) {
    const code = error?.code || '';

    if (code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please login.');
    }

    if (code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }

    if (code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters.');
    }

    if (code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password registration is disabled in your Firebase console for project schemesaathi-f16c9. Please enable Email/Password provider in the Firebase Console under Authentication > Sign-in method, or sign in with Google.');
    }

    throw new Error(error?.message || 'Failed to register with Firebase.');
  }
}

export async function firebaseLogin(email: string, password?: string): Promise<UserAccount> {
  const sanitizedEmail = email.trim().toLowerCase();
  const pass = password || '';

  if (!pass) {
    throw new Error('Please enter your password.');
  }

  if (!auth || !isFirebaseAvailable) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, sanitizedEmail, pass);
    return {
      id: cred.user.uid,
      name: cred.user.displayName || sanitizedEmail.split('@')[0],
      email: cred.user.email || sanitizedEmail
    };
  } catch (error: any) {
    const code = error?.code || '';

    if (code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }

    if (code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please register first.');
    }

    if (code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again or use Forgot Password to reset it.');
    }

    if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
      throw new Error('Incorrect password or no account found with this email. Please check your credentials or use Forgot Password.');
    }

    if (code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    }

    if (code === 'auth/too-many-requests') {
      throw new Error('Access temporarily disabled due to many failed login attempts. Please try again later.');
    }

    if (code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password sign-in is disabled in your Firebase console for project schemesaathi-f16c9. Please enable Email/Password provider in the Firebase Console under Authentication > Sign-in method, or sign in with Google.');
    }

    throw new Error(error?.message || 'Failed to sign in with Firebase.');
  }
}

export async function firebaseLoginWithGoogle(): Promise<UserAccount> {
  if (!auth || !isFirebaseAvailable) {
    throw new Error('Firebase Auth is not initialized.');
  }

  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    const userAccount: UserAccount = {
      id: cred.user.uid,
      name: cred.user.displayName || 'Google User',
      email: cred.user.email || ''
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          id: cred.user.uid,
          name: userAccount.name,
          email: userAccount.email,
          createdAt: new Date().toISOString(),
          role: 'entrepreneur'
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Could not update google user metadata in Firestore:', dbErr);
      }
    }

    return userAccount;
  } catch (error: any) {
    throw error;
  }
}

export async function firebaseLogout(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export function onFirebaseAuthStateChanged(callback: (user: UserAccount | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const user: UserAccount = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (firebaseUser.phoneNumber ? `User ${firebaseUser.phoneNumber.slice(-4)}` : 'Entrepreneur'),
        email: firebaseUser.email || `${firebaseUser.phoneNumber || firebaseUser.uid}@phone.schemesaathi.gov`,
        phone: firebaseUser.phoneNumber || undefined
      };
      callback(user);
    } else {
      callback(null);
    }
  });
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  const input = email.trim().toLowerCase();
  if (!input) {
    throw new Error('Please enter your registered email address.');
  }

  if (!auth || !isFirebaseAvailable) {
    throw new Error('Firebase Auth is not initialized.');
  }

  try {
    await sendPasswordResetEmail(auth, input);
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/user-not-found') {
      throw new Error('No registered account found with this email address.');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many password reset attempts. Please wait a few minutes before trying again.');
    }
    throw new Error(error?.message || 'Failed to send password reset email.');
  }
}

export async function firebaseVerifyPasswordResetCode(oobCode: string): Promise<string> {
  if (!auth || !isFirebaseAvailable) {
    throw new Error('Firebase Auth is not initialized.');
  }
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return email;
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/expired-action-code') {
      throw new Error('The password reset link has expired. Please request a new reset email.');
    }
    if (code === 'auth/invalid-action-code') {
      throw new Error('The password reset link is invalid or has already been used. Please request a new reset email.');
    }
    if (code === 'auth/user-not-found') {
      throw new Error('No registered account found associated with this reset link.');
    }
    throw new Error(error?.message || 'Failed to verify password reset code. Please request a new reset email.');
  }
}

export async function firebaseConfirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
  if (!auth || !isFirebaseAvailable) {
    throw new Error('Firebase Auth is not initialized.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/expired-action-code') {
      throw new Error('The password reset link has expired. Please request a new reset email.');
    }
    if (code === 'auth/invalid-action-code') {
      throw new Error('The password reset link is invalid or has already been used. Please request a new reset email.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters.');
    }
    if (code === 'auth/user-not-found') {
      throw new Error('No registered account found associated with this reset link.');
    }
    throw new Error(error?.message || 'Failed to reset password. Please request a new reset email.');
  }
}

export async function firebaseUpdateUserPassword(newPassword: string): Promise<void> {
  if (!auth?.currentUser) {
    throw new Error('User must be signed in to reset password.');
  }
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  try {
    await updatePassword(auth.currentUser, newPassword);
  } catch (error: any) {
    if (error?.code === 'auth/requires-recent-login') {
      throw new Error('Security check: Please log in again or re-verify OTP before setting a new password.');
    }
    throw new Error(error?.message || 'Failed to update password.');
  }
}

// -------------------------------------------------------------
// CLOUD FIRESTORE SCHEMES SERVICES
// -------------------------------------------------------------
// CLOUD FIRESTORE SCHEMES SERVICES
// -------------------------------------------------------------

export interface FirestoreSchemesResult {
  schemes: Scheme[];
  count: number;
  isPopulated: boolean;
  docIds: string[];
  error?: string;
}

export async function checkFirestoreSchemesStatus(): Promise<FirestoreSchemesResult> {
  if (!db) {
    return {
      schemes: SCHEMES_DATABASE,
      count: 0,
      isPopulated: false,
      docIds: [],
      error: 'Firestore not initialized'
    };
  }

  const path = 'schemes';
  try {
    const fetchPromise = getDocs(collection(db, path));
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore request timed out (offline mode)')), 6000)
    );
    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    const docIds: string[] = [];
    const schemes: Scheme[] = [];

    snapshot.forEach(docSnap => {
      docIds.push(docSnap.id);
      const data = docSnap.data() as any;
      if (data.schemeId && data.schemeName) {
        // Raw CSV field schema or enriched
        schemes.push(transformRawCsvToScheme(data as RawCsvScheme));
      } else {
        schemes.push(data as Scheme);
      }
    });

    // Sort by schemeId (SS-0001, SS-0002, ...)
    schemes.sort((a, b) => (a.schemeId || a.id || '').localeCompare(b.schemeId || b.id || ''));

    // Ensure all 50 schemes are accessible by supplementing any missing schemes from SCHEMES_DATABASE
    if (schemes.length < SCHEMES_DATABASE.length) {
      const existingIdSet = new Set(schemes.map(s => s.schemeId || s.id));
      for (const fallbackScheme of SCHEMES_DATABASE) {
        if (!existingIdSet.has(fallbackScheme.schemeId || fallbackScheme.id)) {
          schemes.push(fallbackScheme);
        }
      }
      schemes.sort((a, b) => (a.schemeId || a.id || '').localeCompare(b.schemeId || b.id || ''));
    }

    return {
      schemes,
      count: snapshot.size,
      isPopulated: snapshot.size >= 50,
      docIds
    };
  } catch (err: any) {
    console.warn('Notice: Firestore schemes fetch operating in offline/fallback mode:', err?.message || err);
    return {
      schemes: SCHEMES_DATABASE,
      count: 0,
      isPopulated: false,
      docIds: [],
      error: err?.message || String(err)
    };
  }
}

export async function fetchSchemesFromFirestore(): Promise<Scheme[]> {
  const result = await checkFirestoreSchemesStatus();
  return result.schemes;
}

// -------------------------------------------------------------
// CLOUD FIRESTORE USER PROFILE SERVICES
// -------------------------------------------------------------

export async function saveUserProfileToFirestore(userId: string, profile: UserProfile): Promise<void> {
  if (!db) return;
  const path = `profiles/${userId}`;
  try {
    await setDoc(doc(db, 'profiles', userId), {
      ...profile,
      userId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  if (!db) return null;
  const path = `profiles/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'profiles', userId));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('Fetching user profile from Firestore fallback:', error);
    return null;
  }
}

// -------------------------------------------------------------
// CLOUD FIRESTORE SAVED SCHEMES SERVICES
// -------------------------------------------------------------

export async function getSavedSchemesFromFirestore(userId: string): Promise<SavedSchemeItem[]> {
  if (!db) return [];
  const effectiveUserId = auth?.currentUser?.uid || userId;
  try {
    const subColRef = collection(db, 'savedSchemes', effectiveUserId, 'items');
    const snapshot = await getDocs(subColRef);
    const items: SavedSchemeItem[] = [];
    snapshot.forEach(docSnap => {
      items.push(docSnap.data() as SavedSchemeItem);
    });
    return items;
  } catch (error) {
    console.warn('Fetching saved schemes from Firestore fallback:', error);
    return [];
  }
}

export async function saveSchemeToFirestore(userId: string, schemeId: string, schemeName: string, notes?: string): Promise<SavedSchemeItem> {
  const effectiveUserId = auth?.currentUser?.uid || userId;
  const item: SavedSchemeItem = {
    id: `saved_${effectiveUserId}_${schemeId}`,
    userId: effectiveUserId,
    schemeId,
    schemeName,
    savedDate: new Date().toISOString().split('T')[0],
    notes
  };

  if (!db) return item;
  try {
    await setDoc(doc(db, 'savedSchemes', effectiveUserId, 'items', schemeId), item);
    return item;
  } catch (error) {
    console.warn('Saving savedScheme fallback:', error);
    return item;
  }
}

export async function removeSavedSchemeFromFirestore(userId: string, schemeId: string): Promise<void> {
  if (!db) return;
  const effectiveUserId = auth?.currentUser?.uid || userId;
  try {
    await deleteDoc(doc(db, 'savedSchemes', effectiveUserId, 'items', schemeId));
  } catch (error) {
    console.warn('Removing savedScheme fallback:', error);
  }
}

// -------------------------------------------------------------
// CLOUD FIRESTORE APPLICATIONS SERVICES
// -------------------------------------------------------------

export function getCleanAppId(userId: string, appId: string): string {
  if (!appId) return `app_${Date.now()}`;
  return appId.replace(new RegExp(`^app_${userId}_`), '');
}

export async function getApplicationsFromFirestore(userId: string): Promise<DemoApplication[]> {
  if (!db) return [];
  // Use Firebase Authentication's currentUser.uid as the user identity
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) {
    // Unauthenticated users cannot access applications
    return [];
  }
  const effectiveUserId = currentAuthUid;
  try {
    // Exact secure path: users/{userId}/applications/{applicationId}
    const userAppsRef = collection(db, 'users', effectiveUserId, 'applications');
    const snapshot = await getDocs(userAppsRef);

    const apps: DemoApplication[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as DemoApplication;
      if (!data.id) {
        data.id = docSnap.id;
      }
      apps.push(data);
    });
    return apps.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
  } catch (error) {
    console.warn('Fetching applications from Firestore fallback:', error);
    return [];
  }
}

export async function saveApplicationToFirestore(userId: string, application: DemoApplication): Promise<DemoApplication> {
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) {
    // Unauthenticated users cannot access or save applications to Firestore
    return application;
  }
  const effectiveUserId = currentAuthUid;
  const cleanId = getCleanAppId(effectiveUserId, application.id);
  const nowIso = new Date().toISOString();
  const record: DemoApplication = {
    ...application,
    id: cleanId,
    userId: effectiveUserId,
    reminderStatus: application.reminderStatus || 'initiated',
    initiatedAt: application.initiatedAt || application.timestamp || nowIso,
    nextReminderAt: application.nextReminderAt || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: application.createdAt || application.timestamp || nowIso,
    updatedAt: nowIso
  };

  if (!db) return record;
  try {
    // Save strictly to users/{userId}/applications/{applicationId}
    await setDoc(doc(db, 'users', effectiveUserId, 'applications', cleanId), record);
    return record;
  } catch (error) {
    console.warn('Saving application to Firestore fallback:', error);
    return record;
  }
}

export async function updateApplicationReminderInFirestore(
  userId: string,
  applicationId: string,
  reminderStatus: DemoApplication['reminderStatus'],
  nextReminderAt?: string,
  completedAt?: string
): Promise<void> {
  if (!db) return;
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) return;
  const effectiveUserId = currentAuthUid;
  const cleanId = getCleanAppId(effectiveUserId, applicationId);
  const updates: Record<string, any> = {
    reminderStatus,
    updatedAt: new Date().toISOString()
  };
  if (nextReminderAt !== undefined) {
    updates.nextReminderAt = nextReminderAt;
  }
  if (completedAt !== undefined) {
    updates.completedAt = completedAt;
  }
  if (reminderStatus === 'completed') {
    updates.status = 'Submitted';
  }

  try {
    await updateDoc(doc(db, 'users', effectiveUserId, 'applications', cleanId), updates);
  } catch (error) {
    console.warn('Updating application reminder in Firestore fallback:', error);
  }
}

export async function updateApplicationStatusInFirestore(userId: string, applicationId: string, status: ApplicationStatus): Promise<void> {
  if (!db) return;
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) return;
  const effectiveUserId = currentAuthUid;
  const cleanId = getCleanAppId(effectiveUserId, applicationId);
  try {
    await updateDoc(doc(db, 'users', effectiveUserId, 'applications', cleanId), {
      status,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Updating application status in Firestore fallback:', error);
  }
}

export function formatTimelineDate(dateStr?: string, fallback: string = 'Pending'): string {
  if (!dateStr) return fallback;
  if (/^\d{2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export async function progressApplicationInFirestore(
  userId: string,
  application: DemoApplication
): Promise<DemoApplication | null> {
  if (!db) return null;
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) return null;
  const effectiveUserId = currentAuthUid;
  const cleanId = getCleanAppId(effectiveUserId, application.id);

  const now = new Date();
  const todayFormatted = formatTimelineDate(now.toISOString());
  let nextStatus: ApplicationStatus = application.status;
  const updatedTimeline = { ...(application.timeline || {}) };

  if (application.status === 'Application Started') {
    nextStatus = 'Submitted';
    if (!updatedTimeline.startedAt) {
      updatedTimeline.startedAt = formatTimelineDate(application.date || application.timestamp, '05 Sep 2026');
    }
    updatedTimeline.submittedAt = todayFormatted;
  } else if (application.status === 'Submitted') {
    nextStatus = 'Under Verification';
    updatedTimeline.verifiedAt = todayFormatted;
  } else if (application.status === 'Under Verification') {
    nextStatus = 'Approved';
    updatedTimeline.decisionAt = todayFormatted;
  } else {
    return null;
  }

  const updatedRecord: DemoApplication = {
    ...application,
    id: cleanId,
    userId: effectiveUserId,
    status: nextStatus,
    timeline: updatedTimeline,
    timestamp: now.toISOString()
  };

  try {
    await setDoc(doc(db, 'users', effectiveUserId, 'applications', cleanId), updatedRecord);
    return updatedRecord;
  } catch (error) {
    console.warn('Progressing application in Firestore fallback:', error);
    return updatedRecord;
  }
}

export async function deleteApplicationFromFirestore(userId: string, applicationId: string): Promise<void> {
  if (!db) return;
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) return;
  const effectiveUserId = currentAuthUid;
  const cleanId = getCleanAppId(effectiveUserId, applicationId);
  try {
    await deleteDoc(doc(db, 'users', effectiveUserId, 'applications', cleanId));
  } catch (error) {
    console.warn('Deleting application from Firestore fallback:', error);
  }
}

// -------------------------------------------------------------
// CLOUD FIRESTORE NOTIFICATIONS SERVICES
// -------------------------------------------------------------

export async function getNotificationsFromFirestore(userId: string): Promise<AppNotification[]> {
  if (!db) return [];
  const effectiveUserId = auth?.currentUser?.uid || userId;
  try {
    const profileDoc = await getDoc(doc(db, 'profiles', effectiveUserId));
    if (profileDoc.exists()) {
      const notifs = profileDoc.data()?.notifications;
      if (Array.isArray(notifs)) {
        return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }
    return [];
  } catch (error) {
    console.warn('Fetching notifications from Firestore fallback:', error);
    return [];
  }
}

export async function saveNotificationToFirestore(
  userId: string,
  notification: AppNotification
): Promise<AppNotification> {
  const effectiveUserId = auth?.currentUser?.uid || userId;
  const record: AppNotification = {
    ...notification,
    userId: effectiveUserId
  };

  if (!db) return record;
  try {
    const profileRef = doc(db, 'profiles', effectiveUserId);
    const snap = await getDoc(profileRef);
    let existingNotifs: AppNotification[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.notifications)) {
      existingNotifs = snap.data()?.notifications;
    }
    const updated = [record, ...existingNotifs.filter(n => n.id !== record.id)].slice(0, 50);
    await setDoc(profileRef, {
      userId: effectiveUserId,
      notifications: updated
    }, { merge: true });
    return record;
  } catch (error) {
    console.warn('Saving notification to Firestore fallback:', error);
    return record;
  }
}

export async function markNotificationAsReadInFirestore(
  userId: string,
  notificationId: string
): Promise<void> {
  if (!db) return;
  const effectiveUserId = auth?.currentUser?.uid || userId;
  try {
    const profileRef = doc(db, 'profiles', effectiveUserId);
    const snap = await getDoc(profileRef);
    if (snap.exists() && Array.isArray(snap.data()?.notifications)) {
      const notifs = snap.data()?.notifications as AppNotification[];
      const updated = notifs.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
      await setDoc(profileRef, { notifications: updated }, { merge: true });
    }
  } catch (error) {
    console.warn('Marking notification read fallback:', error);
  }
}

export async function markAllNotificationsAsReadInFirestore(
  userId: string
): Promise<void> {
  if (!db) return;
  const effectiveUserId = auth?.currentUser?.uid || userId;
  try {
    const profileRef = doc(db, 'profiles', effectiveUserId);
    const snap = await getDoc(profileRef);
    if (snap.exists() && Array.isArray(snap.data()?.notifications)) {
      const notifs = snap.data()?.notifications as AppNotification[];
      const updated = notifs.map(n => ({ ...n, isRead: true }));
      await setDoc(profileRef, { notifications: updated }, { merge: true });
    }
  } catch (error) {
    console.warn('Marking all notifications read fallback:', error);
  }
}

export async function deleteNotificationFromFirestore(
  userId: string,
  notificationId: string
): Promise<void> {
  if (!db) return;
  const effectiveUserId = auth?.currentUser?.uid || userId;
  try {
    const profileRef = doc(db, 'profiles', effectiveUserId);
    const snap = await getDoc(profileRef);
    if (snap.exists() && Array.isArray(snap.data()?.notifications)) {
      const notifs = snap.data()?.notifications as AppNotification[];
      const updated = notifs.filter(n => n.id !== notificationId);
      await setDoc(profileRef, { notifications: updated }, { merge: true });
    }
  } catch (error) {
    console.warn('Deleting notification fallback:', error);
  }
}


