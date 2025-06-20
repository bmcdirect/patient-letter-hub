document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const uploads = ["logo", "signature", "extraPages", "recipients"];
  const uploadedPaths = {};

  for (const field of uploads) {
    const file = formData.get(field);
    if (file && file.size > 0) {
      const uploadRes = await fetch(`/api/upload/${field}`, {
        method: "POST",
        body: new FormData().append(field, file)
      });

      if (!uploadRes.ok) {
        alert(`Failed to upload ${field}`);
        return;
      }

      const uploadData = await uploadRes.json();
      uploadedPaths[`${field}Path`] = uploadData.filePath;
    }
  }

  const letterBody = formData.get("letterBody") || "<p>No content</p>";
  const templateType = formData.get("template") || "custom";
  const colorMode = formData.get("colorMode") || "bw";

  // Estimate total and valid recipients as placeholders for now
  const totalRecipients = 100;
  const validRecipients = 95;

  const orderPayload = {
    templateType,
    subject: "New Letter Order",
    bodyHtml: letterBody,
    colorMode,
    totalRecipients,
    validRecipients,
    ...uploadedPaths
  };

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });

    const result = await res.json();

    if (res.ok) {
      const jobId = result.jobId;
      window.location.href = `/confirmation.html?job_id=${jobId}`;
    } else {
      alert(`❌ Order failed: ${result.message}`);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Something went wrong submitting the order.");
  }
});
