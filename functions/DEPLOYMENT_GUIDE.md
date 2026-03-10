# Firebase Cloud Functions - Deployment Guide

Complete step-by-step instructions for deploying the user story generator function.

## Prerequisites Checklist

- [ ] Google Cloud account with billing enabled
- [ ] Firebase project created (https://console.firebase.google.com)
- [ ] Firestore database created (Cloud Firestore, not Realtime Database)
- [ ] Node.js 20+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] OpenAI API key obtained (https://platform.openai.com/account/api-keys)
- [ ] Git installed (optional, for version control)

---

## Step 1: Prepare Your Environment

### 1.1 Install Firebase CLI

```bash
npm install -g firebase-tools
firebase --version
```

Expected: `firebase-tools/version`

### 1.2 Login to Firebase

```bash
firebase login
```

This will open a browser window. Grant permissions and return to terminal.

### 1.3 Verify Your Projects

```bash
firebase projects:list
```

Copy your `PROJECT_ID` for later steps.

---

## Step 2: Setup Your Local Project

### 2.1 Navigate to Functions Directory

```bash
cd d:\NarrativeAI\functions
```

### 2.2 Initialize Firebase (if not already done)

```bash
firebase init functions
```

When prompted:
- Select your project from the list
- Choose JavaScript for language
- Say yes to ESLint (optional but recommended)
- Install dependencies (say yes)

### 2.3 Install Dependencies

```bash
npm install
```

Verify installation:

```bash
npm list
```

Should show:
```
firebase-admin@12.0.0
firebase-functions@5.0.0
openai@4.28.0
```

---

## Step 3: Configure OpenAI API Key

### 3.1 Set the Secret via Firebase CLI

```bash
firebase functions:config:set openai.key="sk-your-actual-api-key-here"
```

### 3.2 Verify Configuration

```bash
firebase functions:config:get
```

Should output:
```json
{
  "openai": {
    "key": "sk-..."
  }
}
```

### 3.3 Update index.js (if needed)

The code should reference the config as:

```javascript
const apiKey = functions.config().openai.key;
```

This is already in the provided code.

---

## Step 4: Test Locally with Emulator

### 4.1 Install Firebase Emulator Suite

```bash
firebase setup:emulators:firestore
```

### 4.2 Start Emulator

```bash
firebase emulators:start --only functions,firestore
```

Expected output:
```
✔  Emulator started. Press Ctrl-C to stop.

┌─────────────────────────────────────────┐
│ Firestore Emulator started at localhost:8080 │
│ Functions emulator started at localhost:5001 │
└─────────────────────────────────────────┘
```

### 4.3 Test Firestore Trigger Locally

In a new terminal:

```bash
# Create test data in emulated Firestore
curl -X POST http://localhost:8080/v1/projects/demo-project/databases/\(default\)/documents?documentId=evt_001 \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "sessionId": { "stringValue": "test_session_001" },
      "eventType": { "stringValue": "page_view" },
      "url": { "stringValue": "https://example.com" },
      "timestamp": { "stringValue": "'$(date -u +'%Y-%m-%dT%H:%M:%S.000Z')'" },
      "element": { "nullValue": true },
      "metadata": { "mapValue": { "fields": {} } }
    }
  }'
```

### 4.4 Test HTTP Trigger Locally

```bash
curl -X POST http://localhost:5001/PROJECT_ID/us-central1/generateUserStoryManual \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_session_001"}'
```

### 4.5 Stop Emulator

Press `Ctrl+C` in the emulator terminal.

---

## Step 5: Deploy to Production

### 5.1 Preview Deployment

```bash
firebase deploy --only functions --dry-run
```

Review the functions to be deployed.

### 5.2 Deploy Functions

```bash
firebase deploy --only functions
```

Expected output:
```
✔  Deploy complete!

Function URL (generateUserStoryManual): https://us-central1-PROJECT_ID.cloudfunctions.net/generateUserStoryManual
Function URL (deleteSessionStory): https://us-central1-PROJECT_ID.cloudfunctions.net/deleteSessionStory
```

### 5.3 Verify Deployment

```bash
firebase functions:list

# Or view in GCP Console
firebase open functions
```

---

## Step 6: Setup Firestore Database

### 6.1 Create Collections

Go to https://console.firebase.google.com:

1. **Create `events` collection**
   - Click "Create collection"
   - Name: `events`
   - Add first document with:
     ```
     sessionId: "test_session"
     eventType: "page_view"
     url: "https://example.com"
     timestamp: (auto-timestamp)
     element: null
     metadata: {}
     ```

2. **Create `sessionStories` collection**
   - Click "Create collection"
   - Name: `sessionStories`
   - Leave empty (will be populated by function)

### 6.2 Create Required Indexes

The function queries events by sessionId and timestamp. Firebase may prompt you to create an index:

1. When you first test, Firebase will suggest creating a composite index
2. Click the link in the suggestion → Click "Create Index"
3. Wait for index to build (usually 1-5 minutes)

Or manually create in Firebase Console:
- Go to Firestore → Indexes → Create Composite Index
- Collection: `events`
- Fields: `sessionId` (Ascending), `timestamp` (Ascending)
- Click Create Index

---

## Step 7: Deploy Security Rules

### 7.1 Deploy Firestore Rules

```bash
firebase deploy --only firestore
```

This deploys the rules defined in `firestore.rules`.

### 7.2 Verify Rules in Console

Go to https://console.firebase.google.com:
- Firestore Database → Rules
- Should see your security rules

---

## Step 8: Test Production Deployment

### 8.1 Add Test Events to Firestore

Via Firebase Console:

1. Go to `events` collection
2. Click "Add document"
3. Use the document ID format: `evt_001`, `evt_002`, etc.
4. Add these fields:

   **First Event (evt_001)**:
   ```json
   {
     "sessionId": "sid_test_001",
     "eventType": "page_view",
     "url": "https://example.com/home",
     "timestamp": "2026-03-09T14:30:45.000Z",
     "element": null,
     "metadata": {}
   }
   ```

   **Second Event (evt_002)**:
   ```json
   {
     "sessionId": "sid_test_001",
     "eventType": "click",
     "url": "https://example.com/home",
     "timestamp": "2026-03-09T14:30:50.000Z",
     "element": "BUTTON#test",
     "metadata": { "element": "BUTTON#test" }
   }
   ```

   **Third Event (evt_003)**:
   ```json
   {
     "sessionId": "sid_test_001",
     "eventType": "form_submit",
     "url": "https://example.com/signup",
     "timestamp": "2026-03-09T14:30:55.000Z",
     "element": null,
     "metadata": { "formId": "signup_form" }
   }
   ```

### 8.2 Monitor Function Execution

```bash
firebase functions:log
```

Or in GCP Console:
- Cloud Functions → Click function name → Logs

Expected log output:
```
Session sid_test_001 event sequence: page_view → CLICK(BUTTON#test) → form_submit(signup_form)
LLM Response: {...}
Successfully generated story for session sid_test_001
```

### 8.3 Check Generated Story

In Firebase Console:
- Go to `sessionStories` collection
- Should see new document: `sid_test_001`
- View the generated story fields

---

## Step 9: Test Manual HTTP Endpoint

### 9.1 Get Function URL

```bash
firebase functions:describe generateUserStoryManual
```

Or find in GCP Console → Cloud Functions → generateUserStoryManual

URL format:
```
https://us-central1-PROJECT_ID.cloudfunctions.net/generateUserStoryManual
```

### 9.2 Test with curl

```bash
curl -X POST https://us-central1-PROJECT_ID.cloudfunctions.net/generateUserStoryManual \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sid_test_002"
  }'
```

### 9.3 Test with Node.js

```javascript
const response = await fetch(
  'https://us-central1-PROJECT_ID.cloudfunctions.net/generateUserStoryManual',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'sid_test_002' })
  }
);

const result = await response.json();
console.log(result);
```

---

## Step 10: Monitoring & Troubleshooting

### 10.1 View Real-time Logs

```bash
firebase functions:log --lines 50
```

### 10.2 Check GCP Cloud Logging

Go to: https://console.cloud.google.com/logs

- Service: Cloud Functions
- Filter by function name: `generateUserStoryOnEvent`

### 10.3 Monitor Function Invocations

```bash
# Get usage metrics
firebase functions:list --json

# Or in GCP Console
# Cloud Functions → Click function → Metrics
```

### 10.4 Common Issues

**Issue**: Function not triggering
- [ ] Verify Firestore trigger is in "Active" state
- [ ] Check indexes are created
- [ ] Verify sessionId is populated in events
- [ ] Check Cloud Firestore is operational (not in maintenance)

**Issue**: OpenAI API errors
- [ ] Verify API key is set: `firebase functions:config:get`
- [ ] Check OpenAI account has credits
- [ ] Check API key hasn't been revoked

**Issue**: Deadline exceeded (timeout)
- [ ] Function took too long to process
- [ ] Increase timeout in GCP Console or code
- [ ] Optimize LLM query or use faster model

**Issue**: "Index not found" error
- [ ] Create composite index as described in Step 6.2
- [ ] Wait for index to build (1-5 minutes)

---

## Step 11: Optimize & Scale

### 11.1 Adjust LLM Model for Cost

In `index.js`, change model:

```javascript
// Cheaper alternative
model: "gpt-3.5-turbo",

// More capable
model: "gpt-4",
```

### 11.2 Set Memory & Timeout

In GCP Console or Cloud Functions config:

```bash
firebase deploy --only functions \
  --set-env-vars=FIRESTORE_REGION=us-central1
```

Or in GCP Console:
- Cloud Functions → Edit function
- Memory: 256 MB (default is fine)
- Timeout: 60 seconds (default)

### 11.3 Setup Monitoring Alerts

Via GCP Console:
- Cloud Monitoring → Uptime checks
- Alert on function errors or slow execution

---

## Step 12: Production Checklist

Before going live:

- [ ] API keys stored securely (not in code)
- [ ] Firestore security rules reviewed and deployed
- [ ] Function error handling tested
- [ ] OpenAI costs estimated and budgeted
- [ ] Monitoring and logging configured
- [ ] Backup/disaster recovery plan in place
- [ ] Load testing completed (if high volume)
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## Updating the Function

### To Update Code

```bash
# Make changes to index.js

# Deploy updated function
firebase deploy --only functions:generateUserStoryOnEvent

# View new logs
firebase functions:log
```

### To Update Configuration

```bash
# Update API key
firebase functions:config:set openai.key="new-key"

# Deploy
firebase deploy --only functions
```

---

## Rollback Deployment

```bash
# Revert to previous version (via GCP Console)
# Cloud Functions → Versions → Click previous version → Promote

# Or redeploy specific commit
git checkout <commit-hash>
firebase deploy --only functions
```

---

## Cost Estimation

### Per-Session Costs

- **OpenAI GPT-4 Turbo**: ~$0.03-0.05 per story
- **Firestore reads**: 1 read per 10 events analyzed = $0.06 per million reads
- **Firestore writes**: 1 write per story = $0.18 per million writes
- **Cloud Functions**: $0.40 per 1M invocations (included in free tier)

### Example Monthly Cost

For 10,000 sessions/month:
- OpenAI: $300-500
- Firestore: < $1
- Cloud Functions: < $0.01
- **Total: ~$300-500/month**

To reduce costs:
- Use GPT-3.5-turbo (~$0.001 per story)
- Batch process multiple sessions
- Filter out low-event sessions

---

## Next Steps

1. ✅ Deploy Cloud Function
2. ✅ Setup Firestore database
3. Integrate with `session-tracker.js` client library
4. Monitor production metrics
5. Iterate on LLM prompts for better insights
6. Setup dashboard to visualize user stories
7. Export data to analytics platform

---

**Deployment complete! Your user story generator is now live.** 🚀

For issues, check:
- Firebase logs: `firebase functions:log`
- GCP Cloud Logging: https://console.cloud.google.com/logs
- OpenAI status: https://status.openai.com

