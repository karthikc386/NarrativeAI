# Complete Integration Guide - NarrativeAI System

This guide shows how `session-tracker.js` and the Firebase Cloud Function work together.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WEBSITE                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  session-tracker.js                                   │  │
│  │  ✓ Captures events (page_view, click, scroll, etc)    │  │
│  │  ✓ Batches every 5 seconds                            │  │
│  │  ✓ Sends to Firestore                                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────┘
                          │ HTTP POST (events)
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    FIRESTORE DATABASE                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Collection: events                                    │  │
│  │ ├─ evt_001: sessionId, eventType, url, timestamp... │  │
│  │ ├─ evt_002: ...                                       │  │
│  │ └─ evt_NNN: ...                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                    │
│                   [TRIGGER on new doc]                       │
│                          │                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Cloud Function: generateUserStoryOnEvent              │  │
│  │ 1. Fetch all events with same sessionId              │  │
│  │ 2. Build event sequence                               │  │
│  │ 3. Send to OpenAI GPT-4                              │  │
│  │ 4. Write result to sessionStories                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                          │
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                   INSIGHTS COLLECTION                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Collection: sessionStories                           │  │
│  │ ├─ sid_123: intent, userStory, frictionPoints...  │  │
│  │ ├─ sid_456: (auto-generated LLM analysis)        │  │
│  │ └─ sid_NNN: summary, eventCount, timestamps...   │  │
│  └───────────────────────────────────────────────────────┘  │
│           ↑                                                    │
│           │ Query for analytics, dashboards, etc               │
│           │                                                    │
└───────────┼────────────────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ↓                ↓
[Your Dashboard]  [Analytics]
