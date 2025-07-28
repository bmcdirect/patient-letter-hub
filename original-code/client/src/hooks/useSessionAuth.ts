import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: number;
  role: string;
}

export function useSessionAuth() {
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.status === 404 || !response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data as SessionUser;
    },
    retry: false,
    staleTime: 0, // Don't cache auth state - always fresh
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: !isInitialized,
    error
  };
}