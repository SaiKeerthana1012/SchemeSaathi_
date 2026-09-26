import React from 'react';
import { Search, User, FileText } from 'lucide-react';
import { INDIA_MAP_PATH } from './indiaMapData';

export const HomeHeroIllustration: React.FC = () => {
  return (
    <div
      className="relative w-full max-w-2xl mx-auto flex items-center justify-center select-none"
      id="home-hero-blueprint-wrapper"
    >
      {/* Soft Ambient Radial Glow */}
      <div className="absolute inset-0 bg-blue-100/35 rounded-full filter blur-3xl transform scale-90 -z-10 pointer-events-none" />

      {/* Main Blueprint Canvas Stage */}
      <div className="relative w-full aspect-[16/12] sm:aspect-[16/11] flex items-center justify-center overflow-visible">
        
        {/* ======================================================== */}
        {/* SVG: AUTHENTIC GEOGRAPHICAL OUTLINE MAP OF INDIA (BLUEPRINT) */}
        {/* ======================================================== */}
        <svg
          viewBox="100 0 850 980"
          className="w-full h-full drop-shadow-2xs overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Blueprint Translucent Gradient Fill */}
            <linearGradient id="indiaBlueprintFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#EFF6FF" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#E0F2FE" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.45" />
            </linearGradient>

            {/* Glowing Node Radial Gradient */}
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </radialGradient>

            {/* Subtle Blueprint Grid Pattern */}
            <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#93C5FD" strokeWidth="0.5" strokeOpacity="0.2" />
              <circle cx="40" cy="40" r="0.75" fill="#60A5FA" fillOpacity="0.3" />
            </pattern>
          </defs>

          {/* ======================================================== */}
          {/* 1. SUBTLE DIGITAL BACKGROUND GRID & LATITUDE ARCS */}
          {/* ======================================================== */}
          <g id="digital-blueprint-grid" opacity="0.6">
            <rect x="100" y="0" width="850" height="980" fill="url(#blueprintGrid)" />
            
            {/* Orbital longitude/latitude communication arcs */}
            <ellipse cx="430" cy="500" rx="360" ry="240" stroke="#BFDBFE" strokeWidth="0.8" strokeDasharray="5 6" opacity="0.6" />
            <ellipse cx="410" cy="480" rx="420" ry="310" stroke="#DBEAFE" strokeWidth="0.6" strokeDasharray="4 8" opacity="0.5" />
            
            {/* Meridian guide lines */}
            <line x1="410" y1="40" x2="410" y2="940" stroke="#DBEAFE" strokeWidth="0.75" strokeDasharray="3 5" opacity="0.5" />
            <line x1="160" y1="490" x2="820" y2="490" stroke="#DBEAFE" strokeWidth="0.75" strokeDasharray="3 5" opacity="0.5" />
          </g>

          {/* ======================================================== */}
          {/* 2. AUTHENTIC GEOGRAPHICAL OUTLINE MAP OF INDIA */}
          {/* ======================================================== */}
          <g id="authentic-india-boundary">
            {/* Transformation maps the Potrace geometry (bottom-up, scale 10) into top-down 1024 coordinate system */}
            <g transform="translate(0, 1024) scale(0.1, -0.1)">
              
              {/* Primary Geographical Silhouette with Soft Light Blue Translucent Fill & Royal Blue Outline */}
              <path
                d={INDIA_MAP_PATH}
                fill="url(#indiaBlueprintFill)"
                stroke="#1D4ED8"
                strokeWidth="15"
                strokeOpacity="0.45"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Dotted/Dashed Digital Blueprint Precision Boundary */}
              <path
                d={INDIA_MAP_PATH}
                fill="none"
                stroke="#60A5FA"
                strokeWidth="8"
                strokeDasharray="45 30"
                strokeOpacity="0.7"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* ======================================================== */}
          {/* 3. DIGITAL SCHEME NETWORK (Circuits & Hub Connections) */}
          {/* ======================================================== */}
          <g id="digital-scheme-network" opacity="0.85">
            {/* Connected Circuit & Communication Lines */}
            <g stroke="#60A5FA" strokeWidth="1.2" opacity="0.65">
              {/* North - West route */}
              <line x1="404" y1="90" x2="370" y2="275" strokeDasharray="3 3" />
              <line x1="370" y1="275" x2="320" y2="340" />
              <line x1="320" y1="340" x2="230" y2="460" />
              <line x1="230" y1="460" x2="240" y2="580" />
              
              {/* North - Central - South route */}
              <line x1="370" y1="275" x2="390" y2="450" />
              <line x1="390" y1="450" x2="405" y2="630" />
              <line x1="405" y1="630" x2="380" y2="760" />
              <line x1="380" y1="760" x2="380" y2="910" />

              {/* West - Deccan - South route */}
              <line x1="240" y1="580" x2="405" y2="630" strokeDasharray="3 3" />
              <line x1="405" y1="630" x2="455" y2="760" />
              <line x1="380" y1="760" x2="455" y2="760" />
              <line x1="455" y1="760" x2="380" y2="910" />

              {/* Central - East route */}
              <line x1="390" y1="450" x2="680" y2="460" strokeDasharray="3 3" />
              <line x1="370" y1="275" x2="680" y2="460" />
              
              {/* East - Northeast route */}
              <line x1="680" y1="460" x2="800" y2="360" />
            </g>

            {/* Glowing Network Nodes across Key Scheme Hubs */}
            
            {/* Northern Hub (Ladakh) */}
            <g transform="translate(404, 90)">
              <circle cx="0" cy="0" r="14" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="4.5" fill="#3B82F6" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
            </g>

            {/* New Delhi Hub (National Schemes) */}
            <g transform="translate(370, 275)">
              <circle cx="0" cy="0" r="18" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="5.5" fill="#1D4ED8" />
              <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="10" stroke="#60A5FA" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.6" />
            </g>

            {/* Jaipur Hub */}
            <g transform="translate(320, 340)">
              <circle cx="0" cy="0" r="12" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="4" fill="#2563EB" />
              <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Ahmedabad / Gujarat Hub */}
            <g transform="translate(230, 460)">
              <circle cx="0" cy="0" r="14" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="4.5" fill="#2563EB" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
            </g>

            {/* Mumbai Hub */}
            <g transform="translate(240, 580)">
              <circle cx="0" cy="0" r="16" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="5" fill="#1D4ED8" />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>

            {/* Central / Bhopal Hub */}
            <g transform="translate(390, 450)">
              <circle cx="0" cy="0" r="12" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="3.5" fill="#60A5FA" />
              <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Hyderabad Hub */}
            <g transform="translate(405, 630)">
              <circle cx="0" cy="0" r="15" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="4.5" fill="#2563EB" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
            </g>

            {/* Bengaluru Hub */}
            <g transform="translate(380, 760)">
              <circle cx="0" cy="0" r="16" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="5" fill="#1D4ED8" />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>

            {/* Chennai Hub */}
            <g transform="translate(455, 760)">
              <circle cx="0" cy="0" r="14" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="4.5" fill="#2563EB" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
            </g>

            {/* Kolkata / East Hub */}
            <g transform="translate(680, 460)">
              <circle cx="0" cy="0" r="16" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="5" fill="#1D4ED8" />
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>

            {/* Guwahati / Northeast Hub */}
            <g transform="translate(800, 360)">
              <circle cx="0" cy="0" r="14" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="4.5" fill="#3B82F6" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
            </g>

            {/* Southern Tip (Kanyakumari) */}
            <g transform="translate(380, 910)">
              <circle cx="0" cy="0" r="12" fill="url(#nodeGlow)" />
              <circle cx="0" cy="0" r="4" fill="#60A5FA" />
              <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
            </g>
          </g>

          {/* ======================================================== */}
          {/* 4. CALLIGRAPHIC SLOGAN: "Your Growth Our Priority" */}
          {/* ======================================================== */}
          <g id="slogan-calligraphy" transform="translate(690, 680)">
            <text
              x="0"
              y="0"
              fill="#1D4ED8"
              fontSize="30"
              fontWeight="600"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontStyle="italic"
              letterSpacing="0.4"
            >
              Your Growth
            </text>
            <text
              x="20"
              y="32"
              fill="#1D4ED8"
              fontSize="29"
              fontWeight="600"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontStyle="italic"
              letterSpacing="0.4"
            >
              Our Priority
            </text>
            {/* Sleek Dynamic Green Swash Underline */}
            <path
              d="M 24 52 C 54 44, 110 38, 146 50 C 114 56, 68 62, 24 52 Z"
              fill="#16A34A"
            />
          </g>
        </svg>

        {/* ======================================================== */}
        {/* 5. THREE FLOATING UI CARDS (Precise Positioning) */}
        {/* ======================================================== */}

        {/* CARD 1: TOP-LEFT OF MAP
            Green circle with white search magnifying glass
            Find / Relevant Schemes */}
        <div
          id="card-find-relevant-schemes"
          className="absolute top-[8%] left-[-4%] sm:left-[0%] bg-white/95 backdrop-blur-xs border border-slate-100 shadow-md hover:shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-3 z-20 transition-all hover:-translate-y-0.5"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Search className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 block leading-tight">Find</span>
            <span className="text-xs text-slate-500 font-medium block">Relevant Schemes</span>
          </div>
        </div>

        {/* CARD 2: MIDDLE-LEFT OF MAP
            Royal blue circle with white user silhouette
            Check / Eligibility */}
        <div
          id="card-check-eligibility"
          className="absolute top-[42%] left-[-6%] sm:left-[-3%] bg-white/95 backdrop-blur-xs border border-slate-100 shadow-md hover:shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-3 z-20 transition-all hover:-translate-y-0.5"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <User className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 block leading-tight">Check</span>
            <span className="text-xs text-slate-500 font-medium block">Eligibility</span>
          </div>
        </div>

        {/* CARD 3: RIGHT OF MAP
            Golden-amber circle with white document icon
            Get Official / Application Links */}
        <div
          id="card-get-official-links"
          className="absolute top-[26%] right-[-3%] sm:right-[0%] bg-white/95 backdrop-blur-xs border border-slate-100 shadow-md hover:shadow-lg rounded-2xl px-4 py-2.5 flex items-center gap-3 z-20 transition-all hover:-translate-y-0.5"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileText className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 block leading-tight">Get Official</span>
            <span className="text-xs text-slate-500 font-medium block">Application Links</span>
          </div>
        </div>

      </div>
    </div>
  );
};
