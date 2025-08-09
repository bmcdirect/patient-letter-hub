import { useAuth } from "@clerk/nextjs";

/**
 * Hook for making authenticated API calls
 */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();
  
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    try {
      console.log("🔑 Making authenticated request to:", url);
      
      // For API routes, Clerk middleware handles authentication automatically
      // We don't need to send a Bearer token manually
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
      
      console.log("📤 Making request to:", url);
      console.log("📋 Headers:", headers);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
                    console.log("📥 Response status:", response.status);
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                console.log("❌ Error response:", errorData);
                throw new Error(errorData.error || `HTTP ${response.status}`);
              }
      
      return response;
    } catch (error) {
      console.error("🚨 Error in authenticatedFetch:", error);
      throw error;
    }
  };
  
  return { authenticatedFetch };
}
