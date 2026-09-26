export type Language = 'en' | 'te' | 'hi';

export type BusinessStatus = 
  | 'I already have a business'
  | 'I want to start a business'
  | 'I want to expand my business';

export type EnterpriseType = 
  | 'Manufacturing'
  | 'Service'
  | 'Trading'
  | 'Agriculture / Allied Activities'
  | 'Other';

export type SocialCategory = 
  | 'General'
  | 'OBC'
  | 'SC'
  | 'ST'
  | 'Minority'
  | 'Specially Abled / PwD';

export type Gender = 'Female' | 'Male' | 'Transgender' | 'Prefer not to say';

export interface PersonalInfo {
  fullName: string;
  age: number | string;
  state: string;
  district: string;
  gender: Gender;
  socialCategory: SocialCategory;
  annualFamilyIncome: string;
  educationLevel: string;
  areaType: 'Rural' | 'Urban';
  isDifferentlyAbled?: boolean;
  hasAadhaar?: boolean;
  hasBankAccount?: boolean;
  landHolding?: string;
}

export interface BusinessInfo {
  businessStatus: BusinessStatus;
  
  // Starting a business
  businessDescription?: string;
  businessIdea?: string;
  proposedLocation?: 'Rural' | 'Urban';
  estimatedInvestment?: string;
  expectedEmployees?: number | string;

  // Existing or expanding business
  businessName?: string;
  businessStage?: string;
  currentInvestment?: string;
  additionalInvestmentRequired?: string;
  expansionPlan?: string;
  numberEmployees?: number | string;

  // Common
  businessCategory?: string;
  enterpriseType: EnterpriseType;
  financialAssistanceRequired: string;
}

export interface UserProfile {
  personal: PersonalInfo;
  business: BusinessInfo;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

export type NotificationType = 'application_initiated' | 'application_reminder' | 'status_change' | 'general';

export type ReminderStatus = 'initiated' | 'interested' | 'snoozed' | 'dismissed' | 'completed';

export interface AppNotification {
  id: string;
  userId: string;
  applicationId?: string;
  schemeId?: string;
  schemeName?: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  reminderStatus?: ReminderStatus;
  nextReminderAt?: string;
}

export interface Scheme {
  // Primary CSV fields (exact CSV schema)
  schemeId: string;
  csvSchemeId?: string; // Original CSV scheme identifier (e.g. SCH008, SCH009)
  schemeName: string;
  governmentLevel: 'Central' | 'State' | string;
  ministryDepartment: string;
  targetBeneficiary: string;
  genderEligibility: string;
  ageCriteria: string;
  statesCovered: string;
  incomeCriteria: string;
  socialCategoryEligibility: string;
  businessTypes: string;
  businessStage: string;
  eligibilityCriteria: string;
  benefitType: string;
  maximumBenefit: string;
  requiredDocuments: string;
  applicationMethod: string;
  officialApplicationUrl: string;
  sourceUrl: string;
  lastUpdated: string;
  notes: string;

  // Aliases and UI helpers (derived directly from CSV values)
  id: string; // alias to schemeId (e.g. 'SS-0001')
  name: string; // alias to schemeName
  shortName: string;
  ministry: string; // alias to ministryDepartment
  description: string; // alias to eligibilityCriteria / summary
  benefits?: string[];
  eligibilityDetails?: string[];
  requiredDocumentsList?: string[];
  applicationInstructions?: string[];
  schemeCategories?: string[];
  targetBeneficiaries?: string[];
  statesCoveredList?: string[];
  ruralUrbanEligibility?: 'All' | 'Rural' | 'Urban' | 'Rural and Urban';
  financialAssistanceType?: string[];
  officialInformationUrl?: string;
  lastVerifiedDate?: string;
  keyBenefit?: string;
}

export interface SchemeMatchResult {
  scheme: Scheme;
  score: number; // Prototype Match Score (0 - 100)
  reasons: string[]; // "Why this scheme is recommended" (✓ reasons)
  mismatches: string[]; // "Possible mismatch" (⚠ reasons)
  eligibilityHighlights: string[];
}

export interface SavedSchemeItem {
  id: string;
  userId?: string;
  schemeId: string;
  schemeName: string;
  savedDate: string;
  notes?: string;
}

export type ApplicationStatus = 
  | 'Application Started' 
  | 'Application Submitted'
  | 'Submitted' 
  | 'Under Review'
  | 'Under Verification' 
  | 'Documents Required'
  | 'Documents Verified'
  | 'Additional Information Required'
  | 'Approved' 
  | 'Rejected';

export interface DemoApplication {
  id: string; // e.g. SS-DEMO-1001 or user-entered portal reference
  userId: string;
  schemeId: string;
  schemeName: string;
  officialPortal: string;
  officialApplicationUrl?: string;
  date: string;
  status: ApplicationStatus;
  notes: string;
  timestamp: string;
  isExternalUserEntered?: boolean;
  userEnteredApplicationId?: string;
  reminderStatus?: ReminderStatus;
  initiatedAt?: string;
  nextReminderAt?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  lastReminderShownAt?: string;
  reminderRead?: boolean;
  profileSnapshot?: {
    fullName?: string;
    socialCategory?: string;
    enterpriseType?: string;
    businessStatus?: string;
    estimatedInvestment?: string;
  };
  timeline: {
    startedAt?: string;
    submittedAt?: string;
    verifiedAt?: string;
    decisionAt?: string;
  };
}

export type ApplicationRecord = DemoApplication;

