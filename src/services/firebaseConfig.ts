/**
 * Firebase Firestore & Authentication Integration Adapter
 * 
 * Requirement 6:
 * This module identifies the Firestore Collections & Security Rules structure
 * and provides the schema contract for migrating from the current partitioned
 * StorageService to Firebase Authentication and Cloud Firestore seamlessly.
 * 
 * Firestore Collections Structure:
 * - users/{userId} -> User account information (name, email, createdAt)
 * - profiles/{userId} -> User profile (personal and business criteria)
 * - savedSchemes/{userId}/items/{schemeId} -> Saved/bookmarked scheme items
 * - applications/{userId}/items/{appId} -> Citizen demo applications & tracking milestones
 * 
 * Security Rules Schema:
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     match /profiles/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     match /savedSchemes/{userId}/items/{item} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     match /applications/{userId}/items/{item} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  projectId?: string;
  authDomain?: string;
  missingConfigKeys: string[];
}

export const getFirebaseConnectionStatus = (): FirebaseConnectionStatus => {
  const projectId = (typeof process !== 'undefined' && process.env?.FIREBASE_PROJECT_ID) || '';
  const apiKey = (typeof process !== 'undefined' && process.env?.FIREBASE_API_KEY) || '';

  const missing: string[] = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!apiKey) missing.push('FIREBASE_API_KEY');

  return {
    isConfigured: missing.length === 0,
    projectId: projectId || undefined,
    missingConfigKeys: missing
  };
};
