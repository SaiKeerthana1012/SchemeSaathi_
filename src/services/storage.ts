import { UserAccount, UserProfile, SavedSchemeItem, DemoApplication, ApplicationStatus, AppNotification } from '../types';

const USERS_KEY = 'schemesaathi_users';
const CURRENT_USER_KEY = 'schemesaathi_current_user';
const PROFILE_KEY_PREFIX = 'schemesaathi_profile_';
const SAVED_KEY_PREFIX = 'schemesaathi_saved_';
const APPS_KEY_PREFIX = 'schemesaathi_apps_';
const NOTIFICATIONS_KEY_PREFIX = 'schemesaathi_notifications_';

export const StorageService = {
  // --- AUTHENTICATION CACHE (Firebase Auth is primary source of truth) ---
  getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      this.saveUserAccount(user);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  saveUserAccount(user: UserAccount) {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      const users: UserAccount[] = raw ? JSON.parse(raw) : [];
      const existingIdx = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...user };
      } else {
        users.push(user);
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  },

  logout() {
    this.setCurrentUser(null);
  },

  // --- PROFILE ---
  getUserProfile(userId: string): UserProfile | null {
    try {
      const raw = localStorage.getItem(PROFILE_KEY_PREFIX + userId);
      if (raw) return JSON.parse(raw);
      return null;
    } catch {
      return null;
    }
  },

  saveUserProfile(userId: string, profile: UserProfile): void {
    try {
      profile.updatedAt = new Date().toISOString();
      localStorage.setItem(PROFILE_KEY_PREFIX + userId, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
      throw new Error('Failed to save user profile');
    }
  },

  // --- SAVED SCHEMES ---
  getSavedSchemes(userId: string): SavedSchemeItem[] {
    try {
      const raw = localStorage.getItem(SAVED_KEY_PREFIX + userId);
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  },

  saveScheme(userId: string, schemeId: string, schemeName: string, notes?: string): SavedSchemeItem {
    const list = this.getSavedSchemes(userId);
    const existing = list.find(s => s.schemeId === schemeId);
    if (existing) return existing;

    const newItem: SavedSchemeItem = {
      id: 'saved_' + Math.random().toString(36).substring(2, 9),
      schemeId,
      schemeName,
      savedDate: new Date().toISOString().split('T')[0],
      notes
    };
    list.unshift(newItem);
    localStorage.setItem(SAVED_KEY_PREFIX + userId, JSON.stringify(list));
    return newItem;
  },

  removeSavedScheme(userId: string, schemeId: string): void {
    const list = this.getSavedSchemes(userId);
    const updated = list.filter(s => s.schemeId !== schemeId);
    localStorage.setItem(SAVED_KEY_PREFIX + userId, JSON.stringify(updated));
  },

  isSchemeSaved(userId: string, schemeId: string): boolean {
    const list = this.getSavedSchemes(userId);
    return list.some(s => s.schemeId === schemeId);
  },

  // --- APPLICATIONS ---
  getApplications(userId: string): DemoApplication[] {
    try {
      const raw = localStorage.getItem(APPS_KEY_PREFIX + userId);
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  },

  createApplication(
    userId: string, 
    schemeId: string, 
    schemeName: string, 
    officialPortal?: string,
    profileSnapshot?: DemoApplication['profileSnapshot'],
    notes?: string
  ): DemoApplication {
    const list = this.getApplications(userId);

    // Requirement 13: Duplicate Application Protection
    // Reuse/update the existing active application record for the same scheme
    const existingActive = list.find(a => 
      a.schemeId === schemeId && 
      a.reminderStatus !== 'dismissed' && 
      a.reminderStatus !== 'completed'
    );

    if (existingActive) {
      existingActive.updatedAt = new Date().toISOString();
      if (officialPortal) {
        existingActive.officialPortal = officialPortal;
        existingActive.officialApplicationUrl = officialPortal;
      }
      localStorage.setItem(APPS_KEY_PREFIX + userId, JSON.stringify(list));
      return existingActive;
    }

    const now = new Date();
    const initiatedAt = now.toISOString();
    // Default reminder date to approximately 3 days after initiatedAt (Requirement 1)
    const nextReminder = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const nextReminderAt = nextReminder.toISOString();
    const today = initiatedAt.split('T')[0];

    let seqNum = 1001 + list.length;
    while (list.some(a => a.id === `SS-APP-${seqNum}`)) {
      seqNum++;
    }

    const newApp: DemoApplication = {
      id: `SS-APP-${seqNum}`,
      userId,
      schemeId,
      schemeName,
      officialPortal: officialPortal || 'Official Government Portal',
      officialApplicationUrl: officialPortal || '',
      date: today,
      status: 'Application Started',
      reminderStatus: 'initiated',
      initiatedAt,
      nextReminderAt,
      createdAt: initiatedAt,
      updatedAt: initiatedAt,
      notes: notes || 'Application initiated on official government portal.',
      timestamp: initiatedAt,
      isExternalUserEntered: true,
      profileSnapshot,
      timeline: {
        startedAt: today
      }
    };
    list.unshift(newApp);
    localStorage.setItem(APPS_KEY_PREFIX + userId, JSON.stringify(list));
    return newApp;
  },

  updateApplicationReminder(
    userId: string,
    appId: string,
    reminderStatus: DemoApplication['reminderStatus'],
    nextReminderAt?: string,
    completedAt?: string
  ): DemoApplication | null {
    const list = this.getApplications(userId);
    const target = list.find(a => a.id === appId);
    if (!target) return null;

    target.reminderStatus = reminderStatus;
    target.updatedAt = new Date().toISOString();
    if (nextReminderAt !== undefined) {
      target.nextReminderAt = nextReminderAt;
    }
    if (completedAt !== undefined) {
      target.completedAt = completedAt;
    }
    if (reminderStatus === 'completed') {
      target.status = 'Submitted';
      if (!target.timeline.submittedAt) {
        target.timeline.submittedAt = new Date().toISOString().split('T')[0];
      }
    }
    localStorage.setItem(APPS_KEY_PREFIX + userId, JSON.stringify(list));
    return target;
  },

  saveUserEnteredApplication(
    userId: string,
    data: {
      schemeName: string;
      schemeId?: string;
      userEnteredApplicationId: string;
      officialPortal: string;
      date: string;
      status?: ApplicationStatus;
      notes?: string;
    }
  ): DemoApplication {
    const list = this.getApplications(userId);
    let seqNum = 1001 + list.length;
    while (list.some(a => a.id === `SS-USER-${seqNum}`)) {
      seqNum++;
    }
    const today = data.date || new Date().toISOString().split('T')[0];
    const initialStatus: ApplicationStatus = 'Application Started';
    const newApp: DemoApplication = {
      id: `SS-USER-${seqNum}`,
      userId,
      schemeId: data.schemeId || 'custom-scheme',
      schemeName: data.schemeName,
      officialPortal: data.officialPortal,
      date: today,
      status: initialStatus,
      notes: data.notes || 'External government application recorded by user.',
      timestamp: new Date().toISOString(),
      isExternalUserEntered: true,
      userEnteredApplicationId: data.userEnteredApplicationId,
      timeline: {
        startedAt: today
      }
    };
    list.unshift(newApp);
    localStorage.setItem(APPS_KEY_PREFIX + userId, JSON.stringify(list));
    return newApp;
  },

  updateApplication(
    userId: string,
    appId: string,
    updates: Partial<DemoApplication>
  ): DemoApplication | null {
    const list = this.getApplications(userId);
    const target = list.find(a => a.id === appId);
    if (!target) return null;

    Object.assign(target, updates);
    localStorage.setItem(APPS_KEY_PREFIX + userId, JSON.stringify(list));
    return target;
  },

  deleteApplication(userId: string, appId: string): void {
    const list = this.getApplications(userId);
    const updated = list.filter(a => a.id !== appId);
    localStorage.setItem(APPS_KEY_PREFIX + userId, JSON.stringify(updated));
  },

  // --- NOTIFICATIONS ---
  getNotifications(userId: string): AppNotification[] {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY_PREFIX + userId);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNotification(userId: string, notification: AppNotification): AppNotification {
    const list = this.getNotifications(userId);
    const existingIdx = list.findIndex(n => n.id === notification.id);
    if (existingIdx >= 0) {
      list[existingIdx] = notification;
    } else {
      list.unshift(notification);
    }
    localStorage.setItem(NOTIFICATIONS_KEY_PREFIX + userId, JSON.stringify(list));
    return notification;
  },

  setNotifications(userId: string, notifications: AppNotification[]) {
    localStorage.setItem(NOTIFICATIONS_KEY_PREFIX + userId, JSON.stringify(notifications));
  },

  markNotificationAsRead(userId: string, notifId: string): void {
    const list = this.getNotifications(userId);
    const target = list.find(n => n.id === notifId);
    if (target) {
      target.isRead = true;
      localStorage.setItem(NOTIFICATIONS_KEY_PREFIX + userId, JSON.stringify(list));
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const list = this.getNotifications(userId);
    list.forEach(n => { n.isRead = true; });
    localStorage.setItem(NOTIFICATIONS_KEY_PREFIX + userId, JSON.stringify(list));
  },

  deleteNotification(userId: string, notifId: string): void {
    const list = this.getNotifications(userId);
    const updated = list.filter(n => n.id !== notifId);
    localStorage.setItem(NOTIFICATIONS_KEY_PREFIX + userId, JSON.stringify(updated));
  }
};
