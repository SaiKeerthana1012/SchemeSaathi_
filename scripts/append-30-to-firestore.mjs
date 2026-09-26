/**
 * SchemeSaathi - Safe Append 30 New Schemes to Firestore
 * 
 * Preserves SS-0001 to SS-0020 untouched.
 * Adds SS-0021 to SS-0050 to the 'schemes' collection.
 * Verifies all 50 documents.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuote = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}

const SHORT_NAMES = {
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

async function main() {
  console.log('============================================================');
  console.log('SchemeSaathi - Safely Append 30 New Schemes to Firestore');
  console.log('============================================================');

  const csvPath = path.join(rootDir, 'SchemeSaathi_Schemes.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);
  if (rows.length < 2) {
    console.error('ERROR: CSV has no data rows');
    process.exit(1);
  }

  const header = rows[0];
  const allRecords = rows.slice(1).map(row => {
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : '';
    });
    return obj;
  });

  console.log(`✓ Loaded ${allRecords.length} records from SchemeSaathi_Schemes.csv`);

  // Separate preserved (SS-0001 to SS-0020) and new (SS-0021 to SS-0050)
  const newRecords = allRecords.filter(r => {
    const num = parseInt(r.schemeId.replace('SS-', ''), 10);
    return num > 20;
  });

  console.log(`✓ Identified ${newRecords.length} new schemes to add (SS-0021 through SS-0050)`);

  // Credentials
  let credential = null;
  const serviceAccountPath = path.join(rootDir, 'serviceAccountKey.json');

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(parsed);
      console.log('✓ Using FIREBASE_SERVICE_ACCOUNT_KEY');
    } catch (e) {
      console.error('ERROR parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
      process.exit(1);
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      credential = cert(serviceAccount);
      console.log(`✓ Using serviceAccountKey.json`);
    } catch (e) {
      console.error(`ERROR reading ${serviceAccountPath}:`, e.message);
      process.exit(1);
    }
  } else {
    console.error('\n❌ FIREBASE ADMIN CREDENTIALS REQUIRED FOR ELEVATED WRITES:');
    console.error('1. Download serviceAccountKey.json from Firebase Console (Project schemesaathi-f16c9)');
    console.error('2. Place it in the project root: ./serviceAccountKey.json');
    console.error('3. Run: node scripts/append-30-to-firestore.mjs\n');
    process.exit(1);
  }

  let projectId = 'schemesaathi-f16c9';
  const configPath = path.join(rootDir, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (cfg.projectId) projectId = cfg.projectId;
    } catch {
      // ignore
    }
  }

  if (getApps().length === 0) {
    initializeApp({
      credential,
      projectId
    });
  }

  const db = getFirestore();
  console.log(`✓ Connected to Firestore project: "${projectId}"`);
  const schemesCollection = db.collection('schemes');

  // Verify existing preserved 20 schemes
  console.log('\n--- Checking existing documents SS-0001 to SS-0020 ---');
  let preservedCount = 0;
  for (let i = 1; i <= 20; i++) {
    const id = `SS-${String(i).padStart(4, '0')}`;
    const snap = await schemesCollection.doc(id).get();
    if (snap.exists) {
      preservedCount++;
    } else {
      console.warn(`Note: Preserved document ${id} does not exist in Firestore yet.`);
    }
  }
  console.log(`Preserved documents verified present: ${preservedCount} / 20`);

  // Batch insert new 30 schemes
  console.log(`\n--- Batch inserting 30 new schemes (SS-0021 to SS-0050) ---`);
  const batch = db.batch();

  for (const raw of newRecords) {
    const docId = raw.schemeId;
    const docRef = schemesCollection.doc(docId);

    const docData = {
      schemeId: raw.schemeId,
      csvSchemeId: raw.csvSchemeId || '',
      schemeName: raw.schemeName,
      governmentLevel: raw.governmentLevel,
      ministryDepartment: raw.ministryDepartment,
      targetBeneficiary: raw.targetBeneficiary,
      genderEligibility: raw.genderEligibility,
      ageCriteria: raw.ageCriteria,
      statesCovered: raw.statesCovered,
      incomeCriteria: raw.incomeCriteria,
      socialCategoryEligibility: raw.socialCategoryEligibility,
      businessTypes: raw.businessTypes,
      businessStage: raw.businessStage,
      eligibilityCriteria: raw.eligibilityCriteria,
      benefitType: raw.benefitType,
      maximumBenefit: raw.maximumBenefit,
      requiredDocuments: raw.requiredDocuments,
      applicationMethod: raw.applicationMethod,
      officialApplicationUrl: raw.officialApplicationUrl,
      sourceUrl: raw.sourceUrl,
      lastUpdated: raw.lastUpdated,
      notes: raw.notes,

      // UI convenience fields
      id: raw.schemeId,
      name: raw.schemeName,
      shortName: SHORT_NAMES[raw.schemeId] || raw.schemeName,
      ministry: raw.ministryDepartment,
      description: raw.eligibilityCriteria,
      keyBenefit: `${raw.benefitType} - ${raw.maximumBenefit}`,
      importedAt: new Date().toISOString()
    };

    batch.set(docRef, docData);
    console.log(`  -> Queued [${docId}] (${raw.csvSchemeId}) ${raw.schemeName}`);
  }

  await batch.commit();
  console.log('✓ Successfully committed batch of 30 new schemes!');

  // Verification step
  console.log('\n--- VERIFYING FINAL 50 DOCUMENTS IN FIRESTORE ---');
  const snapshot = await schemesCollection.get();
  console.log(`Total documents found in 'schemes' collection: ${snapshot.size}`);

  const allFoundIds = [];
  snapshot.forEach(docSnap => {
    allFoundIds.push(docSnap.id);
  });
  allFoundIds.sort();

  const missingFrom50 = [];
  for (let i = 1; i <= 50; i++) {
    const id = `SS-${String(i).padStart(4, '0')}`;
    if (!allFoundIds.includes(id)) {
      missingFrom50.push(id);
    }
  }

  if (snapshot.size === 50 && missingFrom50.length === 0) {
    console.log('\n============================================================');
    console.log('SUCCESS: Exactly 50 unique documents verified in Firestore "schemes" collection!');
    console.log('SS-0001 to SS-0020 preserved, SS-0021 to SS-0050 added.');
    console.log('Original CSV IDs preserved in csvSchemeId.');
    console.log('============================================================\n');
  } else {
    console.warn(`Current count in Firestore is ${snapshot.size}. Missing IDs: ${missingFrom50.join(', ') || 'None'}`);
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
