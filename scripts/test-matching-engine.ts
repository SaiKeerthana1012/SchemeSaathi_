import { SCHEMES_DATABASE } from '../src/data/schemes';
import { matchSchemesForProfile } from '../src/services/matchingEngine';
import { UserProfile } from '../src/types';

function createProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    personal: {
      fullName: 'Test Entrepreneur',
      gender: 'Female',
      age: 28,
      socialCategory: 'General',
      state: 'Telangana',
      district: 'Hyderabad',
      areaType: 'Rural',
      educationLevel: 'Graduate',
      annualFamilyIncome: '₹2.5 Lakhs - ₹5 Lakhs',
      isDifferentlyAbled: false,
      hasAadhaar: true,
      hasBankAccount: true,
      landHolding: 'Marginal / Landless (< 1 hectare)',
      ...(overrides.personal || {})
    },
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Manufacturing',
      businessCategory: 'Handloom / Textiles',
      businessDescription: 'I want to start a handloom saree weaving business using traditional looms and sell handmade textile products.',
      businessIdea: 'Handloom saree weaving',
      proposedLocation: 'Rural',
      estimatedInvestment: '₹5 Lakhs - ₹10 Lakhs',
      financialAssistanceRequired: 'Subsidy & Term Loan',
      ...(overrides.business || {})
    },
    updatedAt: new Date().toISOString(),
    ...(overrides as any)
  };
}

console.log('====================================================');
console.log('RUNNING SCHEMESAATHI MATCHING ENGINE 9 TEST CASES');
console.log(`Loaded Schemes count: ${SCHEMES_DATABASE.length}`);
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 9;

// TEST 1: Handloom Business
{
  console.log('--- TEST CASE 1: Handloom Business ---');
  const p = createProfile({
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Manufacturing',
      businessCategory: 'Handloom / Textiles',
      businessDescription: 'I want to start a handloom saree weaving business using traditional looms and sell handmade textile products.',
      businessIdea: 'Handloom saree weaving',
      proposedLocation: 'Rural',
      financialAssistanceRequired: 'Subsidy & Term Loan'
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const top3 = results.slice(0, 3);
  console.log('Top 3 matches:');
  top3.forEach(r => console.log(`  [${r.score}%] ${r.scheme.name} (${r.scheme.shortName}) - ${r.reasons[0] || ''}`));
  
  const pmfme = results.find(r => (r.scheme.shortName || '').includes('PMFME') || r.scheme.name.includes('Food Processing'));
  console.log(`PMFME Score: ${pmfme?.score}% | Mismatch note: ${pmfme?.mismatches?.[0] || 'none'}`);

  const topSchemeNames = top3.map(r => (r.scheme.shortName || r.scheme.name).toLowerCase());
  const isHandloomTop = topSchemeNames.some(n => n.includes('sfurti') || n.includes('vishwakarma') || n.includes('handloom') || n.includes('pmegp') || n.includes('mudra'));
  const isPmfmeLow = (pmfme?.score ?? 100) <= 35;

  if (isHandloomTop && isPmfmeLow) {
    console.log('✅ TEST 1 PASSED: Handloom schemes ranked top; Food Processing is low (<=35%).\n');
    passedTests++;
  } else {
    console.error(`❌ TEST 1 FAILED: isHandloomTop=${isHandloomTop}, isPmfmeLow=${isPmfmeLow}\n`);
  }
}

// TEST 2: Food Processing
{
  console.log('--- TEST CASE 2: Food Processing ---');
  const p = createProfile({
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Manufacturing',
      businessCategory: 'Food Processing',
      businessDescription: 'Setting up a micro food processing unit for fruit pulping, packaging, and agro processing.',
      businessIdea: 'Fruit pulping and food packaging',
      proposedLocation: 'Rural',
      financialAssistanceRequired: 'Subsidy & Term Loan'
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const top3 = results.slice(0, 3);
  console.log('Top 3 matches:');
  top3.forEach(r => console.log(`  [${r.score}%] ${r.scheme.name} (${r.scheme.shortName}) - ${r.reasons[0] || ''}`));

  const pmfme = results.find(r => (r.scheme.shortName || '').includes('PMFME') || r.scheme.name.includes('Food Processing'));
  const sfurti = results.find(r => (r.scheme.shortName || '').includes('SFURTI'));
  console.log(`PMFME Score: ${pmfme?.score}% | SFURTI Score: ${sfurti?.score}%`);

  if ((pmfme?.score ?? 0) >= 80) {
    console.log('✅ TEST 2 PASSED: Food processing scheme ranked top with Strong Match (>=80%).\n');
    passedTests++;
  } else {
    console.error(`❌ TEST 2 FAILED: PMFME score=${pmfme?.score}\n`);
  }
}

// TEST 3: Dairy / Milk Products
{
  console.log('--- TEST CASE 3: Dairy / Milk Products ---');
  const p = createProfile({
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Manufacturing',
      businessCategory: 'Dairy / Food Processing',
      businessDescription: 'Dairy processing unit producing paneer, curd, butter, and packaged milk products.',
      businessIdea: 'Dairy unit',
      proposedLocation: 'Rural',
      financialAssistanceRequired: 'Subsidy & Term Loan'
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const top3 = results.slice(0, 3);
  console.log('Top 3 matches:');
  top3.forEach(r => console.log(`  [${r.score}%] ${r.scheme.name} (${r.scheme.shortName}) - ${r.reasons[0] || ''}`));

  const pmfme = results.find(r => (r.scheme.shortName || '').includes('PMFME') || r.scheme.name.includes('Food Processing'));
  if ((pmfme?.score ?? 0) >= 75) {
    console.log('✅ TEST 3 PASSED: Dairy unit matched relevant agro/food schemes with Good/Strong match.\n');
    passedTests++;
  } else {
    console.error(`❌ TEST 3 FAILED: PMFME score=${pmfme?.score}\n`);
  }
}

// TEST 4: Handicrafts & Traditional Artisans
{
  console.log('--- TEST CASE 4: Handicrafts ---');
  const p = createProfile({
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Manufacturing',
      businessCategory: 'Handicrafts',
      businessDescription: 'Traditional wooden toy craft, terracotta pottery, and brass metal artifacts.',
      businessIdea: 'Wooden toys and handicrafts',
      proposedLocation: 'Rural',
      financialAssistanceRequired: 'Toolkit / Equipment Grant'
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const top3 = results.slice(0, 3);
  console.log('Top 3 matches:');
  top3.forEach(r => console.log(`  [${r.score}%] ${r.scheme.name} (${r.scheme.shortName}) - ${r.reasons[0] || ''}`));

  const artisanScheme = top3.find(r => r.scheme.name.includes('Vishwakarma') || r.scheme.name.includes('Handicraft') || (r.scheme.shortName || '').includes('SFURTI') || (r.scheme.shortName || '').includes('CHCDS') || (r.scheme.shortName || '').includes('NHDP'));
  if (artisanScheme && artisanScheme.score >= 80) {
    console.log('✅ TEST 4 PASSED: Artisan/Handicraft scheme ranked in top matches with Strong Match.\n');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED: No artisan scheme with score >= 80 in top 3\n');
  }
}

// TEST 5: Street Vending
{
  console.log('--- TEST CASE 5: Street Vending ---');
  const p = createProfile({
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Service',
      businessCategory: 'Street Vending',
      businessDescription: 'Roadside tea stall and snack vendor needing working capital.',
      businessIdea: 'Roadside tea stall',
      proposedLocation: 'Urban',
      financialAssistanceRequired: 'Working Capital / Mudra Loan'
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const top1 = results[0];
  console.log(`Top 1 match: [${top1.score}%] ${top1.scheme.name} (${top1.scheme.shortName}) - ${top1.reasons[0] || ''}`);

  const svanidhi = results.find(r => (r.scheme.shortName || '').includes('SVANidhi') || r.scheme.name.includes('SVANidhi'));
  console.log(`PM SVANidhi score: ${svanidhi?.score}%`);

  if (svanidhi && svanidhi.score >= 80 && (top1.scheme.shortName || '').includes('SVANidhi')) {
    console.log('✅ TEST 5 PASSED: PM SVANidhi ranked #1 for Street Vending.\n');
    passedTests++;
  } else {
    console.error(`❌ TEST 5 FAILED: SVANidhi rank/score issue. Score=${svanidhi?.score}\n`);
  }
}

// TEST 6: Technology / Startup
{
  console.log('--- TEST CASE 6: Technology / Startup ---');
  const p = createProfile({
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Service',
      businessCategory: 'Technology / Startup',
      businessDescription: 'AI SaaS software platform and digital product development.',
      businessIdea: 'AI SaaS software',
      proposedLocation: 'Urban',
      financialAssistanceRequired: 'Subsidy & Term Loan'
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const top3 = results.slice(0, 3);
  console.log('Top 3 matches:');
  top3.forEach(r => console.log(`  [${r.score}%] ${r.scheme.name} (${r.scheme.shortName}) - ${r.reasons[0] || ''}`));

  const startupScheme = top3.find(r => r.scheme.name.toLowerCase().includes('startup') || (r.scheme.shortName || '').includes('SISFS') || (r.scheme.shortName || '').includes('NIDHI') || (r.scheme.shortName || '').includes('SAMRIDH'));
  const svanidhi = results.find(r => (r.scheme.shortName || '').includes('SVANidhi'));
  console.log(`SVANidhi for Tech Startup: ${svanidhi?.score}%`);

  if (startupScheme && (svanidhi?.score ?? 100) <= 35) {
    console.log('✅ TEST 6 PASSED: Tech startup scheme ranked top; Street vendor scheme is low (<=35%).\n');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED: Tech startup ranking issue\n');
  }
}

// TEST 7: Gender Conflict (Male vs Women-Only Scheme)
{
  console.log('--- TEST CASE 7: Gender Conflict (Male applicant) ---');
  const p = createProfile({
    personal: {
      fullName: 'Ramesh Kumar',
      gender: 'Male',
      socialCategory: 'General',
      state: 'Telangana',
      age: 32
    } as any,
    business: {
      businessStatus: 'I want to start a business',
      enterpriseType: 'Manufacturing',
      businessCategory: 'Handloom / Textiles',
      businessDescription: 'Handloom saree weaving.'
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const wep = results.find(r => (r.scheme.shortName || '').includes('WEP') || r.scheme.name.includes('Women Entrepreneurship'));
  const mahilaCoir = results.find(r => (r.scheme.shortName || '').includes('Mahila Coir') || r.scheme.name.includes('Mahila Coir'));
  console.log(`WEP Score: ${wep?.score}% | Mahila Coir Score: ${mahilaCoir?.score}%`);
  console.log(`WEP Mismatch: ${wep?.mismatches?.[0] || 'none'}`);

  const wepEligible = (wep?.score ?? 100) <= 25;
  const mahilaCoirEligible = (mahilaCoir?.score ?? 100) <= 25;

  if (wepEligible && mahilaCoirEligible) {
    console.log('✅ TEST 7 PASSED: Women-only schemes capped at <=25% for male applicant.\n');
    passedTests++;
  } else {
    console.error(`❌ TEST 7 FAILED: wepScore=${wep?.score}, mahilaCoirScore=${mahilaCoir?.score}\n`);
  }
}

// TEST 8: State Geography Conflict (Telangana applicant vs Tamil Nadu NEEDS)
{
  console.log('--- TEST CASE 8: State Conflict (Telangana applicant vs TN NEEDS) ---');
  const p = createProfile({
    personal: {
      fullName: 'Kavitha Rao',
      gender: 'Female',
      socialCategory: 'General',
      state: 'Telangana',
      age: 28
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const needs = results.find(r => (r.scheme.shortName || '').includes('NEEDS') || r.scheme.name.includes('NEEDS'));
  console.log(`NEEDS Scheme Score for Telangana applicant: ${needs?.score}%`);
  console.log(`NEEDS Mismatch: ${needs?.mismatches?.[0] || 'none'}`);

  if ((needs?.score ?? 100) <= 25) {
    console.log('✅ TEST 8 PASSED: State-restricted scheme (NEEDS) capped at <=25% for non-resident.\n');
    passedTests++;
  } else {
    console.error(`❌ TEST 8 FAILED: NEEDS score=${needs?.score}\n`);
  }
}

// TEST 9: Social Category Conflict (General applicant vs SC/ST Exclusive Scheme)
{
  console.log('--- TEST CASE 9: Social Category Conflict (General applicant vs SC/ST scheme) ---');
  const p = createProfile({
    personal: {
      fullName: 'Sunil Sharma',
      gender: 'Male',
      socialCategory: 'General',
      state: 'Telangana',
      age: 30
    } as any
  });
  const results = matchSchemesForProfile(p, SCHEMES_DATABASE);
  const nsfdc = results.find(r => (r.scheme.shortName || '').includes('NSFDC') || r.scheme.name.includes('National Scheduled Castes'));
  const scStHub = results.find(r => (r.scheme.shortName || '').includes('SC-ST Hub') || r.scheme.name.includes('SC-ST Hub'));
  console.log(`NSFDC Score: ${nsfdc?.score}% | SC-ST Hub Score: ${scStHub?.score}%`);
  console.log(`NSFDC Mismatch: ${nsfdc?.mismatches?.[0] || 'none'}`);

  const nsfdcLow = (nsfdc?.score ?? 100) <= 25;
  const hubLow = (scStHub?.score ?? 100) <= 25;

  if (nsfdcLow && hubLow) {
    console.log('✅ TEST 9 PASSED: SC/ST-exclusive schemes capped at <=25% for General category applicant.\n');
    passedTests++;
  } else {
    console.error(`❌ TEST 9 FAILED: nsfdcScore=${nsfdc?.score}, hubScore=${scStHub?.score}\n`);
  }
}

console.log('====================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('====================================================');
if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
