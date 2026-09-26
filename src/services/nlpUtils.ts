import { BusinessDomain, DOMAIN_DEFINITIONS, GENERIC_STOP_WORDS } from './conceptOntology';

/**
 * Normalizes text: lowercase, replaces punctuation with spaces, trims extra whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes text into meaningful tokens by removing generic stop words and short terms.
 */
export function extractMeaningfulTokens(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const rawTokens = normalized.split(' ');
  const result: string[] = [];

  for (const token of rawTokens) {
    if (token.length >= 3 && !GENERIC_STOP_WORDS.has(token)) {
      result.push(token);
    }
  }

  return result;
}

/**
 * Detects domain concepts in a given text string.
 * Returns a list of detected domains sorted by relevance frequency.
 */
export function detectDomainsFromText(
  category: string = '',
  description: string = '',
  enterpriseType: string = ''
): { primaryDomain: BusinessDomain | null; detectedDomains: BusinessDomain[]; matchedKeywords: string[] } {
  const combined = normalizeText(`${category} ${description} ${category}`);
  const domainScores: Record<BusinessDomain, { count: number; matched: string[] }> = {
    [BusinessDomain.HANDLOOM_TEXTILES]: { count: 0, matched: [] },
    [BusinessDomain.FOOD_PROCESSING]: { count: 0, matched: [] },
    [BusinessDomain.DAIRY]: { count: 0, matched: [] },
    [BusinessDomain.HANDICRAFTS_ARTISANS]: { count: 0, matched: [] },
    [BusinessDomain.COIR]: { count: 0, matched: [] },
    [BusinessDomain.STREET_VENDING]: { count: 0, matched: [] },
    [BusinessDomain.TECH_STARTUP]: { count: 0, matched: [] },
    [BusinessDomain.MANUFACTURING_GENERAL]: { count: 0, matched: [] },
    [BusinessDomain.SERVICES_BEAUTY]: { count: 0, matched: [] },
    [BusinessDomain.SERVICES_GENERAL]: { count: 0, matched: [] },
    [BusinessDomain.AGRICULTURE_ALLIED]: { count: 0, matched: [] }
  };

  const normCategory = normalizeText(category);
  const normDesc = normalizeText(description);

  for (const domain of Object.values(BusinessDomain)) {
    const def = DOMAIN_DEFINITIONS[domain];
    for (const kw of def.keywords) {
      // Category match is given higher weight (3x) than description
      if (normCategory.includes(kw)) {
        domainScores[domain].count += 3;
        domainScores[domain].matched.push(kw);
      } else if (normDesc.includes(kw)) {
        domainScores[domain].count += 1;
        domainScores[domain].matched.push(kw);
      }
    }
  }

  // Fallback / EnterpriseType hint
  const normType = normalizeText(enterpriseType);
  if (normType.includes('manufactur') && domainScores[BusinessDomain.MANUFACTURING_GENERAL].count === 0) {
    domainScores[BusinessDomain.MANUFACTURING_GENERAL].count += 1;
  } else if (normType.includes('service') && domainScores[BusinessDomain.SERVICES_GENERAL].count === 0 && domainScores[BusinessDomain.SERVICES_BEAUTY].count === 0) {
    domainScores[BusinessDomain.SERVICES_GENERAL].count += 1;
  } else if (normType.includes('agri') && domainScores[BusinessDomain.AGRICULTURE_ALLIED].count === 0) {
    domainScores[BusinessDomain.AGRICULTURE_ALLIED].count += 1;
  }

  // Sort domains by score
  const sorted = (Object.keys(domainScores) as BusinessDomain[])
    .filter(d => domainScores[d].count > 0)
    .sort((a, b) => domainScores[b].count - domainScores[a].count);

  const primaryDomain = sorted.length > 0 ? sorted[0] : null;
  const allMatchedKeywords = Array.from(
    new Set(sorted.flatMap(d => domainScores[d].matched))
  );

  return {
    primaryDomain,
    detectedDomains: sorted,
    matchedKeywords: allMatchedKeywords
  };
}

/**
 * Computes semantic similarity (weighted term overlap / cosine approximation)
 * between the user's business description and the scheme's textual profile.
 */
export function computeDescriptionSimilarity(
  userText: string,
  schemeCorpus: string
): { similarity: number; sharedTerms: string[] } {
  const userTokens = extractMeaningfulTokens(userText);
  if (userTokens.length === 0) {
    return { similarity: 0.5, sharedTerms: [] }; // Neutral if user provided no description
  }

  const schemeTokens = new Set(extractMeaningfulTokens(schemeCorpus));
  const shared: string[] = [];

  for (const token of userTokens) {
    if (schemeTokens.has(token)) {
      shared.push(token);
    }
  }

  const uniqueUser = new Set(userTokens).size;
  const uniqueShared = new Set(shared).size;

  if (uniqueUser === 0) return { similarity: 0.5, sharedTerms: [] };

  // Overlap ratio bounded between 0 and 1
  const overlapRatio = uniqueShared / uniqueUser;
  // Scaled similarity
  const similarity = Math.min(1.0, overlapRatio * 1.5);

  return {
    similarity,
    sharedTerms: Array.from(new Set(shared))
  };
}
