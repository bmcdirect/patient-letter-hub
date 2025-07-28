import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401/403 authentication errors
    if (res.status === 401 || res.status === 403) {
      // Clear any stored authentication data
      document.cookie = 'connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      // Try to parse JSON error response
      const errorData = JSON.parse(text);
      errorMessage = errorData.message || text || res.statusText;
    } catch {
      // If JSON parsing fails, use the raw text
      errorMessage = await res.text() || res.statusText;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let headers: Record<string, string> = {};
  let body: string | FormData | undefined;

  if (data) {
    if (data instanceof FormData) {
      // For FormData, don't set Content-Type - let browser set it with boundary
      body = data;
    } else {
      // For regular data, use JSON
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes for better caching
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: 1, // Allow one retry for network issues
    },
    mutations: {
      retry: 1, // Allow one retry for mutations
    },
  },
});
