"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Package, Clock } from "lucide-react";
import { ProductionCalendar } from "@/components/calendar/ProductionCalendar";
import { useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // TODO: Replace with real stats from API
  const stats = {
    quotes: quotes.length,
    activeOrders: orders.filter(order => order.status === 'in-progress' || order.status === 'approved').length,
    pending: orders.filter(order => order.status === 'pending' || order.status === 'draft').length,
    thisMonth: 0, // TODO: Calculate from orders
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchData = async () => {
      try {
        // Fetch user's quotes
        const quotesResponse = await fetch('/api/quotes');
        if (quotesResponse.ok) {
          const quotesData = await quotesResponse.json();
          setQuotes(quotesData.quotes || []);
        }

        // Fetch user's orders
        const ordersResponse = await fetch('/api/orders');
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
        </h2>
        <p className="text-gray-600">
          Managing communications for your practice
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Plus className="h-5 w-5 mr-2 text-blue-600" />
              Create Quote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Generate a new quote for patient communications
            </p>
            <Button 
              asChild
              className="w-full"
              variant="outline"
            >
              <a href="/quotes/create">New Quote</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              Create Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Create a direct order for patient letters
            </p>
            <Button 
              asChild
              className="w-full"
              variant="outline"
            >
              <a href="/orders/create">New Order</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Package className="h-5 w-5 mr-2 text-purple-600" />
              View Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              Manage your practice's orders and track progress
            </p>
            <Button 
              asChild
              className="w-full"
              variant="outline"
            >
              <a href="/orders">View Orders</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.quotes}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar - Replaces Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>My Quotes & Orders Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading calendar...</p>
            </div>
          ) : (
            <ProductionCalendar
              orders={orders}
              quotes={quotes}
              onEventClick={(event) => {
                if (event.entityType === 'quote') {
                  window.location.href = '/quotes';
                } else if (event.entityType === 'order') {
                  window.location.href = '/orders';
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
