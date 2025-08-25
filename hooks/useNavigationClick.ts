import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Custom hook for handling navigation clicks with proper event prevention.
 * This prevents the default browser behavior and ensures clean navigation.
 * 
 * @returns A function that takes a path and returns an event handler
 * 
 * @example
 * const handleNavigation = useNavigationClick();
 * 
 * // In JSX:
 * <Button onClick={handleNavigation("/orders")}>Go to Orders</Button>
 * 
 * // Or inline:
 * <Button onClick={useNavigationClick()("/orders")}>Go to Orders</Button>
 */
export const useNavigationClick = () => {
  const router = useRouter();
  
  return useCallback((path: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(path);
  }, [router]);
};

/**
 * Direct navigation function for cases where you need immediate navigation
 * without an event handler (e.g., in useEffect, after async operations)
 * 
 * @param path - The path to navigate to
 * @param router - The Next.js router instance
 */
export const navigateTo = (path: string, router: ReturnType<typeof useRouter>) => {
  router.push(path);
};

/**
 * Hook for handling external navigation (e.g., to external URLs)
 * with proper event prevention
 */
export const useExternalNavigation = () => {
  return useCallback((url: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);
};
