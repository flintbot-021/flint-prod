# Color Migration Guide

## Overview
This guide helps migrate from hardcoded Tailwind colors to theme-aware semantic colors for proper light/dark mode support.

## Color Mapping Reference

### Background Colors
| ❌ Hardcoded | ✅ Semantic | Usage |
|--------------|-------------|-------|
| `bg-white` | `bg-background` | Main background |
| `bg-gray-50` | `bg-muted` | Subtle background |
| `bg-gray-100` | `bg-accent` | Interactive states |
| `bg-gray-900` | `bg-background dark:bg-foreground` | Inverted background |

### Text Colors
| ❌ Hardcoded | ✅ Semantic | Usage |
|--------------|-------------|-------|
| `text-black` | `text-foreground` | Primary text |
| `text-white` | `text-primary-foreground` | Contrasting text |
| `text-gray-500` | `text-muted-foreground` | Secondary text |
| `text-gray-600` | `text-muted-foreground` | Tertiary text |
| `text-gray-700` | `text-foreground` | Primary text |
| `text-gray-900` | `text-foreground` | Primary text |

### Border Colors
| ❌ Hardcoded | ✅ Semantic | Usage |
|--------------|-------------|-------|
| `border-gray-200` | `border-border` | Standard borders |
| `border-gray-300` | `border-input` | Input borders |

### Interactive States
| ❌ Hardcoded | ✅ Semantic | Usage |
|--------------|-------------|-------|
| `hover:bg-gray-50` | `hover:bg-accent` | Hover states |
| `hover:text-gray-900` | `hover:text-accent-foreground` | Hover text |

## Common Patterns to Replace

### Cards and Containers
```tsx
// ❌ Before
<div className="bg-white border border-gray-200 rounded-lg">

// ✅ After  
<div className="bg-card border border-border rounded-lg">
```

### Headers and Navigation
```tsx
// ❌ Before
<header className="bg-white border-b border-gray-200">

// ✅ After
<header className="bg-background border-b border-border">
```

### Text Content
```tsx
// ❌ Before
<h1 className="text-gray-900">Title</h1>
<p className="text-gray-600">Description</p>

// ✅ After
<h1 className="text-foreground">Title</h1>
<p className="text-muted-foreground">Description</p>
```

### Form Elements
```tsx
// ❌ Before
<input className="border border-gray-300 bg-white" />

// ✅ After
<input className="border border-input bg-background" />
```

## Migration Priority

1. **High Priority** (visible on every page):
   - Main navigation/headers
   - Card backgrounds
   - Primary text colors

2. **Medium Priority** (frequently used):
   - Form elements
   - Button customizations
   - Modal backgrounds

3. **Low Priority** (specific components):
   - Tooltips
   - Debug components
   - Overlay effects

## Testing

After migration:
1. Test both light and dark modes
2. Verify all text is readable in both modes
3. Check interactive states (hover, focus)
4. Validate form elements work in both themes 