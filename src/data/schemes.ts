import { Scheme } from '../types';
import rawSchemesJson from './schemes.json';

export interface RawCsvScheme {
  schemeId: string;
  csvSchemeId?: string;
  schemeName: string;
  governmentLevel: string;
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
}

const SHORT_NAMES: Record<string, string> = {
  'SS-0001': 'Stand-Up India',
  'SS-0002': 'WEP',
  'SS-0003': 'CGTMSE',
  'SS-0004': 'Mahila Coir Yojana',
  'SS-0005': 'PMEGP',
  'SS-0006': 'MUDRA (PMMY)',
  'SS-0007': 'PMFME',
  'SS-0008': 'PM Vishwakarma',
  'SS-0009': 'NEEDS (Tamil Nadu)',
  'SS-0010': 'Startup India (SISFS)',
  'SS-0011': 'PMEGP (Youth)',
  'SS-0012': 'National SC-ST Hub',
  'SS-0013': 'NSKFDC',
  'SS-0014': 'PM Vishwakarma (Artisans)',
  'SS-0015': 'PM SVANidhi',
  'SS-0016': 'Coir Udyami Yojana',
  'SS-0017': 'KVIC Programmes',
  'SS-0018': 'AP MSME Incentives',
  'SS-0019': 'AP Food Processing 4.0',
  'SS-0020': 'AYS (Andhra Yuva Shakti)',
  'SS-0021': 'SFURTI Clusters',
  'SS-0022': 'ASPIRE (Rural Innovation)',
  'SS-0023': 'ESDP (Skill Development)',
  'SS-0024': 'ATI (Training Institutions)',
  'SS-0025': 'MSE-CDP (Cluster Dev)',
  'SS-0026': 'MSME Innovative (Incubation/IPR)',
  'SS-0027': 'MSME Competitive (LEAN)',
  'SS-0028': 'MSME Sustainable (ZED)',
  'SS-0029': 'PMS (Marketing Support)',
  'SS-0030': 'MSME TEAM (ONDC)',
  'SS-0031': 'MSE GIFT (Green Finance)',
  'SS-0032': 'MSE SPICE (Circular Economy)',
  'SS-0033': 'MSE ODR (Samadhaan)',
  'SS-0034': 'MSME Champions',
  'SS-0035': 'MSME Technology Centres',
  'SS-0036': 'Coir Vikas Yojana',
  'SS-0037': 'NHDP (Handicrafts)',
  'SS-0038': 'CHCDS (Mega Clusters)',
  'SS-0039': 'CGSS (Startup Guarantees)',
  'SS-0040': 'Startup India Fund of Funds 2.0',
  'SS-0041': 'NIDHI Seed Support (SSP)',
  'SS-0042': 'NIDHI-PRAYAS (Hardware Grants)',
  'SS-0043': 'BIRAC BIG (Biotech Grants)',
  'SS-0044': 'AgriSURE (Agri Startups)',
  'SS-0045': 'RKVY-RAFTAAR (Agri Innovation)',
  'SS-0046': 'SAMRIDH Accelerator (MeitY)',
  'SS-0047': 'GENESIS (Tier-II/III Startups)',
  'SS-0048': 'iDEX (Defence Innovation)',
  'SS-0049': 'NSFDC Term Loan (SC)',
  'SS-0050': 'NSFDC Micro Finance (SC)'
};

export function transformRawCsvToScheme(raw: RawCsvScheme): Scheme {
  // Normalize states
  const statesList = raw.statesCovered.toLowerCase().includes('all india') || raw.statesCovered.toLowerCase() === 'india'
    ? ['All India']
    : raw.statesCovered.split(';').map(s => s.trim());

  // Benefits list
  const benefitsList: string[] = [
    `Benefit Type: ${raw.benefitType}`,
    `Maximum Support: ${raw.maximumBenefit}`,
    `Eligible Activity: ${raw.businessTypes} (${raw.businessStage})`
  ];

  // Required documents list
  const documentsList: string[] = raw.requiredDocuments.split(';').map(d => d.trim()).filter(Boolean);
  if (documentsList.length === 0) {
    documentsList.push(raw.requiredDocuments);
  }

  // Eligibility details
  const eligibilityList: string[] = [
    `Eligibility Criteria: ${raw.eligibilityCriteria}`,
    `Target Beneficiaries: ${raw.targetBeneficiary}`,
    `Gender Eligibility: ${raw.genderEligibility}`,
    `Age Criteria: ${raw.ageCriteria}`,
    `Social Categories: ${raw.socialCategoryEligibility}`,
    `Income Criteria: ${raw.incomeCriteria}`,
    `Jurisdiction: ${raw.statesCovered} (${raw.governmentLevel} Government)`
  ];

  // Categories for faceted navigation
  const categories: string[] = [];
  if (raw.genderEligibility.toLowerCase().includes('female') || raw.genderEligibility.toLowerCase().includes('women')) {
    categories.push('Women Entrepreneurs');
  }
  if (raw.socialCategoryEligibility.toLowerCase().includes('sc') || raw.socialCategoryEligibility.toLowerCase().includes('st')) {
    categories.push('SC Entrepreneurs', 'ST Entrepreneurs');
  }
  if (raw.socialCategoryEligibility.toLowerCase().includes('bc') || raw.socialCategoryEligibility.toLowerCase().includes('obc')) {
    categories.push('OBC Entrepreneurs');
  }
  if (raw.targetBeneficiary.toLowerCase().includes('youth') || raw.ageCriteria.toLowerCase().includes('young') || raw.schemeName.toLowerCase().includes('youth')) {
    categories.push('Youth Entrepreneurs');
  }
  if (raw.businessStage.toLowerCase().includes('new')) {
    categories.push('New Entrepreneurs');
  }
  if (raw.businessStage.toLowerCase().includes('exist')) {
    categories.push('Existing Businesses');
  }
  if (raw.businessTypes.toLowerCase().includes('manufactur')) {
    categories.push('Manufacturing');
  }
  if (raw.businessTypes.toLowerCase().includes('service')) {
    categories.push('Service');
  }
  if (raw.businessTypes.toLowerCase().includes('food')) {
    categories.push('Food Processing');
  }
  if (raw.businessTypes.toLowerCase().includes('agri')) {
    categories.push('Agriculture / Allied Activities');
  }
  if (categories.length === 0) {
    categories.push('General Entrepreneurs');
  }

  return {
    ...raw,
    id: raw.schemeId,
    csvSchemeId: raw.csvSchemeId || raw.schemeId,
    name: raw.schemeName,
    shortName: SHORT_NAMES[raw.schemeId] || raw.schemeName,
    ministry: raw.ministryDepartment,
    description: raw.eligibilityCriteria,
    benefits: benefitsList,
    eligibilityDetails: eligibilityList,
    requiredDocumentsList: documentsList,
    applicationInstructions: [
      `Application Method: ${raw.applicationMethod}`,
      `Review eligibility and guidelines: ${raw.eligibilityCriteria}`,
      raw.officialApplicationUrl ? `Apply online via verified official portal: ${raw.officialApplicationUrl}` : `Consult designated channel: ${raw.applicationMethod}`
    ],
    schemeCategories: categories,
    targetBeneficiaries: raw.targetBeneficiary.split(';').map(t => t.trim()),
    statesCoveredList: statesList,
    ruralUrbanEligibility: raw.targetBeneficiary.toLowerCase().includes('rural') ? 'Rural' : raw.statesCovered.toLowerCase().includes('urban') ? 'Urban' : 'All',
    financialAssistanceType: [raw.benefitType],
    officialInformationUrl: raw.sourceUrl,
    lastVerifiedDate: raw.lastUpdated,
    keyBenefit: `${raw.benefitType} - ${raw.maximumBenefit}`
  };
}

export const SCHEMES_DATABASE: Scheme[] = (rawSchemesJson as RawCsvScheme[]).map(transformRawCsvToScheme);

export const TOTAL_CSV_SCHEMES_COUNT = SCHEMES_DATABASE.length; // 50
