# Quick Start Guide - Firebase User Story Generator

Get the function deployed in 10 minutes.

## 1️⃣ Prerequisites

```bash
# Install Node.js 20+
npm --version

# Install Firebase CLI
npm install -g firebase-tools
firebase login
```

## 2️⃣ Get OpenAI API Key

1. Go to https://platform.openai.com/api/account/api-keys
2. Create new secret key
3. Copy it (you'll use it in step 4)

## 3️⃣ Setup Firestore

In Firebase Console (https://console.firebase.google.com):

1. Select your project
2. Firestore Database → Create database
3. Start in production mode
4. Region: closest to you

## 4️⃣ Deploy Function

```bash
cd d:\NarrativeAI\functions

# Set OpenAI API key
firebase functions:config:set openai.key="sk-YOUR_KEY_HERE"

# Deploy
firebase deploy --only functions
```

## 5️⃣ Create Firestore Collections

In Firebase Console → Firestore:

1. Create collection: `events`
2. Create collection: `sessionStories`

## 6️⃣ Test It

Add 3+ events to Firestore:

```json
// events/evt_001
{
  "sessionId": "test_001",
  "eventType": "page_view",
  "url": "https://example.com",
  "timestamp": "2026-03-09T14:30:45.000Z",
  "element": null,
  "metadata": {}
}

// events/evt_002
{
  "sessionId": "test_001",
  "eventType": "click",
  "url": "https://example.com",
  "timestamp": "2026-03-09T14:30:50.000Z",
  "element": "BUTTON#test",
  "metadata": {}
}

// events/evt_003
{
  "sessionId": "test_001",
  "eventType": "form_submit",
  "url": "https://example.com",
  "timestamp": "2026-03-09T14:30:55.000Z",
  "element": null,
  "metadata": {}
}
```

Check `sessionStories` → Should see auto-generated story! ✨

## API Reference

### Auto-trigger (Firestore)
When new event added:
```
events/{eventId} → generateUserStoryOnEvent
```

### Manual HTTP Trigger
```
POST /generateUserStoryManual
Body: { "sessionId": "sid_123" }
```

## What Gets Generated

```json
{
  "sessionId": "test_001",
  "intent": "User wanted to try the product",
  "userStory": "User visited homepage, clicked signup button, and submitted form",
  "frictionPoints": [],
  "summary": "Completed signup flow",
  "generatedAt": "2026-03-09T14:30:56.000Z",
  "eventCount": 3
}
```

## Monitoring

```bash
firebase functions:log
```

## Done! 🎉

Your function is processing sessions. Check the logs and `sessionStories` collection for results.

**Next**: Integrate with `session-tracker.js` to start collecting real user events.

---

**Need more?** See README.md for full documentation.
