const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai").default;

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Firestore Trigger: Generate user story when new event is added
 * Runs on document creation in the 'events' collection
 */
exports.generateUserStoryOnEvent = functions.firestore
  .document("events/{eventId}")
  .onCreate(async (snap, context) => {
    try {
      const event = snap.data();
      const { sessionId } = event;

      // Validate required fields
      if (!sessionId) {
        console.log("Event missing sessionId, skipping");
        return null;
      }

      // Check if story already exists for this session (idempotency)
      const existingStory = await db
        .collection("sessionStories")
        .doc(sessionId)
        .get();

      if (existingStory.exists) {
        console.log(`Story already exists for session ${sessionId}`);
        return null;
      }

      // Fetch all events for this session
      const eventsSnapshot = await db
        .collection("events")
        .where("sessionId", "==", sessionId)
        .orderBy("timestamp", "asc")
        .get();

      // Ignore sessions with fewer than 3 events
      if (eventsSnapshot.size < 3) {
        console.log(
          `Session ${sessionId} has only ${eventsSnapshot.size} events, skipping`
        );
        return null;
      }

      // Build event sequence
      const eventSequence = buildEventSequence(eventsSnapshot);
      console.log(`Session ${sessionId} event sequence:`, eventSequence);

      // Generate story using LLM
      const story = await generateStoryWithLLM(eventSequence, sessionId);

      // Store result in sessionStories collection
      await db.collection("sessionStories").doc(sessionId).set({
        sessionId: sessionId,
        intent: story.intent,
        userStory: story.userStory,
        frictionPoints: story.frictionPoints,
        summary: story.summary,
        generatedAt: admin.firestore.Timestamp.now(),
        eventCount: eventsSnapshot.size,
        firstEventTime: eventsSnapshot.docs[0].data().timestamp,
        lastEventTime: eventsSnapshot.docs[eventsSnapshot.size - 1].data()
          .timestamp,
      });

      console.log(`Successfully generated story for session ${sessionId}`);
      return null;
    } catch (error) {
      console.error("Error in generateUserStoryOnEvent:", error);
      // Don't throw - let Firestore handle the error gracefully
      return null;
    }
  });

/**
 * Build a readable event sequence from Firestore documents
 * Example: "home → pricing → signup_click → form_start → abandon"
 */
function buildEventSequence(eventsSnapshot) {
  const sequence = [];

  eventsSnapshot.forEach((doc) => {
    const eventData = doc.data();
    const eventType = eventData.eventType || "unknown";

    // Optionally include context from metadata
    let eventLabel = eventType;

    if (eventType === "page_view") {
      // Extract page name from URL
      const url = eventData.url || "";
      const pathname = url.split("?")[0];
      const pageName = pathname.split("/").pop() || "home";
      eventLabel = pageName || "home";
    } else if (eventType === "click") {
      // Include clicked element
      if (eventData.element) {
        eventLabel = `${eventType}(${eventData.element})`;
      }
    } else if (eventType === "form_submit") {
      // Include form name if available
      const formName = eventData.metadata?.formName || "form";
      eventLabel = `form_submit(${formName})`;
    }

    sequence.push(eventLabel);
  });

  return sequence.join(" → ");
}

/**
 * Send event sequence to OpenAI and generate user story
 */
async function generateStoryWithLLM(eventSequence, sessionId) {
  const systemPrompt = `You are a UX analyst specializing in user behavior analysis.
Analyze user session behavior and generate:
1. Intent: What the user was trying to accomplish (1-2 sentences)
2. User Story: A narrative description of the user journey (2-3 sentences)
3. Friction Points: A list of barriers or issues that slowed the user down (JSON array of strings)
4. Summary: A one-line classification (e.g., "Completed signup", "Browsed products, no purchase", "Abandoned checkout")

Return ONLY valid JSON with these exact keys: intent, userStory, frictionPoints, summary`;

  const userPrompt = `Session ID: ${sessionId}

Event sequence: ${eventSequence}

Analyze this user behavior and generate insights.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    console.log("LLM Response:", content);

    // Parse JSON response
    const story = JSON.parse(content);

    // Validate required fields
    if (!story.intent || !story.userStory || !story.frictionPoints || !story.summary) {
      throw new Error("LLM response missing required fields");
    }

    // Ensure frictionPoints is an array
    if (!Array.isArray(story.frictionPoints)) {
      story.frictionPoints = [story.frictionPoints];
    }

    return story;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

/**
 * Optional: HTTP trigger to manually process a session
 * Useful for testing and backfilling
 * 
 * Usage: POST /generateUserStory
 * Body: { sessionId: "sid_1234567890_abc123" }
 */
exports.generateUserStoryManual = functions.https.onRequest(
  async (req, res) => {
    try {
      // Validate request
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      // Check if story already exists
      const existingStory = await db
        .collection("sessionStories")
        .doc(sessionId)
        .get();

      if (existingStory.exists) {
        return res.status(409).json({
          error: "Story already exists for this session",
          story: existingStory.data(),
        });
      }

      // Fetch all events for this session
      const eventsSnapshot = await db
        .collection("events")
        .where("sessionId", "==", sessionId)
        .orderBy("timestamp", "asc")
        .get();

      if (eventsSnapshot.size === 0) {
        return res.status(404).json({
          error: "No events found for this session",
        });
      }

      if (eventsSnapshot.size < 3) {
        return res.status(400).json({
          error: `Session has only ${eventsSnapshot.size} events (minimum 3 required)`,
        });
      }

      // Build event sequence and generate story
      const eventSequence = buildEventSequence(eventsSnapshot);
      const story = await generateStoryWithLLM(eventSequence, sessionId);

      // Store result
      await db.collection("sessionStories").doc(sessionId).set({
        sessionId: sessionId,
        intent: story.intent,
        userStory: story.userStory,
        frictionPoints: story.frictionPoints,
        summary: story.summary,
        generatedAt: admin.firestore.Timestamp.now(),
        eventCount: eventsSnapshot.size,
        firstEventTime: eventsSnapshot.docs[0].data().timestamp,
        lastEventTime: eventsSnapshot.docs[eventsSnapshot.size - 1].data()
          .timestamp,
      });

      return res.status(200).json({
        success: true,
        message: "User story generated successfully",
        sessionId: sessionId,
        story: story,
        eventCount: eventsSnapshot.size,
      });
    } catch (error) {
      console.error("Error in generateUserStoryManual:", error);
      return res.status(500).json({
        error: "Failed to generate user story",
        details: error.message,
      });
    }
  }
);

/**
 * Optional: Cleanup function to delete sessionStories for testing
 * Development only - remove in production
 * 
 * Usage: POST /deleteSessionStory
 * Body: { sessionId: "sid_1234567890_abc123" }
 */
exports.deleteSessionStory = functions.https.onRequest(
  async (req, res) => {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Not allowed in production" });
      }

      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      await db.collection("sessionStories").doc(sessionId).delete();

      return res.status(200).json({
        success: true,
        message: `Deleted story for session ${sessionId}`,
      });
    } catch (error) {
      console.error("Error in deleteSessionStory:", error);
      return res.status(500).json({
        error: "Failed to delete story",
        details: error.message,
      });
    }
  }
);
