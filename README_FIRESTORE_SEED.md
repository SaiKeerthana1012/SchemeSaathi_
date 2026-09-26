# SchemeSaathi - One-Time Firestore Seed & Import Guide

This guide provides the exact instructions to seed all 20 government schemes from `SchemeSaathi_Schemes.csv` into your Firebase Cloud Firestore database.

---

## Why Is This Required?

1. **Strict Security Rules (`allow write: if false`)**:
   In `firestore.rules`, the `schemes` collection is locked against client-side writes:
   ```javascript
   match /schemes/{schemeId} {
     allow read: if true;
     allow write: if false;
   }
   ```
   This ensures malicious users cannot modify, tamper with, or delete official government scheme data from their web browsers.

2. **Server-Side / Admin SDK Security**:
   To write to a read-only collection without weakening security rules, writes must be executed using the **Firebase Admin SDK** or Google Cloud credentials with Firestore write permissions.
   Because the Google AI Studio container environment runs in a sandboxed host project and does not have access to your private Firebase Service Account credentials, this import script must be executed with your project credentials.

---

## One-Time Import Instructions

### Step 1: Download your Firebase Service Account Key

1. Go to the [Firebase Console Service Accounts Settings](https://console.firebase.google.com/project/schemesaathi-f16c9/settings/serviceaccounts/adminsdk).
2. Select your project (**schemesaathi-f16c9**).
3. Under **Firebase Admin SDK**, click **"Generate new private key"**.
4. Confirm by clicking **"Generate key"**. A `.json` file will download to your computer.

### Step 2: Place the Key in the Project Directory

1. Rename the downloaded file to:
   ```
   serviceAccountKey.json
   ```
2. Place it in the root directory of this project (`SchemeSaathi`).
   *(Note: `serviceAccountKey.json` is already included in `.gitignore` to guarantee it will never be committed or exposed.)*

Alternatively, you can set the environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/downloaded-key.json"
```
Or paste the JSON string into:
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Step 3: Run the Import Script

Run the automated Node.js admin import script:

```bash
node scripts/import-schemes-admin.mjs
```

### Step 4: Verification

The script automatically executes the following:
1. Parses all 20 records from `SchemeSaathi_Schemes.csv`.
2. Uses `schemeId` as the unique document ID (`SS-0001` through `SS-0020`) in the `schemes` collection.
3. Preserves all 21 CSV columns verbatim:
   - `schemeId`
   - `schemeName`
   - `governmentLevel`
   - `ministryDepartment`
   - `targetBeneficiary`
   - `genderEligibility`
   - `ageCriteria`
   - `statesCovered`
   - `incomeCriteria`
   - `socialCategoryEligibility`
   - `businessTypes`
   - `businessStage`
   - `eligibilityCriteria`
   - `benefitType`
   - `maximumBenefit`
   - `requiredDocuments`
   - `applicationMethod`
   - `officialApplicationUrl`
   - `sourceUrl`
   - `lastUpdated`
   - `notes`
4. Performs a batch commit.
5. **Verifies the Firestore collection**: Reads back the `schemes` collection from Firestore, asserts that exactly 20 documents exist, and checks off each ID from `SS-0001` to `SS-0020`.
6. Prints:
   ```
   ============================================================
   SUCCESS: Exactly 20 documents verified in Firestore collection "schemes"!
   All CSV fields preserved and documents keyed by SS-0001 to SS-0020.
   ============================================================
   ```

### Step 5: Check in Firebase Console & SchemeSaathi UI

1. Open your Firebase Console: [Firestore Database Tab](https://console.firebase.google.com/project/schemesaathi-f16c9/firestore/databases/-default-/data).
2. You will see the `schemes` collection populated with documents `SS-0001` through `SS-0020`.
3. In the SchemeSaathi application, click **"Refresh Firestore"** or reload the page. The app will fetch and render all 20 schemes directly from your live Firestore database.
