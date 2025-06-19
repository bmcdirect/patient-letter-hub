document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("job_id");

  if (!jobId) {
    document.body.innerHTML = "<h2>Error: Missing job ID</h2>";
    return;
  }

  document.getElementById("job-id").textContent = jobId;

  try {
    const response = await fetch(`/api/letter-jobs/${jobId}`);
    if (!response.ok) throw new Error("Failed to load job details");
    const job = await response.json();

    document.getElementById("submitted-at").textContent = new Date(job.createdAt).toLocaleString();

    const fileList = document.getElementById("file-list");
    const uploadedFiles = job.files || [];

    if (uploadedFiles.length === 0) {
      fileList.innerHTML = "<li>No files recorded for this job</li>";
    } else {
      uploadedFiles.forEach(file => {
        const li = document.createElement("li");
        li.textContent = file;
        fileList.appendChild(li);
      });
    }

    // Placeholder for pricing logic
    document.getElementById("cost-summary").innerHTML += `<p>Total pages: ${job.totalPages || "?"}</p>`;
  } catch (err) {
    console.error("Error fetching job:", err);
    document.body.innerHTML = "<h2>Failed to load job details</h2>";
  }
});
