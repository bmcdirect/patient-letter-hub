document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("mailings-table");

  try {
    // Hardcoded for now
    const practiceId = 1;

    const res = await fetch(`/api/practices/${practiceId}/letter-jobs`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch jobs");

    const jobs = await res.json();

    if (jobs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5">No mailings found.</td></tr>`;
      return;
    }

    const rows = jobs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(job => `
        <tr>
          <td>${job.id}</td>
          <td>${job.subject || '(no subject)'}</td>
          <td>${job.status}</td>
          <td>${new Date(job.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="action-button" onclick="window.location.href='/confirmation.html?job_id=${job.id}'">View</button>
            <button class="action-button" onclick="duplicateJob(${job.id})">Duplicate</button>
          </td>
        </tr>
      `).join("");

    tableBody.innerHTML = rows;
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="5">❌ ${err.message}</td></tr>`;
  }
});

async function duplicateJob(originalJobId) {
  alert(`TODO: Duplicate logic for job #${originalJobId}`);
}
function startNewJob(templateType) {
  // Redirect to the order form with the selected template type pre-filled (if applicable)
  window.location.href = `/order.html?template=${encodeURIComponent(templateType)}`;
}