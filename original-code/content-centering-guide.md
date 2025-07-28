# Content Centering System - CSS Custom Properties

## Overview
A flexible content centering system using CSS custom properties for easy control and reversibility.

## CSS Variables Available

```css
:root {
  /* Content centering system */
  --main-content-max-width: 1200px;
  --main-content-margin: 0 auto;
  --main-content-padding: 0 20px;
  --content-centering: enabled; /* or disabled */
  
  /* Responsive content widths */
  --content-narrow: 640px;   /* For forms and single-column content */
  --content-medium: 768px;   /* For medium layouts */
  --content-wide: 1024px;    /* For dashboards */
  --content-full: 1200px;    /* For full-width layouts */
}
```

## Usage Examples

### Apply content centering to main containers:

```jsx
// Main content container (1200px max)
<div className="main-content-container">
  {/* Content automatically centered with responsive padding */}
</div>

// Narrow forms (640px max)
<div className="content-narrow">
  {/* Form content */}
</div>

// Medium layouts (768px max)
<div className="content-medium">
  {/* Medium content */}
</div>

// Wide dashboards (1024px max)
<div className="content-wide">
  {/* Dashboard content */}
</div>

// Full width (1200px max)
<div className="content-full">
  {/* Full width content */}
</div>
```

### Disable content centering globally:

```jsx
// Add data attribute to disable centering
<div data-content-centering="disabled">
  <div className="content-wide">
    {/* This content will not be centered */}
  </div>
</div>
```

### Customize via CSS variables:

```css
/* Custom page with different centering */
.custom-page {
  --main-content-max-width: 900px;
  --main-content-padding: 0 30px;
}

/* Disable centering for specific component */
.full-width-component {
  --main-content-max-width: none;
  --main-content-margin: 0;
  --main-content-padding: 0;
}
```

## Benefits

1. **Easy Control**: Change max-width, margin, and padding from CSS variables
2. **Reversible**: Toggle centering on/off with data attributes or CSS overrides
3. **Responsive**: Built-in padding for mobile devices
4. **Consistent**: Same centering behavior across all components
5. **Flexible**: Multiple preset widths for different content types

## Current Implementation

- **Dashboard**: Uses `content-wide` (1024px max)
- **Forms**: Uses `content-narrow` (640px max)
- **Admin Dashboard**: Can use `content-full` for wide tables

## Quick Reference

| Class | Max Width | Use Case |
|-------|-----------|----------|
| `main-content-container` | 1200px | Default main content |
| `content-narrow` | 640px | Forms, single-column |
| `content-medium` | 768px | Medium layouts |
| `content-wide` | 1024px | Dashboards, cards |
| `content-full` | 1200px | Wide content, tables |