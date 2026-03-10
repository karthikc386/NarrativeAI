# Firebase Cloud Functions - User Story Generator

Automatically analyzes user session behavior and generates user stories using OpenAI GPT-4.

## Features

🔥 **Firestore Trigger** - Automatically fires when new events are added  
🤖 **LLM-Powered Analysis** - Uses OpenAI GPT-4 to generate insights  
📖 **User Stories** - Generates intent, narrative, friction points, and summary  
🛡️ **Idempotent** - One story per session, idempotent processing  
⚙️ **Error Handling** - Graceful error handling with logging  
🧪 **Manual Trigger** - HTTP endpoint for testing and backfilling  
📊 **Enriched Storage** - Stores timing and event count metadata  

## Architecture

### Firestore Collections

#### `events` (Input)
```json
{
  "eventId": "auto-generated",
  "sessionId": "sid_1709942445000_x7y2k9m",
  "eventType": "click",
  "url": "https://example.com/products",
  "timestamp": "2026-03-09T14:30:46.456Z",
  "element": "BUTTON#submit",
  "metadata": {
    "scrollY": 1250,
    "scrollX": 0
  }
}
```

#### `sessionStories` (Output)
```json
{
  "sessionId": "sid_1709942445000_x7y2k9m",
  "intent": "User wanted to explore pricing options and attempt checkout",
  "userStory": "Sarah visited the home page, browsed product listings...",
  "frictionPoints": ["Pricing unclear", "Form validation error", "Payment method unavailable"],
  "summary": "Browsed products, abandoned checkout",
  "generatedAt": "2026-03-09T14:31:00.000Z",
  "eventCount": 7,
  "firstEventTime": "2026-03-09T14:30:45.000Z",
  "lastEventTime": "2026-03-09T14:30:58.000Z"
}
```

## Prerequisites

- Firebase project with Firestore enabled
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js 20+
- OpenAI API key

## Installation & Deployment

### 1. Setup Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project root
firebase init functions
```

### 2. Set OpenAI API Key

```bash
# Using Firebase config
firebase functions:config:set openai.key="sk-your-api-key-here"

# Verify
firebase functions:config:get
```

### 3. Deploy Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### 4. Enable Firestore Indexes (if needed)

Firebase will prompt to create composite indexes for the query:
```
db.collection("events").where("sessionId", "==", sessionId).orderBy("timestamp", "asc")
```

## Function Reference

### 1. `generateUserStoryOnEvent` (Firestore Trigger)

**Trigger**: Document created in `events` collection

**Behavior**:
- Collects all events with matching `sessionId`
- Validates minimum 3 events
- Generates story if not already exists (idempotent)
- Stores result in `sessionStories`

**Returns**: `null` (runs asynchronously)

### 2. `generateUserStoryManual` (HTTP Trigger)

**Endpoint**: `POST /generateUserStoryManual`

**Request Body**:
```json
{
  "sessionId": "sid_1709942445000_x7y2k9m"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "User story generated successfully",
  "sessionId": "sid_1709942445000_x7y2k9m",
  "story": {
    "intent": "...",
    "userStory": "...",
    "frictionPoints": [...],
    "summary": "..."
  },
  "eventCount": 7
}
```

**Response** (Error Cases):
- `400` - Missing sessionId or fewer than 3 events
- `404` - No events found for session
- `409` - Story already exists
- `500` - Internal error

### 3. `deleteSessionStory` (HTTP Trigger - Dev Only)

**Endpoint**: `POST /deleteSessionStory`

**Request Body**:
```json
{
  "sessionId": "sid_1709942445000_x7y2k9m"
}
```

Only works when `NODE_ENV !== "production"`.

## LLM Prompt

### System Prompt
```
You are a UX analyst specializing in user behavior analysis.
Analyze user session behavior and generate:
1. Intent: What the user was trying to accomplish (1-2 sentences)
2. User Story: A narrative description of the user journey (2-3 sentences)
3. Friction Points: A list of barriers or issues that slowed the user down (JSON array of strings)
4. Summary: A one-line classification (e.g., "Completed signup", "Browsed products, no purchase", etc.)

Return ONLY valid JSON with these exact keys: intent, userStory, frictionPoints, summary
```

### User Message Example
```
Session ID: sid_1709942445000_x7y2k9m

Event sequence: home → pricing → signup_click → form_start → checkout → payment_error → abandon

Analyze this user behavior and generate insights.
```

### LLM Response Example
```json
{
  "intent": "User wanted to sign up for a premium plan and complete checkout",
  "userStory": "User visited the home page, reviewed pricing options, and initiated the signup flow. They filled out a form but encountered a payment processing error when attempting checkout, ultimately abandoning the purchase.",
  "frictionPoints": [
    "Payment processing error prevented completion",
    "No error recovery option offered",
    "Form submission blocked without clear messaging"
  ],
  "summary": "Payment error during checkout signup"
}
```

## Configuration

### Environment Variables

Set via Firebase config:

```bash
firebase functions:config:set openai.key="sk-..."
```

Access in function:

```javascript
const apiKey = functions.config().openai.key;
```

### LLM Model & Parameters

Edit in `index.js` `generateStoryWithLLM()` function:

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4-turbo",      // Change model here
  temperature: 0.7,          // Adjust creativity (0-1)
  max_tokens: 500,           // Limit response length
  // ...
});
```

## Usage Examples

### Automatic Flow (Recommended)

1. Client-side script sends events to Firestore `events` collection
2. Cloud Function automatically triggers
3. Story generated and stored in `sessionStories`
4. No manual intervention needed

### Manual Trigger (Testing)

```bash
curl -X POST https://us-central1-PROJECT_ID.cloudfunctions.net/generateUserStoryManual \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sid_1709942445000_x7y2k9m"
  }'
```

### From JavaScript/Node.js

```javascript
const response = await fetch(
  'https://us-central1-PROJECT_ID.cloudfunctions.net/generateUserStoryManual',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'sid_1709942445000_x7y2k9m'
    })
  }
);

const result = await response.json();
console.log(result.story);
```

## Monitoring & Debugging

### View Function Logs

```bash
firebase functions:log
```

### Real-time Emulation

```bash
firebase emulators:start --only functions,firestore
```

### Test HTTP Functions Locally

```bash
# In firebase emulator shell
curl http://localhost:5001/PROJECT_ID/us-central1/generateUserStoryManual \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_session"}'
```

## Firestore Security Rules

Protect read/write access to session data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow Cloud Functions to read/write
    match /events/{document=**} {
      allow create: if request.auth != null || 
                        request.resource.data.keys().hasAll(['sessionId', 'eventType', 'timestamp']);
    }
    
    match /sessionStories/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == 'cloud-function-service-account';
    }
  }
}
```

## Performance Tuning

### Handling Large Sessions

For sessions with 100+ events, adjust LLM parameters:

```javascript
// Summarize event sequence before sending to LLM
const summarizedSequence = compressEventSequence(eventSequence, 20);
```

### Rate Limiting

Add rate limiting to manual trigger:

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

exports.generateUserStoryManual = functions.https.onRequest(limiter, async (req, res) => {
  // ...
});
```

### Cost Optimization

- **GPT-4 mini** - Cheaper for routine analysis
- **Batch processing** - Process multiple sessions in one request
- **Caching** - Cache similar event sequences

## Example Firestore Documents

### Event Document
```json
{
  "eventId": "evt_001",
  "sessionId": "sid_1709942445000_x7y2k9m",
  "eventType": "page_view",
  "url": "https://example.com/products",
  "timestamp": "2026-03-09T14:30:45.123Z",
  "element": null,
  "metadata": {}
}
```

### Story Document
```json
{
  "sessionId": "sid_1709942445000_x7y2k9m",
  "intent": "User wanted to explore product options and sign up",
  "userStory": "User landed on the homepage, browsed the product catalog, viewed pricing information, and clicked the signup button. They started filling out the registration form.",
  "frictionPoints": [
    "Long product list may be overwhelming",
    "Pricing not immediately visible on homepage",
    "Form required email verification"
  ],
  "summary": "Browsed products and initiated signup",
  "generatedAt": "2026-03-09T14:31:00.000Z",
  "eventCount": 6,
  "firstEventTime": "2026-03-09T14:30:45.000Z",
  "lastEventTime": "2026-03-09T14:30:58.000Z"
}
```

## Troubleshooting

### Function Not Triggering

1. Verify Firestore trigger is active:
   ```bash
   firebase functions:list
   ```

2. Check Cloud Firestore indexes:
   ```bash
   firebase firestore:indexes --project=YOUR_PROJECT_ID
   ```

3. Enable Cloud Functions API in GCP Console

### OpenAI API Errors

```
Error calling OpenAI API: 401 Unauthorized
```
→ Verify API key is set correctly

```
Error calling OpenAI API: 429 Rate Limited
```
→ Add exponential backoff retry logic

### Firestore Query Fails

```
The query requires an index
```
→ Firebase will provide link to create index, click to create automatically

## Deployment Best Practices

1. **Stage deployments**
   ```bash
   firebase deploy --only functions:generateUserStoryOnEvent
   ```

2. **Monitor costs** - GPT-4 calls incur costs (~$0.03 per story)

3. **Set quotas** in GCP Cloud Functions console

4. **Use environment separation**
   ```bash
   firebase deploy --only functions -P production
   ```

5. **Test with Firebase Emulator** before production

## Integration with session-tracker.js

1. Website includes `session-tracker.js`
2. Events sent to Firestore `events` collection
3. Cloud Function receives trigger
4. Story generated and stored
5. Query `sessionStories` collection for insights

### Full Flow Example

```html
<!-- 1. Initialize tracker on client -->
<script src="session-tracker.js"></script>
<script>
  sessionTracker.init({
    endpoint: 'YOUR_FIRESTORE_ENDPOINT'
  });
</script>

<!-- 2. Cloud Function automatically processes session -->
<!-- 3. Query results from sessionStories -->
<script>
  // Later: fetch generated story
  const sessionId = sessionTracker.getSessionId();
  const storyDoc = await db.collection('sessionStories').doc(sessionId).get();
  console.log(storyDoc.data());
</script>
```

## Limits & Quotas

| Item | Limit |
|------|-------|
| Function timeout | 540 seconds |
| Request payload | 10 MB |
| Firestore document | 1 MB |
| OpenAI token limit | 4,000 tokens (gpt-4-turbo) |

## License

MIT License

---

**Built for production user behavior analytics with AI-powered insights.**
