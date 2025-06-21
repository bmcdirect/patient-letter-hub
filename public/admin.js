let allOrders = [];
let filteredOrders = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadStats();
  await loadOrders();
  setupFilters();
});

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