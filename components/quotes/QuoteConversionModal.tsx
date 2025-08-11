"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, FileText, Users, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { StatusManager, type OrderStatus } from "@/lib/status-management";

interface QuoteConversionModalProps {
  quote: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuoteConversionModal({ quote, isOpen, onClose }: QuoteConversionModalProps) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);

  const handleConvertToOrder = async () => {
    if (!quote?.id) {
      console.error("Quote ID is missing:", quote);
      return;
    }
    
    setIsConverting(true);
    
    try {
      // First, update the quote status to "converted"
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert" })
      });

      if (!response.ok) {
        throw new Error("Failed to convert quote");
      }

      // Redirect to order creation page with quote data
      const queryParams = new URLSearchParams({
        fromQuote: quote.id,
        practiceId: quote.practiceId,
        subject: quote.subject || "",
        estimatedRecipients: quote.estimatedRecipients?.toString() || "",
        colorMode: quote.colorMode || "color",
        dataCleansing: quote.dataCleansing?.toString() || "false",
        ncoaUpdate: quote.ncoaUpdate?.toString() || "false",
        firstClassPostage: quote.firstClassPostage?.toString() || "false",
        notes: quote.notes || "",
        totalCost: quote.totalCost?.toString() || "0"
      });

      router.push(`/orders/create?${queryParams.toString()}`);
    } catch (error) {
      console.error("Error converting quote:", error);
      // Don't close modal on error, let user try again
    } finally {
      setIsConverting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!quote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Convert Quote to Order
          </DialogTitle>
          <DialogDescription>
            Review the quote details and convert it to a new order. All quote information will be pre-filled in the order creation form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quote Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Quote Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Quote Number</p>
                  <p className="text-lg font-semibold">{quote.quoteNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {quote.status}
                  </Badge>
                </div>
              </div>
              
              {quote.subject && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  <p className="text-base">{quote.subject}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Practice</p>
                  <p className="text-base">{quote.practice?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-base">{formatDate(quote.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-green-600" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Recipients</p>
                    <p className="text-base font-semibold">{quote.estimatedRecipients?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Color Mode</p>
                    <Badge variant="outline">
                      {quote.colorMode === 'color' ? 'Color' : 'Black & White'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Additional Services */}
              {(quote.dataCleansing || quote.ncoaUpdate || quote.firstClassPostage) && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Additional Services</p>
                  <div className="flex flex-wrap gap-2">
                    {quote.dataCleansing && (
                      <Badge variant="secondary">Data Cleansing</Badge>
                    )}
                    {quote.ncoaUpdate && (
                      <Badge variant="secondary">NCOA Update</Badge>
                    )}
                    {quote.firstClassPostage && (
                      <Badge variant="secondary">First Class Postage</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Cost Summary */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">Total Cost</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(quote.totalCost || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-600">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>You'll be redirected to the order creation form with all quote details pre-filled</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Upload your customer data file, letter content, and other required documents</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Review and submit the order to begin production</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Track your order status through the production process</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isConverting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConvertToOrder} 
            disabled={isConverting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isConverting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Converting...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert to Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
