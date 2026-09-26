import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { SCHEMES_DATABASE } from './src/data/schemes';

const app = express();
const PORT = 3000;

app.use(express.json());

// Prepare condensed scheme context for grounding Gemini
const schemesContextSummary = SCHEMES_DATABASE.map(s => ({
  id: s.id,
  name: s.name,
  shortName: s.shortName,
  level: s.governmentLevel,
  ministry: s.ministryDepartment,
  beneficiary: s.targetBeneficiary,
  gender: s.genderEligibility,
  socialCategory: s.socialCategoryEligibility,
  states: s.statesCovered,
  businessTypes: s.businessTypes,
  businessStage: s.businessStage,
  keyBenefit: s.keyBenefit,
  maximumBenefit: s.maximumBenefit,
  eligibility: s.eligibilityCriteria,
  documents: s.requiredDocuments,
  applicationUrl: s.officialApplicationUrl,
  sourceUrl: s.sourceUrl
}));

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// System instructions for Saathi AI
const SYSTEM_INSTRUCTION = `You are "Saathi AI", the dedicated Government Scheme Assistant for the SchemeSaathi platform.
Your mission is to help Indian micro, small, rural, and marginalized entrepreneurs (especially women, SC, ST, OBC, artisans, and youth) understand government schemes, check eligibility, explore documents, compare schemes, and understand application steps.

RULES FOR DATA ACCURACY & INTEGRITY:
1. Ground every answer STRICTLY in the provided SchemeSaathi verified scheme database.
2. NEVER hallucinate or invent scheme names, eligibility rules, percentages, subsidy amounts, deadlines, or URLs.
3. If an asked scheme or requested detail is not present in the SchemeSaathi database, explicitly state:
   "I couldn't verify that information from the available SchemeSaathi data. Please check the official scheme source."
4. Always provide the official application URL or source URL when discussing a specific scheme.
5. Trust & Safety Disclaimer: Remind users when giving match or benefit guidance:
   "Final eligibility and benefits are determined by the official government authority."

STRICT RESPONSE STYLE (CRITICAL):
- DO NOT give long paragraphs. Be direct, concise, and actionable.
- Important points only with short sentences.
- Default format: 3–6 concise bullet points when appropriate.
- Use headings when useful (e.g. ### Scheme Name).
- Highlight important eligibility, documents, and benefits clearly with emojis.
- Avoid repeating the user's question.
- Avoid unnecessary preambles or filler explanations.
- For simple questions: Answer in 1–3 short sentences or bullets.
- For complex questions: Break into small, scannable sections with concise bullet points.

RESPONSE STYLE EXAMPLE:
Instead of:
"PMEGP is a government scheme that provides financial assistance to entrepreneurs..."
Prefer:
"### PMEGP
- 💰 Benefit: Credit-linked subsidy (15% to 35%)
- 👤 For: New entrepreneurs & self-employment
- 📄 Key docs: Aadhaar, PAN, project report, bank passbook
- 📝 Apply: Official portal (https://www.kviconline.gov.in)
- ⚠️ Final sanctioning depends on bank & scheme rules."

LANGUAGE CAPABILITIES:
- You natively understand and reply in English, Telugu (తెలుగు), and Telugu-English mixed language (e.g. "Na business ki em schemes unnayi?", "Women entrepreneurs ki schemes em unnayi?", "Ee scheme ki eligibility enti?").
- Reply naturally in the same language or tone the user uses.
- NEVER mis-translate official scheme names (keep "PMEGP", "Stand-Up India", "PM Vishwakarma", "PM Mudra Yojana", "Mahila Coir Yojana", etc. intact).
- In Telugu/Telugu-English, follow the same concise, bullet-pointed format.

AVAILABLE VERIFIED SCHEME DATABASE:
${JSON.stringify(schemesContextSummary, null, 2)}
`;

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SchemeSaathi Backend',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Chatbot endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], userProfile = null, isAuthenticated = false } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API is not configured or unavailable.',
        fallbackNeeded: true
      });
      return;
    }

    // Prepare profile context if user is authenticated
    let userContext = '';
    if (isAuthenticated && userProfile) {
      userContext = `\nLOGGED IN USER PROFILE:\n` +
        `- Full Name: ${userProfile.personal?.fullName || 'Entrepreneur'}\n` +
        `- Age: ${userProfile.personal?.age || 'Not specified'}\n` +
        `- Gender: ${userProfile.personal?.gender || 'Not specified'}\n` +
        `- Social Category: ${userProfile.personal?.socialCategory || 'Not specified'}\n` +
        `- State & District: ${userProfile.personal?.state || 'Not specified'}, ${userProfile.personal?.district || ''}\n` +
        `- Area Type: ${userProfile.personal?.areaType || 'Rural'}\n` +
        `- Business Status: ${userProfile.business?.businessStatus || 'Not specified'}\n` +
        `- Enterprise Type: ${userProfile.business?.enterpriseType || 'Not specified'}\n` +
        `- Financial Assistance Required: ${userProfile.business?.financialAssistanceRequired || 'Not specified'}\n` +
        `- Investment Range: ${userProfile.business?.estimatedInvestment || userProfile.business?.currentInvestment || 'Not specified'}\n`;
    } else {
      userContext = `\nUSER STATUS: GUEST (NOT LOGGED IN).\n` +
        `Note: If this guest user asks for personalized recommendations, asking which scheme is best for them, checking their documents, or saving/applying, you MUST instruct them to Login or Register to continue using SchemeSaathi.`;
    }

    // Format chat contents
    const contents: any[] = [];
    
    // Add previous history (last 6 turns for context)
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const h of recentHistory) {
      if (h.sender === 'user') {
        contents.push({ role: 'user', parts: [{ text: h.text }] });
      } else if (h.sender === 'bot') {
        contents.push({ role: 'model', parts: [{ text: h.text }] });
      }
    }

    // Add current user prompt with context
    contents.push({
      role: 'user',
      parts: [{ text: `${userContext}\n\nUser Query: ${message}` }]
    });

    let replyText = '';
    
    // Try primary model: gemini-3.8-flash, fallback to gemini-3.1-flash-lite
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.4
        }
      });
      replyText = response.text || '';
    } catch (err1: any) {
      console.warn('Primary model error, attempting fallback model:', err1?.message);
      try {
        const response2 = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.4
          }
        });
        replyText = response2.text || '';
      } catch (err2: any) {
        console.warn('Fallback model error, using grounded scheme matcher:', err2?.message);
      }
    }

    if (!replyText) {
      res.json({
        reply: null,
        fallbackNeeded: true,
        disclaimer: 'Saathi provides guidance based on available scheme information. Final eligibility, approval and benefits are determined by the official government authority.'
      });
      return;
    }

    res.json({
      reply: replyText,
      disclaimer: 'Saathi provides guidance based on available scheme information. Final eligibility, approval and benefits are determined by the official government authority.'
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to process chat query.',
      fallbackNeeded: true
    });
  }
});

// Vite Middleware & Static Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SchemeSaathi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
