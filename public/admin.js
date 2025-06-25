let allOrders = [];
let filteredOrders = [];

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await loadStats();
  await loadOrders();
  setupFilters();
  setupLogout();
});

// Enhanced admin-specific functions
async function loadOrders() {
  try {
    const response = await fetch('/admin/api/orders', {
      headers: { Accept: "application/json" }
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error("Non-JSON response from server");
    }
    
    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to load orders");
    }
    
    allOrders = data.orders || [];
    
    // Load practice list for filter
    await loadPracticeFilter();
    
    renderOrdersTable();
  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('Failed to load orders: ' + error.message, 'error');
  }
}

async function loadPracticeFilter() {
  try {
    const response = await fetch('/admin/api/practices');
    if (response.ok) {
      const data = await response.json();
      const practiceFilter = document.getElementById('practiceFilter');
      
      data.practices.forEach(practice => {
        const option = document.createElement('option');
        option.value = practice.name;
        option.textContent = practice.name;
        practiceFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading practices:', error);
  }
}

function renderOrdersTable() {
  const tableBody = document.getElementById('ordersTableBody');
  tableBody.innerHTML = '';

  const filteredOrders = applyFilters();

  if (filteredOrders.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="11">No orders found</td></tr>';
    return;
  }

  filteredOrders.forEach(order => {
    const row = document.createElement('tr');
    
    // Generate file links
    const fileLinks = generateFileLinks(order.files || {});
    
    // Generate status history
    const statusHistory = generateStatusHistory(order);
    
    // Generate action buttons based on status
    const actionButtons = generateActionButtons(order);
    
    row.innerHTML = `
      <td>${order.id}</td>
      <td>
        ${escapeHtml(order.subject)}
        ${statusHistory}
      </td>
      <td>${escapeHtml(order.practiceName || 'N/A')}</td>
      <td>${escapeHtml(order.userEmail || 'N/A')}</td>
      <td>
        <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select">
          <option value="Quote" ${order.status === 'Quote' ? 'selected' : ''}>Quote</option>
          <option value="Converted" ${order.status === 'Converted' ? 'selected' : ''}>Converted</option>
          <option value="Pending Approval" ${order.status === 'Pending Approval' ? 'selected' : ''}>Pending Approval</option>
          <option value="In Process" ${order.status === 'In Process' ? 'selected' : ''}>In Process</option>
          <option value="Fulfilled" ${order.status === 'Fulfilled' ? 'selected' : ''}>Fulfilled</option>
        </select>
      </td>
      <td>${order.recipientCount || 'N/A'}</td>
      <td>$${(order.totalCost || 0).toFixed(2)}</td>
      <td>${order.invoiceNumber || 'N/A'}</td>
      <td>${new Date(order.created_at).toLocaleDateString()}</td>
      <td class="files-column">${fileLinks}</td>
      <td>
        <div class="action-group">
          ${actionButtons}
        </div>
        <textarea class="admin-notes" placeholder="Admin notes..." onblur="saveAdminNote(${order.id}, this.value)">${order.adminNotes || ''}</textarea>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

function generateFileLinks(files) {
  const fileTypes = [
    { key: 'letterDocument', label: 'Letter' },
    { key: 'recipients', label: 'Recipients' },
    { key: 'letterhead', label: 'Letterhead' },
    { key: 'logo', label: 'Logo' },
    { key: 'signature', label: 'Signature' },
    { key: 'enclosures', label: 'Enclosures' },
    { key: 'envelopeArt', label: 'Envelope' },
    { key: 'zipFile', label: 'Zip' }
  ];
  
  return fileTypes
    .filter(type => files[type.key])
    .map(type => `<a href="/uploads/${files[type.key]}" target="_blank" class="file-link">${type.label}</a>`)
    .join('<br>');
}

function generateStatusHistory(order) {
  if (!order.statusHistory) return '';
  
  const history = order.statusHistory.map(entry => 
    `${entry.status} (${new Date(entry.timestamp).toLocaleDateString()})`
  ).join(' → ');
  
  return `<div class="status-history">${history}</div>`;
}

function generateActionButtons(order) {
  let buttons = [];
  
  // Always show view and confirmation buttons
  buttons.push(`<button onclick="window.open('/confirmation.html?jobId=${order.id}', '_blank')" class="btn-view">View Details</button>`);
  
  // Status-specific buttons
  if (order.status === 'Pending Approval' || order.status === 'In Process') {
    buttons.push(`<button onclick="downloadProof(${order.id})" class="btn-proof">Download Proof</button>`);
  }
  
  if (order.invoiceNumber) {
    buttons.push(`<button onclick="viewInvoice(${order.id})" class="btn-invoice">View Invoice</button>`);
  }
  
  // Admin-only actions
  if (order.status !== 'Fulfilled') {
    buttons.push(`<button onclick="markFulfilled(${order.id})" class="btn-fulfill">Mark Fulfilled</button>`);
  }
  
  buttons.push(`<button onclick="editOrderMetadata(${order.id})" class="btn-edit">Edit Metadata</button>`);
  
  return buttons.join('');
}

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const practiceFilter = document.getElementById('practiceFilter').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  return allOrders.filter(order => {
    const matchesSearch = !search || 
      order.subject.toLowerCase().includes(search) || 
      order.id.toString().includes(search) ||
      (order.practiceName && order.practiceName.toLowerCase().includes(search)) ||
      (order.userEmail && order.userEmail.toLowerCase().includes(search)) ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(search));
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesPractice = !practiceFilter || order.practiceName === practiceFilter;
    
    const orderDate = new Date(order.created_at);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate);
    const matchesEndDate = !endDate || orderDate <= new Date(endDate);

    return matchesSearch && matchesStatus && matchesPractice && matchesStartDate && matchesEndDate;
  });
}

// Admin-specific action functions
function downloadProof(orderId) {
  window.open(`/api/orders/${orderId}/proof`, '_blank');
}

function viewInvoice(orderId) {
  window.open(`/invoice.html?jobId=${orderId}`, '_blank');
}

async function markFulfilled(orderId) {
  if (!confirm('Mark this order as fulfilled? This action will update the status and send notifications.')) {
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/orders/${orderId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      showToast('Order marked as fulfilled', 'success');
      loadOrders(); // Refresh the table
    } else {
      throw new Error('Failed to mark order as fulfilled');
    }
  } catch (error) {
    console.error('Error marking order as fulfilled:', error);
    showToast('Failed to mark order as fulfilled', 'error');
  }
}

function editOrderMetadata(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  
  const newInvoiceNumber = prompt('Edit Invoice Number:', order.invoiceNumber || '');
  const newCost = prompt('Edit Total Cost:', order.totalCost || '');
  
  if (newInvoiceNumber !== null || newCost !== null) {
    updateOrderMetadata(orderId, {
      invoiceNumber: newInvoiceNumber || order.invoiceNumber,
      totalCost: parseFloat(newCost) || order.totalCost
    });
  }
}

async function updateOrderMetadata(orderId, metadata) {
  try {
    const response = await fetch(`/admin/api/orders/${orderId}/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    });
    
    if (response.ok) {
      showToast('Order metadata updated', 'success');
      loadOrders(); // Refresh the table
    } else {
      throw new Error('Failed to update order metadata');
    }
  } catch (error) {
    console.error('Error updating order metadata:', error);
    showToast('Failed to update order metadata', 'error');
  }
}

async function saveAdminNote(orderId, note) {
  try {
    const response = await fetch(`/admin/api/orders/${orderId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save admin note');
    }
  } catch (error) {
    console.error('Error saving admin note:', error);
  }
}

function exportData() {
  const filteredOrders = applyFilters();
  
  const headers = ['ID', 'Subject', 'Practice', 'User Email', 'Status', 'Recipients', 'Total Cost', 'Invoice Number', 'Created Date'];
  const csvContent = [
    headers.join(','),
    ...filteredOrders.map(order => [
      order.id,
      `"${order.subject.replace(/"/g, '""')}"`,
      `"${(order.practiceName || '').replace(/"/g, '""')}"`,
      `"${(order.userEmail || '').replace(/"/g, '""')}"`,
      order.status,
      order.recipientCount || 0,
      (order.totalCost || 0).toFixed(2),
      order.invoiceNumber || '',
      new Date(order.created_at).toLocaleDateString()
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('practiceFilter').value = '';
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  renderOrdersTable();
}

function setupFilters() {
  const inputs = ['searchInput', 'statusFilter', 'practiceFilter', 'startDate', 'endDate'];
  inputs.forEach(inputId => {
    const element = document.getElementById(inputId);
    if (element) {
      element.addEventListener('change', renderOrdersTable);
      element.addEventListener('keyup', renderOrdersTable);
    }
  });
}

// Check authentication and redirect if needed
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/user');
    if (!res.ok) {
      window.location.href = '/login.html';
      return;
    }
    
    const data = await res.json();
    if (!data.success || !data.user.is_admin) {
      window.location.href = '/login.html';
      return;
    }
    
    // Display user info
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

// Load dashboard statistics
async function loadStats() {
  try {
    const res = await fetch("/admin/api/stats");
    const data = await res.json();

    if (data.success) {
      const stats = data.stats;
      document.getElementById('total-orders').textContent = stats.totalOrders;
      document.getElementById('pending-orders').textContent = stats.pending;
      document.getElementById('submitted-orders').textContent = stats.submitted;
      document.getElementById('total-recipients').textContent = stats.totalRecipients.toLocaleString();
      document.getElementById('estimated-cost').textContent = `$${stats.estimatedCost.toFixed(2)}`;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Load orders data
async function loadOrders() {
  const container = document.getElementById("orders");
  
  try {
    container.innerHTML = '<div class="loading">Loading orders...</div>';
    
    const res = await fetch("/api/orders");
    const data = await res.json();

    if (!data.success || !Array.isArray(data.orders)) {
      throw new Error("Invalid data format");
    }

    allOrders = data.orders;
    filteredOrders = [...allOrders];
    renderTable();

  } catch (err) {
    container.innerHTML = `<p style="color:red">❌ Failed to load orders: ${err.message}</p>`;
  }
}

// Render the orders table
function renderTable() {
  const container = document.getElementById("orders");
  
  if (filteredOrders.length === 0) {
    container.innerHTML = '<div class="empty-state">No orders found matching your criteria.</div>';
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Subject</th>
        <th>Status</th>
        <th>Created</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${filteredOrders.map(order => `
        <tr id="order-row-${order.jobId}">
          <td>${order.jobId}</td>
          <td>${order.subject || "N/A"}</td>
          <td>
            <span class="tag ${order.status}" id="status-tag-${order.jobId}">${order.status}</span>
            <select class="status-dropdown" onchange="updateOrderStatus(${order.jobId}, this.value)">
              <option value="">Change Status</option>
              <option value="Pending" ${order.status === 'Pending' ? 'disabled' : ''}>Pending</option>
              <option value="Submitted" ${order.status === 'Submitted' ? 'disabled' : ''}>Submitted</option>
              <option value="Fulfilled" ${order.status === 'Fulfilled' ? 'disabled' : ''}>Fulfilled</option>
            </select>
          </td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td class="actions">
            <a href="/confirmation.html?jobId=${order.jobId}">View</a>
            <a href="/api/orders/${order.jobId}/pdf" target="_blank">PDF</a>
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;
  container.innerHTML = "";
  container.appendChild(table);
}

// Setup filter event listeners
function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const dateFromFilter = document.getElementById('date-from');
  const dateToFilter = document.getElementById('date-to');

  // Add event listeners for real-time filtering
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  dateFromFilter.addEventListener('change', applyFilters);
  dateToFilter.addEventListener('change', applyFilters);
}

// Apply filters to orders
function applyFilters() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;

  filteredOrders = allOrders.filter(order => {
    // Search filter
    const matchesSearch = !searchTerm || 
      order.subject?.toLowerCase().includes(searchTerm) ||
      order.jobId.toString().includes(searchTerm);

    // Status filter
    const matchesStatus = !statusFilter || order.status === statusFilter;

    // Date filters
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
    const matchesDateTo = !dateTo || orderDate <= dateTo;

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  renderTable();
}

// Clear all filters
function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('status-filter').value = '';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';
  
  filteredOrders = [...allOrders];
  renderTable();
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  if (!newStatus) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await res.json();

    if (result.success) {
      // Update local data
      const orderIndex = allOrders.findIndex(o => o.jobId === orderId);
      if (orderIndex !== -1) {
        allOrders[orderIndex].status = newStatus;
      }
      
      const filteredIndex = filteredOrders.findIndex(o => o.jobId === orderId);
      if (filteredIndex !== -1) {
        filteredOrders[filteredIndex].status = newStatus;
      }

      // Update UI
      const statusTag = document.getElementById(`status-tag-${orderId}`);
      if (statusTag) {
        statusTag.textContent = newStatus;
        statusTag.className = `tag ${newStatus}`;
      }

      // Reset dropdown
      const dropdown = event.target;
      dropdown.selectedIndex = 0;

      // Show success toast
      showToast(`Order ${orderId} status updated to ${newStatus}`, 'success');

      // Reload stats
      await loadStats();

    } else {
      throw new Error(result.message || 'Failed to update status');
    }

  } catch (err) {
    console.error('Status update failed:', err);
    showToast(`Failed to update status: ${err.message}`, 'error');
    
    // Reset dropdown on failure
    event.target.selectedIndex = 0;
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}