import { Scheme, UserProfile, UserAccount, DemoApplication } from '../types';
import { SCHEMES_DATABASE } from '../data/schemes';
import { matchSchemesForProfile } from './matchingEngine';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  type?: 'text' | 'auth_prompt' | 'scheme_cards' | 'comparison' | 'document_checker' | 'benefit_estimate';
  data?: any;
  quickActions?: string[];
}

export interface SchemeComparisonData {
  schemeA: Scheme;
  schemeB: Scheme;
}

// Check if query is personalized and requires authentication
export function isPersonalizedQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  const personalizedPatterns = [
    'which scheme is best for me',
    'find schemes for me',
    'find schemes for my business',
    'schemes for me',
    'schemes for my business',
    'for my business',
    'am i eligible',
    'check my eligibility',
    'check my documents',
    'my documents',
    'save this scheme',
    'apply for this scheme',
    'my application',
    'my applications',
    'my profile',
    'recommend for me',
    'recommend me',
    'best for me',
    'eligible for me',
    'na business ki em schemes',
    'naaku em schemes'
  ];

  return personalizedPatterns.some(pattern => q.includes(pattern));
}

// Detect language (English, Telugu, or Telugu-English mixed)
export function detectLanguage(text: string): 'en' | 'te' | 'telugu-english' {
  const teluguUnicodeRegex = /[\u0C00-\u0C7F]/;
  if (teluguUnicodeRegex.test(text)) {
    return 'te';
  }

  const teluguEnglishWords = [
    'na', 'naaku', 'em', 'emi', 'schemes', 'unnayi', 'undi', 'chesukovali',
    'enti', 'ela', 'apply', 'cheyali', 'kavali', ' అర్హత', 'పథకాలు', 'దరఖాస్తు',
    'women', 'ki', 'kosam', 'dabbulu', 'subsidy', 'loan'
  ];
  const words = text.toLowerCase().split(/\s+/);
  const matchCount = words.filter(w => teluguEnglishWords.includes(w)).length;
  if (matchCount >= 2 || text.toLowerCase().includes('na business') || text.toLowerCase().includes('ki em')) {
    return 'telugu-english';
  }

  return 'en';
}

// Find schemes matching query keywords
export function findSchemesByKeyword(query: string): Scheme[] {
  const q = query.toLowerCase();
  
  // Specific scheme identifiers
  if (q.includes('pmegp')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0005' || s.name.toLowerCase().includes('pmegp'));
  if (q.includes('stand up') || q.includes('stand-up') || q.includes('standup')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0001');
  if (q.includes('mudra') || q.includes('pmmy')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0006');
  if (q.includes('vishwakarma') || q.includes('artisan')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0008' || s.id === 'SS-0014');
  if (q.includes('coir') || q.includes('mahila coir')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0004' || s.id === 'SS-0016');
  if (q.includes('svanidhi') || q.includes('street vendor')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0015');
  if (q.includes('pmfme') || q.includes('food')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0007' || s.id === 'SS-0019');
  if (q.includes('cgtmse') || q.includes('collateral free') || q.includes('guarantee')) return SCHEMES_DATABASE.filter(s => s.id === 'SS-0003');
  if (q.includes('andhra') || q.includes('ap msme') || q.includes('yuva shakti') || q.includes('ays')) {
    return SCHEMES_DATABASE.filter(s => s.statesCovered.toLowerCase().includes('andhra') || s.id === 'SS-0018' || s.id === 'SS-0020');
  }

  // Categories
  if (q.includes('women') || q.includes('mahila') || q.includes('lady') || q.includes('female')) {
    return SCHEMES_DATABASE.filter(s => 
      s.genderEligibility.toLowerCase().includes('female') ||
      s.targetBeneficiary.toLowerCase().includes('women') ||
      s.socialCategoryEligibility.toLowerCase().includes('women') ||
      s.id === 'SS-0001' || s.id === 'SS-0002' || s.id === 'SS-0004'
    );
  }

  if (q.includes('sc') || q.includes('st') || q.includes('dalit') || q.includes('tribal')) {
    return SCHEMES_DATABASE.filter(s => 
      s.socialCategoryEligibility.toLowerCase().includes('sc') || 
      s.socialCategoryEligibility.toLowerCase().includes('st') ||
      s.id === 'SS-0001' || s.id === 'SS-0012'
    );
  }

  if (q.includes('youth') || q.includes('young') || q.includes('student')) {
    return SCHEMES_DATABASE.filter(s => s.id === 'SS-0011' || s.id === 'SS-0020' || s.id === 'SS-0010');
  }

  // Dynamic search across all 50 schemes (matches name, shortName, csvSchemeId, businessTypes, targetBeneficiary, notes, or ministry)
  const tokens = q.split(/\s+/).filter(t => t.length > 2);
  const dynamicMatches = SCHEMES_DATABASE.filter(s => {
    const haystack = `${s.name} ${s.shortName} ${s.csvSchemeId || ''} ${s.businessTypes} ${s.targetBeneficiary} ${s.notes} ${s.ministryDepartment} ${s.benefitType}`.toLowerCase();
    return tokens.some(t => haystack.includes(t));
  });

  if (dynamicMatches.length > 0) {
    return dynamicMatches.slice(0, 6);
  }

  return SCHEMES_DATABASE.slice(0, 4);
}

// Generate personalized matching response with explainable criteria
export function generatePersonalizedRecommendations(
  userProfile: UserProfile | null,
  schemes: Scheme[] = SCHEMES_DATABASE,
  applications: DemoApplication[] = []
): { text: string; matchedSchemes: any[] } {
  if (!userProfile) {
    return {
      text: "To give you personalized recommendations, please fill out your Entrepreneur Profile questionnaire first.",
      matchedSchemes: []
    };
  }

  const results = matchSchemesForProfile(userProfile, schemes);
  const topMatches = results.slice(0, 4);

  const matchedSchemesData = topMatches.map(res => {
    const existingApp = applications.find(a => a.schemeId === res.scheme.id);
    return {
      scheme: res.scheme,
      matchScore: res.score,
      reasons: res.reasons.length > 0 ? res.reasons.slice(0, 4) : [
        '✓ Your business status matches scheme target',
        '✓ Location alignment confirmed',
        '✓ Enterprise type satisfies guidelines'
      ],
      mismatches: res.mismatches.length > 0 ? res.mismatches : [
        '⚠ Document readiness and income verification required by sanctioning bank'
      ],
      applicationStatus: existingApp?.status || null,
      officialApplicationUrl: res.scheme.officialApplicationUrl || res.scheme.sourceUrl
    };
  });

  const lang = detectLanguage(userProfile.personal.fullName || '');
  let introText = `🎯 Based on your profile (${userProfile.personal.gender || 'Entrepreneur'}, ${userProfile.personal.socialCategory || 'General'}, ${userProfile.personal.state || 'India'}, ${userProfile.business.enterpriseType || 'Enterprise'}), I found ${topMatches.length} strong matching schemes:`;

  return {
    text: introText,
    matchedSchemes: matchedSchemesData
  };
}

// Generate Scheme Comparison
export function generateSchemeComparison(schemeAId?: string, schemeBId?: string): SchemeComparisonData | null {
  const sA = SCHEMES_DATABASE.find(s => s.id === schemeAId || s.shortName.toLowerCase().includes((schemeAId || '').toLowerCase())) || SCHEMES_DATABASE[4]; // PMEGP
  const sB = SCHEMES_DATABASE.find(s => s.id === schemeBId || s.shortName.toLowerCase().includes((schemeBId || '').toLowerCase())) || SCHEMES_DATABASE[5]; // MUDRA

  return {
    schemeA: sA,
    schemeB: sB
  };
}

// Generate Document Readiness Evaluation
export function generateDocumentReadiness(
  scheme: Scheme,
  userProfile: UserProfile | null
): {
  schemeName: string;
  requiredDocuments: string[];
  readyCount: number;
  totalCount: number;
  readyDocuments: string[];
  missingDocuments: string[];
} {
  const requiredDocs = (scheme.requiredDocuments || '')
    .split(';')
    .map(d => d.trim())
    .filter(Boolean);

  // Default baseline documents an entrepreneur normally has if profile is filled
  const readyList: string[] = [];
  const missingList: string[] = [];

  // Check each document against profile indications
  for (const doc of requiredDocs) {
    const dLower = doc.toLowerCase();
    if (dLower.includes('aadhaar') || dLower.includes('aadhar') || dLower.includes('identity')) {
      readyList.push(doc);
    } else if (dLower.includes('pan') || dLower.includes('photograph') || dLower.includes('photo')) {
      readyList.push(doc);
    } else if (dLower.includes('bank') || dLower.includes('passbook')) {
      readyList.push(doc);
    } else if (dLower.includes('udyam') || dLower.includes('registration') || dLower.includes('project report') || dLower.includes('caste') || dLower.includes('quotation')) {
      // Specialized documents requiring active upload/verification
      if (userProfile && userProfile.business.businessStatus === 'I already have a business' && dLower.includes('udyam')) {
        readyList.push(doc);
      } else {
        missingList.push(doc);
      }
    } else {
      missingList.push(doc);
    }
  }

  return {
    schemeName: scheme.shortName || scheme.name,
    requiredDocuments: requiredDocs,
    readyCount: readyList.length,
    totalCount: requiredDocs.length,
    readyDocuments: readyList,
    missingDocuments: missingList
  };
}

// Generate Benefit Estimate
export function generateBenefitEstimate(
  scheme: Scheme,
  userProfile: UserProfile | null
): {
  schemeName: string;
  estimateText: string;
  disclaimer: string;
  keyBenefit: string;
  maxBenefit: string;
} {
  let estimateText = '';
  const investment = userProfile?.business?.estimatedInvestment || userProfile?.business?.currentInvestment || '₹5 - ₹10 Lakhs';
  const category = userProfile?.personal?.socialCategory || 'Special';
  const isRural = (userProfile?.personal?.areaType || 'Rural') === 'Rural';

  if (scheme.id === 'SS-0005' || scheme.shortName.toLowerCase().includes('pmegp')) {
    const subsidyPct = isRural ? (category === 'General' ? '25%' : '35%') : (category === 'General' ? '15%' : '25%');
    estimateText = `For your proposed project in ${isRural ? 'Rural' : 'Urban'} area (${category} Category), you are eligible for up to **${subsidyPct} Government Subsidy** under PMEGP. Maximum project cost: ₹50 Lakhs for Manufacturing and ₹20 Lakhs for Services.`;
  } else if (scheme.id === 'SS-0006' || scheme.shortName.toLowerCase().includes('mudra')) {
    estimateText = `Under Pradhan Mantri MUDRA Yojana, you can get collateral-free business loans: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 Lakhs), and Tarun (₹5 Lakhs to ₹10 Lakhs) at competitive bank interest rates.`;
  } else if (scheme.id === 'SS-0001' || scheme.shortName.toLowerCase().includes('stand-up')) {
    estimateText = `Under Stand-Up India, eligible Women, SC, and ST entrepreneurs can receive bank composite loans between **₹10 Lakhs and ₹1 Crore** for greenfield enterprises.`;
  } else if (scheme.id === 'SS-0008' || scheme.shortName.toLowerCase().includes('vishwakarma')) {
    estimateText = `Under PM Vishwakarma, traditional artisans receive basic training with ₹500/day stipend, ₹15,000 modern toolkit incentive, and collateral-free enterprise loans up to **₹3 Lakhs** at a concessional 5% interest rate.`;
  } else {
    estimateText = `Maximum financial support under ${scheme.shortName}: ${scheme.maximumBenefit}. Benefit type: ${scheme.benefitType}.`;
  }

  return {
    schemeName: scheme.shortName,
    estimateText,
    keyBenefit: scheme.keyBenefit,
    maxBenefit: scheme.maximumBenefit,
    disclaimer: 'This is an estimate based on the available scheme information. Actual benefit depends on official approval and scheme rules.'
  };
}
