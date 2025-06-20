document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("orderForm");

  // If template type is provided in the URL, pre-fill the dropdown
  const params = new URLSearchParams(window.location.search);
  const templateFromUrl = params.get("template");
  if (templateFromUrl) {
    const templateSelect = document.querySelector('[name="template"]');
    if (templateSelect) {
      templateSelect.value = templateFromUrl;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData,
        credentials: "include" // Include session cookies for authentication
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (confirm("You need to sign in to process orders. Would you like to sign in now?")) {
          window.location.href = "/api/auth/login";
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        alert("Error: " + errorData.message);
        return;
      }

      const result = await response.json();
      alert("Order submitted successfully! Job ID: " + result.jobId);
      window.location.href = `/confirmation.html?jobId=${result.jobId}`;

    } catch (err) {
      console.error("Submission failed", err);
      alert("Something went wrong. Please try again.");
    }
  });
});
