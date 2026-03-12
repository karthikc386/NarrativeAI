# NarrativeAI - Complete User Session Analytics Platform

**Capture user behavior events and automatically generate AI-powered user stories using Firebase and OpenAI.**

## 🎯 Overview

NarrativeAI is a complete solution for understanding user behavior through automated session analysis:

```
Website → session-tracker.js → Firestore → Cloud Function → OpenAI GPT-4 → User Stories
```

### Key Features

✨ **Automatic Event Capture** - 5 event types: page_view, click, scroll, navigation, form_submit  
🤖 **AI-Powered Analysis** - OpenAI GPT-4 generates intent, user stories, and friction points  
📊 **Session Batching** - Events batched every 5 seconds for efficient delivery  
🚀 **Lightweight** - Client library under 4KB (minified)  
⚡ **Non-Blocking** - Async operations that don't impact page performance  
🔒 **Firebase Native** - Full Firestore integration for serverless scalability  
📱 **Mobile Ready** - Works seamlessly on all modern browsers  

## 📁 Project Structure

```
NarrativeAI/
├── tracker/
│   ├── session-tracker.js          # Client-side event tracking library
│   └── README.md                   # Tracker documentation
│
├── functions/
│   ├── index.js                    # Cloud Function source code
│   ├── package.json                # Dependencies
│   ├── firebase.json               # Firebase configuration
│   ├── firestore.rules             # Security rules
│   ├── firestore.indexes.json      # Firestore indexes
│   ├── .env.example                # Environment template
│   │
│   ├── README.md                   # Complete function documentation
│   ├── QUICK_START.md              # 10-minute setup guide
│   ├── DEPLOYMENT_GUIDE.md         # Step-by-step deployment
│   ├── ARCHITECTURE.md             # System architecture
│   └── EXAMPLE_DOCUMENTS.js        # Firestore test data
│
├── UserSessionAnalyzer.html        # Complete working example
└── README.md                       # This file
```

## 🚀 Quick Start (10 Minutes)

### 1. Prerequisites

```bash
# Install Node.js 20+
npm install -g firebase-tools
firebase login
```

### 2. Setup Firestore

Go to https://console.firebase.google.com:
- Create/select project
- Enable Firestore Database (production mode)
- Create collections: `events`, `sessionStories`

### 3. Deploy Cloud Function

```bash
cd functions

# Set OpenAI API key
firebase functions:config:set openai.key="sk-YOUR_KEY_HERE"

# Deploy
firebase deploy --only functions
```

### 4. Add Events to Firestore (Test)

Create 3 events in the `events` collection:

```json
// Event 1
{
  "sessionId": "test_001",
  "eventType": "page_view",
  "url": "https://example.com",
  "timestamp": "2026-03-09T14:30:45.000Z",
  "element": null,
  "metadata": {}
}

// Event 2
{
  "sessionId": "test_001",
  "eventType": "click",
  "url": "https://example.com",
  "timestamp": "2026-03-09T14:30:50.000Z",
  "element": "BUTTON#test",
  "metadata": {}
}

// Event 3
{
  "sessionId": "test_001",
  "eventType": "form_submit",
  "url": "https://example.com",
  "timestamp": "2026-03-09T14:30:55.000Z",
  "element": null,
  "metadata": {}
}
```

### 5. Check Results

Look in `sessionStories` collection → You'll see auto-generated story! ✨

## 📚 Documentation

### Client-Side (session-tracker.js)

[Read tracker documentation](tracker/README.md)

**Quick example:**

```html
<script src="session-tracker.js"></script>
<script>
  // Initialize
  sessionTracker.init({
    endpoint: 'https://firestore.googleapis.com/v1/projects/PROJECT/databases/(default)/documents/events'
  });

  // Track custom event anytime
  sessionTracker.event('user_signup', {
    plan: 'premium',
    source: 'organic'
  });
</script>
```

### Server-Side (Cloud Function)

[Read function documentation](functions/README.md)

[Quick deployment guide](functions/QUICK_START.md)

[Full deployment instructions](functions/DEPLOYMENT_GUIDE.md)

### Integration

[See complete working example](UserSessionAnalyzer.html)

## 🏗️ System Architecture

### Data Flow

1. **Client (Website)**
   - User visits page
   - `session-tracker.js` captures events
   - Events batched in memory

2. **Event Transmission** (Every 5 seconds or when batch fills)
   - Events sent to Firestore REST API
   - Recorded in `events` collection
   - Non-blocking, async HTTP

3. **Cloud Function** (Triggered automatically)
   - Listen for new documents in `events`
   - Query all events with same `sessionId`
   - Minimum 3 events required
   - One story generated per session (idempotent)

4. **AI Analysis** (OpenAI GPT-4)
   - Receives event sequence
   - Generates:
     - **Intent**: What user was trying to do
     - **User Story**: Narrative of journey
     - **Friction Points**: Barriers encountered
     - **Summary**: One-line classification

5. **Storage** (Firestore)
   - Results written to `sessionStories`
   - Include metadata: timing, event count
   - Ready for querying and analysis

### Firestore Collections

**events**
- Input collection for raw session events
- Auto-populated by `session-tracker.js`
- Trigger for Cloud Function

**sessionStories**
- Output collection with AI analysis
- One document per session
- Contains intent, story, friction points, summary

## 💡 Example Outputs

### Input: Event Sequence
```
home → products → click(product-card) → pricing → click(signup) → signup_form → form_submit
```

### Output: Generated Story
```json
{
  "sessionId": "sid_1709942445000_abc123",
  "intent": "User wanted to explore products and sign up",
  "userStory": "Sarah visited the homepage, browsed product listings, clicked on a specific product, reviewed pricing information, and clicked the signup button to create an account.",
  "frictionPoints": [
    "Product page took longer than expected to load",
    "Pricing wasn't immediately visible on homepage"
  ],
  "summary": "Successfully initiated signup flow",
  "generatedAt": "2026-03-09T14:31:00.000Z",
  "eventCount": 7,
  "firstEventTime": "2026-03-09T14:30:45.000Z",
  "lastEventTime": "2026-03-09T14:30:58.000Z"
}
```

## 🔐 Security

### Client-Side
- No sensitive data captured
- Session IDs are anonymous (timestamp + random)
- localStorage used only for session persistence

### Server-Side
All included in `functions/firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow create: if request.resource.data.keys().hasAll(['sessionId', 'eventType', 'timestamp']);
    }
    match /sessionStories/{sessionId} {
      allow read: if request.auth != null;
    }
  }
}
```

## 📊 Pricing Estimate

### Per 10,000 Sessions/Month

| Service | Cost |
|---------|------|
| OpenAI (GPT-4) | $300-500 |
| Firestore | < $1 |
| Cloud Functions | < $1 |
| **Total** | **~$300-500** |

**Cost reduction options:**
- Switch to GPT-3.5-turbo (~$10-50/month)
- Filter low-value sessions (< 5 events)
- Use session sampling

## 🧪 Testing

### Local Development

```bash
cd functions
firebase emulators:start --only functions,firestore
```

Add test events and verify stories generate.

### Production Testing

Use the manual HTTP endpoint:

```bash
curl -X POST https://us-central1-PROJECT.cloudfunctions.net/generateUserStoryManual \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "sid_test_001"}'
```

### Monitoring

```bash
firebase functions:log
```

Or view in [GCP Cloud Logging](https://console.cloud.google.com/logs)

## 🔄 Integration Examples

### React App

```javascript
useEffect(() => {
  window.sessionTracker?.init({
    endpoint: process.env.REACT_APP_FIRESTORE_ENDPOINT
  });
}, []);
```

### Next.js

```javascript
// pages/_app.js
useEffect(() => {
  if (window.sessionTracker) {
    sessionTracker.init({
      endpoint: process.env.NEXT_PUBLIC_FIRESTORE_ENDPOINT
    });
  }
}, []);
```

### WordPress

```html
<!-- functions.php or custom script -->
<script src="/wp-content/plugins/narrativeai/session-tracker.js"></script>
<script>
  sessionTracker.init({ endpoint: '<?php echo get_option("narrativeai_endpoint"); ?>' });
</script>
```

## 📈 Use Cases

### E-Commerce
- Understand checkout abandonment
- Identify product page friction
- Track customer journey to purchase

### SaaS Onboarding
- Measure signup completion
- Identify confusing UI flows
- Track feature discovery

### Content Sites
- Understand reader behavior
- Identify popular content paths
- Track engagement metrics

### Mobile Apps
- Monitor user flows
- Identify drop-off points
- Track feature usage patterns

## ⚙️ Configuration

### Client-Side Config

```javascript
sessionTracker.init({
  endpoint: 'YOUR_FIRESTORE_ENDPOINT',
  debug: false  // Enable console logs
});
```

### Server-Side Config

**OpenAI API Key**: Set via Firebase config
```bash
firebase functions:config:set openai.key="sk-..."
```

**Function Settings**: Edit in `functions/index.js`
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4-turbo",      // Change model
  temperature: 0.7,          // Adjust creativity
  max_tokens: 500,           // Response length limit
});
```

## 🐛 Troubleshooting

### Events not appearing in Firestore?
1. Verify Firestore endpoint is correct
2. Check CORS headers are allowed
3. Enable debug mode: `sessionTracker.init({ debug: true })`
4. Check browser console for errors

### Cloud Function not triggering?
1. Verify Firestore trigger is active: `firebase functions:list`
2. Check composite index exists: `firebase firestore:indexes`
3. Ensure sessionId is populated in events
4. View logs: `firebase functions:log`

### Story not generating?
1. Verify session has 3+ events (minimum)
2. Check OpenAI API key is set
3. Verify account has API credits
4. Check function logs for OpenAI errors

## 📞 Support

For detailed information:
- [Client Library Docs](tracker/README.md)
- [Function Docs](functions/README.md)
- [Deployment Guide](functions/DEPLOYMENT_GUIDE.md)
- [Example Code](UserSessionAnalyzer.html)
- [Firestore Test Data](functions/EXAMPLE_DOCUMENTS.js)

## 🎓 Learning Resources

1. **Getting Started**: Read [QUICK_START.md](functions/QUICK_START.md)
2. **Deep Dive**: Read [functions/README.md](functions/README.md)
3. **Integration**: Check [UserSessionAnalyzer.html](UserSessionAnalyzer.html)
4. **Deployment**: Follow [DEPLOYMENT_GUIDE.md](functions/DEPLOYMENT_GUIDE.md)

## 📝 License

MIT License - Use freely in your projects

## 🚀 Next Steps

1. ✅ Deploy Cloud Function
2. ✅ Setup Firestore database
3. Integrate session-tracker.js on your website
4. Monitor user behavior in sessionStories
5. Build dashboards with the insights
6. Iterate on UX based on friction points
7. Export to analytics platform
8. Train ML models on user intents

---

**Built with modern backend practices: Firebase, OpenAI, Node.js, Firestore**

**Questions?** Check the documentation files or view example implementations.

**Ready to deploy?** Start with [Quick Start Guide](functions/QUICK_START.md)

