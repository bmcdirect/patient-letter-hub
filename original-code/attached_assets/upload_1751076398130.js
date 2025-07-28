document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const quoteId = new URLSearchParams(window.location.search).get("quote_id");
  document.getElementById("quoteIdField").value = quoteId;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const res = await fetch("/api/orders", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (data.job_id) {
      alert("✅ Job submitted successfully!");
      window.location.href = "/";
    } else {
      alert("⚠️ Job submission failed. Please try again.");
    }
  });
});
