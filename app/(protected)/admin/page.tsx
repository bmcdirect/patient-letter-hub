"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Upload, Package, CheckCircle2, Truck, Clock, Link2, Mail, FileText, MoreHorizontal } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, practices: 0, quotes: 0, orders: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data.stats || { users: 0, practices: 0, quotes: 0, orders: 0 });
      setLoading(false);
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchQuotes() {
      setQuotesLoading(true);
      const res = await fetch("/api/admin/quotes");
      const data = await res.json();
      setQuotes(data.quotes || []);
      setQuotesLoading(false);
    }
    fetchQuotes();
  }, []);

  useEffect(() => {
    async function fetchOrders() {
      setOrdersLoading(true);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setOrdersLoading(false);
    }
    fetchOrders();
  }, []);

  // Filtered orders and quotes
  const filteredOrders = orders.filter(order => {
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesSearch = !orderSearch || order.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) || order.subject?.toLowerCase().includes(orderSearch.toLowerCase()) || order.practiceName?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = !quoteSearch || quote.quoteNumber?.toLowerCase().includes(quoteSearch.toLowerCase()) || quote.subject?.toLowerCase().includes(quoteSearch.toLowerCase()) || quote.practiceName?.toLowerCase().includes(quoteSearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">{stats.users}</div>
                  <div className="text-gray-600 mb-2">Users</div>
                  <Link href="/users" className="text-blue-600 underline">Manage</Link>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">{stats.practices}</div>
                  <div className="text-gray-600 mb-2">Practices</div>
                  <Link href="/practices" className="text-blue-600 underline">Manage</Link>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">{stats.quotes}</div>
                  <div className="text-gray-600 mb-2">Quotes</div>
                  <Link href="/quotes" className="text-blue-600 underline">Manage</Link>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">{stats.orders}</div>
                  <div className="text-gray-600 mb-2">Orders</div>
                  <Link href="/orders" className="text-blue-600 underline">Manage</Link>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        <TabsContent value="orders">
          <div className="flex items-center gap-4 mb-4">
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="waiting-approval-rev1">Waiting Approval (Rev 1)</SelectItem>
                <SelectItem value="waiting-approval-rev2">Waiting Approval (Rev 2)</SelectItem>
                <SelectItem value="waiting-approval-rev3">Waiting Approval (Rev 3)</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/orders/create" className="bg-primary-500 text-white flex items-center px-4 py-2 rounded-md font-medium hover:bg-primary-600 transition">
              <Plus className="h-4 w-4 mr-2" />New Order
            </Link>
          </div>
          {ordersLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Practice</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{order.practiceName || order.practice?.name || '-'}</TableCell>
                      <TableCell>{order.subject}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'pending' ? 'secondary' : order.status === 'approved' ? 'default' : order.status === 'in-progress' ? 'default' : order.status === 'completed' ? 'secondary' : order.status === 'delivered' ? 'outline' : 'secondary'}>
                          {order.status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link>
                            </DropdownMenuItem>
                            {/* Status-dependent actions */}
                            {order.status === 'draft' && (
                              <DropdownMenuItem><Upload className="mr-2 h-4 w-4" />Upload Proof</DropdownMenuItem>
                            )}
                            {order.status === 'pending' && (
                              <DropdownMenuItem><Package className="mr-2 h-4 w-4" />Start Production</DropdownMenuItem>
                            )}
                            {order.status === 'in-progress' && (
                              <DropdownMenuItem><CheckCircle2 className="mr-2 h-4 w-4" />Mark Complete</DropdownMenuItem>
                            )}
                            {order.status === 'completed' && (
                              <DropdownMenuItem><Truck className="mr-2 h-4 w-4" />Mark Delivered</DropdownMenuItem>
                            )}
                            {order.status === 'on-hold' && (
                              <DropdownMenuItem><Package className="mr-2 h-4 w-4" />Resume</DropdownMenuItem>
                            )}
                            {order.status?.startsWith('waiting-approval') && (
                              <DropdownMenuItem><Link2 className="mr-2 h-4 w-4" />Copy Proof Review Link</DropdownMenuItem>
                            )}
                            <DropdownMenuItem><Mail className="mr-2 h-4 w-4" />Send Email</DropdownMenuItem>
                            <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />View Files</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="quotes">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search quotes..."
                value={quoteSearch}
                onChange={e => setQuoteSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/quotes/create" className="bg-primary-500 text-white flex items-center px-4 py-2 rounded-md font-medium hover:bg-primary-600 transition">
              <Plus className="h-4 w-4 mr-2" />New Quote
            </Link>
          </div>
          {quotesLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Practice</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map(quote => (
                    <TableRow key={quote.id}>
                      <TableCell>{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.practiceName || quote.practice?.name || '-'}</TableCell>
                      <TableCell>{quote.subject}</TableCell>
                      <TableCell>{quote.status}</TableCell>
                      <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/quotes/create?edit=${quote.id}`} className="inline-flex items-center justify-center text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background select-none active:scale-[0.98] border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3 rounded-md">
                          Edit
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="billing">
          <div className="text-gray-500">Billing and invoicing features coming soon.</div>
        </TabsContent>
        <TabsContent value="communication">
          <div className="text-gray-500">Communication and email features coming soon.</div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
