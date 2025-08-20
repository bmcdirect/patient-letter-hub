"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Plus, Filter, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Upload, Package, CheckCircle2, Truck, Clock, Link2, Mail, FileText, MoreHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import ProofUploadModal from "@/components/admin/ProofUploadModal";
import StatusManagementModal from "@/components/admin/StatusManagementModal";
import FileUploadComponent from "@/components/file-upload/FileUploadComponent";
import { ProductionCalendar } from "@/components/calendar/ProductionCalendar";

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
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [fileUploadOrder, setFileUploadOrder] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({});
  const [proofNotes, setProofNotes] = useState("");
  const [revisionNumber, setRevisionNumber] = useState(1);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showFileViewModal, setShowFileViewModal] = useState(false);
  const [fileViewOrder, setFileViewOrder] = useState<any>(null);
  const [fileViewFiles, setFileViewFiles] = useState<any[]>([]);
  const [fileViewLoading, setFileViewLoading] = useState(false);
  const [fileViewError, setFileViewError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailOrder, setEmailOrder] = useState<any>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [invoiceGenerating, setInvoiceGenerating] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);

  // Proof Upload Modal State
  const [showProofUploadModal, setShowProofUploadModal] = useState(false);
  const [proofUploadOrder, setProofUploadOrder] = useState<any>(null);

  // Status Management Modal State
  const [showStatusManagementModal, setShowStatusManagementModal] = useState(false);
  const [statusManagementOrder, setStatusManagementOrder] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  
  // Advanced filtering state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [orderDateRange, setOrderDateRange] = useState<{from: string, to: string}>({from: '', to: ''});
  const [orderCostRange, setOrderCostRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [orderTemplateFilter, setOrderTemplateFilter] = useState<string>('all');
  const [orderColorModeFilter, setOrderColorModeFilter] = useState<string>('all');
  const [orderPracticeFilter, setOrderPracticeFilter] = useState<string>('all');
  const [quoteDateRange, setQuoteDateRange] = useState<{from: string, to: string}>({from: '', to: ''});
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');
  const [quotePracticeFilter, setQuotePracticeFilter] = useState<string>('all');

  // Calculate additional stats
  const orderStats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    inProgress: orders.filter(o => o.status === 'in-progress').length,
    awaitingApproval: orders.filter(o => o.status?.startsWith('waiting-approval')).length,
    draft: orders.filter(o => o.status === 'draft').length,
  };

  const quoteStats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    converted: quotes.filter(q => q.status === 'converted').length,
  };

  const revenueStats = {
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.cost?.toString() || '0'), 0),
    monthlyRevenue: orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      return o.status === 'completed' && 
             orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }).reduce((sum, o) => sum + parseFloat(o.cost?.toString() || '0'), 0),
  };

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

  // Move fetchOrders outside useEffect so it can be called from other functions
  async function fetchOrders() {
    setOrdersLoading(true);
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setOrdersLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    async function fetchEmails() {
      setEmailsLoading(true);
      try {
        const res = await fetch("/api/admin/emails");
        const data = await res.json();
        setEmails(data || []);
      } catch (error) {
        console.error("Failed to fetch emails:", error);
      } finally {
        setEmailsLoading(false);
      }
    }
    fetchEmails();
  }, []);

  // Advanced status management with workflow validation
  const getValidStatusTransitions = (currentStatus: string) => {
    const transitions = {
      'pending': ['draft', 'cancelled'],
      'draft': ['pending', 'waiting-approval-rev1', 'cancelled'],
      'waiting-approval-rev1': ['approved', 'changes-requested', 'cancelled'],
      'waiting-approval-rev2': ['approved', 'changes-requested', 'cancelled'],
      'waiting-approval-rev3': ['approved', 'changes-requested', 'cancelled'],
      'changes-requested': ['draft', 'cancelled'],
      'approved': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': ['delivered'],
      'delivered': [],
      'cancelled': []
    };
    return transitions[currentStatus] || [];
  };

  const getStatusDependentActions = (order: any) => {
    const actions = [];
    const status = order.status;
    // Always show all workflow actions, but only enable when valid
    actions.push({
      label: 'View Details',
      icon: 'Eye',
      action: () => openOrderModal(order),
      available: true
    });
    actions.push({
      label: 'Manage Status',
      icon: 'RefreshCw',
      action: () => openStatusManagementModal(order),
      available: true
    });
    actions.push({
      label: 'View Files',
      icon: 'FileText',
      action: () => openFileViewModal(order),
      available: true
    });
    actions.push({
      label: 'Upload Proof',
      icon: 'Package',
      action: () => openProofUploadModal(order),
      available: status === 'draft' || status === 'in-progress' || status.includes('revision'),
      reason: status === 'draft' || status === 'in-progress' || status.includes('revision') ? undefined : 'Can only upload proof when order is in Draft, In Progress, or Revision status.'
    });
    actions.push({
      label: 'Copy Proof Link',
      icon: 'Link2',
      action: () => handleCopyProofLink(order),
      available: status?.startsWith('waiting-approval'),
      reason: status?.startsWith('waiting-approval') ? undefined : 'Proof link is only available when waiting for customer approval.'
    });
    actions.push({
      label: 'Send Email',
      icon: 'Mail',
      action: () => openEmailModal(order),
      available: true
    });
    actions.push({
      label: 'Generate Invoice',
      icon: 'FileText',
      action: () => openInvoiceModal(order),
      available: status === 'completed',
      reason: status === 'completed' ? undefined : 'Invoice can only be generated for completed orders.'
    });
    // ... (status change actions as before) ...
    return actions;
  };

  // Enhanced status change handler with validation
  async function handleStatusChange(orderId: string, newStatus: string) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const validTransitions = getValidStatusTransitions(order.status);
    if (!validTransitions.includes(newStatus)) {
      alert(`Invalid status transition from ${order.status} to ${newStatus}`);
      return;
    }

    setStatusUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state optimistically
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );

      // Trigger email notification for status change
      try {
        await fetch('/api/admin/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailType: 'order_status_change',
            recipientEmail: order.practice?.email || 'customer@example.com',
            subject: `Order ${order.orderNumber} Status Update`,
            content: `Your order ${order.orderNumber} has been updated to status: ${newStatus}`,
            orderId: orderId,
            practiceId: order.practiceId,
            userId: order.userId
          })
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the status update if email fails
      }

      // Show success message
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update failed:', error);
      alert('Failed to update order status');
    } finally {
      setStatusUpdating(null);
    }
  }

  // Enhanced customer feedback detection
  const getCustomerFeedback = (order: any) => {
    // This would typically come from the database
    // For now, we'll simulate based on status
    if (order.status?.startsWith('waiting-approval')) {
      return {
        hasFeedback: false,
        message: 'Waiting for customer review'
      };
    }
    if (order.status === 'changes-requested') {
      return {
        hasFeedback: true,
        message: 'Customer requested changes',
        type: 'changes-requested'
      };
    }
    if (order.status === 'approved') {
      return {
        hasFeedback: true,
        message: 'Customer approved proof',
        type: 'approved'
      };
    }
    return {
      hasFeedback: false,
      message: null
    };
  };

  // Enhanced critical alerts with comprehensive monitoring
  useEffect(() => {
    const alerts = [];
    
    // Orders awaiting customer approval
    const awaitingApproval = orders.filter(o => o.status?.startsWith('waiting-approval'));
    if (awaitingApproval.length > 0) {
      alerts.push({
        type: 'warning',
        title: '📩 Customer Approval Pending',
        message: `${awaitingApproval.length} order(s) waiting for customer approval`,
        count: awaitingApproval.length,
        orders: awaitingApproval,
        action: 'approval_pending'
      });
    }

    // Orders with customer feedback
    const withFeedback = orders.filter(o => getCustomerFeedback(o).hasFeedback);
    if (withFeedback.length > 0) {
      alerts.push({
        type: 'info',
        title: '📩 Customer Feedback Available',
        message: `${withFeedback.length} order(s) have customer feedback`,
        count: withFeedback.length,
        orders: withFeedback,
        action: 'feedback_available'
      });
    }

    // Draft orders ready for proof
    const draftOrders = orders.filter(o => o.status === 'draft');
    if (draftOrders.length > 0) {
      alerts.push({
        type: 'success',
        title: '🎨 Ready for Proof Upload',
        message: `${draftOrders.length} order(s) ready for proof upload`,
        count: draftOrders.length,
        orders: draftOrders,
        action: 'ready_for_proof'
      });
    }

    // Orders in production that need completion
    const inProgressOrders = orders.filter(o => o.status === 'in-progress');
    if (inProgressOrders.length > 0) {
      alerts.push({
        type: 'default',
        title: '🏭 Production in Progress',
        message: `${inProgressOrders.length} order(s) currently in production`,
        count: inProgressOrders.length,
        orders: inProgressOrders,
        action: 'production_in_progress'
      });
    }

    // Orders ready for delivery
    const completedOrders = orders.filter(o => o.status === 'completed');
    if (completedOrders.length > 0) {
      alerts.push({
        type: 'secondary',
        title: '📦 Ready for Delivery',
        message: `${completedOrders.length} order(s) completed and ready for delivery`,
        count: completedOrders.length,
        orders: completedOrders,
        action: 'ready_for_delivery'
      });
    }

    // High priority orders (overdue or urgent)
    const highPriorityOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const daysSinceCreation = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation > 7 && o.status !== 'completed' && o.status !== 'delivered';
    });
    if (highPriorityOrders.length > 0) {
      alerts.push({
        type: 'destructive',
        title: '🚨 High Priority Orders',
        message: `${highPriorityOrders.length} order(s) older than 7 days need attention`,
        count: highPriorityOrders.length,
        orders: highPriorityOrders,
        action: 'high_priority'
      });
    }

    setCriticalAlerts(alerts);
  }, [orders]);

  // Generate recent activity
  useEffect(() => {
    const activity = [];
    
    // Add recent orders
    const recentOrders = orders.slice(0, 5).map(order => ({
      type: 'order',
      action: 'created',
      item: order.orderNumber,
      customer: order.practiceName || order.practice?.name,
      date: order.createdAt,
      status: order.status,
    }));
    
    // Add recent quotes
    const recentQuotes = quotes.slice(0, 5).map(quote => ({
      type: 'quote',
      action: 'created',
      item: quote.quoteNumber,
      customer: quote.practiceName || quote.practice?.name,
      date: quote.createdAt,
      status: quote.status,
    }));
    
    // Combine and sort by date
    const allActivity = [...recentOrders, ...recentQuotes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    setRecentActivity(allActivity);
  }, [orders, quotes]);

  // Get unique values for filter options
  const uniqueTemplates = [...new Set(orders.map(o => o.templateType).filter(Boolean))];
  const uniqueColorModes = [...new Set(orders.map(o => o.colorMode).filter(Boolean))];
  const uniquePractices = [...new Set(orders.map(o => o.practiceName).filter(Boolean))];
  const uniqueQuoteStatuses = [...new Set(quotes.map(q => q.status).filter(Boolean))];

  // Enhanced filtering logic with advanced criteria
  const filteredOrders = orders.filter(order => {
    // Basic filters
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesSearch = !orderSearch || 
      order.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) || 
      order.subject?.toLowerCase().includes(orderSearch.toLowerCase()) || 
      order.practiceName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.templateType?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.colorMode?.toLowerCase().includes(orderSearch.toLowerCase());

    // Advanced filters
    const matchesDateRange = !orderDateRange.from && !orderDateRange.to || 
      (orderDateRange.from && orderDateRange.to && 
       new Date(order.createdAt) >= new Date(orderDateRange.from) && 
       new Date(order.createdAt) <= new Date(orderDateRange.to));

    const matchesCostRange = !orderCostRange.min && !orderCostRange.max ||
      (orderCostRange.min && orderCostRange.max && 
       order.cost >= parseFloat(orderCostRange.min) && 
       order.cost <= parseFloat(orderCostRange.max));

    const matchesTemplate = orderTemplateFilter === 'all' || order.templateType === orderTemplateFilter;
    const matchesColorMode = orderColorModeFilter === 'all' || order.colorMode === orderColorModeFilter;
    const matchesPractice = orderPracticeFilter === 'all' || order.practiceName === orderPracticeFilter;

    return matchesStatus && matchesSearch && matchesDateRange && matchesCostRange && 
           matchesTemplate && matchesColorMode && matchesPractice;
  });

  const filteredQuotes = quotes.filter(quote => {
    // Basic search
    const matchesSearch = !quoteSearch || 
      quote.quoteNumber?.toLowerCase().includes(quoteSearch.toLowerCase()) || 
      quote.subject?.toLowerCase().includes(quoteSearch.toLowerCase()) || 
      quote.practiceName?.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      quote.templateType?.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      quote.colorMode?.toLowerCase().includes(quoteSearch.toLowerCase());

    // Advanced filters
    const matchesDateRange = !quoteDateRange.from && !quoteDateRange.to || 
      (quoteDateRange.from && quoteDateRange.to && 
       new Date(quote.createdAt) >= new Date(quoteDateRange.from) && 
       new Date(quote.createdAt) <= new Date(quoteDateRange.to));

    const matchesStatus = quoteStatusFilter === 'all' || quote.status === quoteStatusFilter;
    const matchesPractice = quotePracticeFilter === 'all' || quote.practiceName === quotePracticeFilter;

    return matchesSearch && matchesDateRange && matchesStatus && matchesPractice;
  });

  async function handleQuickAction(action: string, orderIds: string[]) {
    setStatusUpdating('bulk');
    try {
      let newStatus = action;
      
      // Map alert actions to status changes
      switch (action) {
        case 'approval_pending':
          // No status change needed, just acknowledge
          alert(`Acknowledged ${orderIds.length} orders awaiting approval`);
          break;
        case 'feedback_available':
          // No status change needed, just acknowledge
          alert(`Acknowledged ${orderIds.length} orders with feedback`);
          break;
        case 'ready_for_proof':
          // These are already draft status, no change needed
          alert(`${orderIds.length} orders are ready for proof upload`);
          break;
        case 'production_in_progress':
          // These are already in-progress, no change needed
          alert(`${orderIds.length} orders are in production`);
          break;
        case 'ready_for_delivery':
          newStatus = 'delivered';
          break;
        case 'high_priority':
          // Mark as in-progress to move them along
          newStatus = 'in-progress';
          break;
        default:
          // Direct status change
          newStatus = action;
      }

      // Perform status updates if needed
      if (newStatus !== action) {
        for (const orderId of orderIds) {
          await handleStatusChange(orderId, newStatus);
        }
      }

      // Refresh orders
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders || []);
      
      alert(`Bulk action completed for ${orderIds.length} orders`);
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert("Failed to perform bulk action");
    } finally {
      setStatusUpdating(null);
    }
  }

  function openOrderModal(order: any) {
    setSelectedOrder(order);
    setShowOrderModal(true);
  }
  function closeOrderModal() {
    setShowOrderModal(false);
    setSelectedOrder(null);
  }

  function openFileUploadModal(order: any) {
    setFileUploadOrder(order);
    setShowFileUploadModal(true);
    setProofNotes("");
    setProofFile(null);
    setUploadError(null);
    
    // Calculate next revision number
    const currentRevisions = order.files?.filter((f: any) => f.fileType === 'admin-proof') || [];
    setRevisionNumber(currentRevisions.length + 1);
  }
  function closeFileUploadModal() {
    setShowFileUploadModal(false);
    setFileUploadOrder(null);
  }

  async function handleFileUploadSubmit() {
    if (!fileUploadOrder || !proofFile) {
      setUploadError("Please select a proof file to upload");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', proofFile);
      formData.append('orderId', fileUploadOrder.id);
      formData.append('fileType', 'admin-proof');
      formData.append('revisionNumber', revisionNumber.toString());
      formData.append('adminNotes', proofNotes);

      const response = await fetch('/api/file-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload proof');
      }

      const result = await response.json();
      
      // Update local state
      setUploadedFiles(prev => ({
        ...prev,
        [fileUploadOrder.id]: result.files
      }));

      // Update order status to waiting-approval
      await handleStatusChange(fileUploadOrder.id, `waiting-approval-rev${revisionNumber}`);

      // Close modal and reset
      closeFileUploadModal();
      alert(`Proof uploaded successfully! Revision ${revisionNumber} is now ready for customer review.`);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Failed to upload proof. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function openFileViewModal(order: any) {
    setFileViewOrder(order);
    setShowFileViewModal(true);
    setFileViewLoading(true);
    setFileViewError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/files`);
      if (!res.ok) throw new Error("Failed to fetch order files");
      const data = await res.json();
      setFileViewFiles(data.files || []);
    } catch (err) {
      setFileViewError("Failed to load files.");
    } finally {
      setFileViewLoading(false);
    }
  }
  function closeFileViewModal() {
    setShowFileViewModal(false);
    setFileViewOrder(null);
    setFileViewFiles([]);
    setFileViewError(null);
  }

  function openEmailModal(order: any) {
    setEmailOrder(order);
    setShowEmailModal(true);
    setEmailTo(order.userEmail || "");
    setEmailSubject("");
    setEmailMessage("");
    setEmailError(null);
    setEmailSuccess(false);
  }
  function closeEmailModal() {
    setShowEmailModal(false);
    setEmailOrder(null);
    setEmailTo("");
    setEmailSubject("");
    setEmailMessage("");
    setEmailError(null);
    setEmailSuccess(false);
  }
  async function handleSendEmail() {
    if (!emailOrder || !emailTo || !emailSubject || !emailMessage) {
      setEmailError("All fields are required.");
      return;
    }
    setEmailSending(true);
    setEmailError(null);
    setEmailSuccess(false);
    try {
      // Use our new email system
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: 'custom',
          recipientEmail: emailTo,
          subject: emailSubject,
          content: emailMessage,
          orderId: emailOrder.id,
          practiceId: emailOrder.practiceId,
          userId: emailOrder.userId
        })
      });
      if (!res.ok) throw new Error("Failed to send email");
      setEmailSuccess(true);
      
      // Refresh emails list
      const emailsRes = await fetch("/api/admin/emails");
      const emailsData = await emailsRes.json();
      setEmails(emailsData || []);
    } catch (err) {
      setEmailError("Failed to send email. Please try again.");
    } finally {
      setEmailSending(false);
    }
  }

  async function handleCopyProofLink(order: any) {
    const proofReviewUrl = `${window.location.origin}/orders/${order.id}/proof-review`;
    try {
      await navigator.clipboard.writeText(proofReviewUrl);
      setCopySuccess(`Proof review link copied for Order #${order.orderNumber}`);
      setTimeout(() => setCopySuccess(null), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = proofReviewUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(`Proof review link copied for Order #${order.orderNumber}`);
      setTimeout(() => setCopySuccess(null), 3000);
    }
  }

  async function handleGenerateInvoice() {
    if (!invoiceOrder) return;
    setInvoiceGenerating(true);
    setInvoiceError(null);
    setInvoiceSuccess(false);
    try {
      const res = await fetch(`/api/orders/${invoiceOrder.id}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to generate invoice");
      const data = await res.json();
      setInvoiceSuccess(true);
      // Refresh orders to show invoice status
      const ordersRes = await fetch("/api/admin/orders");
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
    } catch (err) {
      setInvoiceError("Failed to generate invoice. Please try again.");
    } finally {
      setInvoiceGenerating(false);
    }
  }

  function openInvoiceModal(order: any) {
    setInvoiceOrder(order);
    setShowInvoiceModal(true);
    setInvoiceError(null);
    setInvoiceSuccess(false);
  }
  function closeInvoiceModal() {
    setShowInvoiceModal(false);
    setInvoiceOrder(null);
    setInvoiceError(null);
    setInvoiceSuccess(false);
  }

  // Proof Upload Modal Functions
  function openProofUploadModal(order: any) {
    setProofUploadOrder(order);
    setShowProofUploadModal(true);
  }
  
  function closeProofUploadModal() {
    setShowProofUploadModal(false);
    setProofUploadOrder(null);
  }

  function handleProofUploadSuccess() {
    // Refresh orders to show updated status
    fetchOrders();
  }

  // Status Management Functions
  function openStatusManagementModal(order: any) {
    setStatusManagementOrder(order);
    setShowStatusManagementModal(true);
  }

  function closeStatusManagementModal() {
    setShowStatusManagementModal(false);
    setStatusManagementOrder(null);
  }

  function handleStatusManagementSuccess() {
    fetchOrders();
    setShowStatusManagementModal(false);
    setStatusManagementOrder(null);
  }

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>
        
        {/* Quick Actions & Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions & Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalAlerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  alert.type === 'info' ? 'border-blue-200 bg-blue-50' :
                  'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{alert.title}</h4>
                    <span className="text-sm font-bold">{alert.count}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleQuickAction(alert.action, alert.orders.map((o: any) => o.id))}
                      disabled={statusUpdating === 'bulk'}
                      className={`w-full px-3 py-1 text-xs rounded disabled:opacity-50 ${
                        alert.type === 'warning' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                        alert.type === 'info' ? 'bg-blue-500 text-white hover:bg-blue-600' :
                        alert.type === 'success' ? 'bg-green-500 text-white hover:bg-green-600' :
                        alert.type === 'destructive' ? 'bg-red-500 text-white hover:bg-red-600' :
                        'bg-gray-500 text-white hover:bg-gray-600'
                      }`}
                    >
                      {statusUpdating === 'bulk' ? 'Processing...' : 
                        alert.action === 'approval_pending' ? 'Acknowledge' :
                        alert.action === 'feedback_available' ? 'View Feedback' :
                        alert.action === 'ready_for_proof' ? 'Upload Proof' :
                        alert.action === 'production_in_progress' ? 'View Progress' :
                        alert.action === 'ready_for_delivery' ? 'Mark Delivered' :
                        alert.action === 'high_priority' ? 'Take Action' :
                        'Process Orders'
                      }
                    </button>
                    <button 
                      onClick={() => setTab('orders')}
                      className="w-full px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      View All Orders
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <TabsContent value="overview">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-8">
              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold mb-2 text-blue-600">{stats.users}</div>
                    <div className="text-gray-600 mb-2">Total Users</div>
                    <div className="text-sm text-gray-500">Active accounts</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold mb-2 text-green-600">{stats.practices}</div>
                    <div className="text-gray-600 mb-2">Practices</div>
                    <div className="text-sm text-gray-500">Registered practices</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold mb-2 text-purple-600">{stats.quotes}</div>
                    <div className="text-gray-600 mb-2">Quotes</div>
                    <div className="text-sm text-gray-500">Total quotes created</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold mb-2 text-orange-600">{stats.orders}</div>
                    <div className="text-gray-600 mb-2">Orders</div>
                    <div className="text-sm text-gray-500">Total orders placed</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Orders</span>
                        <span className="font-semibold">{orderStats.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Completed</span>
                        <span className="font-semibold text-green-600">{orderStats.completed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>In Progress</span>
                        <span className="font-semibold text-blue-600">{orderStats.inProgress}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Awaiting Approval</span>
                        <span className="font-semibold text-yellow-600">{orderStats.awaitingApproval}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Draft</span>
                        <span className="font-semibold text-gray-600">{orderStats.draft}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quote Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Quotes</span>
                        <span className="font-semibold">{quoteStats.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pending</span>
                        <span className="font-semibold text-yellow-600">{quoteStats.pending}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Converted to Orders</span>
                        <span className="font-semibold text-green-600">{quoteStats.converted}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Conversion Rate</span>
                        <span className="font-semibold text-blue-600">
                          {quoteStats.total > 0 ? ((quoteStats.converted / quoteStats.total) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        ${revenueStats.totalRevenue.toFixed(2)}
                      </div>
                      <div className="text-gray-600">Total Revenue</div>
                      <div className="text-sm text-gray-500">All completed orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        ${revenueStats.monthlyRevenue.toFixed(2)}
                      </div>
                      <div className="text-gray-600">This Month</div>
                      <div className="text-sm text-gray-500">Completed orders this month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${
                            activity.type === 'order' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {activity.type === 'order' ? 'Order' : 'Quote'} {activity.item} {activity.action}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.customer} • {activity.date ? new Date(activity.date).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                            activity.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            activity.status?.startsWith('waiting-approval') ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">No recent activity</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setTab('orders')}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="font-medium">Manage Orders</div>
                      <div className="text-sm text-gray-500">View and manage all orders</div>
                    </button>
                    <button 
                      onClick={() => setTab('quotes')}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="font-medium">Manage Quotes</div>
                      <div className="text-sm text-gray-500">View and manage all quotes</div>
                    </button>
                    <button 
                      onClick={() => window.location.href = '/orders/create'}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="font-medium">Create New Order</div>
                      <div className="text-sm text-gray-500">Start a new order</div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        <TabsContent value="orders">
          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="flex items-center gap-4">
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/orders/create" className="bg-primary-500 text-white flex items-center px-4 py-2 rounded-md font-medium hover:bg-primary-600 transition">
                <Plus className="h-4 w-4 mr-2" />New Order
              </Link>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        placeholder="From"
                        value={orderDateRange.from}
                        onChange={e => setOrderDateRange({...orderDateRange, from: e.target.value})}
                      />
                      <Input
                        type="date"
                        placeholder="To"
                        value={orderDateRange.to}
                        onChange={e => setOrderDateRange({...orderDateRange, to: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Cost Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Range</label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Min Cost"
                        value={orderCostRange.min}
                        onChange={e => setOrderCostRange({...orderCostRange, min: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Max Cost"
                        value={orderCostRange.max}
                        onChange={e => setOrderCostRange({...orderCostRange, max: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Template Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
                    <Select value={orderTemplateFilter} onValueChange={setOrderTemplateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Templates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Templates</SelectItem>
                        {uniqueTemplates.map(template => (
                          <SelectItem key={template} value={template}>{template}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Color Mode Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color Mode</label>
                    <Select value={orderColorModeFilter} onValueChange={setOrderColorModeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Color Modes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Color Modes</SelectItem>
                        {uniqueColorModes.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Practice Filter */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Practice</label>
                  <Select value={orderPracticeFilter} onValueChange={setOrderPracticeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Practices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Practices</SelectItem>
                      {uniquePractices.map(practice => (
                        <SelectItem key={practice} value={practice}>{practice}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setOrderDateRange({from: '', to: ''});
                      setOrderCostRange({min: '', max: ''});
                      setOrderTemplateFilter('all');
                      setOrderColorModeFilter('all');
                      setOrderPracticeFilter('all');
                    }}
                  >
                    Clear All Filters
                  </Button>
                  <span className="text-sm text-gray-500 self-center">
                    {filteredOrders.length} of {orders.length} orders
                  </span>
                </div>
              </div>
            )}
          </div>
          {ordersLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Bulk Actions */}
              {selectedOrders.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-blue-900">
                        {selectedOrders.length} order(s) selected
                      </span>
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select bulk action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-progress">Start Production</SelectItem>
                          <SelectItem value="completed">Mark Complete</SelectItem>
                          <SelectItem value="delivered">Mark Delivered</SelectItem>
                          <SelectItem value="draft">Mark as Draft</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (bulkAction) {
                            handleQuickAction(bulkAction, selectedOrders);
                            setSelectedOrders([]);
                            setBulkAction('');
                          }
                        }}
                        disabled={!bulkAction || bulkProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {bulkProcessing ? 'Processing...' : 'Apply to Selected'}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrders([]);
                        setBulkAction('');
                      }}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                        className="rounded"
                      />
                    </TableHead>
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
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                            }
                          }}
                          className="rounded"
                        />
                      </TableCell>
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
                          <DropdownMenuContent align="end" className="w-56">
                            {getStatusDependentActions(order).map((action, index) => (
                              <DropdownMenuItem 
                                key={index}
                                onClick={action.action}
                                disabled={statusUpdating === order.id}
                                className={action.isStatusChange ? 'text-blue-600' : ''}
                              >
                                {action.icon === 'Eye' && <Eye className="mr-2 h-4 w-4" />}
                                {action.icon === 'FileText' && <FileText className="mr-2 h-4 w-4" />}
                                {action.icon === 'Upload' && <Upload className="mr-2 h-4 w-4" />}
                                {action.icon === 'Link2' && <Link2 className="mr-2 h-4 w-4" />}
                                {action.icon === 'Mail' && <Mail className="mr-2 h-4 w-4" />}
                                {action.icon === 'RefreshCw' && <RefreshCw className="mr-2 h-4 w-4" />}
                                {action.label}
                                {statusUpdating === order.id && action.isStatusChange && (
                                  <span className="ml-2">...</span>
                                )}
                              </DropdownMenuItem>
                            ))}
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
          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quotes..."
                  value={quoteSearch}
                  onChange={e => setQuoteSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/quotes/create" className="bg-primary-500 text-white flex items-center px-4 py-2 rounded-md font-medium hover:bg-primary-600 transition">
                <Plus className="h-4 w-4 mr-2" />New Quote
              </Link>
            </div>

            {/* Advanced Filters for Quotes */}
            {showAdvancedFilters && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        placeholder="From"
                        value={quoteDateRange.from}
                        onChange={e => setQuoteDateRange({...quoteDateRange, from: e.target.value})}
                      />
                      <Input
                        type="date"
                        placeholder="To"
                        value={quoteDateRange.to}
                        onChange={e => setQuoteDateRange({...quoteDateRange, to: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <Select value={quoteStatusFilter} onValueChange={setQuoteStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueQuoteStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Practice Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Practice</label>
                    <Select value={quotePracticeFilter} onValueChange={setQuotePracticeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Practices" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Practices</SelectItem>
                        {uniquePractices.map(practice => (
                          <SelectItem key={practice} value={practice}>{practice}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setQuoteDateRange({from: '', to: ''});
                      setQuoteStatusFilter('all');
                      setQuotePracticeFilter('all');
                    }}
                  >
                    Clear All Filters
                  </Button>
                  <span className="text-sm text-gray-500 self-center">
                    {filteredQuotes.length} of {quotes.length} quotes
                  </span>
                </div>
              </div>
            )}
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
        <TabsContent value="calendar">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Production Calendar</h2>
                <p className="text-gray-600">Schedule and track letter production with preferred mail dates</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            
            {ordersLoading || quotesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading calendar data...</p>
                </div>
              </div>
            ) : (
              <ProductionCalendar
                orders={orders}
                quotes={quotes}
                onEventClick={(event) => {
                  if (event.entityType === 'order') {
                    const order = orders.find(o => o.id === event.entityId);
                    if (order) {
                      openOrderModal(order);
                    }
                  } else if (event.entityType === 'quote') {
                    // Navigate to quotes page for editing
                    window.location.href = '/quotes';
                  }
                }}
                onExportSchedule={() => {
                  // Enhanced CSV export with more details
                  const csvContent = [
                    ['Date', 'Practice', 'Type', 'Order/Quote #', 'Status', 'Subject', 'Preferred Mail Date', 'Production Start', 'Production End'],
                    ...orders.map(order => [
                      order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
                      order.practiceName || order.practice?.name || '',
                      'Order',
                      order.orderNumber,
                      order.status,
                      order.subject || '',
                      order.preferredMailDate ? new Date(order.preferredMailDate).toLocaleDateString() : '',
                      order.productionStartDate ? new Date(order.productionStartDate).toLocaleDateString() : '',
                      order.productionEndDate ? new Date(order.productionEndDate).toLocaleDateString() : ''
                    ]),
                    ...quotes.map(quote => [
                      quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : '',
                      quote.practiceName || quote.practice?.name || '',
                      'Quote',
                      quote.quoteNumber,
                      quote.status,
                      quote.subject || '',
                      '', '', '', ''
                    ])
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `production-schedule-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="emails">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search emails..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          {emailsLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(emails || []).map(email => (
                    <TableRow key={email.id}>
                      <TableCell>{new Date(email.sentAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          email.emailType === 'order_status_change' ? 'default' :
                          email.emailType === 'proof_ready' ? 'secondary' :
                          email.emailType === 'invoice_generated' ? 'outline' :
                          'default'
                        }>
                          {email.emailType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>{email.recipientEmail}</TableCell>
                      <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                      <TableCell>
                        <Badge variant={
                          email.status === 'sent' ? 'default' :
                          email.status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {email.order ? (
                          <Link href={`/orders/${email.order.id}`} className="text-blue-600 hover:underline">
                            {email.order.orderNumber}
                          </Link>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Show email content in a modal
                            alert(`Email Content:\n\nSubject: ${email.subject}\n\n${email.content}`);
                          }}
                        >
                          View
                        </Button>
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
      {showOrderModal && selectedOrder && (
        <Modal showModal={showOrderModal} setShowModal={setShowOrderModal} onClose={closeOrderModal}>
          <div className="p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Order Details - #{selectedOrder.orderNumber}</h2>
            
            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Order Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Order Number:</span>
                    <span>{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status?.startsWith('waiting-approval') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.status?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Subject:</span>
                    <span>{selectedOrder.subject || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Template Type:</span>
                    <span>{selectedOrder.templateType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Color Mode:</span>
                    <span>{selectedOrder.colorMode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cost:</span>
                    <span>${parseFloat(selectedOrder.cost?.toString() || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Practice:</span>
                    <span>{selectedOrder.practiceName || selectedOrder.practice?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Customer:</span>
                    <span>{selectedOrder.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{selectedOrder.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Created:</span>
                    <span>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Last Updated:</span>
                    <span>{selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Files Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Files</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedOrder.files && selectedOrder.files.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{file.fileName}</div>
                            <div className="text-sm text-gray-500">
                              Uploaded {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <a 
                          href={file.filePath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">No files uploaded for this order</div>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Status Timeline</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Order Created</div>
                      <div className="text-sm text-gray-500">
                        {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {selectedOrder.status !== 'draft' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Order Updated</div>
                        <div className="text-sm text-gray-500">
                          {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Add more timeline items based on status */}
                  {selectedOrder.status?.startsWith('waiting-approval') && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Awaiting Customer Approval</div>
                        <div className="text-sm text-gray-500">Proof submitted for review</div>
                      </div>
                    </div>
                  )}
                  {selectedOrder.status === 'in-progress' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">In Production</div>
                        <div className="text-sm text-gray-500">Order is being processed</div>
                      </div>
                    </div>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Completed</div>
                        <div className="text-sm text-gray-500">Order has been completed</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Communication History */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Communication History</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-500 text-center py-4">
                  Communication history will be displayed here when email functionality is fully implemented.
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    closeOrderModal();
                    openFileUploadModal(selectedOrder);
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Upload Files
                </button>
                <button 
                  onClick={() => {
                    closeOrderModal();
                    openEmailModal(selectedOrder);
                  }}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Send Email
                </button>
                {selectedOrder.status === 'completed' && (
                  <button 
                    onClick={() => {
                      closeOrderModal();
                      openInvoiceModal(selectedOrder);
                    }}
                    className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                  >
                    Generate Invoice
                  </button>
                )}
              </div>
            </div>

            <button onClick={closeOrderModal} className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">
              Close
            </button>
          </div>
        </Modal>
      )}
      {/* File Upload Modal */}
      {showFileUploadModal && fileUploadOrder && (
        <Modal showModal={showFileUploadModal} setShowModal={setShowFileUploadModal} onClose={closeFileUploadModal}>
          <div className="p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Upload Proof - Order #{fileUploadOrder.orderNumber}</h2>
            
            {/* Order Information */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {fileUploadOrder.practiceName || fileUploadOrder.practice?.name}
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {fileUploadOrder.subject}
                </div>
                <div>
                  <span className="font-medium">Current Status:</span> 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {fileUploadOrder.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Revision:</span> 
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                    Rev {revisionNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Revision History */}
            {fileUploadOrder.files && fileUploadOrder.files.filter((f: any) => f.fileType === 'admin-proof').length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Previous Revisions</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    {fileUploadOrder.files
                      .filter((f: any) => f.fileType === 'admin-proof')
                      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((file: any, index: number) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">Revision {index + 1}</div>
                              <div className="text-sm text-gray-500">
                                Uploaded {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <a 
                            href={file.filePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            View
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Proof File (PDF recommended)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {proofFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="Add any notes about this proof for the customer..."
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                These notes will be visible to the customer when they review the proof.
              </p>
            </div>

            {/* Error Display */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeFileUploadModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUploadSubmit}
                disabled={!proofFile || uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : `Upload Proof (Rev ${revisionNumber})`}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showFileViewModal && fileViewOrder && (
        <Modal showModal={showFileViewModal} setShowModal={setShowFileViewModal} onClose={closeFileViewModal}>
          <div className="p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Files for Order #{fileViewOrder.orderNumber}</h2>
            {fileViewLoading ? (
              <div>Loading files...</div>
            ) : fileViewError ? (
              <div className="text-red-500">{fileViewError}</div>
            ) : fileViewFiles.length === 0 ? (
              <div>No files uploaded for this order.</div>
            ) : (
              <ul className="space-y-2">
                {fileViewFiles.map((file: any) => (
                  <li key={file.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <div className="font-medium">{file.fileName}</div>
                      <div className="text-sm text-gray-500">
                        Uploaded by {file.uploader?.name || 'Unknown'} on {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/orders/${fileViewOrder.id}/files/${file.id}/download`);
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.fileName;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          }
                        } catch (error) {
                          console.error("Error downloading file:", error);
                        }
                      }}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={closeFileViewModal} className="mt-6 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">Close</button>
          </div>
        </Modal>
      )}
      {showEmailModal && emailOrder && (
        <Modal showModal={showEmailModal} setShowModal={setShowEmailModal} onClose={closeEmailModal}>
          <div className="p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Send Email for Order #{emailOrder.orderNumber}</h2>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">To</label>
              <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} className="w-full border rounded px-2 py-1 min-h-[100px]" />
            </div>
            {emailError && <div className="text-red-500 mt-2">{emailError}</div>}
            {emailSuccess && <div className="text-green-600 mt-2">Email sent successfully!</div>}
            <div className="flex gap-2 mt-6">
              <button onClick={closeEmailModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={handleSendEmail} className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600" disabled={emailSending}>
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showInvoiceModal && invoiceOrder && (
        <Modal showModal={showInvoiceModal} setShowModal={setShowInvoiceModal} onClose={closeInvoiceModal}>
          <div className="p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Generate Invoice for Order #{invoiceOrder.orderNumber}</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Order:</span>
                  <span>{invoiceOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{invoiceOrder.practiceName || invoiceOrder.practice?.name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${parseFloat(invoiceOrder.cost?.toString() || '0').toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Invoice Details</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    • Auto-generated invoice number (INV-2025-XXXX)
                    <br />
                    • Complete order and cost breakdown
                    <br />
                    • Professional PDF format
                    <br />
                    • Net 30 payment terms
                  </p>
                </div>
              </div>
            </div>
            {invoiceError && <div className="text-red-500 mb-4">{invoiceError}</div>}
            {invoiceSuccess && <div className="text-green-600 mb-4">Invoice generated successfully!</div>}
            <div className="flex gap-2">
              <button onClick={closeInvoiceModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={handleGenerateInvoice} className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600" disabled={invoiceGenerating}>
                {invoiceGenerating ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* Success message for copy */}
      {copySuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {copySuccess}
        </div>
      )}

      {/* Proof Upload Modal */}
      {showProofUploadModal && proofUploadOrder && (
        <ProofUploadModal
          order={proofUploadOrder}
          isOpen={showProofUploadModal}
          onClose={closeProofUploadModal}
          onSuccess={handleProofUploadSuccess}
        />
      )}

      {/* Status Management Modal */}
      {showStatusManagementModal && statusManagementOrder && (
        <StatusManagementModal
          order={statusManagementOrder}
          isOpen={showStatusManagementModal}
          onClose={closeStatusManagementModal}
          onSuccess={handleStatusManagementSuccess}
        />
      )}
    </main>
  );
}
