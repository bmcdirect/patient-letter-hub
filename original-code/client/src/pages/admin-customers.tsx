import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Upload,
  Settings,
  Ban,
  AlertTriangle,
  Package,
  Calendar,
  FileText,
  User,
  MapPinIcon,
  BuildingIcon,
  UserPlus,
  Home,
  Briefcase,
  Crown,
  Shield,
  Activity,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Null-safe date formatter
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';
  
  // Modal states
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isUserAccessModalOpen, setIsUserAccessModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    billingEmail: "",
    mainAddress: "",
    city: "",
    state: "",
    zipCode: "",
    subscriptionTier: "standard",
    maxUsers: 5,
    maxMonthlyOrders: 100,
    paymentTerms: "credit_card",
    creditLimit: 0,
    status: "active",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "password123"
  });
  
  const [locationForm, setLocationForm] = useState({
    name: "",
    phone: "",
    email: "",
    mainAddress: "",
    city: "",
    state: "",
    zipCode: "",
    isDefault: false
  });
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // Fetch customers data
  const { data: customersResponse, isLoading: customersLoading, refetch: refetchCustomers } = useQuery({
    queryKey: ["/api/admin/customers"],
  });
  
  const { data: customerStatsResponse } = useQuery({
    queryKey: ["/api/admin/customers/stats"],
  });

  // Fetch customer locations when location modal is open
  const { data: customerLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/admin/customers", selectedCustomer?.id, "locations"],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      const response = await apiRequest("GET", `/api/admin/customers/${selectedCustomer.id}/locations`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!selectedCustomer?.id && isLocationModalOpen,
  });
  
  // Extract customers array from response
  const customers = Array.isArray(customersResponse) ? customersResponse : [];
  const customerStats = customerStatsResponse || {
    totalCustomers: 0,
    activeCustomers: 0,
    suspendedCustomers: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    monthlyGrowth: 0
  };

  // Ensure customerLocations is always an array
  const locationsArray = Array.isArray(customerLocations) ? customerLocations : [];
  
  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/admin/customers", customerData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers/stats"] });
      setIsAddCustomerOpen(false);
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        billingEmail: "",
        mainAddress: "",
        city: "",
        state: "",
        zipCode: "",
        subscriptionTier: "standard",
        maxUsers: 5,
        maxMonthlyOrders: 100,
        paymentTerms: "credit_card",
        creditLimit: 0,
        status: "active",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminPassword: "password123"
      });
      toast({
        title: "Customer Created",
        description: "New customer has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    }
  });
  
  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/customers/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers/stats"] });
      setIsCustomerDetailsOpen(false);
      toast({
        title: "Customer Updated",
        description: "Customer information has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    }
  });
  
  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/customers/${customerId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers/stats"] });
      toast({
        title: "Customer Deleted",
        description: "Customer has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    }
  });
  
  // Bulk status update mutation
  const bulkStatusUpdateMutation = useMutation({
    mutationFn: async ({ customerIds, status }: { customerIds: number[]; status: string }) => {
      const response = await apiRequest("POST", "/api/admin/customers/bulk-status", {
        customerIds,
        status
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers/stats"] });
      setSelectedCustomers([]);
      toast({
        title: "Bulk Update Complete",
        description: "Customer statuses have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer statuses",
        variant: "destructive",
      });
    }
  });
  
  // Helper functions
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'credit_hold': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'suspended': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'credit_hold': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'cancelled': return <Ban className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case 'starter': return <Package className="h-4 w-4 text-blue-600" />;
      case 'standard': return <Briefcase className="h-4 w-4 text-green-600" />;
      case 'professional': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'enterprise': return <Shield className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.billingEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    const matchesSubscription = subscriptionFilter === "all" || customer.subscriptionTier === subscriptionFilter;
    const matchesPayment = paymentFilter === "all" || customer.billingPreference === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesSubscription && matchesPayment;
  });
  
  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[sortBy] || "";
    const bValue = b[sortBy] || "";
    
    if (sortOrder === "asc") {
      return aValue.toString().localeCompare(bValue.toString());
    } else {
      return bValue.toString().localeCompare(aValue.toString());
    }
  });
  
  // Handle customer selection
  const handleCustomerSelection = (customerId: number) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedCustomers.length === sortedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(sortedCustomers.map(c => c.id));
    }
  };
  
  // Handle form submissions
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate(customerForm);
  };
  
  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer) {
      updateCustomerMutation.mutate({
        id: selectedCustomer.id,
        data: customerForm
      });
    }
  };
  
  const handleDeleteCustomer = (customerId: number) => {
    if (confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      deleteCustomerMutation.mutate(customerId);
    }
  };
  
  const handleBulkStatusUpdate = (status: string) => {
    if (selectedCustomers.length === 0) return;
    
    const confirmMessage = `Are you sure you want to ${status} ${selectedCustomers.length} customer(s)?`;
    if (confirm(confirmMessage)) {
      bulkStatusUpdateMutation.mutate({
        customerIds: selectedCustomers,
        status
      });
    }
  };
  
  // Handle export
  const handleExport = () => {
    // Placeholder for export functionality
    toast({
      title: "Export Started",
      description: "Customer data export is being prepared.",
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600">Manage all customer accounts and practice information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={() => setIsAddCustomerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats.activeCustomers}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats.suspendedCustomers}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(customerStats.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(customerStats.avgOrderValue || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats.monthlyGrowth}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="credit_hold">Credit Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="net_terms">Net Terms</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSubscriptionFilter("all");
                setPaymentFilter("all");
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Bulk Actions */}
        {selectedCustomers.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedCustomers.length} customer(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate("active")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate("suspended")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate("credit_hold")}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Credit Hold
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Customer Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Customer Overview ({sortedCustomers.length} customers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCustomers.length === sortedCustomers.length && sortedCustomers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-500">Loading customers...</p>
                      </TableCell>
                    </TableRow>
                  ) : sortedCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        No customers found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCustomers.map((customer: any) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.includes(customer.id)}
                            onCheckedChange={() => handleCustomerSelection(customer.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(customer.status)}
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.tenantKey}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getSubscriptionIcon(customer.subscriptionTier)}
                            <span className="capitalize">{customer.subscriptionTier}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            <span className="capitalize">{customer.billingPreference?.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.totalOrders || 0}</div>
                            <div className="text-gray-500">orders</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>${parseFloat(customer.totalRevenue || 0).toFixed(2)}</div>
                            <div className="text-gray-500">lifetime</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {fmtDate(customer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerForm(customer);
                                setIsCustomerDetailsOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerForm(customer);
                                setIsCustomerDetailsOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Customer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedCustomer(customer);
                                setIsLocationModalOpen(true);
                              }}>
                                <MapPin className="h-4 w-4 mr-2" />
                                Manage Locations
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedCustomer(customer);
                                setIsUserAccessModalOpen(true);
                              }}>
                                <Users className="h-4 w-4 mr-2" />
                                User Access
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Customer Modal */}
        <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer account with practice information and initial admin user.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateCustomer} className="space-y-6">
              <Tabs defaultValue="practice" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="practice">Practice Info</TabsTrigger>
                  <TabsTrigger value="billing">Billing Settings</TabsTrigger>
                  <TabsTrigger value="admin">Admin User</TabsTrigger>
                </TabsList>
                
                <TabsContent value="practice" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Practice Name *</Label>
                      <Input
                        id="name"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Practice Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Account Status</Label>
                      <Select value={customerForm.status} onValueChange={(value) => setCustomerForm({...customerForm, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="credit_hold">Credit Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="mainAddress">Main Address</Label>
                    <Textarea
                      id="mainAddress"
                      value={customerForm.mainAddress}
                      onChange={(e) => setCustomerForm({...customerForm, mainAddress: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={customerForm.city}
                        onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={customerForm.state}
                        onChange={(e) => setCustomerForm({...customerForm, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={customerForm.zipCode}
                        onChange={(e) => setCustomerForm({...customerForm, zipCode: e.target.value})}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="billing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                      <Select value={customerForm.subscriptionTier} onValueChange={(value) => setCustomerForm({...customerForm, subscriptionTier: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Select value={customerForm.paymentTerms} onValueChange={(value) => setCustomerForm({...customerForm, paymentTerms: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="net_terms">Net Terms</SelectItem>
                          <SelectItem value="invoice">Invoice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingEmail">Billing Email</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={customerForm.billingEmail}
                        onChange={(e) => setCustomerForm({...customerForm, billingEmail: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="creditLimit">Credit Limit</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        value={customerForm.creditLimit}
                        onChange={(e) => setCustomerForm({...customerForm, creditLimit: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxUsers">Max Users</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        value={customerForm.maxUsers}
                        onChange={(e) => setCustomerForm({...customerForm, maxUsers: parseInt(e.target.value) || 5})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxMonthlyOrders">Max Monthly Orders</Label>
                      <Input
                        id="maxMonthlyOrders"
                        type="number"
                        value={customerForm.maxMonthlyOrders}
                        onChange={(e) => setCustomerForm({...customerForm, maxMonthlyOrders: parseInt(e.target.value) || 100})}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="admin" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminFirstName">Admin First Name *</Label>
                      <Input
                        id="adminFirstName"
                        value={customerForm.adminFirstName}
                        onChange={(e) => setCustomerForm({...customerForm, adminFirstName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminLastName">Admin Last Name *</Label>
                      <Input
                        id="adminLastName"
                        value={customerForm.adminLastName}
                        onChange={(e) => setCustomerForm({...customerForm, adminLastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminEmail">Admin Email *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={customerForm.adminEmail}
                        onChange={(e) => setCustomerForm({...customerForm, adminEmail: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminPassword">Initial Password *</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={customerForm.adminPassword}
                        onChange={(e) => setCustomerForm({...customerForm, adminPassword: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This will create the initial admin user for the practice. 
                      The admin user will have full access to manage their practice's account and can invite additional users.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Customer Details Modal */}
        <Dialog open={isCustomerDetailsOpen} onOpenChange={setIsCustomerDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View and edit customer account information and settings.
              </DialogDescription>
            </DialogHeader>
            
            {selectedCustomer && (
              <form onSubmit={handleUpdateCustomer} className="space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Practice Name</Label>
                        <Input
                          id="edit-name"
                          value={customerForm.name}
                          onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-email">Practice Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                          id="edit-phone"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-status">Account Status</Label>
                        <Select value={customerForm.status} onValueChange={(value) => setCustomerForm({...customerForm, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="credit_hold">Credit Hold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-mainAddress">Main Address</Label>
                      <Textarea
                        id="edit-mainAddress"
                        value={customerForm.mainAddress}
                        onChange={(e) => setCustomerForm({...customerForm, mainAddress: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-city">City</Label>
                        <Input
                          id="edit-city"
                          value={customerForm.city}
                          onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-state">State</Label>
                        <Input
                          id="edit-state"
                          value={customerForm.state}
                          onChange={(e) => setCustomerForm({...customerForm, state: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-zipCode">ZIP Code</Label>
                        <Input
                          id="edit-zipCode"
                          value={customerForm.zipCode}
                          onChange={(e) => setCustomerForm({...customerForm, zipCode: e.target.value})}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="billing" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-subscriptionTier">Subscription Tier</Label>
                        <Select value={customerForm.subscriptionTier} onValueChange={(value) => setCustomerForm({...customerForm, subscriptionTier: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-paymentTerms">Payment Terms</Label>
                        <Select value={customerForm.paymentTerms} onValueChange={(value) => setCustomerForm({...customerForm, paymentTerms: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="net_terms">Net Terms</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-billingEmail">Billing Email</Label>
                        <Input
                          id="edit-billingEmail"
                          type="email"
                          value={customerForm.billingEmail}
                          onChange={(e) => setCustomerForm({...customerForm, billingEmail: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-creditLimit">Credit Limit</Label>
                        <Input
                          id="edit-creditLimit"
                          type="number"
                          value={customerForm.creditLimit}
                          onChange={(e) => setCustomerForm({...customerForm, creditLimit: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Billing Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Orders:</span>
                          <span className="ml-2 font-medium">{selectedCustomer.totalOrders || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Revenue:</span>
                          <span className="ml-2 font-medium">${parseFloat(selectedCustomer.totalRevenue || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Outstanding Balance:</span>
                          <span className="ml-2 font-medium">${parseFloat(selectedCustomer.outstandingBalance || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Payment:</span>
                          <span className="ml-2 font-medium">{selectedCustomer.lastPaymentDate || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-maxUsers">Max Users</Label>
                        <Input
                          id="edit-maxUsers"
                          type="number"
                          value={customerForm.maxUsers}
                          onChange={(e) => setCustomerForm({...customerForm, maxUsers: parseInt(e.target.value) || 5})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-maxMonthlyOrders">Max Monthly Orders</Label>
                        <Input
                          id="edit-maxMonthlyOrders"
                          type="number"
                          value={customerForm.maxMonthlyOrders}
                          onChange={(e) => setCustomerForm({...customerForm, maxMonthlyOrders: parseInt(e.target.value) || 100})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Account Features</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="autoDelete" defaultChecked />
                          <Label htmlFor="autoDelete">Auto-delete data files</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="emailNotifications" defaultChecked />
                          <Label htmlFor="emailNotifications">Email notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="smsNotifications" />
                          <Label htmlFor="smsNotifications">SMS notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="apiAccess" />
                          <Label htmlFor="apiAccess">API access</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Account History</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Account Created:</span>
                          <span>{fmtDate(selectedCustomer.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span>{fmtDate(selectedCustomer.updatedAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Status:</span>
                          <Badge variant={getStatusBadgeVariant(selectedCustomer.status)}>
                            {selectedCustomer.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Recent Activity</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Last login: {selectedCustomer.lastLoginAt || 'Never'}</p>
                        <p>• Last order: {selectedCustomer.lastOrderDate || 'None'}</p>
                        <p>• Last payment: {selectedCustomer.lastPaymentDate || 'None'}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCustomerDetailsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCustomerMutation.isPending}>
                    {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Location Management Modal */}
        <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Locations</DialogTitle>
              <DialogDescription>
                Manage practice locations for {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Practice Locations</h4>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
              
              {/* Location List */}
              <div className="border rounded-lg">
                {locationsLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading locations...
                    </div>
                  </div>
                ) : locationsArray.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No locations found</p>
                    <p className="text-sm text-gray-500">
                      This customer hasn't created any practice locations yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {locationsArray.map((location: any) => (
                      <div key={location.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-gray-900">{location.label}</h5>
                              {location.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {location.addressLine1}
                                </p>
                                <p className="ml-4">{location.city}, {location.state} {location.zipCode}</p>
                              </div>
                              <div>
                                {location.phone && (
                                  <p className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {location.phone}
                                  </p>
                                )}
                                {location.email && (
                                  <p className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {location.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsLocationModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* User Access Modal */}
        <Dialog open={isUserAccessModalOpen} onOpenChange={setIsUserAccessModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>User Access Management</DialogTitle>
              <DialogDescription>
                Manage user accounts and permissions for {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">User Accounts</h4>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </div>
              
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center py-8">
                  User access management interface will be implemented here.
                  This will show all users for the selected customer with ability to manage roles and permissions.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsUserAccessModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}