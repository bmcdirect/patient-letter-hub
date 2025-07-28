import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BarChart3, FileBarChart, TrendingUp, Download } from "lucide-react";

export default function Reports() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-1">Generate and view business reports and analytics</p>
            </div>

            {/* Coming Soon Notice */}
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive reporting features are coming soon. This will include business analytics, 
                  performance metrics, financial reports, and custom report generation.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <FileBarChart className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Business Reports</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Analytics</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <Download className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Export Data</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}