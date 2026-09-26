import React from 'react';
import { ShieldCheck, ExternalLink, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-16" id="gov-tech-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Main Minimal Footer Bar (Requirement 6) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80 text-center md:text-left">
          
          {/* Left: Government of India / Empowering Entrepreneurs / Building a Self-Reliant India */}
          <div className="space-y-1.5">
            <div className="text-sm font-bold text-white tracking-wide">
              Government of India
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Empowering Entrepreneurs • Building a Self-Reliant India
            </div>
            <div className="text-[11px] text-slate-500">
              SchemeSaathi Citizen Discovery Initiative
            </div>
          </div>

          {/* Right: Data from Firestore (schemes collection) with green indicator */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              Data from Firestore <span className="text-slate-500">(schemes collection)</span>
            </span>
          </div>
        </div>

        {/* Quick Official Portals & Navigation */}
        <div className="py-6 flex flex-wrap items-center justify-between gap-4 text-xs border-b border-slate-800/60">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
              Home
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('find-schemes')} className="hover:text-white transition-colors cursor-pointer">
              Find My Scheme
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('find-schemes')} className="hover:text-white transition-colors cursor-pointer">
              Browse Schemes
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('guide')} className="hover:text-white transition-colors cursor-pointer">
              Application Guide
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('help')} className="hover:text-white transition-colors cursor-pointer">
              Citizen Help
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
            <span className="text-slate-500">Official Direct:</span>
            <a href="https://www.jansamarth.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-0.5">
              JanSamarth <ArrowUpRight className="w-3 h-3 text-slate-500" />
            </a>
            <a href="https://udyamregistration.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-0.5">
              Udyam <ArrowUpRight className="w-3 h-3 text-slate-500" />
            </a>
            <a href="https://www.standupmitra.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-0.5">
              Stand-Up Mitra <ArrowUpRight className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Bottom Bar: Disclaimers & Copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-slate-500">
          <div className="max-w-3xl leading-relaxed">
            <p className="text-[11px]">
              <strong>Disclaimer:</strong> SchemeSaathi is an independent informational discovery platform. Official scheme criteria, terms, and financial sanctions are determined solely by the issuing Government authorities and designated banks.
            </p>
          </div>
          <div className="shrink-0 text-[11px] text-slate-400">
            © {currentYear} SchemeSaathi.
          </div>
        </div>
      </div>
    </footer>
  );
};
