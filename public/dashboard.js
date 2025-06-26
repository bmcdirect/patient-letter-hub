document.addEventListener("DOMContentLoaded", async () => {
  await verifyAuth();
  await loadOrders();
  await loadQuotes();
  setupArchiveToggle();
});

async function verifyAuth() {
  const res = await fetch("/api/auth/user", { credentials: "include" });
  if (!res.ok) {
    window.location.href = "/login.html";
  }
}

async function loadOrders() {
  const table = document.getElementById("mailings-table");
  try {
    const res = await fetch("/api/orders", { credentials: "include" });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Order load failed");

    const orders = data.orders;
    if (!orders || orders.length === 0) {
      table.innerHTML = `<tr><td colspan="6">No mailings found.</td></tr>`;
      return;
    }

    table.innerHTML = "";
    for (const order of orders) {
      const row = document.createElement("tr");
      const cost = typeof order.cost === 'number' ? order.cost.toFixed(2) : "0.00";
      const statusClass = getStatusClass(order.status);

      row.innerHTML = `
        <td>${order.order_number || order.id}</td>
        <td>${order.subject}</td>
        <td><span class="status-tag ${statusClass}">${order.status}</span></td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>$${cost}</td>
        <td>
          <button class="action-button" onclick="viewPDF('${order.id}')">View PDF</button>
        </td>
      `;
      table.appendChild(row);
    }
  } catch (err) {
    console.error("Order load error:", err);
    table.innerHTML = `<tr><td colspan="6">Error loading data: ${err.message}</td></tr>`;
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Pending Approval": return "status-pending";
    case "In Process": return "status-processing";
    case "Fulfilled": return "status-fulfilled";
    default: return "status-default";
  }
}

async function loadQuotes() {
  const table = document.getElementById("quotes-table");
  try {
    const res = await fetch("/api/quotes", { credentials: "include" });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Quote load failed");

    const quotes = data.quotes;
    if (!quotes || quotes.length === 0) {
      table.innerHTML = `<tr><td colspan="8">No quotes found.</td></tr>`;
      return;
    }

    table.innerHTML = "";
    for (const quote of quotes) {
      const isConverted = quote.status === "Converted";
      const cost = typeof quote.totalCost === 'number' ? quote.totalCost.toFixed(2) : "0.00";

      table.innerHTML += `
        <tr>
          <td>${quote.quote_number || quote.id}</td>
          <td>${quote.subject}</td>
          <td>${quote.practiceLocation || "N/A"}</td>
          <td>${quote.templateType}</td>
          <td>${quote.estimatedRecipients}</td>
          <td>$${cost}</td>
          <td><span class="status-tag ${isConverted ? "status-converted" : "status-quote"}">${quote.status}</span></td>
          <td>
            ${isConverted
              ? `<button class="action-button" onclick="viewOrder('${quote.convertedOrderId}')">View Order</button>`
              : `<button class="action-button" onclick="convertQuote('${quote.id}')">Convert</button>
                 <button class="action-button" onclick="editQuote('${quote.id}')">Edit</button>`}
          </td>
        </tr>
      `;
    }
  } catch (err) {
    console.error("Quote load error:", err);
    table.innerHTML = `<tr><td colspan="8">Error loading quotes: ${err.message}</td></tr>`;
  }
}

function convertQuote(id) {
  if (confirm("Convert this quote to an order?")) {
    fetch(`/api/quotes/${id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Quote converted!");
          window.location.reload();
        } else {
          alert(`Failed: ${data.message}`);
        }
      });
  }
}

function editQuote(id) {
  window.location.href = `/quote.html?editId=${id}`;
}

function viewPDF(id) {
  window.open(`/api/orders/${id}/pdf`, "_blank");
}

function viewOrder(id) {
  window.open(`/confirmation.html?jobId=${id}`, "_blank");
}

function setupArchiveToggle() {
  const toggleBtn = document.getElementById("toggleArchive");
  const archiveContainer = document.getElementById("archiveTableContainer");

  if (toggleBtn && archiveContainer) {
    toggleBtn.addEventListener("click", () => {
      archiveContainer.style.display =
        archiveContainer.style.display === "none" ? "block" : "none";
      toggleBtn.textContent =
        archiveContainer.style.display === "none" ? "Show Archive" : "Hide Archive";
    });
  }
}
