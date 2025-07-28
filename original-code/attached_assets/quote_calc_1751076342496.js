document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quoteForm");
  const totalDisplay = document.getElementById("estimateTotal");

  const pricing = {
    base: 1.25,
    enclosure: 0.25,
    colorLetter: 0.09,
    colorEnvelope: 0.10,
    ncoa: 45,
    deliveryConfirm: 0.50,
    postage: {
      meter: 0.69,
      certified: 5.60,
      bulk: 0.45
    }
  };

  function calculateTotal() {
    const count = parseInt(form.recipientCount.value) || 0;
    let total = 0;

    if (count > 0) {
      total += count * pricing.base;

      if (form.enclosure.value === "yes") total += count * pricing.enclosure;
      if (form.letterColor.value === "color") total += count * pricing.colorLetter;
      if (form.envelopeColor.value === "color") total += count * pricing.colorEnvelope;
      if (form.confirmation.checked) total += count * pricing.deliveryConfirm;

      const rate = form.postageRate.value;
      total += count * pricing.postage[rate];

      if (form.ncoa.checked) total += pricing.ncoa;
    }

    totalDisplay.textContent = `Estimated Total: $${total.toFixed(2)}`;
    return total;
  }

  form.addEventListener("input", calculateTotal);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const total = calculateTotal();

    const formData = new FormData(form);
    formData.append("quote_total", total);

    const res = await fetch("/api/quotes", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (data.quote_id) {
      alert("✅ Estimate created!");
      window.location.href = `/upload.html?quote_id=${data.quote_id}`;
    } else {
      alert("⚠️ Error creating quote.");
    }
  });
});
