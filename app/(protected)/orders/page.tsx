"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = order.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate order stats
  const orderStats = {
    draft: orders?.filter(o => o.status === 'draft').length || 0,
    inProgress: orders?.filter(o => o.status === 'in-progress').length || 0,
    completed: orders?.filter(o => o.status === 'completed').length || 0,
    delivered: orders?.filter(o => o.status === 'delivered').length || 0,
    total: orders?.length || 0,
  };

  return (
    <main className="flex-1 overflow-hidden p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Track and manage patient letter orders</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button 
              onClick={() => router.push("/orders/create")}
              className="bg-primary-500 hover:bg-primary-600 text-white flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Order</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{orderStats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{orderStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{orderStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{orderStats.total}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </CardContent>
        </Card>
      </div>

      {/* Order Filters */}
      <Card className="shadow-sm border border-gray-100 mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Practice</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Practices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Practices</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Order #</th>
              <th className="px-4 py-2 border">Practice</th>
              <th className="px-4 py-2 border">Subject</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Created</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-2 border">{order.orderNumber}</td>
                <td className="px-4 py-2 border">{order.practice?.name || "-"}</td>
                <td className="px-4 py-2 border">{order.subject}</td>
                <td className="px-4 py-2 border">{order.status}</td>
                <td className="px-4 py-2 border">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-2 border">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
} 