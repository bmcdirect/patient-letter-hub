"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuotesTable } from "@/components/dashboard/QuotesTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function QuotesTableWrapper() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchQuotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes");
      if (!res.ok) throw new Error("Failed to fetch quotes");
      const data = await res.json();
      setQuotes(data.quotes || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleEdit = (quote: any) => {
    router.push(`/quotes/create?edit=${quote.id}`);
  };

  const handleConvert = async (quoteId: any) => {
    try {
      // Instead of directly converting, redirect to order creation page with quote data
      router.push(`/orders/create?fromQuote=${quoteId}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to redirect to order creation",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (quoteId: any) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete quote");
      toast({
        title: "Quote Deleted",
        description: "Quote has been permanently deleted.",
      });
      await fetchQuotes();
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete quote. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <QuotesTable
      quotes={quotes}
      isLoading={isLoading}
      onRefresh={fetchQuotes}
      onConvert={handleConvert}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
} 