import { SCHEMES_DATABASE } from '../data/schemes';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  relatedSchemes?: { id: string; name: string }[];
}

export function generateAssistantReply(query: string, language: 'en' | 'te' | 'hi' = 'en'): {
  reply: string;
  matchedSchemes: { id: string; name: string }[];
} {
  const cleanQ = query.trim().toLowerCase();

  if (!cleanQ) {
    return {
      reply: language === 'hi' 
        ? 'कृपया अपना प्रश्न लिखें।' 
        : language === 'te' 
        ? 'దయచేసి మీ ప్రశ్నను నమోదు చేయండి.' 
        : 'Please enter your question.',
      matchedSchemes: []
    };
  }

  // 1. Check for specific schemes
  const matchedSchemes: { id: string; name: string }[] = [];

  const mentionsPmegp = cleanQ.includes('pmegp') || cleanQ.includes('employment generation') || cleanQ.includes('prime minister employment');
  const mentionsStandup = cleanQ.includes('stand up') || cleanQ.includes('standup') || cleanQ.includes('greenfield');
  const mentionsMudra = cleanQ.includes('mudra') || cleanQ.includes('shishu') || cleanQ.includes('kishore') || cleanQ.includes('tarun');
  const mentionsVishwakarma = cleanQ.includes('vishwakarma') || cleanQ.includes('artisan') || cleanQ.includes('craft') || cleanQ.includes('toolkit') || cleanQ.includes('carpenter') || cleanQ.includes('potter');
  const mentionsFood = cleanQ.includes('food') || cleanQ.includes('processing') || cleanQ.includes('pmfme') || cleanQ.includes('fssai') || cleanQ.includes('odop');
  const mentionsCgtmse = cleanQ.includes('cgtmse') || cleanQ.includes('guarantee') || cleanQ.includes('collateral free') || cleanQ.includes('no collateral');
  const mentionsNssh = cleanQ.includes('nssh') || cleanQ.includes('hub') || cleanQ.includes('cpse') || cleanQ.includes('tender');
  const mentionsShg = cleanQ.includes('shg') || cleanQ.includes('nrlm') || cleanQ.includes('aajeevika') || cleanQ.includes('self help');
  const mentionsCoir = cleanQ.includes('coir') || cleanQ.includes('spinning');
  const mentionsAsiim = cleanQ.includes('asiim') || cleanQ.includes('student') || cleanQ.includes('innovation') || cleanQ.includes('equity');

  // General theme checks
  const asksWomen = cleanQ.includes('women') || cleanQ.includes('female') || cleanQ.includes('mahila') || cleanQ.includes('మహిళ');
  const asksScSt = cleanQ.includes('sc') || cleanQ.includes('st') || cleanQ.includes('dalit') || cleanQ.includes('tribal') || cleanQ.includes('caste');
  const asksSubsidy = cleanQ.includes('subsidy') || cleanQ.includes('grant') || cleanQ.includes('discount') || cleanQ.includes('సబ్సిడీ') || cleanQ.includes('सब्सिडी');
  const asksDocs = cleanQ.includes('document') || cleanQ.includes('certificate') || cleanQ.includes('paper') || cleanQ.includes('పత్రాలు') || cleanQ.includes('दस्तावेज');
  const asksManufacturing = cleanQ.includes('manufacturing') || cleanQ.includes('factory') || cleanQ.includes('production') || cleanQ.includes('యంత్రాలు');

  // Specific Scheme Questions
  if (mentionsPmegp) {
    const s = SCHEMES_DATABASE.find(x => x.id === 'pmegp')!;
    matchedSchemes.push({ id: s.id, name: s.name });
    return {
      reply: `Regarding Prime Minister's Employment Generation Programme (PMEGP):
• Financial Benefit: Provides 25% to 35% capital subsidy (Margin Money). Special categories (SC/ST/OBC/Women/Rural) receive up to 35% subsidy in rural areas.
• Project Limits: Up to ₹50 Lakhs for manufacturing ventures and up to ₹20 Lakhs for service projects.
• Eligibility: Minimum 18 years of age. At least 8th pass for manufacturing projects above ₹10 Lakhs.
• Where to apply: KVIC PMEGP online portal.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  if (mentionsVishwakarma) {
    const s = SCHEMES_DATABASE.find(x => x.id === 'pm-vishwakarma')!;
    matchedSchemes.push({ id: s.id, name: s.name });
    return {
      reply: `Regarding PM Vishwakarma Scheme:
• Target Vocations: 18 traditional artisan trades (carpenters, blacksmiths, potters, sculptors, weavers, etc.).
• Key Benefits: ₹15,000 modern toolkit grant voucher, basic skill training with ₹500/day stipend, and collateral-free loan up to ₹3 Lakhs at a concessional 5% interest rate.
• Application: Enrollment through Common Service Centres (CSC) with biometric verification on pmvishwakarma.gov.in.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  if (mentionsMudra) {
    const s = SCHEMES_DATABASE.find(x => x.id === 'pm-mudra-shishu-kishore-tarun')!;
    matchedSchemes.push({ id: s.id, name: s.name });
    return {
      reply: `Regarding Pradhan Mantri MUDRA Yojana (PMMY):
• Three Loan Categories:
  1. Shishu: Loans up to ₹50,000 (ideal for tiny vendors & start-up tools).
  2. Kishore: Loans above ₹50,000 up to ₹5 Lakhs (equipment & working capital).
  3. Tarun: Loans above ₹5 Lakhs up to ₹10 Lakhs (established enterprise scaling).
• Collateral: Zero collateral security needed. MUDRA Card provided for flexible cash credit.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  if (mentionsStandup) {
    const s = SCHEMES_DATABASE.find(x => x.id === 'standup-india')!;
    matchedSchemes.push({ id: s.id, name: s.name });
    return {
      reply: `Regarding Stand-Up India:
• Target Beneficiaries: Specifically for Scheduled Caste (SC), Scheduled Tribe (ST), and Women entrepreneurs.
• Loan Size: Bank credit from ₹10 Lakhs up to ₹1 Crore for setting up a greenfield (first-time) manufacturing, service, trading, or agri-allied enterprise.
• Support: 85% composite loan with 7-year repayment window and SIDBI handholding support.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  if (mentionsFood) {
    const s = SCHEMES_DATABASE.find(x => x.id === 'pmfme-scheme')!;
    matchedSchemes.push({ id: s.id, name: s.name });
    return {
      reply: `Regarding PMFME (PM Formalisation of Micro Food Processing Enterprises):
• Benefit: 35% credit-linked capital subsidy up to ₹10 Lakhs for micro food processing units, SHGs, and FPOs.
• Focus: One District One Product (ODOP) value-addition, FSSAI certification support, and modern packaging machinery.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  // Cross-Cutting Queries
  if (asksWomen && asksSubsidy) {
    matchedSchemes.push(
      { id: 'pmegp', name: "PMEGP (Up to 35% Rural Subsidy)" },
      { id: 'standup-india', name: 'Stand-Up India (₹10L - ₹1Cr)' },
      { id: 'mahila-coir-yojana', name: 'Mahila Coir Yojana (75% Machinery Subsidy)' },
      { id: 'day-nrlm-enterprise', name: 'DAY-NRLM (Subsidized SHG Loans)' }
    );
    return {
      reply: `Government schemes offering high subsidies or loans for Women Entrepreneurs:
1. PMEGP: Offers 35% capital subsidy for women setting up manufacturing or services in rural areas (25% in urban).
2. Stand-Up India: Mandates at least one bank loan between ₹10 Lakhs and ₹1 Crore per bank branch for women greenfield ventures.
3. Mahila Coir Yojana: Offers 75% machinery subsidy on modern spinning equipment with free 2-month training.
4. DAY-NRLM: Interest-subvented credit down to 7% (or 4% on prompt repayment) for women SHG enterprises.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  if (asksScSt) {
    matchedSchemes.push(
      { id: 'standup-india', name: 'Stand-Up India' },
      { id: 'nssh-hub', name: 'National SC-ST Hub (NSSH)' },
      { id: 'asiim-sc-st', name: 'Ambedkar Social Innovation Mission (ASIIM)' },
      { id: 'pmegp', name: 'PMEGP (Special Category 35% Subsidy)' }
    );
    return {
      reply: `Key government schemes dedicated to SC & ST Entrepreneurs:
1. Stand-Up India: Bank loans from ₹10 Lakhs to ₹1 Crore for greenfield projects.
2. National SC-ST Hub (NSSH): 25% capital subsidy on technology upgrades up to ₹25 Lakhs, 100% booth reimbursement in exhibitions, and 4% CPSE procurement quota.
3. ASIIM Mission: Up to ₹30 Lakhs equity funding over 3 years for innovative SC/ST student and youth startups.
4. PMEGP: Special category designation gives 35% margin money subsidy in rural locations.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  if (asksDocs) {
    return {
      reply: `Standard documentation required for government enterprise schemes:
1. Identity Proof: Aadhaar Card, Voter ID, or PAN Card.
2. Address Proof: Domicile Certificate, Ration Card, or utility bill.
3. Caste/Category Certificate: Issued by Tahsildar / Competent Authority (mandatory for SC/ST/OBC benefits).
4. Detailed Project Report (DPR): Explaining proposed business activity, machinery cost, and financial projections.
5. Bank Account Details: Passbook copy or cancelled cheque.
6. Educational Proof: 8th/10th certificate for manufacturing units over ₹10 Lakhs.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes: [{ id: 'pmegp', name: 'PMEGP' }, { id: 'pm-mudra-shishu-kishore-tarun', name: 'PM MUDRA' }]
    };
  }

  if (asksSubsidy) {
    matchedSchemes.push(
      { id: 'pmegp', name: 'PMEGP (25% - 35% Subsidy)' },
      { id: 'pmfme-scheme', name: 'PMFME (35% Subsidy up to ₹10L)' },
      { id: 'mahila-coir-yojana', name: 'Mahila Coir Yojana (75% Subsidy)' },
      { id: 'nssh-hub', name: 'NSSH (25% Technology Subsidy)' }
    );
    return {
      reply: `Subsidies available in the scheme dataset:
• PMEGP: 15% to 35% Margin Money subsidy (up to ₹17.5 Lakhs grant on ₹50L manufacturing project).
• PMFME: 35% credit-linked capital subsidy up to ₹10 Lakhs for micro food processing.
• Mahila Coir Yojana: 75% machinery subsidy for rural women artisans.
• PM Vishwakarma: ₹15,000 toolkit voucher grant plus interest subvention (interest capped at 5%).

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  if (mentionsCgtmse || cleanQ.includes('collateral')) {
    const s = SCHEMES_DATABASE.find(x => x.id === 'cgtmse-guarantee')!;
    matchedSchemes.push({ id: s.id, name: s.name });
    return {
      reply: `Regarding Collateral-Free Loans (CGTMSE & MUDRA):
• CGTMSE provides credit guarantee coverage up to ₹5 Crore without requiring immovable property or third-party guarantee.
• MUDRA Yojana provides micro-loans up to ₹10 Lakhs with zero collateral across Shishu, Kishore, and Tarun tiers.
• PM Vishwakarma offers collateral-free loans up to ₹3 Lakhs at 5% interest for traditional artisans.

Please verify this information with the respective official scheme authority.`,
      matchedSchemes
    };
  }

  // Fallback strictly obeying prompt rule:
  // "If an answer cannot be determined, say: Please verify this information with the respective official scheme authority. Do not invent government information."
  return {
    reply: `I could not locate verified details for this specific query within our local scheme dataset.

Please verify this information with the respective official scheme authority.`,
    matchedSchemes: []
  };
}
