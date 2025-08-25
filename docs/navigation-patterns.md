# Navigation Patterns & Best Practices

This document outlines the standardized navigation patterns used throughout the application to prevent common issues like page refreshes and unexpected browser behavior.

## 🚨 The Problem

Before implementing these patterns, the application suffered from:
- **Page refreshes** when clicking navigation elements
- **Unexpected browser behavior** due to missing `event.preventDefault()`
- **Inconsistent navigation** patterns across components
- **Race conditions** in authentication flows

## ✅ The Solution

We've implemented standardized navigation hooks that ensure:
- **Consistent event handling** across all navigation elements
- **Proper event prevention** to avoid page refreshes
- **Clean, maintainable code** with reusable patterns
- **Type-safe navigation** with proper TypeScript support

## 🪝 Available Hooks

### `useNavigationClick()`

The primary hook for handling navigation clicks with proper event prevention.

```typescript
import { useNavigationClick } from "@/hooks/useNavigationClick";

export function MyComponent() {
  const handleNavigation = useNavigationClick();
  
  return (
    <Button onClick={handleNavigation("/orders")}>
      Go to Orders
    </Button>
  );
}
```

**Features:**
- Automatically prevents default browser behavior
- Stops event propagation
- Uses Next.js router for client-side navigation
- Memoized for performance

### `navigateTo()`

Direct navigation function for programmatic navigation (e.g., after async operations).

```typescript
import { navigateTo } from "@/hooks/useNavigationClick";

export function MyComponent() {
  const router = useRouter();
  
  const handleSubmit = async () => {
    await saveData();
    navigateTo("/success", router);
  };
}
```

### `useExternalNavigation()`

For external links that should open in new tabs.

```typescript
import { useExternalNavigation } from "@/hooks/useNavigationClick";

export function MyComponent() {
  const handleExternalNav = useExternalNavigation();
  
  return (
    <Button onClick={handleExternalNav("https://example.com")}>
      External Link
    </Button>
  );
}
```

## 🔄 Migration Guide

### Before (Problematic)
```typescript
// ❌ This can cause page refreshes
<Button onClick={() => router.push("/orders")}>
  Go to Orders
</Button>

// ❌ This bypasses Next.js routing
<Button onClick={() => window.location.href = "/orders"}>
  Go to Orders
</Button>
```

### After (Recommended)
```typescript
// ✅ Clean, consistent, and safe
const handleNavigation = useNavigationClick();

<Button onClick={handleNavigation("/orders")}>
  Go to Orders
</Button>
```

## 📍 Usage Examples

### Basic Navigation
```typescript
const handleNavigation = useNavigationClick();

<Button onClick={handleNavigation("/dashboard")}>Dashboard</Button>
<Button onClick={handleNavigation("/orders/create")}>New Order</Button>
<Button onClick={handleNavigation(`/orders/${orderId}`)}>View Order</Button>
```

### Conditional Navigation
```typescript
const handleNavigation = useNavigationClick();

const handleAction = (event: React.MouseEvent) => {
  if (user.hasPermission) {
    handleNavigation("/admin")(event);
  } else {
    handleNavigation("/unauthorized")(event);
  }
};
```

### With Event Handling
```typescript
const handleNavigation = useNavigationClick();

const handleClick = (event: React.MouseEvent) => {
  // Custom logic here
  console.log("Navigating to orders...");
  
  // Then navigate
  handleNavigation("/orders")(event);
};
```

## 🧪 Testing

When testing components that use these hooks:

1. **Verify no page refreshes** occur on navigation
2. **Check that events are properly prevented** from bubbling
3. **Ensure navigation happens** to the correct routes
4. **Test with different event types** (click, keyboard, etc.)

## 🚀 Performance Benefits

- **Memoized handlers** prevent unnecessary re-renders
- **Consistent patterns** reduce bundle size through tree-shaking
- **Type safety** catches navigation errors at compile time
- **Standardized behavior** reduces debugging time

## 🔧 Troubleshooting

### Common Issues

1. **Navigation not working**: Check that the hook is properly imported and used
2. **Type errors**: Ensure you're passing the correct path string
3. **Event handling conflicts**: Make sure you're not mixing old and new patterns

### Debug Mode

Add logging to see what's happening:

```typescript
const handleNavigation = useNavigationClick();

// Add this to see the generated handler
console.log("Navigation handler:", handleNavigation("/orders"));
```

## 📚 Related Files

- `hooks/useNavigationClick.ts` - The main navigation hook
- `components/calendar/ProductionCalendar.tsx` - Example usage in calendar
- `app/(protected)/dashboard/page.tsx` - Example usage in dashboard
- `app/(protected)/orders/page.tsx` - Example usage in orders page

## 🤝 Contributing

When adding new navigation elements:

1. **Always use** `useNavigationClick()` for internal navigation
2. **Use** `useExternalNavigation()` for external links
3. **Avoid** direct `router.push()` calls in onClick handlers
4. **Never use** `window.location.href` for internal navigation
5. **Test** that events are properly prevented

This ensures consistency and prevents the navigation issues we've experienced in the past.
