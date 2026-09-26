/**
 * Safe Utility Module for Handling Official Government Portal Links
 * 
 * Strict Guidelines:
 * - Preserves verified official government URLs exactly without modification.
 * - Trims accidental leading/trailing whitespace.
 * - Validates protocol (http:// or https://) and standard host structure.
 * - Never performs blocking frontend health checks (government servers often block automated fetch requests).
 * - Never prevents a user from opening a valid URL based on automated network status.
 * - Opens external links in a new browser tab with 'noopener,noreferrer' directly from click events.
 * - Provides graceful messaging when URLs are missing/malformed instead of a broken Apply button.
 */

export const PORTAL_MESSAGES = {
  UNAVAILABLE_TITLE: 'Official portal link is currently unavailable.',
  UNAVAILABLE_DESC: 'Please check the scheme details later or visit the concerned government department.',
  OPENS_IN_NEW_TAB: 'Opens the official government portal in a new tab.',
  ACCESSIBLE_APPLY_LABEL: 'Open official government portal (opens in a new tab)',
  TEMP_UNAVAILABLE_TITLE: 'Government portal is temporarily unavailable.',
  TEMP_UNAVAILABLE_DESC: 'Please try again later.',
  TRY_AGAIN_BUTTON: 'Try Again'
} as const;

export interface SafeUrlResult {
  url: string | null;
  isValid: boolean;
  status: 'valid' | 'missing' | 'malformed';
  displayLabel: string;
  fallbackTitle: string;
  fallbackDesc: string;
  secondaryNote: string;
  accessibleLabel: string;
}

/**
 * Validates and sanitizes a government portal URL.
 * Preserves the exact URL, trims whitespace, verifies protocol (https:// or http://).
 * Never blocks valid official URLs with automated server fetch pings.
 */
export function getSafePortalUrl(rawUrl: string | undefined | null): SafeUrlResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      url: null,
      isValid: false,
      status: 'missing',
      displayLabel: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackTitle: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackDesc: PORTAL_MESSAGES.UNAVAILABLE_DESC,
      secondaryNote: PORTAL_MESSAGES.OPENS_IN_NEW_TAB,
      accessibleLabel: PORTAL_MESSAGES.ACCESSIBLE_APPLY_LABEL
    };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return {
      url: null,
      isValid: false,
      status: 'missing',
      displayLabel: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackTitle: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackDesc: PORTAL_MESSAGES.UNAVAILABLE_DESC,
      secondaryNote: PORTAL_MESSAGES.OPENS_IN_NEW_TAB,
      accessibleLabel: PORTAL_MESSAGES.ACCESSIBLE_APPLY_LABEL
    };
  }

  // Accept only valid absolute http:// or https:// URLs
  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      url: null,
      isValid: false,
      status: 'malformed',
      displayLabel: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackTitle: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackDesc: PORTAL_MESSAGES.UNAVAILABLE_DESC,
      secondaryNote: PORTAL_MESSAGES.OPENS_IN_NEW_TAB,
      accessibleLabel: PORTAL_MESSAGES.ACCESSIBLE_APPLY_LABEL
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        url: null,
        isValid: false,
        status: 'malformed',
        displayLabel: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
        fallbackTitle: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
        fallbackDesc: PORTAL_MESSAGES.UNAVAILABLE_DESC,
        secondaryNote: PORTAL_MESSAGES.OPENS_IN_NEW_TAB,
        accessibleLabel: PORTAL_MESSAGES.ACCESSIBLE_APPLY_LABEL
      };
    }
    return {
      url: trimmed,
      isValid: true,
      status: 'valid',
      displayLabel: trimmed,
      fallbackTitle: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackDesc: PORTAL_MESSAGES.UNAVAILABLE_DESC,
      secondaryNote: PORTAL_MESSAGES.OPENS_IN_NEW_TAB,
      accessibleLabel: PORTAL_MESSAGES.ACCESSIBLE_APPLY_LABEL
    };
  } catch {
    return {
      url: null,
      isValid: false,
      status: 'malformed',
      displayLabel: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackTitle: PORTAL_MESSAGES.UNAVAILABLE_TITLE,
      fallbackDesc: PORTAL_MESSAGES.UNAVAILABLE_DESC,
      secondaryNote: PORTAL_MESSAGES.OPENS_IN_NEW_TAB,
      accessibleLabel: PORTAL_MESSAGES.ACCESSIBLE_APPLY_LABEL
    };
  }
}

/**
 * Safely opens an official government portal URL immediately in a new browser tab.
 * Executed directly within the user's click interaction.
 * Does not wait for any network check.
 * 
 * @param rawUrl The URL to open
 * @returns boolean indicating whether the open command was executed
 */
export function openOfficialPortal(rawUrl: string | undefined | null): boolean {
  const result = getSafePortalUrl(rawUrl);
  if (!result.isValid || !result.url) {
    console.warn('Cannot open portal: official portal link is unavailable or malformed:', rawUrl);
    return false;
  }

  const targetUrl = result.url;

  try {
    // 1. Direct window.open with safe security attributes
    const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    
    // 2. Safe fallback if window.open was suppressed (e.g. sandbox or strict popup blocker)
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const anchor = document.createElement('a');
      anchor.href = targetUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    return true;
  } catch (err) {
    console.error('Error opening official portal:', err);
    try {
      const anchor = document.createElement('a');
      anchor.href = targetUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Re-attempts to open the official government portal URL.
 * Directly re-opens the official URL without repeatedly pinging or testing the government server.
 */
export function retryOpenPortal(rawUrl: string | undefined | null): boolean {
  return openOfficialPortal(rawUrl);
}
