let currentJobId = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await loadInvoiceData();
  setupLogout();
});

// Check authentication and redirect if needed
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/user');
    if (!res.ok) {
      window.location.href = '/login.html';
      return;
    }
    
    const data = await res.json();
    if (!data.success) {
      window.location.href = '/login.html';
      return;
    }
    
    currentUser = data.user;
    document.getElementById('user-info').textContent = `Logged in as: ${data.user.email}`;
    
  } catch (err) {
    window.location.href = '/login.html';
  }
}

// Setup logout functionality
function setupLogout() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login.html';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  });
}

// Get job ID from URL parameters
function getJobIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('jobId');
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Show error message
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('invoice-content').style.display = 'none';
  document.getElementById('error-container').style.display = 'block';
  document.getElementById('error-container').innerHTML = `<div class="error">${message}</div>`;
}

// Load invoice data
async function loadInvoiceData() {
  currentJobId = getJobIdFromUrl();
  
  if (!currentJobId) {
    showError('Invalid or missing order ID. Please check the URL.');
    return;
  }
  
  try {
    const res = await fetch(`/api/orders/${currentJobId}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        showError('Order not found or you do not have permission to view this invoice.');
      } else if (res.status === 401) {
        window.location.href = '/login.html';
      } else if (res.status === 403) {
        showError('You do not have permission to view this invoice.');
      } else {
        showError('Failed to load order details. Please try again.');
      }
      return;
    }
    
    const data = await res.json();
    
    if (!data.success) {
      showError(data.message || 'Failed to load order details.');
      return;
    }
    
    populateInvoice(data.order);
    
  } catch (err) {
    console.error('Error loading invoice:', err);
    showError('Network error. Please check your connection and try again.');
  }
}

// Populate invoice with order data
function populateInvoice(order) {
  // Basic order information
  document.getElementById('order-id').textContent = order.jobId || currentJobId;
  document.getElementById('order-subject').textContent = order.subject || 'N/A';
  document.getElementById('order-date').textContent = formatDate(order.createdAt);
  
  // Status with styling
  const statusElement = document.getElementById('order-status');
  statusElement.innerHTML = `<span class="status ${order.status || 'Pending'}">${order.status || 'Pending'}</span>`;
  
  // Customer information
  document.getElementById('practice-name').textContent = order.practiceName || 'N/A';
  document.getElementById('customer-email').textContent = currentUser?.email || 'N/A';
  document.getElementById('valid-recipients').textContent = order.validRecipients || 0;
  document.getElementById('color-mode').textContent = order.colorMode === 'color' ? 'Color' : 'Black & White';
  
  // Cost calculations
  const validRecipients = parseInt(order.validRecipients) || 0;
  const rate = order.colorMode === 'color' ? 0.65 : 0.50;
  const estimatedCost = validRecipients * rate;
  
  document.getElementById('cost-recipients').textContent = validRecipients;
  document.getElementById('cost-per-letter').textContent = formatCurrency(rate);
  document.getElementById('letters-cost').textContent = formatCurrency(estimatedCost);
  document.getElementById('total-cost').textContent = formatCurrency(estimatedCost);
  
  // Setup action buttons
  document.getElementById('download-pdf-btn').href = `/api/orders/${currentJobId}/invoice-pdf`;
  
  // Back to dashboard button based on user role
  const backBtn = document.getElementById('back-dashboard-btn');
  if (currentUser?.is_admin) {
    backBtn.href = '/admin.html';
    backBtn.textContent = 'Back to Admin Dashboard';
  } else {
    backBtn.href = '/order.html';
    backBtn.textContent = 'Back to Dashboard';
  }
  
  // Show the invoice content
  document.getElementById('loading').style.display = 'none';
  document.getElementById('invoice-content').style.display = 'block';
}

// Print invoice
function printInvoice() {
  window.print();
}

// Add keyboard shortcut for printing
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    printInvoice();
  }
});