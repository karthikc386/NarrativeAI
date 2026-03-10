/**
 * session-tracker.js - Lightweight session tracking library
 * Captures user activity events and sends them to Firebase Firestore
 * Size optimized for production use
 */
(function() {
  'use strict';

  // Configuration constants
  const BATCH_INTERVAL = 5000;
  const STORAGE_KEY = 'st_sessionId';
  const MAX_BATCH_SIZE = 50;
  const SCROLL_THROTTLE = 2000;

  // State
  let sessionId = null;
  let eventBatch = [];
  let batchTimer = null;
  let lastScrollTime = 0;
  let config = {};

  /**
   * Get or create a session ID from localStorage
   */
  function getOrCreateSessionId() {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = 'sid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch (e) {
        // localStorage may be disabled or full
        console.warn('sessionTracker: localStorage unavailable');
      }
    }
    return id;
  }

  /**
   * Get element identifier string from DOM element
   */
  function getElementId(el) {
    if (!el) return null;
    let id = el.tagName;
    if (el.id) id += '#' + el.id;
    if (el.className) id += '.' + el.className.split(' ')[0];
    return id;
  }

  /**
   * Format metadata object to Firestore field format
   */
  function formatMetadata(obj) {
    const fields = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          fields[key] = { stringValue: value };
        } else if (typeof value === 'number') {
          fields[key] = { doubleValue: value };
        } else if (typeof value === 'boolean') {
          fields[key] = { booleanValue: value };
        } else if (value === null) {
          fields[key] = { nullValue: true };
        } else {
          fields[key] = { stringValue: String(value) };
        }
      }
    }
    return fields;
  }

  /**
   * Track an event
   */
  function trackEvent(eventType, metadata) {
    metadata = metadata || {};
    
    const event = {
      sessionId: sessionId,
      eventType: eventType,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      element: metadata.element || null,
      metadata: metadata
    };

    eventBatch.push(event);

    // Flush if batch is full
    if (eventBatch.length >= MAX_BATCH_SIZE) {
      flushBatch();
    } else if (!batchTimer) {
      // Schedule batch send
      batchTimer = setTimeout(function() {
        flushBatch();
      }, BATCH_INTERVAL);
    }
  }

  /**
   * Send batched events to Firestore
   */
  function flushBatch() {
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }

    if (eventBatch.length === 0 || !config.endpoint) {
      return;
    }

    const eventsToSend = eventBatch.splice(0);

    // Prepare Firestore REST API payload
    const writeRequests = eventsToSend.map(function(event) {
      return {
        document: {
          fields: {
            sessionId: { stringValue: event.sessionId },
            eventType: { stringValue: event.eventType },
            url: { stringValue: event.url },
            timestamp: { stringValue: event.timestamp },
            element: event.element ? { stringValue: event.element } : { nullValue: true },
            metadata: { mapValue: { fields: formatMetadata(event.metadata) } }
          }
        }
      };
    });

    const payload = { writes: writeRequests };

    // Send asynchronously, non-blocking
    fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function(err) {
      // Silently fail to avoid blocking user
      if (config.debug) {
        console.error('sessionTracker: Failed to send events', err);
      }
    });
  }

  /**
   * Setup automatic event tracking
   */
  function setupAutoTracking() {
    // Track page view
    trackEvent('page_view', {});

    // Track clicks
    document.addEventListener('click', function(e) {
      const element = getElementId(e.target);
      trackEvent('click', { element: element });
    }, true);

    // Track scroll (throttled)
    window.addEventListener('scroll', function() {
      const now = Date.now();
      if (now - lastScrollTime > SCROLL_THROTTLE) {
        trackEvent('scroll', {
          scrollY: Math.round(window.scrollY),
          scrollX: Math.round(window.scrollX)
        });
        lastScrollTime = now;
      }
    }, true);

    // Track navigation (back/forward)
    window.addEventListener('popstate', function() {
      trackEvent('navigation', {
        url: window.location.href
      });
    });

    // Track form submissions
    document.addEventListener('submit', function(e) {
      const formId = e.target.id || 'anonymous';
      const formName = e.target.name || '';
      trackEvent('form_submit', {
        formId: formId,
        formName: formName
      });
    }, true);

    // Flush events when page unloads
    window.addEventListener('beforeunload', function() {
      flushBatch();
    });
  }

  /**
   * Public API
   */
  window.sessionTracker = {
    /**
     * Initialize the tracker with Firestore config
     * @param {Object} options - Configuration object
     * @param {string} options.endpoint - Firestore REST API endpoint
     * @param {boolean} options.debug - Enable debug logging
     */
    init: function(options) {
      config = options || {};
      sessionId = getOrCreateSessionId();
      setupAutoTracking();
    },

    /**
     * Track a custom event
     * @param {string} eventType - Type of event
     * @param {Object} metadata - Event metadata
     */
    event: function(eventType, metadata) {
      trackEvent(eventType, metadata);
    },

    /**
     * Manually flush pending events
     */
    flush: function() {
      flushBatch();
    },

    /**
     * Get current session ID
     */
    getSessionId: function() {
      return sessionId;
    },

    /**
     * Get batch size (for debugging)
     */
    getPendingEvents: function() {
      return eventBatch.length;
    }
  };

})();
