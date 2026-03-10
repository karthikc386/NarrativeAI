/**
 * FIRESTORE EXAMPLE DOCUMENTS
 * Copy and paste into Firebase console to test locally
 */

// ========================================
// EXAMPLE 1: User Browsing Session
// ========================================

// events/evt_001
{
  "sessionId": "sid_1709942445000_abc123",
  "eventType": "page_view",
  "url": "https://example.com/",
  "timestamp": "2026-03-09T14:30:45.000Z",
  "element": null,
  "metadata": {}
}

// events/evt_002
{
  "sessionId": "sid_1709942445000_abc123",
  "eventType": "page_view",
  "url": "https://example.com/products",
  "timestamp": "2026-03-09T14:30:50.000Z",
  "element": null,
  "metadata": {}
}

// events/evt_003
{
  "sessionId": "sid_1709942445000_abc123",
  "eventType": "click",
  "url": "https://example.com/products",
  "timestamp": "2026-03-09T14:30:55.000Z",
  "element": "A.product-card",
  "metadata": {
    "element": "A.product-card"
  }
}

// events/evt_004
{
  "sessionId": "sid_1709942445000_abc123",
  "eventType": "page_view",
  "url": "https://example.com/pricing",
  "timestamp": "2026-03-09T14:31:00.000Z",
  "element": null,
  "metadata": {}
}

// events/evt_005
{
  "sessionId": "sid_1709942445000_abc123",
  "eventType": "scroll",
  "url": "https://example.com/pricing",
  "timestamp": "2026-03-09T14:31:05.000Z",
  "element": null,
  "metadata": {
    "scrollY": 500,
    "scrollX": 0
  }
}

// events/evt_006
{
  "sessionId": "sid_1709942445000_abc123",
  "eventType": "click",
  "url": "https://example.com/pricing",
  "timestamp": "2026-03-09T14:31:10.000Z",
  "element": "BUTTON#signup_btn",
  "metadata": {
    "element": "BUTTON#signup_btn"
  }
}

// events/evt_007
{
  "sessionId": "sid_1709942445000_abc123",
  "eventType": "form_submit",
  "url": "https://example.com/signup",
  "timestamp": "2026-03-09T14:31:15.000Z",
  "element": null,
  "metadata": {
    "formId": "signup_form",
    "formName": "user_registration"
  }
}

// Generated story would be in sessionStories/sid_1709942445000_abc123:
{
  "sessionId": "sid_1709942445000_abc123",
  "intent": "User wanted to learn about pricing plans and sign up for the service",
  "userStory": "User visited the homepage, browsed available products, reviewed the pricing page, and initiated the signup process. They scrolled through pricing options and clicked the signup button, successfully submitting the registration form.",
  "frictionPoints": [],
  "summary": "Successfully completed signup",
  "generatedAt": "2026-03-09T14:31:16.000Z",
  "eventCount": 7,
  "firstEventTime": "2026-03-09T14:30:45.000Z",
  "lastEventTime": "2026-03-09T14:31:15.000Z"
}

// ========================================
// EXAMPLE 2: User Abandoned Cart
// ========================================

// events/evt_008
{
  "sessionId": "sid_1709942500000_xyz789",
  "eventType": "page_view",
  "url": "https://example.com/",
  "timestamp": "2026-03-09T15:00:00.000Z",
  "element": null,
  "metadata": {}
}

// events/evt_009
{
  "sessionId": "sid_1709942500000_xyz789",
  "eventType": "click",
  "url": "https://example.com/",
  "timestamp": "2026-03-09T15:00:05.000Z",
  "element": "A#shop_link",
  "metadata": {
    "element": "A#shop_link"
  }
}

// events/evt_010
{
  "sessionId": "sid_1709942500000_xyz789",
  "eventType": "page_view",
  "url": "https://example.com/shop",
  "timestamp": "2026-03-09T15:00:10.000Z",
  "element": null,
  "metadata": {}
}

// events/evt_011
{
  "sessionId": "sid_1709942500000_xyz789",
  "eventType": "click",
  "url": "https://example.com/shop",
  "timestamp": "2026-03-09T15:00:15.000Z",
  "element": "BUTTON.add_to_cart",
  "metadata": {
    "element": "BUTTON.add_to_cart",
    "productId": "prod_123"
  }
}

// events/evt_012
{
  "sessionId": "sid_1709942500000_xyz789",
  "eventType": "page_view",
  "url": "https://example.com/checkout",
  "timestamp": "2026-03-09T15:00:20.000Z",
  "element": null,
  "metadata": {}
}

// events/evt_013
{
  "sessionId": "sid_1709942500000_xyz789",
  "eventType": "click",
  "url": "https://example.com/checkout",
  "timestamp": "2026-03-09T15:01:00.000Z",
  "element": "BUTTON#payment_button",
  "metadata": {
    "element": "BUTTON#payment_button"
  }
}

// Generated story would be in sessionStories/sid_1709942500000_xyz789:
{
  "sessionId": "sid_1709942500000_xyz789",
  "intent": "User wanted to purchase a product",
  "userStory": "User visited the homepage, navigated to the shop, added a product to their cart, and proceeded to checkout. They attempted to click the payment button but the session ended without completing the purchase.",
  "frictionPoints": [
    "Payment process may have encountered an error",
    "Checkout page took 40 seconds before payment attempt",
    "No error message displayed to user"
  ],
  "summary": "Added to cart, abandoned at payment",
  "generatedAt": "2026-03-09T15:01:05.000Z",
  "eventCount": 6,
  "firstEventTime": "2026-03-09T15:00:00.000Z",
  "lastEventTime": "2026-03-09T15:01:00.000Z"
}

// ========================================
// EXAMPLE 3: Mobile User Quick Browse
// ========================================

// events/evt_014
{
  "sessionId": "sid_1709942600000_mobile01",
  "eventType": "page_view",
  "url": "https://example.com/blog",
  "timestamp": "2026-03-09T15:30:00.000Z",
  "element": null,
  "metadata": {
    "userAgent": "Mozilla/5.0 (iPhone..."
  }
}

// events/evt_015
{
  "sessionId": "sid_1709942600000_mobile01",
  "eventType": "scroll",
  "url": "https://example.com/blog",
  "timestamp": "2026-03-09T15:30:05.000Z",
  "element": null,
  "metadata": {
    "scrollY": 300,
    "scrollX": 0
  }
}

// events/evt_016
{
  "sessionId": "sid_1709942600000_mobile01",
  "eventType": "click",
  "url": "https://example.com/blog",
  "timestamp": "2026-03-09T15:30:10.000Z",
  "element": "A.blog_post",
  "metadata": {
    "element": "A.blog_post",
    "postTitle": "Getting Started Guide"
  }
}

// Generated story:
{
  "sessionId": "sid_1709942600000_mobile01",
  "intent": "User wanted to read blog content",
  "userStory": "Mobile user accessed the blog page and scrolled through the post list. They clicked on a 'Getting Started Guide' article to read more information.",
  "frictionPoints": [],
  "summary": "Browsed blog and viewed article",
  "generatedAt": "2026-03-09T15:30:11.000Z",
  "eventCount": 3,
  "firstEventTime": "2026-03-09T15:30:00.000Z",
  "lastEventTime": "2026-03-09T15:30:10.000Z"
}

// ========================================
// IMPORTS: Add these to your Firestore database via console:
// 1. Go to https://console.firebase.google.com
// 2. Select your project
// 3. Open Firestore Database
// 4. Create collections "events" and "sessionStories"
// 5. Add documents with above data
// 6. Deploy Cloud Function
// 7. New documents in "events" will trigger story generation
// ========================================
