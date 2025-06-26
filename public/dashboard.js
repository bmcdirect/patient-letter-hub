document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard loading...");
  const table = document.getElementById("mailings-table");

  try {
    // First check authentication
    const authResponse = await fetch("/api/auth/user", {
      headers: { Accept: "application/json" },
      credentials: 'include'
    });

    console.log("Auth check status:", authResponse.status);

    if (!authResponse.ok) {
      console.log("Not authenticated, redirecting to login");
      window.location.href = '/login.html';
      return;
    }

    const authData = await authResponse.json();
    console.log("User authenticated:", authData.user?.email);

    // Now fetch orders
    console.log("Fetching orders...");
    const response = await fetch("/api/orders", {
      headers: { Accept: "application/json" },
      credentials: 'include'
    });

    console.log("Orders response status:", response.status);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error("Non-JSON response:", await response.text());
      throw new Error("Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load orders`);
    }

    const data = await response.json();
    console.log("Orders data received:", data);
    
    if (!data.success) {
      throw new Error(data.message || "API returned failure status");
    }

    const orders = data.orders || [];
    console.log(`Found ${orders.length} orders`);

    if (orders.length === 0) {
      table.innerHTML = `<tr><td colspan="6">No mailings found.</td></tr>`;
      return;
    }

    // Clear placeholder
    table.innerHTML = "";

    for (const order of orders) {
      const row = document.createElement("tr");

      // Add status styling
      let statusClass = '';
      switch(order.status) {
        case 'Pending Approval': statusClass = 'status-pending'; break;
        case 'In Process': statusClass = 'status-processing'; break;
        case 'Fulfilled': statusClass = 'status-fulfilled'; break;
        default: statusClass = 'status-default';
      }

      row.innerHTML = `
        <td>${order.order_number || order.id}</td>
        <td>${order.subject}</td>
        <td><span class="status-tag ${statusClass}">${order.status}</span></td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>$${order.cost.toFixed(2)}</td>
        <td>
          <button class="action-button" onclick="viewPDF(${order.jobId})">View PDF</button>
          <button class="action-button" onclick="duplicateJob(${order.jobId})">Duplicate</button>
          ${order.status === 'Fulfilled' ? '<button class="action-button" onclick="viewInvoice(' + order.jobId + ')">Invoice</button>' : ''}
        </td>
      `;

      table.appendChild(row);
    }

    console.log("Dashboard loaded successfully");
  } catch (err) {
    console.error("Error loading dashboard:", err);
    table.innerHTML = `<tr><td colspan="6">Error loading data: ${err.message}</td></tr>`;
  }
});

function duplicateJob(originalJobId) {
  alert(`TODO: Duplicate logic for job #${originalJobId}`);
}

function viewPDF(jobId) {
  window.open(`/api/orders/${jobId}/pdf`, "_blank");
}

function viewInvoice(jobId) {
  window.open(`/invoice.html?jobId=${jobId}`, '_blank');
}

function startNewJob(templateType) {
  window.location.href = `/order.html?template=${encodeURIComponent(templateType)}`;
}

// Load quotes data for the quotes section
async function loadQuotes() {
  try {
    console.log("Loading quotes...");
    const response = await fetch("/api/quotes", {
      headers: { Accept: "application/json" },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load quotes`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to load quotes");
    }

    const quotesTable = document.getElementById("quotes-table");
    const quotes = data.quotes || [];

    if (quotes.length === 0) {
      quotesTable.innerHTML = '<tr><td colspan="8">No quotes found.</td></tr>';
      return;
    }

    quotesTable.innerHTML = "";

    for (const quote of quotes) {
      const row = document.createElement("tr");
      const isConverted = quote.status === 'Converted';
      
      row.innerHTML = `
        <td>${quote.id}</td>
        <td>${quote.subject}</td>
        <td>${quote.practiceLocation}</td>
        <td>${quote.templateType}</td>
        <td>${quote.estimatedRecipients}</td>
        <td>$${quote.totalCost.toFixed(2)}</td>
        <td><span class="status-tag ${isConverted ? 'status-converted' : 'status-quote'}">${quote.status}</span></td>
        <td>
          ${isConverted 
            ? `<button class="action-button" onclick="window.open('/confirmation.html?jobId=${quote.convertedOrderId}', '_blank')">View Order</button>`
            : `<button class="action-button" onclick="convertQuote('${quote.id}')">Convert to Order</button>
               <button class="action-button" onclick="editQuote('${quote.id}')">Edit</button>`
          }
          <button class="action-button" onclick="deleteQuote('${quote.id}')" style="background: #dc2626;">Delete</button>
        </td>
      `;
      quotesTable.appendChild(row);
    }

    console.log(`Loaded ${quotes.length} quotes`);
  } catch (err) {
    console.error("Error loading quotes:", err);
    const quotesTable = document.getElementById("quotes-table");
    quotesTable.innerHTML = `<tr><td colspan="8">Error loading quotes: ${err.message}</td></tr>`;
  }
}

function convertQuote(quoteId) {
  if (confirm(`Convert quote ${quoteId} to an order?`)) {
    fetch(`/api/quotes/${quoteId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(`Quote converted successfully! Order ID: ${data.orderId}`);
        location.reload(); // Refresh to show updated data
      } else {
        alert(`Error: ${data.message}`);
      }
    })
    .catch(err => {
      console.error('Conversion error:', err);
      alert('Failed to convert quote');
    });
  }
}

function editQuote(quoteId) {
  window.location.href = `/quote.html?editId=${quoteId}`;
}

function deleteQuote(quoteId) {
  if (confirm(`Are you sure you want to delete quote ${quoteId}? This action cannot be undone.`)) {
    // First, save the quote to localStorage before deleting
    saveQuoteToDeletedArchive(quoteId);
    
    fetch(`/api/quotes/${quoteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(`Quote ${quoteId} deleted successfully!`);
        location.reload(); // Refresh to update the quotes list
      } else {
        alert(`Error deleting quote: ${data.message}`);
      }
    })
    .catch(err => {
      console.error('Delete error:', err);
      alert('Failed to delete quote. Please try again.');
    });
  }
}

function saveQuoteToDeletedArchive(quoteId) {
  // Find the quote in the current data and save it to localStorage before deletion
  const quotesTableBody = document.getElementById("quotesTableBody");
  const rows = quotesTableBody.querySelectorAll('tr');
  
  for (let row of rows) {
    const firstCell = row.querySelector('td');
    if (firstCell && firstCell.textContent === quoteId) {
      const cells = row.querySelectorAll('td');
      const quoteData = {
        id: cells[0].textContent,
        subject: cells[1].textContent,
        practiceLocation: cells[2].textContent,
        templateType: cells[3].textContent,
        estimatedRecipients: cells[4].textContent,
        totalCost: cells[5].textContent,
        status: 'Deleted',
        deletedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      let deletedQuotes = JSON.parse(localStorage.getItem('deletedQuotes') || '[]');
      deletedQuotes.push(quoteData);
      localStorage.setItem('deletedQuotes', JSON.stringify(deletedQuotes));
      break;
    }
  }
}

function loadDeletedQuotesFromStorage() {
  const deletedQuotes = JSON.parse(localStorage.getItem('deletedQuotes') || '[]');
  const archiveTableBody = document.getElementById("archiveTableBody");
  
  for (const quote of deletedQuotes) {
    const row = document.createElement("tr");
    
    row.innerHTML = `
      <td>${quote.id}</td>
      <td>${quote.subject}</td>
      <td>${quote.practiceLocation}</td>
      <td>${quote.templateType}</td>
      <td>${quote.estimatedRecipients}</td>
      <td>${quote.totalCost}</td>
      <td><span class="status-tag" style="background: #ef4444;">Deleted</span></td>
      <td>-</td>
    `;
    
    archiveTableBody.appendChild(row);
  }
}

// Toggle archive visibility
function setupArchiveToggle() {
  const toggleButton = document.getElementById('toggleArchive');
  const archiveContainer = document.getElementById('archiveTableContainer');
  
  if (toggleButton && archiveContainer) {
    toggleButton.addEventListener('click', function() {
      if (archiveContainer.style.display === 'none') {
        archiveContainer.style.display = 'block';
        toggleButton.textContent = 'Hide Archive';
      } else {
        archiveContainer.style.display = 'none';
        toggleButton.textContent = 'Show Archive';
      }
    });
  }
}

// Setup on page load
document.addEventListener('DOMContentLoaded', function() {
  setupArchiveToggle();
});

// Load quotes when dashboard loads
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(loadQuotes, 500); // Load after orders
});
