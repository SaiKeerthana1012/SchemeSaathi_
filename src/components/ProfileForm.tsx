import React, { useState, useEffect } from 'react';
import { 
  Language, 
  UserProfile, 
  PersonalInfo, 
  BusinessInfo, 
  BusinessStatus, 
  EnterpriseType, 
  SocialCategory, 
  Gender 
} from '../types';
import { TRANSLATIONS } from '../translations';
import { 
  User, 
  MapPin, 
  Briefcase, 
  FileCheck, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface ProfileFormProps {
  language: Language;
  initialProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
  onCancel?: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other State/UT'
];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  language,
  initialProfile,
  onSaveProfile,
  onCancel
}) => {
  const t = TRANSLATIONS[language];
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [personal, setPersonal] = useState<PersonalInfo>({
    fullName: initialProfile?.personal?.fullName || '',
    age: initialProfile?.personal?.age || '',
    state: initialProfile?.personal?.state || 'Telangana',
    district: initialProfile?.personal?.district || '',
    areaType: initialProfile?.personal?.areaType || 'Rural',
    gender: initialProfile?.personal?.gender || 'Female',
    socialCategory: initialProfile?.personal?.socialCategory || 'SC',
    annualFamilyIncome: initialProfile?.personal?.annualFamilyIncome || '1.5 Lakh - 3 Lakh',
    educationLevel: initialProfile?.personal?.educationLevel || '10th Pass',
    isDifferentlyAbled: initialProfile?.personal?.isDifferentlyAbled ?? false,
    hasAadhaar: initialProfile?.personal?.hasAadhaar ?? true,
    hasBankAccount: initialProfile?.personal?.hasBankAccount ?? true,
    landHolding: initialProfile?.personal?.landHolding || 'Marginal / Landless (< 1 hectare)'
  });

  const [business, setBusiness] = useState<BusinessInfo>({
    businessStatus: initialProfile?.business?.businessStatus || 'I want to start a business',
    businessCategory: initialProfile?.business?.businessCategory || '',
    enterpriseType: initialProfile?.business?.enterpriseType || 'Manufacturing',
    financialAssistanceRequired: initialProfile?.business?.financialAssistanceRequired || 'Subsidy & Term Loan',
    businessDescription: initialProfile?.business?.businessDescription || '',
    businessIdea: initialProfile?.business?.businessIdea || '',
    proposedLocation: initialProfile?.business?.proposedLocation || 'Rural',
    estimatedInvestment: initialProfile?.business?.estimatedInvestment || '₹5 Lakhs - ₹10 Lakhs',
    expectedEmployees: initialProfile?.business?.expectedEmployees || '4',
    businessName: initialProfile?.business?.businessName || '',
    businessStage: initialProfile?.business?.businessStage || 'Early Stage (1-3 years)',
    currentInvestment: initialProfile?.business?.currentInvestment || '₹3 Lakhs',
    additionalInvestmentRequired: initialProfile?.business?.additionalInvestmentRequired || '₹5 Lakhs',
    expansionPlan: initialProfile?.business?.expansionPlan || '',
    numberEmployees: initialProfile?.business?.numberEmployees || '3'
  });

  // Sync when initialProfile changes
  useEffect(() => {
    if (initialProfile) {
      if (initialProfile.personal) {
        setPersonal(prev => ({
          ...prev,
          ...initialProfile.personal,
          isDifferentlyAbled: initialProfile.personal.isDifferentlyAbled ?? false,
          hasAadhaar: initialProfile.personal.hasAadhaar ?? true,
          hasBankAccount: initialProfile.personal.hasBankAccount ?? true,
          landHolding: initialProfile.personal.landHolding || 'Marginal / Landless (< 1 hectare)'
        }));
      }
      if (initialProfile.business) {
        setBusiness(prev => ({ ...prev, ...initialProfile.business }));
      }
    }
  }, [initialProfile]);

  // Validation functions
  const validateStep1 = (): boolean => {
    if (!personal.fullName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return false;
    }
    const ageNum = Number(personal.age);
    if (!personal.age || isNaN(ageNum) || ageNum < 18 || ageNum > 90) {
      setErrorMessage('Please enter a valid age between 18 and 90 years.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!personal.state.trim()) {
      setErrorMessage('Please select your State.');
      return false;
    }
    if (!personal.district.trim()) {
      setErrorMessage('Please enter your District name.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep3 = (): boolean => {
    if (business.businessDescription?.trim() && !business.businessIdea?.trim()) {
      business.businessIdea = business.businessDescription;
    }
    if (business.businessStatus === 'I want to start a business') {
      if (!business.businessIdea?.trim() && !business.businessDescription?.trim()) {
        setErrorMessage('Please describe your proposed Business Idea or Description.');
        return false;
      }
    } else {
      if (!business.businessName?.trim()) {
        setErrorMessage('Please enter your current Business / Enterprise Name.');
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep4 = (): boolean => {
    if (!personal.annualFamilyIncome.trim()) {
      setErrorMessage('Please select your Annual Household Income range.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleCalculateEligibility = () => {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      return;
    }

    const completedProfile: UserProfile = {
      personal,
      business,
      updatedAt: new Date().toISOString()
    };
    onSaveProfile(completedProfile);
  };

  const stepsConfig = [
    { num: 1, title: 'Personal Demographics', short: 'Demographics', icon: User },
    { num: 2, title: 'Location & Geography', short: 'Location', icon: MapPin },
    { num: 3, title: 'Business Details', short: 'Business', icon: Briefcase },
    { num: 4, title: 'Additional Criteria', short: 'Criteria', icon: FileCheck }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6" id="profile-wizard-container">
      {/* Wizard Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Citizen Profiler</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Find My Scheme Wizard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Provide your details to match tailored subsidy, grant, and loan programs.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 uppercase">Progress</span>
            <div className="text-xl font-black text-blue-700">Step {currentStep} of 4</div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mt-6">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {stepsConfig.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num === 1) setCurrentStep(1);
                    else if (s.num === 2 && validateStep1()) setCurrentStep(2);
                    else if (s.num === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                    else if (s.num === 4 && validateStep1() && validateStep2() && validateStep3()) setCurrentStep(4);
                  }}
                  className={`text-left p-2 sm:p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20'
                      : isPast
                      ? 'bg-slate-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isPast ? '✓' : s.num}
                    </div>
                    <span className={`text-xs font-bold truncate hidden sm:inline ${
                      isActive ? 'text-blue-950' : isPast ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {s.short}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress fill line */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-700 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center justify-between shadow-2xs" id="form-error-alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-rose-600 hover:text-rose-900 font-bold text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 1: Personal Demographics */}
      {/* ========================================================== */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6" id="wizard-step-1">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-950">Step 1: Personal Demographics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Demographic variables determine targeted subsidies for affirmative and priority categories under MSME & MoRD guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-fullName">
                Full Legal Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-fullName"
                type="text"
                value={personal.fullName}
                onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                placeholder="e.g. Lakshmi Devi"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">As per official Aadhaar / Government ID</span>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-age">
                Age (in years) <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-age"
                type="number"
                min="18"
                max="90"
                value={personal.age}
                onChange={(e) => setPersonal({ ...personal, age: e.target.value })}
                placeholder="e.g. 32"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Applicant must be at least 18 years old</span>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-gender">
                Gender <span className="text-rose-600">*</span>
              </label>
              <select
                id="select-gender"
                value={personal.gender}
                onChange={(e) => setPersonal({ ...personal, gender: e.target.value as Gender })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="Female">Female (Eligible for Stand-Up India, PMEGP Higher Subsidy)</option>
                <option value="Male">Male</option>
                <option value="Transgender">Transgender (Special inclusion)</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Women entrepreneurs qualify for up to 35% subsidies</span>
            </div>

            {/* Social Category */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-socialCategory">
                Social Category <span className="text-rose-600">*</span>
              </label>
              <select
                id="select-socialCategory"
                value={personal.socialCategory}
                onChange={(e) => setPersonal({ ...personal, socialCategory: e.target.value as SocialCategory })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="Minority">Minority (Christian, Muslim, Sikh, Jain, Buddhist, Parsi)</option>
                <option value="General">General Category</option>
                <option value="Specially Abled / PwD">Specially Abled / PwD</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Enables affirmative action benefits & margin reduction</span>
            </div>
          </div>

          {/* Differently Abled Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                id="check-differently-abled"
                checked={personal.isDifferentlyAbled}
                onChange={(e) => setPersonal({ ...personal, isDifferentlyAbled: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Differently Abled (PwD / Divyangjan)</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Check this box if you possess a disability certificate of 40% or more to unlock special concession grants.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 2: Location & Geography */}
      {/* ========================================================== */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6" id="wizard-step-2">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-950">Step 2: Location & Geography</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Many schemes (such as PMEGP Rural 35% vs Urban 25%) provide significantly different subsidy percentages based on geographic classification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-state">
                State / Union Territory <span className="text-rose-600">*</span>
              </label>
              <select
                id="select-state"
                value={personal.state}
                onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Unlocks both Central and State-specific assistance</span>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-district">
                District <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-district"
                type="text"
                value={personal.district}
                onChange={(e) => setPersonal({ ...personal, district: e.target.value })}
                placeholder="e.g. Warangal, Visakhapatnam, Pune"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">District Industries Centre (DIC) jurisdiction</span>
            </div>
          </div>

          {/* Area Type: Rural vs Urban */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Area Classification <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-4 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
                  personal.areaType === 'Rural'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="areaType"
                  value="Rural"
                  checked={personal.areaType === 'Rural'}
                  onChange={() => setPersonal({ ...personal, areaType: 'Rural' })}
                  className="mt-1 text-blue-700 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Rural Area (Gram Panchayat)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Highest subsidy bracket in PMEGP (35% for Special Categories, 25% for General).
                  </span>
                </div>
              </label>

              <label 
                className={`p-4 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
                  personal.areaType === 'Urban'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="areaType"
                  value="Urban"
                  checked={personal.areaType === 'Urban'}
                  onChange={() => setPersonal({ ...personal, areaType: 'Urban' })}
                  className="mt-1 text-blue-700 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Urban Area (Municipality / Corp)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Urban bracket subsidy (25% for Special Categories, 15% for General).
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 3: Business Details */}
      {/* ========================================================== */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6" id="wizard-step-3">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-950">Step 3: Business Details & Sector</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify your enterprise status, sector, and investment profile to match specific ministry schemes.
            </p>
          </div>

          {/* Business Stage Radio Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Business Stage <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { val: 'I want to start a business', label: 'New / Starting Out', desc: 'Seeking seed funding, PMEGP, Mudra Shishu' },
                { val: 'I already have a business', label: 'Existing Unit', desc: 'Operating micro enterprise seeking working capital' },
                { val: 'I want to expand my business', label: 'Expansion / Scaling', desc: 'Seeking modern machinery or Mudra Tarun' }
              ].map((stage) => (
                <label
                  key={stage.val}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all ${
                    business.businessStatus === stage.val
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name="businessStatus"
                      value={stage.val}
                      checked={business.businessStatus === stage.val}
                      onChange={() => setBusiness({ ...business, businessStatus: stage.val as BusinessStatus })}
                      className="text-blue-700 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-900">{stage.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{stage.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Business Category */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-businessCategory">
                Business Category <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-businessCategory"
                type="text"
                list="business-category-list"
                value={business.businessCategory || ''}
                onChange={(e) => setBusiness({ ...business, businessCategory: e.target.value })}
                placeholder="e.g. Handloom / Textiles"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              />
              <datalist id="business-category-list">
                <option value="Handloom / Textiles" />
                <option value="Food Processing" />
                <option value="Dairy / Food Processing" />
                <option value="Handicrafts" />
                <option value="Beauty & Personal Care Services" />
                <option value="Street Vending" />
                <option value="Small Manufacturing" />
                <option value="Technology / Startup" />
                <option value="Agriculture / Allied Activities" />
              </datalist>
            </div>

            {/* Enterprise Type / Sector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-enterpriseType">
                Sector / Enterprise Type <span className="text-rose-600">*</span>
              </label>
              <select
                id="select-enterpriseType"
                value={business.enterpriseType}
                onChange={(e) => setBusiness({ ...business, enterpriseType: e.target.value as EnterpriseType })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="Manufacturing">Manufacturing (Processing, Handloom, Fabric, Metal, etc.)</option>
                <option value="Service">Service (Repair, Transport, Digital, Hospitality, Healthcare)</option>
                <option value="Trading">Trading / Retail / Kirana</option>
                <option value="Agriculture / Allied Activities">Agriculture / Allied Activities (Dairy, Poultry, Fisheries)</option>
                <option value="Other">Other Category</option>
              </select>
            </div>

            {/* Financial Assistance Required */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-financialAssistance">
                Financial Assistance Type <span className="text-rose-600">*</span>
              </label>
              <select
                id="select-financialAssistance"
                value={business.financialAssistanceRequired}
                onChange={(e) => setBusiness({ ...business, financialAssistanceRequired: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="Subsidy & Term Loan">Capital Subsidy & Term Loan</option>
                <option value="Working Capital / Mudra Loan">Working Capital / Mudra Loan</option>
                <option value="Interest Subsidy">Interest Rate Subsidy</option>
                <option value="Collateral Free Credit Guarantee">Collateral-Free Credit Guarantee (CGTMSE)</option>
                <option value="Toolkit / Equipment Grant">Toolkit & Equipment Grant (Vishwakarma)</option>
              </select>
            </div>
          </div>

          {/* Conditional inputs for Starting vs Existing */}
          {business.businessStatus === 'I want to start a business' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-businessIdea">
                  Proposed Business Activity / Product <span className="text-rose-600">*</span>
                </label>
                <input
                  id="input-businessIdea"
                  type="text"
                  value={business.businessIdea || ''}
                  onChange={(e) => setBusiness({ ...business, businessIdea: e.target.value })}
                  placeholder="e.g. Handloom Pochampally saree weaving unit or spice processing"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-investment">
                    Estimated Project Cost / Investment
                  </label>
                  <select
                    id="select-investment"
                    value={business.estimatedInvestment || '₹5 Lakhs - ₹10 Lakhs'}
                    onChange={(e) => setBusiness({ ...business, estimatedInvestment: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
                  >
                    <option value="Under ₹50,000">Under ₹50,000 (Mudra Shishu / PM SVANidhi)</option>
                    <option value="₹50,000 - ₹5 Lakhs">₹50,000 - ₹5 Lakhs (Mudra Kishore)</option>
                    <option value="₹5 Lakhs - ₹10 Lakhs">₹5 Lakhs - ₹10 Lakhs (Mudra Tarun / PMEGP)</option>
                    <option value="₹10 Lakhs - ₹25 Lakhs">₹10 Lakhs - ₹25 Lakhs (PMEGP Service limit)</option>
                    <option value="₹25 Lakhs - ₹50 Lakhs">₹25 Lakhs - ₹50 Lakhs (PMEGP Mfg limit)</option>
                    <option value="Above ₹50 Lakhs">Above ₹50 Lakhs (Stand-Up India up to ₹1 Crore)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-employees">
                    Expected Employment Generation (Persons)
                  </label>
                  <input
                    id="input-employees"
                    type="number"
                    min="1"
                    value={business.expectedEmployees || '4'}
                    onChange={(e) => setBusiness({ ...business, expectedEmployees: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-businessName">
                    Enterprise / Shop Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="input-businessName"
                    type="text"
                    value={business.businessName || ''}
                    onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                    placeholder="e.g. Sri Lakshmi Textiles"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-stage">
                    Operating History
                  </label>
                  <select
                    id="select-stage"
                    value={business.businessStage || 'Early Stage (1-3 years)'}
                    onChange={(e) => setBusiness({ ...business, businessStage: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
                  >
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="Early Stage (1-3 years)">Early Stage (1-3 years)</option>
                    <option value="Established (3-5 years)">Established (3-5 years)</option>
                    <option value="Mature (5+ years)">Mature (5+ years)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-currentInvestment">
                    Current Annual Turnover / Investment
                  </label>
                  <input
                    id="input-currentInvestment"
                    type="text"
                    value={business.currentInvestment || '₹5 Lakhs'}
                    onChange={(e) => setBusiness({ ...business, currentInvestment: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="input-additionalCapital">
                    Additional Funding Needed
                  </label>
                  <input
                    id="input-additionalCapital"
                    type="text"
                    value={business.additionalInvestmentRequired || '₹10 Lakhs'}
                    onChange={(e) => setBusiness({ ...business, additionalInvestmentRequired: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Description for Domain Match Enhancement */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800" htmlFor="input-businessDescription">
                Business Description <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Lightweight NLP Matching
              </span>
            </div>
            <textarea
              id="input-businessDescription"
              rows={3}
              value={business.businessDescription || ''}
              onChange={(e) => setBusiness({ ...business, businessDescription: e.target.value })}
              placeholder='Describe what your business actually does (e.g. "I want to start a handloom saree weaving business using traditional looms and sell handmade textile products.")'
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
            ></textarea>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Enter specific products, materials, tools, and processes. Both Business Category and Description are evaluated by the matching engine.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* STEP 4: Additional Criteria */}
      {/* ========================================================== */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6" id="wizard-step-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-950">Step 4: Additional Criteria & Readiness</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm official documentation readiness, household income bracket, and land ownership status.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Annual Household Income */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-income">
                Annual Household Income <span className="text-rose-600">*</span>
              </label>
              <select
                id="select-income"
                value={personal.annualFamilyIncome}
                onChange={(e) => setPersonal({ ...personal, annualFamilyIncome: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="Below 1 Lakh">Below ₹1,00,000 (BPL / Priority Assistance)</option>
                <option value="1 Lakh - 1.5 Lakh">₹1,00,000 - ₹1,50,000</option>
                <option value="1.5 Lakh - 3 Lakh">₹1,50,000 - ₹3,00,000</option>
                <option value="3 Lakh - 5 Lakh">₹3,00,000 - ₹5,00,000</option>
                <option value="5 Lakh - 8 Lakh">₹5,00,000 - ₹8,00,000</option>
                <option value="Above 8 Lakh">Above ₹8,00,000</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Determines subsidized interest and grant eligibility</span>
            </div>

            {/* Education Level */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-education">
                Education Qualification <span className="text-rose-600">*</span>
              </label>
              <select
                id="select-education"
                value={personal.educationLevel}
                onChange={(e) => setPersonal({ ...personal, educationLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="No Formal Education">No Formal Education / Basic Literacy</option>
                <option value="8th Pass">8th Pass (PMEGP project requirement for &gt;₹10 Lakhs)</option>
                <option value="10th Pass">10th Pass</option>
                <option value="12th Pass / Intermediate">12th Pass / Intermediate</option>
                <option value="ITI / Diploma / Vocational">ITI / Vocational Certificate</option>
                <option value="Graduate / Post-Graduate">Graduate / Degree Holder</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Note: PMEGP projects over ₹10L in Mfg require 8th Pass</span>
            </div>

            {/* Land Holding */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="select-landHolding">
                Agricultural / Land Holding Status
              </label>
              <select
                id="select-landHolding"
                value={personal.landHolding || 'Marginal / Landless (< 1 hectare)'}
                onChange={(e) => setPersonal({ ...personal, landHolding: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="Marginal / Landless (< 1 hectare)">Marginal / Landless (&lt; 1 hectare / 2.5 acres)</option>
                <option value="Small Farmer (1-2 hectares)">Small Farmer (1-2 hectares / 2.5 - 5 acres)</option>
                <option value="Medium / Large Farmer (> 2 hectares)">Semi-Medium / Large (&gt; 2 hectares)</option>
                <option value="Non-Agricultural / Urban">Non-Agricultural / Urban Resident</option>
              </select>
            </div>
          </div>

          {/* Banking & Identity Verification Checklist */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Readiness Check: Direct Benefit Transfer (DBT) Requirements</span>
            
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                id="check-has-aadhaar"
                checked={personal.hasAadhaar ?? true}
                onChange={(e) => setPersonal({ ...personal, hasAadhaar: e.target.checked })}
                className="w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">I have an active Aadhaar Card with linked Mobile Number</span>
                <span className="text-[11px] text-slate-500 block">Required for OTP e-KYC on official portals like Udyam and JanSamarth.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                id="check-has-bank-account"
                checked={personal.hasBankAccount ?? true}
                onChange={(e) => setPersonal({ ...personal, hasBankAccount: e.target.checked })}
                className="w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">I possess an active Commercial / Grameena Bank Savings or Current Account</span>
                <span className="text-[11px] text-slate-500 block">Required for direct government subsidy margin credit.</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* Wizard Footer Navigation Controls */}
      {/* ========================================================== */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div>
          {currentStep > 1 ? (
            <button
              type="button"
              id="wizard-btn-back"
              onClick={handleBack}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <div className="text-xs text-slate-400">Step 1 of 4</div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {currentStep < 4 ? (
            <button
              type="button"
              id="wizard-btn-next"
              onClick={handleNext}
              className="w-full sm:w-auto px-7 py-3 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-all shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              id="wizard-btn-submit"
              onClick={handleCalculateEligibility}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Calculate Scheme Eligibility</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
