document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("orders");

  try {
    const res = await fetch("/api/orders");
    const data = await res.json();

    if (!data.success || !Array.isArray(data.orders)) {
      throw new Error("Invalid data format");
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
        ${data.orders.map(order => `
          <tr>
            <td>${order.jobId}</td>
            <td>${order.subject || "N/A"}</td>
            <td><span class="tag ${order.status}">${order.status}</span></td>
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

  } catch (err) {
    container.innerHTML = `<p style="color:red">❌ Failed to load orders: ${err.message}</p>`;
  }
});