/* ===== DIRECTORIO BTC - donation-ui.js ===== */

function getTextContent(id) {
  const element = document.getElementById(id);
  return element ? element.textContent.trim() : "";
}

function getDonationValues() {
  const bolt12Offer = getTextContent("bolt12-offer-value");
  const onchainAddress = getTextContent("onchain-address-value");
  const nostrNip05 = getTextContent("nostr-nip05-value");

  return {
    bolt12Offer,
    bolt12Uri: bolt12Offer ? `bitcoin:?lno=${bolt12Offer}` : "",
    onchainAddress,
    nostrNip05
  };
}

function renderQrFallback(container, message) {
  container.innerHTML = `<p class="donation-qr-fallback">${message}</p>`;
  container.dataset.qrReady = "false";
}

function resolveDonationValue(name, values) {
  if (!name) return "";

  const normalizedName = name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  return values?.[name] || values?.[normalizedName] || "";
}

function initDonationBindings(values) {
  const openLink = document.getElementById("bolt12-open-link");
  if (openLink) {
    if (values.bolt12Uri) {
      openLink.href = values.bolt12Uri;
      openLink.removeAttribute("aria-disabled");
      openLink.classList.remove("is-disabled");
    } else {
      openLink.href = "#";
      openLink.setAttribute("aria-disabled", "true");
      openLink.classList.add("is-disabled");
    }
  }
}

function initDonationQrs(values) {
  document.querySelectorAll(".donation-qr[data-qr-source]").forEach(container => {
    if (container.dataset.qrReady === "true") return;

    const primaryValue = resolveDonationValue(container.dataset.qrSource, values);
    const fallbackValue = resolveDonationValue(container.dataset.qrFallbackSource, values);
    const candidates = [primaryValue, fallbackValue].filter(Boolean);
    const size = Number.parseInt(container.dataset.qrSize || "192", 10);

    container.innerHTML = "";

    if (typeof QRCode === "undefined") {
      renderQrFallback(container, "No se pudo cargar el generador de QR. Copia la oferta y pegala en tu wallet.");
      return;
    }

    let rendered = false;

    for (const value of candidates) {
      try {
        new QRCode(container, {
          text: value,
          width: size,
          height: size,
          colorDark: "#111315",
          colorLight: "#f6f7f9",
          correctLevel: QRCode.CorrectLevel.L
        });
        container.dataset.qrReady = "true";
        container.dataset.qrValue = value;
        rendered = true;
        break;
      } catch {
        container.innerHTML = "";
      }
    }

    if (!rendered) {
      renderQrFallback(container, "No hemos podido renderizar este QR en tu navegador. Usa los botones de copiar.");
    }
  });
}

async function copyText(text) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }

    return copied;
  }
}

function resolveCopyValue(button, values) {
  if (button.dataset.copy) return button.dataset.copy;

  const targetId = button.dataset.copyTarget;
  if (targetId) return getTextContent(targetId);

  const generatedKey = button.dataset.copyGenerated;
  if (generatedKey) return resolveDonationValue(generatedKey, values);

  return "";
}

function setCopiedState(button) {
  const original = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = original;
  button.textContent = "Copiado";
  button.classList.add("copied");

  window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove("copied");
  }, 1800);
}

function initCopyButtons(values) {
  document.querySelectorAll(".btn-copy").forEach(button => {
    if (button.tagName === "A") return;

    button.addEventListener("click", async () => {
      const text = resolveCopyValue(button, values);
      if (!text) return;

      const copied = await copyText(text);
      if (copied) setCopiedState(button);
    });
  });
}

function initThanksBanner() {
  const params = new URLSearchParams(window.location?.search || "");
  if (params.get("from") !== "submit") return;

  const thanks = document.getElementById("donate-thanks");
  if (!thanks) return;

  const project = params.get("project");
  const issue = params.get("issue");
  const title = document.createElement("h2");
  const text = document.createElement("p");

  title.textContent = "Gracias por contribuir";

  if (project && issue) {
    text.textContent = `Tu proyecto "${project}" ya se ha enviado para revision como issue #${issue}. Si te apetece apoyar el directorio, puedes dejar unos sats aqui.`;
  } else if (project) {
    text.textContent = `Tu proyecto "${project}" ya se ha enviado para revision. Si te apetece apoyar el directorio, puedes dejar unos sats aqui.`;
  } else {
    text.textContent = "Tu proyecto ya se ha enviado para revision. Si te apetece apoyar el directorio, puedes dejar unos sats aqui.";
  }

  thanks.append(title, text);
  thanks.classList.remove("hidden");
  if (window.history?.replaceState) {
    window.history.replaceState({}, document.title, "donar.html");
  }
}

function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  if (!hamburger || !menu) return;

  hamburger.addEventListener("click", () => {
    menu.classList.toggle("open");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const values = getDonationValues();
  initHamburger();
  initDonationBindings(values);
  initDonationQrs(values);
  initCopyButtons(values);
  initThanksBanner();
});
