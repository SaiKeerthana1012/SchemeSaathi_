import React, { useState, useEffect } from 'react';
import { Language, UserAccount } from '../types';
import { TRANSLATIONS } from '../translations';
import { StorageService } from '../services/storage';
import { 
  firebaseRegister, 
  firebaseLogin, 
  firebaseLoginWithGoogle,
  firebaseSendPasswordReset,
  firebaseVerifyPasswordResetCode,
  firebaseConfirmPasswordReset
} from '../services/firebase';

export type AuthModalMode = 
  | 'login' 
  | 'register' 
  | 'auth_for_apply' 
  | 'auth_for_save' 
  | 'auth_for_matching' 
  | 'auth_for_browse' 
  | 'auth_for_chatbot'
  | 'reset_password';

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-') || domain.includes('..')) return false;
  const localRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localRegex.test(local)) return false;
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  for (const part of domainParts) {
    if (!part || !/^[a-zA-Z0-9-]+$/.test(part) || part.startsWith('-') || part.endsWith('-')) return false;
  }
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;
  return true;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  mode?: AuthModalMode;
  pendingScheme?: { id: string; name: string } | null;
  onLoginSuccess: (user: UserAccount, mode?: AuthModalMode, pendingScheme?: { id: string; name: string } | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  mode = 'login',
  pendingScheme = null,
  onLoginSuccess
}) => {
  const t = TRANSLATIONS[language];
  const [tab, setTab] = useState<'login' | 'register' | 'forgot_password' | 'reset_password'>(
    mode === 'register' ? 'register' : mode === 'reset_password' ? 'reset_password' : 'login'
  );

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let oobCode: string | null = null;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('mode') === 'resetPassword' && searchParams.get('oobCode')) {
        oobCode = searchParams.get('oobCode');
      }
    } catch {
      // ignore non-browser environment
    }

    if (mode === 'register') {
      setTab('register');
    } else if (mode === 'reset_password' || oobCode) {
      setTab('reset_password');
      setResetCode(oobCode);
      if (oobCode) {
        setIsLoading(true);
        firebaseVerifyPasswordResetCode(oobCode)
          .then((verifiedEmail) => {
            setResetEmail(verifiedEmail);
            setEmail(verifiedEmail);
          })
          .catch((err) => {
            setError(err?.message || 'The password reset link is invalid or has expired. Please request a new reset email.');
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setTab('login');
    }
    setError(null);
    setResetSuccessMessage(null);
  }, [mode, isOpen]);

  if (!isOpen) return null;

  // Handle Email Registration / Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (tab === 'register') {
      if (!name.trim()) {
        setError('Please provide your full name.');
        return;
      }
      if (!password) {
        setError('Please provide a password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    } else {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
    }

    setIsLoading(true);

    try {
      let user: UserAccount;
      if (tab === 'register') {
        user = await firebaseRegister(name.trim(), trimmedEmail, password);
      } else {
        user = await firebaseLogin(trimmedEmail, password);
      }

      StorageService.saveUserAccount(user);
      StorageService.setCurrentUser(user);
      onLoginSuccess(user, mode, pendingScheme);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password / Account Recovery (Email link)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter your registered email address.');
      return;
    }
    setIsLoading(true);
    try {
      await firebaseSendPasswordReset(trimmedEmail);
      setResetSuccessMessage(`Password reset link sent to ${trimmedEmail}. Check your email inbox and follow the link to set a new password.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Action Link Password Reset (from email reset link)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccessMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!resetCode) {
      setError('The password reset link is invalid or has already been used. Please request a new reset email.');
      return;
    }

    setIsLoading(true);
    try {
      await firebaseConfirmPasswordReset(resetCode, newPassword);
      setResetSuccessMessage('Password reset successfully! Please log in with your new password.');
      setNewPassword('');
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
      setTimeout(() => {
        setTab('login');
        setResetCode(null);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please request a new reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await firebaseLoginWithGoogle();
      StorageService.saveUserAccount(user);
      StorageService.setCurrentUser(user);
      onLoginSuccess(user, mode, pendingScheme);
      onClose();
    } catch (err: any) {
      console.warn('Google login notice:', err);
      setError(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine modal header and context messages based on mode
  let modalTitle = 'Login or Register to continue using SchemeSaathi.';
  let modalMessage = '';

  if (mode === 'auth_for_browse' || mode === 'auth_for_matching') {
    modalTitle = 'Login or Register to continue using SchemeSaathi.';
    modalMessage = mode === 'auth_for_browse'
      ? 'Browse Schemes requires authentication. Please sign in or create an account to access the directory.'
      : 'Find My Scheme requires authentication. Please sign in or create an account to view personalized matches.';
  } else if (mode === 'auth_for_chatbot') {
    modalTitle = 'Login or Register to continue using SchemeSaathi.';
    modalMessage = 'This personalized Saathi AI feature needs your profile information. Please sign in or create an account to continue.';
  } else if (mode === 'auth_for_apply') {
    modalTitle = 'Application Tracking & Reminders';
    modalMessage = 'Please log in or create an account to track your application and receive follow-up reminders.';
  } else if (mode === 'auth_for_save') {
    modalTitle = 'Save Schemes';
    modalMessage = 'Login or Register to save schemes.';
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="auth-modal">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-200">
        
        {/* Context Banner if triggered by action */}
        {modalMessage && tab !== 'forgot_password' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-xs font-bold text-blue-950">{modalTitle}</h3>
            <p className="text-xs text-blue-900 mt-0.5">{modalMessage}</p>
            {pendingScheme && (
              <div className="mt-1.5 text-[11px] font-semibold text-blue-950 bg-blue-100/70 px-2 py-1 rounded inline-block">
                Scheme: {pendingScheme.name}
              </div>
            )}
          </div>
        )}

        {/* Modal Tabs Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
          {tab === 'forgot_password' || tab === 'reset_password' ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="auth-back-to-login"
                onClick={() => { setTab('login'); setError(null); setResetSuccessMessage(null); }}
                className="text-xs font-bold text-blue-900 hover:text-blue-700 cursor-pointer flex items-center gap-1"
              >
                ← Back
              </button>
              <span className="text-sm font-bold text-gray-900">
                {tab === 'reset_password' ? 'Set New Password' : 'Account Recovery'}
              </span>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button
                id="auth-tab-login"
                onClick={() => { setTab('login'); setError(null); setResetSuccessMessage(null); }}
                className={`text-sm font-bold pb-1 cursor-pointer transition-colors ${
                  tab === 'login'
                    ? 'text-blue-900 border-b-2 border-blue-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.login}
              </button>
              <button
                id="auth-tab-register"
                onClick={() => { setTab('register'); setError(null); setResetSuccessMessage(null); }}
                className={`text-sm font-bold pb-1 cursor-pointer transition-colors ${
                  tab === 'register'
                    ? 'text-blue-900 border-b-2 border-blue-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.register}
              </button>
            </div>
          )}

          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer"
            aria-label="Close auth modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md" id="auth-error-message" role="alert">
            {error}
          </div>
        )}

        {resetSuccessMessage && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md" id="auth-success-message">
            {resetSuccessMessage}
          </div>
        )}

        {/* ----------------- FORGOT PASSWORD VIEW (EMAIL LINK) ----------------- */}
        {tab === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-3.5 text-xs">
            <p className="text-gray-600 text-xs">
              Enter your registered email address. We will send a secure password reset link to your email inbox.
            </p>
            <div>
              <label className="block font-bold text-gray-700 mb-1" htmlFor="auth-recovery-email">
                Registered Email Address <span className="text-red-600">*</span>
              </label>
              <input
                id="auth-recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. entrepreneur@domain.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
            <button
              id="auth-recovery-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
            </button>
          </form>
        )}

        {/* ----------------- RESET PASSWORD FORM (VIA ACTION LINK) ----------------- */}
        {tab === 'reset_password' && (
          <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-3.5 text-xs">
            <p className="text-gray-600 text-xs">
              {resetEmail 
                ? `Enter a new password for ${resetEmail}.` 
                : 'Enter your new password below.'}
            </p>
            <div>
              <label className="block font-bold text-gray-700 mb-1" htmlFor="auth-action-new-pass">
                New Password (min. 6 characters) <span className="text-red-600">*</span>
              </label>
              <input
                id="auth-action-new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
            <button
              id="auth-action-reset-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password & Continue</span>
              )}
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setTab('forgot_password'); setError(null); }}
                className="text-blue-900 hover:underline text-xs cursor-pointer"
              >
                Request a new password reset email
              </button>
            </div>
          </form>
        )}

        {/* ----------------- EMAIL TAB (LOGIN & REGISTER) ----------------- */}
        {tab !== 'forgot_password' && tab !== 'reset_password' && (
          <form onSubmit={handleEmailSubmit} noValidate className="space-y-3.5 text-xs">
            {tab === 'register' && (
              <div>
                <label className="block font-bold text-gray-700 mb-1" htmlFor="auth-name">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-700 mb-1" htmlFor="auth-email">
                Email Address <span className="text-red-600">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. entrepreneur@domain.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-gray-700" htmlFor="auth-password">
                  Password <span className="text-red-600">*</span>
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    id="auth-forgot-password-link"
                    onClick={() => { setTab('forgot_password'); setError(null); }}
                    className="text-[11px] text-blue-800 hover:text-blue-950 underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{tab === 'login' ? t.login : t.register}</span>
              )}
            </button>
          </form>
        )}

        {/* Social Authentication: Google */}
        {tab !== 'forgot_password' && tab !== 'reset_password' && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-gray-500 font-semibold">Or continue with</span>
              </div>
            </div>

            <button
              id="auth-google-login-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
          <span>Protected by Firebase Auth</span>
          <span className="font-mono text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">schemesaathi-f16c9</span>
        </div>
      </div>
    </div>
  );
};
