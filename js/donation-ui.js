/* ===== DIRECTORIO BTC - donation-ui.js ===== */

function initDonationQrs() {
  if (typeof QRCode === "undefined") return;

  document.querySelectorAll(".donation-qr[data-qr-value]").forEach(container => {
    if (container.dataset.qrReady === "true") return;

    const value = container.dataset.qrValue?.trim();
    if (!value) return;

    const size = Number.parseInt(container.dataset.qrSize || "192", 10);
    container.innerHTML = "";

    new QRCode(container, {
      text: value,
      width: size,
      height: size,
      colorDark: "#121417",
      colorLight: "#f6f7f9",
      correctLevel: QRCode.CorrectLevel.M
    });

    container.dataset.qrReady = "true";
  });
}

document.addEventListener("DOMContentLoaded", initDonationQrs);
