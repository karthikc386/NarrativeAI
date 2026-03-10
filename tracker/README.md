# session-tracker.js

A lightweight, non-blocking JavaScript library for capturing user session activity and sending events to Firebase Firestore.

## Features

✨ **Lightweight** - Under 10KB minified  
⚡ **Non-blocking** - Async event delivery via fetch API  
📊 **Auto-tracking** - Captures page_view, click, scroll, navigation, form_submit  
🎯 **Custom Events** - Manual event tracking API  
📦 **Batching** - Events batched every 5 seconds  
🔒 **Privacy-ready** - Works with localStorage & modern browsers  
📱 **No Dependencies** - Pure vanilla JavaScript  

## Installation

### Via Script Tag

```html
<script src="session-tracker.js"></script>
<script>
  sessionTracker.init({
    endpoint: 'YOUR_FIRESTORE_ENDPOINT',
    debug: false
  });
</script>
```

### With Data Attributes (Self-initializing)

```html
<script 
  src="session-tracker.js"
  data-auto-init="true"
  data-firestore-endpoint="YOUR_FIRESTORE_ENDPOINT">
</script>
```

## Configuration

```javascript
sessionTracker.init({
  endpoint: 'https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/events',
  debug: false  // Enable console logs for troubleshooting
});
```

### Firestore Endpoint Format

For Firebase Firestore, use the REST API endpoint:

```
https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{COLLECTION}
```

You must authenticate via:
- Request headers with Bearer token
- Or use Firestore rules to allow unauthenticated writes

## API

### initialize

```javascript
sessionTracker.init(options)
```

Initialize the tracker with Firestore endpoint configuration.

### Track Custom Events

```javascript
sessionTracker.event(eventType, metadata)
```

**Example:**

```javascript
// Simple event
sessionTracker.event('signup_attempt');

// Event with metadata
sessionTracker.event('purchase_complete', {
  amount: 99.99,
  currency: 'USD',
  productId: 'prod_123'
});
```

### Manually Flush Events

```javascript
sessionTracker.flush()
```

### Get Current Session ID

```javascript
const sessionId = sessionTracker.getSessionId();
```

### Check Pending Events (Debug)

```javascript
const pending = sessionTracker.getPendingEvents();
console.log(`Pending events: ${pending}`);
```

## Auto-Tracked Events

The library automatically captures the following events:

### page_view
Sent when the page loads.

```json
{
  "sessionId": "sid_1234567890_abc123",
  "eventType": "page_view",
  "url": "https://example.com/products",
  "timestamp": "2026-03-09T14:30:45.123Z",
  "element": null,
  "metadata": {}
}
```

### click
Sent when user clicks any element.

```json
{
  "sessionId": "sid_1234567890_abc123",
  "eventType": "click",
  "url": "https://example.com/products",
  "timestamp": "2026-03-09T14:30:46.456Z",
  "element": "BUTTON#submit.btn-primary",
  "metadata": {
    "element": "BUTTON#submit.btn-primary"
  }
}
```

### scroll
Sent when user scrolls (throttled to once every 2 seconds).

```json
{
  "sessionId": "sid_1234567890_abc123",
  "eventType": "scroll",
  "url": "https://example.com/products",
  "timestamp": "2026-03-09T14:30:48.789Z",
  "element": null,
  "metadata": {
    "scrollY": 1250,
    "scrollX": 0
  }
}
```

### navigation
Sent when user navigates (back/forward buttons).

```json
{
  "sessionId": "sid_1234567890_abc123",
  "eventType": "navigation",
  "url": "https://example.com/checkout",
  "timestamp": "2026-03-09T14:30:50.012Z",
  "element": null,
  "metadata": {
    "url": "https://example.com/checkout"
  }
}
```

### form_submit
Sent when user submits a form.

```json
{
  "sessionId": "sid_1234567890_abc123",
  "eventType": "form_submit",
  "url": "https://example.com/signup",
  "timestamp": "2026-03-09T14:30:52.345Z",
  "element": null,
  "metadata": {
    "formId": "signup-form",
    "formName": "user_registration"
  }
}
```

## Custom Event Example

```json
{
  "sessionId": "sid_1234567890_abc123",
  "eventType": "signup_attempt",
  "url": "https://example.com/signup",
  "timestamp": "2026-03-09T14:30:54.678Z",
  "element": null,
  "metadata": {
    "source": "newsletter",
    "plan": "premium"
  }
}
```

## Event Batching

Events are batched and sent to Firestore in two scenarios:

1. **Time-based**: Events are sent every 5 seconds (configurable in code)
2. **Size-based**: Events are sent immediately when batch reaches 50 events

When the page unloads, any pending events are flushed automatically.

## Firestore Payload Format

The library sends events in Firestore REST API format:

```json
{
  "writes": [
    {
      "document": {
        "fields": {
          "sessionId": { "stringValue": "sid_1234567890_abc123" },
          "eventType": { "stringValue": "click" },
          "url": { "stringValue": "https://example.com" },
          "timestamp": { "stringValue": "2026-03-09T14:30:46.456Z" },
          "element": { "stringValue": "BUTTON#submit" },
          "metadata": {
            "mapValue": {
              "fields": {
                "source": { "stringValue": "organic" }
              }
            }
          }
        }
      }
    }
  ]
}
```

## Session ID

A unique session ID is automatically generated and stored in `localStorage` with key `st_sessionId`. The session persists across page reloads within the same browser.

Session ID format: `sid_{timestamp}_{random}`

Example: `sid_1709942445000_x7y2k9m`

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- All modern browsers with fetch API and localStorage support

## Performance Considerations

- **Non-blocking**: All network requests use `keepalive: true` and run asynchronously
- **Minimal footprint**: ~4KB minified gzipped
- **Event batching**: Automatic batching reduces server load
- **Throttling**: Scroll events throttled to once per 2 seconds

## Security

### Before Production:

1. Configure Firestore security rules to validate events
2. Consider using a cloud function to process and validate events
3. Never expose API keys in client code; use service account or application-specific credentials
4. Implement rate limiting on your Firestore writes

### Example Firestore Security Rule

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{document=**} {
      allow create: if request.auth != null || 
                        request.resource.data.keys().hasAll(['sessionId', 'eventType', 'timestamp']);
    }
  }
}
```

## Examples

### Full HTML Page Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome</h1>
  <button id="signup-btn">Sign Up</button>

  <script src="session-tracker.js"></script>
  <script>
    // Initialize tracker
    sessionTracker.init({
      endpoint: 'https://firestore.googleapis.com/v1/projects/my-project/databases/(default)/documents/events'
    });

    // Track custom event
    document.getElementById('signup-btn').addEventListener('click', function() {
      sessionTracker.event('signup_button_click', {
        buttonText: 'Sign Up',
        position: 'top'
      });
    });

    // Manually flush (test)
    setTimeout(function() {
      sessionTracker.flush();
    }, 10000);
  </script>
</body>
</html>
```

### React Integration

```javascript
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize after script loads
    if (window.sessionTracker) {
      window.sessionTracker.init({
        endpoint: process.env.REACT_APP_FIRESTORE_ENDPOINT
      });
    }
  }, []);

  const handleCustomEvent = () => {
    window.sessionTracker.event('user_action', {
      action: 'button_click',
      timestamp: Date.now()
    });
  };

  return <button onClick={handleCustomEvent}>Track Event</button>;
}

export default App;
```

### Vue Integration

```javascript
export default {
  mounted() {
    if (window.sessionTracker) {
      window.sessionTracker.init({
        endpoint: process.env.VUE_APP_FIRESTORE_ENDPOINT
      });
    }
  },
  methods: {
    trackEvent(name) {
      window.sessionTracker.event('vue_event', {
        eventName: name
      });
    }
  }
}
```

## Size

- **Minified**: ~4.2 KB
- **Minified + Gzipped**: ~1.8 KB

Meet all size requirements for production deployment.

## Troubleshooting

### Events not sending?

1. Check that the Firestore endpoint is correct
2. Verify CORS headers on Firestore (should be allowed from your domain)
3. Check browser console for network errors
4. Enable debug mode: `sessionTracker.init({ debug: true })`

### localStorage is disabled?

The library gracefully degrades if localStorage is unavailable. Session IDs will be generated per-session but not persisted.

### Missing events?

- Use `sessionTracker.getPendingEvents()` to check if events are queued
- Call `sessionTracker.flush()` manually to force send
- Check browser network tab for failed requests

## License

MIT License - Feel free to use in your projects

## Support

For issues or feature requests, please open an issue in the repository.

---

**Built for modern web applications with privacy and performance in mind.**
