import { Scheme, UserProfile, SchemeMatchResult } from '../types';
import { SCHEMES_DATABASE } from '../data/schemes';
import { 
  BusinessDomain, 
  DOMAIN_DEFINITIONS, 
  GENERIC_STOP_WORDS 
} from './conceptOntology';
import { 
  normalizeText, 
  extractMeaningfulTokens, 
  detectDomainsFromText, 
  computeDescriptionSimilarity 
} from './nlpUtils';

/**
 * Configurable weights for matching factors as specified:
 * Business domain/category relevance: 35%
 * Business description semantic similarity: 20%
 * Target beneficiary: 15%
 * Business stage: 10%
 * Gender eligibility: 5%
 * Social category: 5%
 * Income eligibility: 5%
 * Age eligibility: 3%
 * State/geography: 2%
 * Total: 100%
 */
export interface MatchingWeights {
  domain: number;      // 0.35
  description: number; // 0.20
  beneficiary: number; // 0.15
  stage: number;       // 0.10
  gender: number;      // 0.05
  social: number;      // 0.05
  income: number;      // 0.05
  age: number;         // 0.03
  state: number;       // 0.02
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  domain: 0.35,
  description: 0.20,
  beneficiary: 0.15,
  stage: 0.10,
  gender: 0.05,
  social: 0.05,
  income: 0.05,
  age: 0.03,
  state: 0.02
};

export interface SchemeDomainAnalysis {
  exclusiveDomain: BusinessDomain | null;
  supportedDomains: BusinessDomain[];
  isBroadEnterprise: boolean;
  isTechStartupOnly: boolean;
  isFoodProcessingOnly: boolean;
  isCoirOnly: boolean;
  isStreetVendingOnly: boolean;
  isHandicraftsArtisansOnly: boolean;
  isWomenOnly: boolean;
  isScStOnly: boolean;
}

/**
 * Analyzes a scheme dynamically from its Firestore fields to determine its domain specialization.
 * Does NOT hard-code individual scheme IDs.
 */
export function analyzeSchemeDomain(scheme: Scheme): SchemeDomainAnalysis {
  const normName = normalizeText(scheme.schemeName || scheme.name || '');
  const normMinistry = normalizeText(scheme.ministryDepartment || scheme.ministry || '');
  const normTypes = normalizeText(scheme.businessTypes || '');
  const normBeneficiary = normalizeText(scheme.targetBeneficiary || '');
  const normGender = normalizeText(scheme.genderEligibility || '');
  const normSocial = normalizeText(scheme.socialCategoryEligibility || '');
  const combined = `${normName} ${normMinistry} ${normTypes} ${normBeneficiary}`;

  // 1. Food Processing exclusive detection
  const isFoodProcessingOnly = (
    normMinistry.includes('food processing') ||
    (normTypes.includes('food processing') && !normTypes.includes('manufacturing') && !normTypes.includes('textile')) ||
    (normName.includes('food processing') && !normName.includes('msme'))
  );

  // 2. Coir exclusive detection
  const isCoirOnly = (
    normTypes.includes('coir') || 
    normName.includes('coir')
  );

  // 3. Street Vending exclusive detection
  const isStreetVendingOnly = (
    normBeneficiary.includes('street vendor') || 
    normBeneficiary.includes('hawker') ||
    normName.includes('svanidhi')
  );

  // 4. Tech Startup exclusive detection
  const isTechStartupOnly = (
    (normTypes.includes('tech startup') || normTypes.includes('innovative early stage') || normBeneficiary.includes('dpiit') || normName.includes('seed support') || normName.includes('accelerator') || (normName.includes('nidhi') && !normName.includes('svanidhi')) || normName.includes('samridh') || normName.includes('genesis') || normName.includes('idex') || normName.includes('biotechnology ignition')) &&
    !normTypes.includes('traditional') &&
    !normTypes.includes('handloom') &&
    !isStreetVendingOnly
  );

  // 5. Handicrafts & Traditional Artisans detection
  const isHandicraftsArtisansOnly = (
    (normName.includes('handicraft') || normName.includes('vishwakarma') || normName.includes('chcds') || normName.includes('nhdp')) &&
    !normTypes.includes('food processing')
  );

  // 6. Women only detection
  const isWomenOnly = (
    normGender === 'female' ||
    normGender === 'women only' ||
    (normGender.includes('women') && !normGender.includes('any') && !normGender.includes('all') && !normGender.includes('male') && !normGender.includes('sc / st'))
  );

  // 7. SC/ST only detection
  const isScStOnly = (
    normSocial === 'sc' ||
    normSocial === 'sc / st' ||
    normSocial === 'sc/st' ||
    normName.includes('sc-st hub') ||
    normName.includes('nsfdc') ||
    (normBeneficiary.includes('sc') && !normBeneficiary.includes('all') && !normBeneficiary.includes('general') && !normBeneficiary.includes('women'))
  );

  // Determine supported domains
  const supportedDomains: BusinessDomain[] = [];
  for (const domain of Object.values(BusinessDomain)) {
    const def = DOMAIN_DEFINITIONS[domain];
    for (const kw of def.keywords) {
      if (combined.includes(kw)) {
        supportedDomains.push(domain);
        break;
      }
    }
  }

  // Broad MSME schemes (PMEGP, MUDRA, Stand-Up India, CGTMSE, etc.)
  const isBroadEnterprise = (
    normTypes.includes('manufacturing') && 
    normTypes.includes('service') &&
    !isFoodProcessingOnly && 
    !isCoirOnly && 
    !isTechStartupOnly
  );

  let exclusiveDomain: BusinessDomain | null = null;
  if (isFoodProcessingOnly) exclusiveDomain = BusinessDomain.FOOD_PROCESSING;
  else if (isCoirOnly) exclusiveDomain = BusinessDomain.COIR;
  else if (isStreetVendingOnly) exclusiveDomain = BusinessDomain.STREET_VENDING;
  else if (isTechStartupOnly) exclusiveDomain = BusinessDomain.TECH_STARTUP;
  else if (isHandicraftsArtisansOnly) exclusiveDomain = BusinessDomain.HANDICRAFTS_ARTISANS;

  return {
    exclusiveDomain,
    supportedDomains,
    isBroadEnterprise,
    isTechStartupOnly,
    isFoodProcessingOnly,
    isCoirOnly,
    isStreetVendingOnly,
    isHandicraftsArtisansOnly,
    isWomenOnly,
    isScStOnly
  };
}

/**
 * Main matching engine: calculates explainable, deterministic matching scores for ALL available schemes.
 */
export function matchSchemesForProfile(
  profile: UserProfile,
  schemes: Scheme[] = SCHEMES_DATABASE,
  weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS
): SchemeMatchResult[] {
  const { personal, business } = profile;

  // 1. Extract and normalize user inputs
  const userGender = personal.gender || 'Female';
  const userSocialCategory = personal.socialCategory || 'General';
  const userAge = Number(personal.age) || 28;
  const userState = (personal.state || 'Telangana').trim();
  const userLocation = personal.areaType || business.proposedLocation || 'Rural';
  const userStatus = business.businessStatus || 'I want to start a business';
  const userType = business.enterpriseType || 'Manufacturing';
  const userCategory = (business as any).businessCategory || '';
  const userDescription = business.businessDescription || business.businessIdea || '';
  const userFullText = `${userCategory} ${userDescription} ${business.businessIdea || ''} ${business.expansionPlan || ''}`;

  // 2. Detect User Business Domain
  const userDomainAnalysis = detectDomainsFromText(userCategory, userDescription, userType);
  const userPrimaryDomain = userDomainAnalysis.primaryDomain;
  const userDetectedDomains = userDomainAnalysis.detectedDomains;

  const isUserFemale = userGender === 'Female';
  const isUserMale = userGender === 'Male';
  const isUserYouth = userAge >= 18 && userAge <= 45;
  const isUserNew = userStatus.toLowerCase().includes('start') || userStatus.toLowerCase().includes('new');
  const isUserExisting = userStatus.toLowerCase().includes('already') || userStatus.toLowerCase().includes('existing');
  const isUserExpansion = userStatus.toLowerCase().includes('expand');

  const results: SchemeMatchResult[] = [];

  // Iterate over all schemes dynamically (SS-0001 to SS-0050 or any number in Firestore)
  for (const scheme of schemes) {
    const schemeAnalysis = analyzeSchemeDomain(scheme);
    const reasons: string[] = [];
    const mismatches: string[] = [];
    const highlights: string[] = [];

    let hardDisqualificationReason: string | null = null;
    let domainMismatchPenalty = false;
    let domainMismatchNote = '';

    // =========================================================================
    // FACTOR 1: Business Domain / Category Relevance (Weight: 35%)
    // =========================================================================
    let domainScore = 50;
    const schemeCorpus = `${scheme.schemeName} ${scheme.ministryDepartment} ${scheme.businessTypes} ${scheme.targetBeneficiary} ${scheme.eligibilityCriteria} ${scheme.notes || ''}`;

    if (schemeAnalysis.exclusiveDomain) {
      // Scheme is specialized for a single narrow domain
      if (userPrimaryDomain === schemeAnalysis.exclusiveDomain || userDetectedDomains.includes(schemeAnalysis.exclusiveDomain)) {
        domainScore = 96;
        const domainName = DOMAIN_DEFINITIONS[schemeAnalysis.exclusiveDomain].displayName;
        reasons.push(`High match because this scheme supports ${domainName.toLowerCase()} enterprises.`);
        highlights.push(`${domainName} Focus`);
      } else {
        // CONFLICT! Scheme is exclusive to a domain the user does not belong to.
        domainScore = 5;
        domainMismatchPenalty = true;
        const schemeDomainName = DOMAIN_DEFINITIONS[schemeAnalysis.exclusiveDomain].displayName;
        const userDomainName = userPrimaryDomain ? DOMAIN_DEFINITIONS[userPrimaryDomain].displayName : 'your chosen sector';
        domainMismatchNote = `Low match because this scheme focuses on ${schemeDomainName.toLowerCase()}, while your business is related to ${userDomainName.toLowerCase()}.`;
        mismatches.push(domainMismatchNote);
      }
    } else if (schemeAnalysis.isBroadEnterprise) {
      // Broad enterprise schemes (PMEGP, MUDRA, Stand-Up India, etc.)
      const normTypes = normalizeText(scheme.businessTypes || '');
      const userTypeNorm = normalizeText(userType);

      if (normTypes.includes(userTypeNorm)) {
        domainScore = 84;
        reasons.push(`Supports ${userType} enterprises under standard credit and margin guidelines.`);
      } else {
        domainScore = 70;
      }

      // Bonus if specific domain concepts appear in broad scheme (e.g. traditional/khadi in KVIC, weavers in Vishwakarma)
      if (userPrimaryDomain && schemeAnalysis.supportedDomains.includes(userPrimaryDomain)) {
        domainScore = Math.min(94, domainScore + 10);
        reasons.unshift(`Direct domain alignment for ${DOMAIN_DEFINITIONS[userPrimaryDomain].displayName}.`);
      }
    } else {
      // Scheme supports multiple domains
      if (userPrimaryDomain && schemeAnalysis.supportedDomains.includes(userPrimaryDomain)) {
        domainScore = 88;
        reasons.push(`Covers activities in ${DOMAIN_DEFINITIONS[userPrimaryDomain].displayName}.`);
      } else {
        domainScore = 60;
      }
    }

    // =========================================================================
    // FACTOR 2: Business Description Semantic Similarity (Weight: 20%)
    // =========================================================================
    const semanticResult = computeDescriptionSimilarity(userFullText, schemeCorpus);
    const descScore = Math.round(semanticResult.similarity * 100);

    if (semanticResult.sharedTerms.length > 0 && !domainMismatchPenalty) {
      const topShared = semanticResult.sharedTerms.slice(0, 4).join(', ');
      reasons.push(`Matched concepts: ${topShared}.`);
    }

    // =========================================================================
    // FACTOR 3: Target Beneficiary Fit (Weight: 15%)
    // =========================================================================
    let beneficiaryScore = 70;
    const normBeneficiary = normalizeText(scheme.targetBeneficiary || '');
    const normTypes = normalizeText(scheme.businessTypes || '');

    if (userDomainAnalysis.primaryDomain === BusinessDomain.HANDLOOM_TEXTILES && (normBeneficiary.includes('weaver') || normBeneficiary.includes('artisan') || normBeneficiary.includes('craft') || normBeneficiary.includes('handloom') || normBeneficiary.includes('textile'))) {
      beneficiaryScore = 96;
      highlights.push('Weavers & Artisans');
    } else if (userDomainAnalysis.primaryDomain === BusinessDomain.FOOD_PROCESSING && (normBeneficiary.includes('food') || normBeneficiary.includes('agro') || normBeneficiary.includes('processing') || normBeneficiary.includes('enterprise'))) {
      beneficiaryScore = 96;
      highlights.push('Food Processing Target');
    } else if (userDomainAnalysis.primaryDomain === BusinessDomain.DAIRY && (normBeneficiary.includes('dairy') || normBeneficiary.includes('milk') || normBeneficiary.includes('food') || normBeneficiary.includes('agro') || normBeneficiary.includes('enterprise'))) {
      beneficiaryScore = 95;
      highlights.push('Dairy & Food Target');
    } else if (userDomainAnalysis.primaryDomain === BusinessDomain.HANDICRAFTS_ARTISANS && (normBeneficiary.includes('artisan') || normBeneficiary.includes('craft') || normBeneficiary.includes('vishwakarma'))) {
      beneficiaryScore = 95;
      highlights.push('Artisan Focus');
    } else if (userDomainAnalysis.primaryDomain === BusinessDomain.STREET_VENDING && (normBeneficiary.includes('vendor') || normBeneficiary.includes('hawker') || normBeneficiary.includes('vending') || normTypes.includes('vending'))) {
      beneficiaryScore = 98;
      highlights.push('Street Vendor Target');
    } else if (userDomainAnalysis.primaryDomain === BusinessDomain.TECH_STARTUP && (normBeneficiary.includes('startup') || normBeneficiary.includes('dpiit') || normBeneficiary.includes('innovator'))) {
      beneficiaryScore = 95;
      highlights.push('Startup Innovator');
    }

    if (isUserFemale && normBeneficiary.includes('women')) {
      beneficiaryScore = Math.max(beneficiaryScore, 92);
      highlights.push('Women Beneficiary');
    }
    if ((userSocialCategory === 'SC' || userSocialCategory === 'ST') && (normBeneficiary.includes('sc') || normBeneficiary.includes('st'))) {
      beneficiaryScore = Math.max(beneficiaryScore, 95);
      highlights.push(`${userSocialCategory} Beneficiary`);
    }

    // =========================================================================
    // FACTOR 4: Business Stage (Weight: 10%)
    // =========================================================================
    let stageScore = 75;
    const normStage = normalizeText(scheme.businessStage || '');

    if (userDomainAnalysis.primaryDomain === BusinessDomain.STREET_VENDING && (normBeneficiary.includes('vendor') || normBeneficiary.includes('hawker') || normTypes.includes('vending'))) {
      stageScore = 95;
      reasons.push('Provides direct collateral-free working capital for vendors.');
    } else if (isUserNew) {
      if (normStage.includes('greenfield') || normStage.includes('new') || normStage.includes('start') || normStage.includes('eligible new')) {
        stageScore = 95;
        reasons.push('Designed for establishing new enterprise units.');
      } else if (normStage.includes('existing unit') && !normStage.includes('new')) {
        stageScore = 20;
        mismatches.push('Primarily requires an already operational business unit.');
      }
    } else if (isUserExisting || isUserExpansion) {
      if (normStage.includes('existing') || normStage.includes('expansion') || normStage.includes('formalization')) {
        stageScore = 95;
        reasons.push('Supports scaling and upgrading existing operational units.');
      }
    }

    // =========================================================================
    // FACTOR 5: Gender Eligibility (Weight: 5%)
    // =========================================================================
    let genderScore = 80;
    const normGender = normalizeText(scheme.genderEligibility || '');

    if (schemeAnalysis.isWomenOnly) {
      if (isUserFemale) {
        genderScore = 100;
        reasons.push('Exclusively dedicated to Women entrepreneurs.');
        highlights.push('Women Exclusive');
      } else {
        genderScore = 0;
        hardDisqualificationReason = 'Not eligible: Scheme is exclusively reserved for Women entrepreneurs.';
        mismatches.push(hardDisqualificationReason);
      }
    } else if (normGender.includes('women') || normGender.includes('female')) {
      if (isUserFemale) {
        genderScore = 95;
        reasons.push('Provides special subsidies and priority quotas for Women entrepreneurs.');
      } else {
        genderScore = 75;
      }
    }

    // =========================================================================
    // FACTOR 6: Social Category Eligibility (Weight: 5%)
    // =========================================================================
    let socialScore = 80;
    const normSocial = normalizeText(scheme.socialCategoryEligibility || '');

    if (schemeAnalysis.isScStOnly) {
      if (userSocialCategory === 'SC' || userSocialCategory === 'ST') {
        socialScore = 100;
        reasons.push(`Dedicated affirmative scheme for ${userSocialCategory} entrepreneurs.`);
        highlights.push(`${userSocialCategory} Exclusive`);
      } else {
        socialScore = 0;
        hardDisqualificationReason = 'Not eligible: Scheme is exclusively reserved for SC / ST entrepreneurs.';
        mismatches.push(hardDisqualificationReason);
      }
    } else if (normSocial.includes('sc') || normSocial.includes('st')) {
      if (userSocialCategory === 'SC' || userSocialCategory === 'ST') {
        socialScore = 95;
        reasons.push(`Offers higher margin subsidy and concession for ${userSocialCategory} applicants.`);
      } else {
        socialScore = 75;
      }
    }

    // Stand-Up India Rule: Borrower must be Woman OR SC/ST
    const isStandUpIndia = scheme.schemeName.toLowerCase().includes('stand-up india') || scheme.schemeId === 'SS-0001';
    if (isStandUpIndia) {
      const isEligibleStandup = isUserFemale || userSocialCategory === 'SC' || userSocialCategory === 'ST';
      if (!isEligibleStandup) {
        hardDisqualificationReason = 'Stand-Up India requires applicant to be a Woman OR belonging to SC/ST category.';
        mismatches.push(hardDisqualificationReason);
      }
    }

    // =========================================================================
    // FACTOR 7: Income Eligibility (Weight: 5%)
    // =========================================================================
    let incomeScore = 80;
    const normIncome = normalizeText(scheme.incomeCriteria || '');
    if (normIncome.includes('no annual income limit') || normIncome.includes('no limit')) {
      incomeScore = 85;
    } else if (normIncome.includes('bpl') || normIncome.includes('below')) {
      incomeScore = 75;
    }

    // =========================================================================
    // FACTOR 8: Age Eligibility (Weight: 3%)
    // =========================================================================
    let ageScore = 80;
    const normAge = normalizeText(scheme.ageCriteria || '');
    if (normAge.includes('21 to 45') || normAge.includes('21-45')) {
      if (userAge >= 21 && userAge <= 45) {
        ageScore = 100;
        reasons.push(`Meets youth age eligibility (${userAge} yrs).`);
      } else {
        ageScore = 0;
        hardDisqualificationReason = `Age criterion not met: Scheme requires age between 21 and 45 (applicant is ${userAge} yrs).`;
        mismatches.push(hardDisqualificationReason);
      }
    } else if (userAge >= 18) {
      ageScore = 85;
    }

    // =========================================================================
    // FACTOR 9: State / Geography (Weight: 2%)
    // =========================================================================
    let stateScore = 80;
    const normStates = normalizeText(scheme.statesCovered || '');
    const isAllIndia = (
      normStates.includes('india') ||
      normStates.includes('pan-india') ||
      normStates.includes('central') ||
      normStates.includes('all states') ||
      normStates.includes('nationwide')
    );

    if (!isAllIndia) {
      if (normStates.includes(normalizeText(userState))) {
        stateScore = 100;
        reasons.push(`State-specific scheme for residents of ${userState}.`);
        highlights.push(`State: ${userState}`);
      } else {
        stateScore = 0;
        hardDisqualificationReason = `Not eligible: Scheme is restricted to ${scheme.statesCovered}.`;
        mismatches.push(hardDisqualificationReason);
      }
    }

    // =========================================================================
    // WEIGHTED SCORE CALCULATION
    // =========================================================================
    let rawScore = (
      (domainScore * weights.domain) +
      (descScore * weights.description) +
      (beneficiaryScore * weights.beneficiary) +
      (stageScore * weights.stage) +
      (genderScore * weights.gender) +
      (socialScore * weights.social) +
      (incomeScore * weights.income) +
      (ageScore * weights.age) +
      (stateScore * weights.state)
    );

    // =========================================================================
    // HARD ELIGIBILITY CAPS & PENALTIES
    // =========================================================================
    if (hardDisqualificationReason) {
      // If user has a hard eligibility conflict (wrong gender, wrong state, wrong SC/ST only, Stand-Up criteria),
      // cap score at ≤ 25% (Low Match / Ineligible)
      rawScore = Math.min(25, rawScore);
    } else if (domainMismatchPenalty) {
      // If scheme is strictly for food processing and user is handloom, cap score at ≤ 35% (Low Match)
      rawScore = Math.min(35, rawScore);
    } else if (schemeAnalysis.isTechStartupOnly && userPrimaryDomain !== BusinessDomain.TECH_STARTUP) {
      // Tech startup scheme for non-startup applicant
      rawScore = Math.min(32, rawScore);
      mismatches.push('Requires DPIIT-recognized technology startup innovation.');
    }

    const finalScore = Math.round(Math.min(98, Math.max(15, rawScore)));

    // Generate concise summary reason
    if (reasons.length === 0) {
      reasons.push('General enterprise support matching basic eligibility.');
    }

    results.push({
      scheme,
      score: finalScore,
      reasons: reasons.slice(0, 4),
      mismatches: mismatches.slice(0, 2),
      eligibilityHighlights: highlights.slice(0, 3)
    });
  }

  // Sort descending: highest match percentage to lowest
  return results.sort((a, b) => b.score - a.score);
}
