/**
 * SchemeSaathi Concept & Domain Ontology
 * Lightweight, reusable semantic concept and synonym taxonomy for enterprise schemes.
 */

export enum BusinessDomain {
  HANDLOOM_TEXTILES = 'HANDLOOM_TEXTILES',
  FOOD_PROCESSING = 'FOOD_PROCESSING',
  DAIRY = 'DAIRY',
  HANDICRAFTS_ARTISANS = 'HANDICRAFTS_ARTISANS',
  COIR = 'COIR',
  STREET_VENDING = 'STREET_VENDING',
  TECH_STARTUP = 'TECH_STARTUP',
  MANUFACTURING_GENERAL = 'MANUFACTURING_GENERAL',
  SERVICES_BEAUTY = 'SERVICES_BEAUTY',
  SERVICES_GENERAL = 'SERVICES_GENERAL',
  AGRICULTURE_ALLIED = 'AGRICULTURE_ALLIED'
}

export interface DomainDefinition {
  id: BusinessDomain;
  displayName: string;
  keywords: string[];
  exclusiveSchemeIndicators: string[];
  relatedDomains: BusinessDomain[];
}

export const DOMAIN_DEFINITIONS: Record<BusinessDomain, DomainDefinition> = {
  [BusinessDomain.HANDLOOM_TEXTILES]: {
    id: BusinessDomain.HANDLOOM_TEXTILES,
    displayName: 'Handloom / Textiles',
    keywords: [
      'handloom', 'weaving', 'weave', 'weaver', 'weavers', 'loom', 'looms', 'textile', 'textiles',
      'saree', 'saris', 'sari', 'fabric', 'fabrics', 'garment', 'garments', 'apparel', 'cloth',
      'clothing', 'yarn', 'spinning', 'khadi', 'charkha', 'cotton', 'silk', 'powerloom',
      'embroidery', 'tailoring', 'dressmaking', 'woolen', 'hosiery', 'linen', 'traditional loom'
    ],
    exclusiveSchemeIndicators: [
      'handloom', 'textiles', 'weaver', 'weavers', 'charkha', 'khadi'
    ],
    relatedDomains: [BusinessDomain.HANDICRAFTS_ARTISANS, BusinessDomain.MANUFACTURING_GENERAL]
  },

  [BusinessDomain.FOOD_PROCESSING]: {
    id: BusinessDomain.FOOD_PROCESSING,
    displayName: 'Food Processing',
    keywords: [
      'food processing', 'food manufacturing', 'agro processing', 'packaged food', 'food products',
      'fruit processing', 'vegetable processing', 'food unit', 'bakery', 'spice', 'spices', 'pickles',
      'flour mill', 'grain processing', 'beverage', 'canning', 'preservation', 'cold storage',
      'food packaging', 'processed food', 'snack foods', 'rice mill', 'oil extraction', 'masala',
      'jam', 'jelly', 'sauce', 'juice', 'dehydration', 'pulping', 'milling'
    ],
    exclusiveSchemeIndicators: [
      'food processing', 'agro-processing', 'micro food', 'pmfme', 'fruit processing'
    ],
    relatedDomains: [BusinessDomain.DAIRY, BusinessDomain.AGRICULTURE_ALLIED, BusinessDomain.MANUFACTURING_GENERAL]
  },

  [BusinessDomain.DAIRY]: {
    id: BusinessDomain.DAIRY,
    displayName: 'Dairy / Milk Products',
    keywords: [
      'dairy', 'dairy processing', 'milk', 'milk products', 'paneer', 'curd', 'butter', 'ghee',
      'cheese', 'dairy products', 'dairy unit', 'cattle', 'bovine', 'milch', 'livestock',
      'dairy farm', 'ice cream', 'buttermilk', 'pasteurization'
    ],
    exclusiveSchemeIndicators: [
      'dairy', 'milk processing', 'dairy processing'
    ],
    relatedDomains: [BusinessDomain.FOOD_PROCESSING, BusinessDomain.AGRICULTURE_ALLIED]
  },

  [BusinessDomain.HANDICRAFTS_ARTISANS]: {
    id: BusinessDomain.HANDICRAFTS_ARTISANS,
    displayName: 'Handicrafts & Artisans',
    keywords: [
      'handicraft', 'handicrafts', 'artisan', 'artisans', 'handmade', 'traditional craft',
      'craft products', 'handicraft products', 'pottery', 'clay', 'terracotta', 'wood craft',
      'carpenter', 'blacksmith', 'goldsmith', 'sculptor', 'stone carving', 'bamboo', 'cane',
      'brass', 'metal craft', 'folk art', 'vishwakarma', 'leather craft', 'toy making', 'zari',
      'craftsperson', 'craftsmen', 'traditional artisans'
    ],
    exclusiveSchemeIndicators: [
      'handicraft', 'handicrafts', 'artisan', 'artisans', 'vishwakarma', 'nhdp', 'chcds'
    ],
    relatedDomains: [BusinessDomain.HANDLOOM_TEXTILES, BusinessDomain.MANUFACTURING_GENERAL]
  },

  [BusinessDomain.COIR]: {
    id: BusinessDomain.COIR,
    displayName: 'Coir & Natural Fibers',
    keywords: [
      'coir', 'coconut fiber', 'coir pith', 'coir yarn', 'coir rope', 'coir mat', 'coir geotextiles',
      'coconut husk', 'defibering'
    ],
    exclusiveSchemeIndicators: [
      'coir', 'coconut fiber'
    ],
    relatedDomains: [BusinessDomain.HANDICRAFTS_ARTISANS, BusinessDomain.MANUFACTURING_GENERAL]
  },

  [BusinessDomain.STREET_VENDING]: {
    id: BusinessDomain.STREET_VENDING,
    displayName: 'Street Vending & Micro Retail',
    keywords: [
      'street vendor', 'street vendors', 'vending', 'roadside stall', 'hawker', 'hawkers',
      'small stall', 'mobile vendor', 'street business', 'cart vendor', 'footpath vendor',
      'thela', 'rehri', 'street food stall', 'pavement vendor', 'peri-urban vendor',
      'food stall', 'tea stall', 'fruit cart', 'vegetable cart', 'daily market vendor'
    ],
    exclusiveSchemeIndicators: [
      'street vendor', 'street vendors', 'svanidhi', 'hawker', 'hawkers'
    ],
    relatedDomains: [BusinessDomain.SERVICES_GENERAL]
  },

  [BusinessDomain.TECH_STARTUP]: {
    id: BusinessDomain.TECH_STARTUP,
    displayName: 'Technology / Startup',
    keywords: [
      'technology startup', 'tech startup', 'startup', 'startups', 'software', 'digital product',
      'technology', 'innovation', 'innovative', 'tech venture', 'product development',
      'app development', 'saas', 'ai', 'iot', 'biotech', 'deeptech', 'dpiit', 'incubator',
      'seed support', 'prototyping', 'validation', 'intellectual property', 'ipr', 'tech platform',
      'proof of concept', 'poc', 'early stage funding', 'angel funding', 'accelerator'
    ],
    exclusiveSchemeIndicators: [
      'startup', 'incubator', 'seed fund', 'dpiit', 'innovative startup', 'nidhi', 'sisfs',
      'samridh', 'genesis', 'idex', 'biotechnology ignition'
    ],
    relatedDomains: [BusinessDomain.SERVICES_GENERAL, BusinessDomain.MANUFACTURING_GENERAL]
  },

  [BusinessDomain.MANUFACTURING_GENERAL]: {
    id: BusinessDomain.MANUFACTURING_GENERAL,
    displayName: 'Manufacturing',
    keywords: [
      'manufacturing', 'production', 'factory', 'machinery', 'manufacturing unit', 'production unit',
      'fabrication', 'assembly', 'industrial unit', 'equipment', 'tools', 'raw material processing',
      'hardware', 'plastics', 'packaging unit', 'household products', 'metal works', 'paper products'
    ],
    exclusiveSchemeIndicators: [],
    relatedDomains: [BusinessDomain.HANDLOOM_TEXTILES, BusinessDomain.FOOD_PROCESSING, BusinessDomain.HANDICRAFTS_ARTISANS]
  },

  [BusinessDomain.SERVICES_BEAUTY]: {
    id: BusinessDomain.SERVICES_BEAUTY,
    displayName: 'Beauty & Personal Care Services',
    keywords: [
      'beauty', 'salon', 'parlour', 'personal care', 'cosmetology', 'hair styling', 'spa',
      'wellness', 'skincare', 'makeup', 'beautician', 'bridal', 'grooming', 'hairdressing'
    ],
    exclusiveSchemeIndicators: [],
    relatedDomains: [BusinessDomain.SERVICES_GENERAL]
  },

  [BusinessDomain.SERVICES_GENERAL]: {
    id: BusinessDomain.SERVICES_GENERAL,
    displayName: 'Services & Commercial Activities',
    keywords: [
      'service', 'services', 'repair', 'maintenance', 'hospitality', 'consulting',
      'cleaning service', 'transport', 'logistics', 'coaching', 'digital service',
      'printing', 'servicing unit', 'commercial service', 'auto repair', 'tailoring shop'
    ],
    exclusiveSchemeIndicators: [],
    relatedDomains: [BusinessDomain.SERVICES_BEAUTY, BusinessDomain.STREET_VENDING]
  },

  [BusinessDomain.AGRICULTURE_ALLIED]: {
    id: BusinessDomain.AGRICULTURE_ALLIED,
    displayName: 'Agriculture / Allied Activities',
    keywords: [
      'agriculture', 'farming', 'allied activities', 'poultry', 'fisheries', 'horticulture',
      'sericulture', 'organic farming', 'floriculture', 'aquaculture', 'bee keeping',
      'apiculture', 'animal husbandry', 'crops', 'plantation', 'seed production'
    ],
    exclusiveSchemeIndicators: [
      'agri-entrepreneurship', 'agrisure', 'rkvy'
    ],
    relatedDomains: [BusinessDomain.DAIRY, BusinessDomain.FOOD_PROCESSING]
  }
};

/**
 * Generic words that alone must NEVER create a high match or inflate semantic similarity scores.
 */
export const GENERIC_STOP_WORDS = new Set([
  'business', 'businesses', 'entrepreneur', 'entrepreneurs', 'enterprise', 'enterprises',
  'scheme', 'schemes', 'government', 'loan', 'loans', 'support', 'financial', 'finance',
  'fund', 'funds', 'funding', 'application', 'applications', 'beneficiary', 'beneficiaries',
  'eligible', 'eligibility', 'development', 'assistance', 'program', 'programme', 'project',
  'projects', 'unit', 'units', 'india', 'national', 'state', 'central', 'ministry', 'department',
  'subsidy', 'subsidies', 'credit', 'bank', 'banks', 'amount', 'maximum', 'upto', 'under',
  'criteria', 'general', 'activity', 'activities', 'small', 'micro', 'medium', 'msme',
  'sector', 'sectors', 'help', 'start', 'starting', 'established', 'existing', 'annual',
  'turnover', 'cost', 'person', 'persons', 'individual', 'individuals', 'need', 'needs',
  'want', 'wants', 'provide', 'provides', 'provided', 'benefit', 'benefits', 'portal',
  'official', 'apply', 'details', 'rule', 'rules', 'requirement', 'requirements',
  'guideline', 'guidelines', 'standard', 'concession', 'margin', 'rate', 'interest',
  'new', 'plan', 'planning', 'scale', 'local', 'area', 'work', 'working', 'capital',
  // Common grammatical stop words
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
  'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
  'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);
