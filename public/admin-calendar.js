let calendarData = {};
let currentDate = new Date();

document.addEventListener("DOMContentLoaded", async () => {
  await loadCalendarData();
  renderCalendar();
});

// Load calendar data from API
async function loadCalendarData() {
  try {
    const res = await fetch("/admin/api/calendar");
    const data = await res.json();

    if (data.success) {
      calendarData = data.calendar;
    } else {
      throw new Error(data.message || "Failed to load calendar data");
    }

  } catch (err) {
    console.error('Failed to load calendar data:', err);
    document.getElementById('calendar-container').innerHTML = `
      <div class="error">❌ Failed to load calendar: ${err.message}</div>
    `;
  }
}

// Render the calendar grid
function renderCalendar() {
  const container = document.getElementById('calendar-container');
  
  // Get first day of current month and calculate grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let calendarHTML = `
    <div class="calendar-header">
      <button onclick="previousMonth()" style="float: left; background: none; border: none; font-size: 1.2rem; cursor: pointer;">‹</button>
      ${monthNames[month]} ${year}
      <button onclick="nextMonth()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">›</button>
    </div>
    <div class="calendar-grid">
  `;
  
  // Add day headers
  dayNames.forEach(day => {
    calendarHTML += `<div class="day-header">${day}</div>`;
  });
  
  // Generate calendar days (6 weeks = 42 days)
  for (let i = 0; i < 42; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    
    const dateKey = currentDay.toISOString().split('T')[0];
    const isCurrentMonth = currentDay.getMonth() === month;
    const dayData = calendarData[dateKey];
    
    let cellClass = 'day-cell';
    if (!isCurrentMonth) {
      cellClass += ' other-month';
    }
    if (dayData && dayData.orderCount > 0) {
      cellClass += ' has-orders';
    }
    
    let cellContent = `<div class="day-number">${currentDay.getDate()}</div>`;
    
    if (dayData && dayData.orderCount > 0) {
      cellContent += `
        <div class="day-summary">
          <span class="order-indicator">${dayData.orderCount} orders</span>
          <span class="order-indicator">${dayData.totalRecipients} recipients</span>
          <span class="cost-indicator">$${dayData.totalCost.toFixed(2)}</span>
        </div>
      `;
    }
    
    calendarHTML += `
      <div class="${cellClass}" onclick="showDayOrders('${dateKey}', '${currentDay.toLocaleDateString()}')">
        ${cellContent}
      </div>
    `;
  }
  
  calendarHTML += '</div>';
  container.innerHTML = calendarHTML;
}

// Navigate to previous month
function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

// Navigate to next month
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// Show orders for a specific day
function showDayOrders(dateKey, formattedDate) {
  const dayData = calendarData[dateKey];
  
  if (!dayData || !dayData.orders || dayData.orders.length === 0) {
    return; // No orders for this day
  }
  
  const modal = document.getElementById('order-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  modalTitle.textContent = `Orders for ${formattedDate}`;
  
  let ordersHTML = `
    <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f8ff; border-radius: 4px;">
      <strong>Summary:</strong> ${dayData.orderCount} orders, ${dayData.totalRecipients} recipients, $${dayData.totalCost.toFixed(2)} total cost
    </div>
    <ul class="order-list">
  `;
  
  dayData.orders.forEach(order => {
    ordersHTML += `
      <li class="order-item">
        <h4>Order #${order.id}: ${order.subject || 'N/A'}</h4>
        <div class="order-details">
          <span class="status-tag ${order.status}">${order.status}</span>
          <span style="margin-left: 1rem;">Recipients: ${order.recipients || 0}</span>
          <span style="margin-left: 1rem;">Cost: $${(order.cost || 0).toFixed(2)}</span>
        </div>
        <div style="margin-top: 0.5rem;">
          <a href="/confirmation.html?jobId=${order.id}" target="_blank" style="color: #007bff; text-decoration: none;">View Details</a>
          |
          <a href="/api/orders/${order.id}/pdf" target="_blank" style="color: #007bff; text-decoration: none;">View PDF</a>
        </div>
      </li>
    `;
  });
  
  ordersHTML += '</ul>';
  modalBody.innerHTML = ordersHTML;
  modal.style.display = 'block';
}

// Close modal
function closeModal() {
  document.getElementById('order-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('order-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}