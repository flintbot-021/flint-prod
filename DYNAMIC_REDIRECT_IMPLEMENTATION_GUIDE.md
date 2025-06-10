# Dynamic Redirect Feature - Implementation Guide

## Overview

The Dynamic Redirect feature allows campaign builders to redirect users to custom Webflow pages after campaign completion, with dynamic data population. This gives users complete design control while leveraging campaign logic and AI processing.

## How It Works

### 1. **Campaign Builder Flow**
1. Add "Dynamic Redirect" section to your campaign (from Output category)
2. Configure the target Webflow URL
3. Set up variable mappings (which campaign variables map to which Webflow elements)
4. Copy the generated JavaScript code
5. Paste it into your Webflow page's custom code section

### 2. **User Experience Flow**
1. User completes campaign questions
2. AI processes responses and generates variables
3. Instead of showing built-in results, user is redirected to your custom Webflow page
4. The script automatically populates your page with personalized data

## Setup Instructions

### Step 1: Configure Dynamic Redirect Section

In the campaign builder:

1. **Add Section**: Drag "Dynamic Redirect" from the Output category
2. **Set Target URL**: Enter your Webflow page URL (e.g., `https://yoursite.webflow.io/results`)
3. **Choose Data Method**: 
   - **localStorage** (Recommended): Stores data locally, works offline
   - **sessionStorage**: Similar to localStorage but clears when tab closes
   - **URL Parameters**: Adds data to URL (limited by length)

### Step 2: Configure Variable Mappings

Map your campaign variables to Webflow elements:

- **Campaign Variable**: Select from available variables (e.g., `@name`, `@score`)
- **Webflow Attribute**: Create a custom attribute name (e.g., `user-name`, `quiz-score`)
- **CSS Selector** (Optional): Target specific elements (e.g., `.result-name`, `#final-score`)
- **Transformation Type**:
  - **Text Content**: Replaces element's text
  - **HTML Content**: Replaces element's HTML
  - **Attribute Value**: Sets an attribute value
  - **Style Property**: Applies CSS styles

### Step 3: Copy Generated Script

Click "Copy Script to Clipboard" to get the JavaScript code. The script will look like this:

```javascript
<!-- Flint Campaign Dynamic Data Script -->
<script>
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    dataSource: 'localStorage',
    storageKey: 'flint_campaign_data',
    debug: false
  };
  
  // Get data and apply to elements
  function getCampaignData() {
    // Retrieves data based on transmission method
  }
  
  function applyDataToElements(data) {
    // Applies data to your Webflow elements
  }
  
  // Initialize when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
</script>
```

### Step 4: Set Up Webflow Page

1. **Create/Edit Page**: Design your results page in Webflow
2. **Add Custom Code**: Go to Page Settings → Custom Code
3. **Paste Script**: Add the script to "Before </body> tag" section
4. **Tag Elements**: Add data attributes or use @variable text

## Webflow Implementation Methods

### Method 1: Custom Data Attributes (Recommended)

Add `data-variable="variable-name"` to elements:

```html
<!-- In Webflow -->
<h1 data-variable="user-name">Default Name</h1>
<p data-variable="quiz-score">Your score will appear here</p>
<div data-variable="ai-recommendation">Loading recommendation...</div>
```

### Method 2: @Variable Text Replacement

Use @variable syntax directly in your text:

```html
<!-- In Webflow -->
<h1>Hello @name!</h1>
<p>Your score is @score out of 100.</p>
<div>@recommendation</div>
```

### Method 3: CSS Selectors

Target elements by class or ID:

```html
<!-- In Webflow -->
<h1 class="user-name">Default Name</h1>
<p id="final-score">Loading...</p>

<!-- Configure in campaign builder -->
<!-- CSS Selector: .user-name → maps to @name variable -->
<!-- CSS Selector: #final-score → maps to @score variable -->
```

## Variable Types and Examples

### Input Variables (From Questions)

Created automatically from question section titles:

- Question: "What is your name?" → Variable: `@name`
- Question: "How far are you running?" → Variable: `@how_far_are_you_running`
- Multiple choice: "Experience level?" → Variable: `@experience_level`

### AI Output Variables

Created by AI Logic sections:

```javascript
// Example AI outputs
{
  "target_time": "45 minutes",
  "pace": "9:00 per mile", 
  "training_plan": "Beginner 5K plan",
  "motivation": "You've got this! Start with short runs..."
}
```

### Capture Variables

From lead capture forms:

- `@name` - User's full name
- `@email` - Email address  
- `@phone` - Phone number

## Example Implementation

### Campaign Configuration

1. **Question Section**: "What's your name?" (creates `@name`)
2. **Question Section**: "How far are you running?" (creates `@distance`)
3. **AI Logic Section**: Processes inputs, outputs `@target_time`, `@pace`
4. **Dynamic Redirect**: Redirects to Webflow page with data

### Webflow Page Setup

```html
<!-- Your Webflow page -->
<div class="results-container">
  <h1>Hey @name, here are your results!</h1>
  
  <div class="result-card">
    <h2>Race Distance</h2>
    <p data-variable="distance">Loading...</p>
  </div>
  
  <div class="result-card">
    <h2>Target Time</h2>
    <p data-variable="target_time">Calculating...</p>
  </div>
  
  <div class="result-card">
    <h2>Recommended Pace</h2>
    <p data-variable="pace">Analyzing...</p>
  </div>
</div>

<!-- Add the generated script before </body> -->
<script>
// Generated script goes here
</script>
```

## Data Transmission Methods

### localStorage (Recommended)
- **Pros**: Large storage (5-10MB), persists across tabs, works offline
- **Cons**: Persists until manually cleared
- **Use Case**: Most implementations

### sessionStorage  
- **Pros**: Automatically clears when browser tab closes
- **Cons**: Smaller storage, doesn't work across tabs
- **Use Case**: Sensitive data that shouldn't persist

### URL Parameters
- **Pros**: Simple, works with any page setup
- **Cons**: Limited to ~2000 characters, visible in URL
- **Use Case**: Simple data, when storage isn't available

## Advanced Features

### Conditional Content

Show/hide elements based on variable values:

```javascript
// In your custom script (after the generated script)
document.addEventListener('DOMContentLoaded', function() {
  const data = JSON.parse(localStorage.getItem('flint_campaign_data') || '{}');
  
  // Show different content based on score
  if (data.score > 80) {
    document.querySelector('.high-score-message').style.display = 'block';
  } else {
    document.querySelector('.improvement-tips').style.display = 'block';
  }
});
```

### Image Replacement

Replace images based on results:

```html
<!-- Webflow -->
<img data-variable="result_image" src="default-image.jpg" alt="Result">
```

```javascript
// Configure in mappings:
// Transformation Type: "attribute"
// CSS Selector: [data-variable="result_image"]
// This will set the src attribute
```

### Styling Based on Data

Apply styles dynamically:

```javascript
// Custom script addition
const score = parseInt(data.score);
const scoreElement = document.querySelector('[data-variable="score"]');

if (score > 90) {
  scoreElement.style.color = 'green';
} else if (score > 70) {
  scoreElement.style.color = 'orange';
} else {
  scoreElement.style.color = 'red';
}
```

## Troubleshooting

### Common Issues

1. **Data Not Appearing**
   - Check browser console for errors
   - Verify the script is in "Before </body>" section
   - Confirm data attributes match variable names exactly

2. **Script Not Running**
   - Ensure script is properly pasted in Webflow
   - Check for JavaScript errors in console
   - Verify page is published in Webflow

3. **Variables Not Found**
   - Check variable names match exactly (case-sensitive)
   - Ensure question sections have titles
   - Verify AI logic sections have output variables configured

### Debug Mode

Enable debug mode by editing the generated script:

```javascript
const CONFIG = {
  dataSource: 'localStorage',
  storageKey: 'flint_campaign_data',
  debug: true  // Change to true
};
```

This will log detailed information to the browser console.

## Security Considerations

- **Data Sensitivity**: Only include necessary data in transmissions
- **URL Parameters**: Avoid sensitive data in URLs (visible in logs)
- **localStorage**: Clear data after use if it contains PII
- **Validation**: Always validate data before displaying

## Best Practices

1. **Test Thoroughly**: Test with different data combinations
2. **Fallback Content**: Provide default content in case data fails to load
3. **Performance**: Minimize script size and execution time
4. **User Experience**: Show loading states while data populates
5. **Analytics**: Track successful redirects and data population

## Future Enhancements

- **Template System**: Pre-built Webflow templates with common variable patterns
- **Visual Editor**: Drag-and-drop mapping interface
- **Real-time Preview**: Preview data population in campaign builder
- **Analytics Integration**: Track user engagement on custom pages
- **A/B Testing**: Test different Webflow designs with same campaign data

---

This feature bridges the gap between Flint's powerful campaign logic and unlimited design flexibility, giving you the best of both worlds! 