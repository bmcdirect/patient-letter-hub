"use client";
import React from "react";
import QuotesTableWrapper from "@/components/dashboard/QuotesTableWrapper";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function QuotesPage() {
  return (
    <main className="flex-1 overflow-hidden p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
            <p className="text-gray-600">Manage patient letter campaign quotes</p>
          </div>
          <Button
            onClick={() => window.location.href = "/quotes/create"}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Quote</span>
          </Button>
        </div>
      </div>
      <QuotesTableWrapper />
    </main>
  );
} 