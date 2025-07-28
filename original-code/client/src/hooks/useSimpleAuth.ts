import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface SimpleUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: number;
  practiceName: string;
  role: string;
}

export function useSimpleAuth() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        
        if (!isMounted) return;
        
        if (response.status === 401) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const userData = await response.json();
        setUser(userData);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err as Error);
        setUser(null);
        setIsLoading(false);
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      
      if (response.status === 401) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await response.json();
      setUser(userData);
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setUser(null);
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout,
    refreshUser,
  };
}