import { z } from 'zod';
import { apiRequest } from './queryClient';

// Types from shared schema
export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: number;
  practiceName: string;
  role: string;
};

export type Tenant = {
  id: number;
  name: string;
};

export type Practice = {
  id: number;
  tenantId: number;
  name: string;
};

export type Quote = {
  id: number;
  tenantId: number;
  practiceId: number;
  userId: number;
  quoteNumber: string;
  subject: string;
  total: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: number;
  tenantId: number;
  practiceId: number;
  userId: number;
  orderNumber: string;
  subject: string;
  total: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderFile = {
  id: number;
  orderId: number;
  filename: string;
  mimetype: string;
  size: number;
};

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const createQuoteSchema = z.object({
  practiceId: z.number(),
  userId: z.number(),
  subject: z.string().min(1),
  total: z.string()
});

export const createOrderSchema = z.object({
  practiceId: z.number(),
  userId: z.number(),
  subject: z.string().min(1),
  total: z.string()
});

// API Functions
export const api = {
  // Authentication
  async login(credentials: z.infer<typeof loginSchema>) {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    return response.json();
  },

  async logout() {
    const response = await apiRequest('POST', '/api/auth/logout');
    return response.json();
  },

  async getCurrentUser(): Promise<User> {
    const response = await fetch('/api/auth/user', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  async getPractices(): Promise<Practice[]> {
    const response = await fetch('/api/auth/practices', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch practices');
    }
    return response.json();
  },

  // Tenant-specific endpoints
  async getQuotes(tenantId: number): Promise<Quote[]> {
    const response = await fetch(`/api/tenants/${tenantId}/quotes`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch quotes');
    }
    return response.json();
  },

  async createQuote(tenantId: number, data: z.infer<typeof createQuoteSchema>) {
    const response = await apiRequest('POST', `/api/tenants/${tenantId}/quotes`, data);
    return response.json();
  },

  async updateQuote(tenantId: number, id: number, data: Partial<Quote>) {
    const response = await apiRequest('PUT', `/api/tenants/${tenantId}/quotes/${id}`, data);
    return response.json();
  },

  async deleteQuote(tenantId: number, id: number) {
    const response = await apiRequest('DELETE', `/api/tenants/${tenantId}/quotes/${id}`);
    return response.json();
  },

  async getOrders(tenantId: number): Promise<Order[]> {
    const response = await fetch(`/api/tenants/${tenantId}/orders`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return response.json();
  },

  async createOrder(tenantId: number, data: z.infer<typeof createOrderSchema> & { files?: FileList }) {
    const formData = new FormData();
    
    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'files') {
        formData.append(key, String(value));
      }
    });
    
    // Add files if present
    if (data.files) {
      for (let i = 0; i < data.files.length; i++) {
        formData.append('files', data.files[i]);
      }
    }
    
    const response = await apiRequest('POST', `/api/tenants/${tenantId}/orders`, formData);
    return response.json();
  },

  async updateOrder(tenantId: number, id: number, data: Partial<Order>) {
    const response = await apiRequest('PUT', `/api/tenants/${tenantId}/orders/${id}`, data);
    return response.json();
  },

  async deleteOrder(tenantId: number, id: number) {
    const response = await apiRequest('DELETE', `/api/tenants/${tenantId}/orders/${id}`);
    return response.json();
  },

  async getPracticesByTenant(tenantId: number): Promise<Practice[]> {
    const response = await fetch(`/api/tenants/${tenantId}/practices`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch practices');
    }
    return response.json();
  },

  async createPractice(tenantId: number, data: { name: string }) {
    const response = await apiRequest('POST', `/api/tenants/${tenantId}/practices`, data);
    return response.json();
  }
};

// Global fetch interceptor for 401 handling
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await originalFetch(input, init);
  
  if (response.status === 401) {
    // Redirect to login on 401
    window.location.href = '/login';
  }
  
  return response;
};

// Date formatting utility
export const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
};

export const fmtDateTime = (d?: string | null) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '—';
  }
};