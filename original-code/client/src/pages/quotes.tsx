import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { QuotesTable } from "@/components/dashboard/QuotesTable";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

export default function Quotes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSimpleAuth();

  const { data: quotes = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const response = await fetch('/api/quotes');
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      return await response.json();
    },
    enabled: !!user,
  });



  const convertToOrderMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await apiRequest("POST", `/api/quotes/${quoteId}/convert`);
      return response.json();
    },
    onSuccess: (order: any) => {
      toast({
        title: "Success",
        description: `Quote converted to order ${order.orderNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to convert quote to order",
        variant: "destructive",
      });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await apiRequest("DELETE", `/api/quotes/${quoteId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Deleted",
        description: "Quote has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuoteEdit = (quote: any) => {
    setLocation(`/quotes/create?edit=${quote.id}`);
  };

  const handleQuoteConvert = (quoteId: number) => {
    convertToOrderMutation.mutate(quoteId);
  };

  const handleQuoteDelete = (quoteId: number) => {
    deleteQuoteMutation.mutate(quoteId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
                <p className="text-gray-600">Manage patient letter campaign quotes</p>
              </div>
              <Button 
                onClick={() => setLocation("/quotes/create")}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Quote</span>
              </Button>
            </div>
          </div>

          <QuotesTable 
            quotes={(quotes as any) || []}
            isLoading={isLoading}
            onRefresh={refetch}
            onConvert={handleQuoteConvert}
            onEdit={handleQuoteEdit}
            onDelete={handleQuoteDelete}
          />
        </main>
      </div>
    </div>
  );
}
