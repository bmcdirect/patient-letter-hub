document.addEventListener("DOMContentLoaded", async () => {
  const table = document.getElementById("mailings-table");

  try {
    const response = await fetch("/api/orders", {
      headers: { Accept: "application/json" }
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error("Non-JSON response from server");
    }

    if (!response.ok) {
      throw new Error("Failed to load recent orders.");
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to load orders");
    }

    const orders = data.orders || [];

    if (orders.length === 0) {
      table.innerHTML = `<tr><td colspan="5">No mailings found.</td></tr>`;
      return;
    }

    // Clear placeholder
    table.innerHTML = "";

    for (const order of orders) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${order.jobId}</td>
        <td>${order.subject}</td>
        <td>${order.status}</td>
        <td>${new Date(order.createdAt).toLocaleString()}</td>
        <td>
          <button class="action-button" onclick="viewPDF(${order.jobId})">View PDF</button>
          <button class="action-button" onclick="duplicateJob(${order.jobId})">Duplicate</button>
        </td>
      `;

      table.appendChild(row);
    }
  } catch (err) {
    console.error("Error loading orders:", err);
    table.innerHTML = `<tr><td colspan="5">Error loading data: ${err.message}</td></tr>`;
  }
});

function duplicateJob(originalJobId) {
  alert(`TODO: Duplicate logic for job #${originalJobId}`);
}

function viewPDF(jobId) {
  window.open(`/api/orders/${jobId}/pdf`, "_blank");
}

function startNewJob(templateType) {
  window.location.href = `/order.html?template=${encodeURIComponent(templateType)}`;
}
