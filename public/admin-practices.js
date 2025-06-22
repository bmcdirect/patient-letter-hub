let allPractices = [];
let filteredPractices = [];
let deleteTargetId = null;

// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/user');
    const data = await response.json();
    
    if (!response.ok || !data.success || !data.user.is_admin) {
      window.location.href = '/login.html';
      return;
    }
    
    document.getElementById('userEmail').textContent = data.user.email;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login.html';
  }
}

// Logout function
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = '/login.html';
  }
}

// Load practices data
async function loadPractices() {
  try {
    const response = await fetch('/admin/api/practices');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load practices');
    }
    
    allPractices = data.practices || [];
    filteredPractices = [...allPractices];
    renderTable();
    
  } catch (error) {
    console.error('Failed to load practices:', error);
    showError('Failed to load practices: ' + error.message);
  }
}

// Render practices table
function renderTable() {
  const tbody = document.getElementById('practicesTableBody');
  
  if (filteredPractices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <h3>No practices found</h3>
          <p>There are no practices matching your search criteria.</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filteredPractices.map(practice => {
    const assignedUser = practice.owner_email || practice.user_email;
    const hasUser = Boolean(assignedUser);
    
    return `
      <tr>
        <td>
          <div class="practice-info">
            <div class="practice-name">${escapeHtml(practice.name)}</div>
            <div class="practice-details">
              ${practice.npi ? `NPI: ${escapeHtml(practice.npi)}` : ''}
              ${practice.taxonomy ? ` • ${escapeHtml(practice.taxonomy)}` : ''}
            </div>
          </div>
        </td>
        <td>
          <div class="practice-details">
            ${practice.email ? escapeHtml(practice.email) : 'No email'}
            ${practice.phone ? `<br>${escapeHtml(practice.phone)}` : ''}
          </div>
        </td>
        <td>
          <div class="practice-details">
            ${practice.address ? escapeHtml(practice.address) : ''}
            ${practice.city || practice.state ? `<br>${[practice.city, practice.state].filter(Boolean).join(', ')}` : ''}
            ${practice.zip_code ? ` ${escapeHtml(practice.zip_code)}` : ''}
          </div>
        </td>
        <td>
          <span class="status-indicator ${hasUser ? 'assigned' : 'unassigned'}"></span>
          ${hasUser ? `<span class="user-email">${escapeHtml(assignedUser)}</span>` : 'Unassigned'}
        </td>
        <td>
          ${practice.created_at ? new Date(practice.created_at).toLocaleDateString() : 'Unknown'}
        </td>
        <td>
          <button onclick="viewOrders(${practice.id})" class="action-button">View Orders</button>
          <button onclick="editPractice(${practice.id})" class="action-button edit">Edit</button>
          <button onclick="showDeleteModal(${practice.id}, '${escapeHtml(practice.name)}')" class="action-button delete">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Filter practices based on search input
function filterPractices() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  
  if (!searchTerm) {
    filteredPractices = [...allPractices];
  } else {
    filteredPractices = allPractices.filter(practice => 
      practice.name.toLowerCase().includes(searchTerm) ||
      (practice.email && practice.email.toLowerCase().includes(searchTerm)) ||
      (practice.city && practice.city.toLowerCase().includes(searchTerm)) ||
      (practice.npi && practice.npi.includes(searchTerm)) ||
      (practice.owner_email && practice.owner_email.toLowerCase().includes(searchTerm)) ||
      (practice.user_email && practice.user_email.toLowerCase().includes(searchTerm))
    );
  }
  
  renderTable();
}

// View orders for a practice
function viewOrders(practiceId) {
  window.open(`/admin.html?practiceFilter=${practiceId}`, '_blank');
}

// Edit practice (placeholder - would open edit form)
function editPractice(practiceId) {
  showToast('Edit functionality coming soon', 'info');
  // Future: window.location.href = `/practice-form.html?edit=${practiceId}`;
}

// Show delete confirmation modal
function showDeleteModal(practiceId, practiceName) {
  deleteTargetId = practiceId;
  document.getElementById('deleteMessage').innerHTML = 
    `Are you sure you want to delete <strong>${escapeHtml(practiceName)}</strong>? This action cannot be undone and will affect any associated orders and quotes.`;
  document.getElementById('deleteModal').style.display = 'block';
}

// Close delete modal
function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('deleteModal').style.display = 'none';
}

// Confirm practice deletion
async function confirmDelete() {
  if (!deleteTargetId) return;
  
  try {
    const response = await fetch(`/admin/api/practices/${deleteTargetId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete practice');
    }
    
    showToast('Practice deleted successfully', 'success');
    closeDeleteModal();
    loadPractices(); // Reload the table
    
  } catch (error) {
    console.error('Failed to delete practice:', error);
    showToast('Failed to delete practice: ' + error.message, 'error');
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle modal clicks (close when clicking outside)
window.onclick = function(event) {
  const modal = document.getElementById('deleteModal');
  if (event.target === modal) {
    closeDeleteModal();
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  checkAuth().then(() => {
    loadPractices();
  });
  
  // Setup search input debouncing
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterPractices, 300);
  });
});