import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. CSV Parser (Handles quoted multi-line fields and commas within quotes)
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

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
  console.log('------------------------------------------------------------');
  console.log('SchemeSaathi - Firestore One-Time Seed / Import (Admin SDK)');
  console.log('------------------------------------------------------------');

  // Locate SchemeSaathi_Schemes.csv
  const csvPath = path.join(rootDir, 'SchemeSaathi_Schemes.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);
  if (rows.length < 2) {
    console.error('ERROR: CSV file is empty or missing data rows.');
    process.exit(1);
  }

  const headers = rows[0];
  const records = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : '';
    });
    return obj;
  });

  console.log(`✓ Read and parsed ${records.length} records from SchemeSaathi_Schemes.csv`);
  if (records.length !== 50) {
    console.warn(`Warning: Expected 50 records, found ${records.length}.`);
  }

  // Locate Firebase credentials
  let credential = null;
  const serviceAccountPath = path.join(rootDir, 'serviceAccountKey.json');

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(parsed);
      console.log('✓ Using service account credentials from FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    } catch (e) {
      console.error('ERROR parsing FIREBASE_SERVICE_ACCOUNT_KEY env var:', e.message);
      process.exit(1);
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      credential = cert(serviceAccount);
      console.log(`✓ Using service account credentials from ${serviceAccountPath}`);
    } catch (e) {
      console.error(`ERROR reading ${serviceAccountPath}:`, e.message);
      process.exit(1);
    }
  } else {
    console.error('\n❌ MISSING FIREBASE ADMIN CREDENTIALS:');
    console.error('To run this server-side import script, you need a Firebase Service Account key:');
    console.error('1. Open Firebase Console: https://console.firebase.google.com/project/schemesaathi-f16c9/settings/serviceaccounts/adminsdk');
    console.error('2. Click "Generate new private key".');
    console.error('3. Save the downloaded JSON file as "serviceAccountKey.json" in the project root directory.');
    console.error('4. Re-run: node scripts/import-schemes-admin.mjs\n');
    process.exit(1);
  }

  // Load project ID
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

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    initializeApp({
      credential,
      projectId
    });
  }

  const db = getFirestore();
  console.log(`✓ Connected to Firestore project: "${projectId}"`);

  // Prepare batch write
  const batch = db.batch();
  const schemesCollection = db.collection('schemes');

  // Check and preserve SS-0001 to SS-0020 untouched
  console.log('\n--- Checking existing documents SS-0001 to SS-0020 (Untouched) ---');
  let preservedCount = 0;
  for (let i = 1; i <= 20; i++) {
    const id = `SS-${String(i).padStart(4, '0')}`;
    const snap = await schemesCollection.doc(id).get();
    if (snap.exists) {
      preservedCount++;
    } else {
      console.warn(`Note: Preserved document ${id} not found in Firestore.`);
    }
  }
  console.log(`Preserved documents verified intact: ${preservedCount} / 20`);

  // Filter only the 30 schemes to import: SS-0021 through SS-0050
  const schemesToImport = records.filter(raw => {
    const num = parseInt((raw.schemeId || '').replace('SS-', ''), 10);
    return num > 20 && num <= 50;
  });

  console.log(`\nImporting ${schemesToImport.length} schemes (SS-0021 through SS-0050) to Firestore collection "schemes"...`);
  for (const raw of schemesToImport) {
    const docId = raw.schemeId;
    if (!docId) {
      console.error('Skipping row missing schemeId:', raw);
      continue;
    }

    const docRef = schemesCollection.doc(docId);

    // Exact CSV fields preserved completely
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

      // Convenience aliases for frontend rendering
      id: raw.schemeId,
      name: raw.schemeName,
      shortName: SHORT_NAMES[raw.schemeId] || raw.schemeName,
      ministry: raw.ministryDepartment,
      description: raw.eligibilityCriteria,
      keyBenefit: `${raw.benefitType} - ${raw.maximumBenefit}`,
      importedAt: new Date().toISOString()
    };

    batch.set(docRef, docData);
    console.log(`  -> Queued [${docId}] (${raw.csvSchemeId || 'N/A'}) ${raw.schemeName}`);
  }

  // Commit batch write
  await batch.commit();
  console.log('✓ Batch commit of 30 schemes completed successfully.');

  // Verification step: Query Firestore to confirm documents actually exist
  console.log('\n--- VERIFYING FIRESTORE IMPORT ---');
  const snapshot = await schemesCollection.get();
  console.log(`Total documents found in "schemes" collection: ${snapshot.size}`);

  const foundIds = [];
  snapshot.forEach(docSnap => {
    foundIds.push(docSnap.id);
  });
  foundIds.sort();

  console.log(`Document IDs present in Firestore:`);
  console.log(`  ${foundIds.join(', ')}`);

  const expectedIds = records.map(r => r.schemeId).sort();
  const missingIds = expectedIds.filter(id => !foundIds.includes(id));

  if (snapshot.size === 50 && missingIds.length === 0) {
    console.log('\n============================================================');
    console.log('SUCCESS: Exactly 50 documents verified in Firestore collection "schemes"!');
    console.log('All CSV fields preserved and documents keyed by SS-0001 to SS-0050.');
    console.log('============================================================\n');
  } else {
    console.error(`\nFAILED: Expected 50 documents, found ${snapshot.size}.`);
    if (missingIds.length > 0) {
      console.error(`Missing scheme IDs: ${missingIds.join(', ')}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\nFatal Error during Firestore import:', err);
  process.exit(1);
});
