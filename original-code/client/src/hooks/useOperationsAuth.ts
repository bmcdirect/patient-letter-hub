import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface OperationsUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'operations_staff' | 'operations_admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useOperationsAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Check operations authentication status
  const { data: operationsUser, isLoading, error } = useQuery({
    queryKey: ["/api/operations/auth/user"],
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Operations logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/operations/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      // Clear operations auth cache
      queryClient.invalidateQueries({ queryKey: ["/api/operations/auth/user"] });
      // Redirect to operations login
      setLocation("/operations/login");
    },
  });

  const isOperationsAuthenticated = !!operationsUser && !error;
  const isOperationsAdmin = operationsUser?.role === 'operations_admin';

  return {
    operationsUser: operationsUser as OperationsUser | undefined,
    isOperationsAuthenticated,
    isOperationsAdmin,
    isLoading,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}