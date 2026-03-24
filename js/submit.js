/* ===== DIRECTORIO BTC - submit.js ===== */

const SUBMIT_API_URL =
  window.DIRECTORIO_CONFIG?.submitApiUrl?.trim() || "/api/submit-project";
const DEFAULT_BUTTON_LABEL = "Enviar proyecto →";
const DEFAULT_NOTE = "Enviaremos tu propuesta desde este formulario y se generará una PR para revisión.";
const RETURN_HOME_DELAY_MS = 2200;

let returnHomeTimer = null;

async function submitProject(data) {
  const res = await fetch(SUBMIT_API_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.error || payload.message || `Error ${res.status}`);
  }

  return payload;
}

/* ===== VALIDATE URL ===== */
function isValidURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/* ===== SHOW ERROR ===== */
function showError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.style.borderColor = "#ef4444";
  const existing = field.parentNode.querySelector(".field-error");
  if (!existing) {
    const err = document.createElement("span");
    err.className = "field-error";
    err.style.cssText = "font-size:12px;color:#ef4444;display:block;margin-top:4px;";
    err.textContent = msg;
    field.parentNode.appendChild(err);
  }
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(e => e.remove());
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.style.borderColor = "";
  });
}

function setFormNote(message, variant = "default") {
  const note = document.getElementById("form-note");
  if (!note) return;

  if (variant === "error") {
    note.textContent = `Error: ${message}`;
    note.style.background = "rgba(239,68,68,0.1)";
    note.style.borderColor = "rgba(239,68,68,0.3)";
    return;
  }

  note.textContent = `ℹ️ ${message}`;
  note.style.background = "rgba(247,147,26,0.1)";
  note.style.borderColor = "rgba(247,147,26,0.2)";
}

/* ===== COPY TO CLIPBOARD ===== */
function initCopyButtons() {
  document.querySelectorAll(".btn-copy[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      const original = btn.textContent;
      btn.textContent = "¡Copiado!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 2000);
    });
  });
}

/* ===== MODAL ===== */
function openModal() {
  const modal = document.getElementById("donate-modal");
  if (modal) {
    modal.classList.add("open");
    document.getElementById("modal-close")?.focus();
  }
}

function closeModal() {
  document.getElementById("donate-modal")?.classList.remove("open");
}

function scheduleReturnHome() {
  window.clearTimeout(returnHomeTimer);
  returnHomeTimer = window.setTimeout(() => {
    window.location.href = "index.html";
  }, RETURN_HOME_DELAY_MS);
}

/* ===== CHAR COUNTER ===== */
function initCharCounter() {
  const desc = document.getElementById("proj-desc");
  const counter = document.getElementById("desc-count");
  if (!desc || !counter) return;

  desc.addEventListener("input", () => {
    const len = desc.value.length;
    counter.textContent = `${len} / 300`;
    counter.classList.toggle("warn", len > 260);
  });
}

/* ===== HAMBURGER ===== */
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

/* ===== FORM SUBMIT ===== */
function initForm() {
  const form = document.getElementById("submit-form");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();
    setFormNote(DEFAULT_NOTE);

    const name = document.getElementById("proj-name").value.trim();
    const url = document.getElementById("proj-url").value.trim();
    const desc = document.getElementById("proj-desc").value.trim();
    const cat = document.getElementById("proj-cat").value;
    const github = document.getElementById("proj-github").value.trim();
    const author = document.getElementById("proj-author").value.trim();
    const x = document.getElementById("proj-x").value.trim();
    const nostr = document.getElementById("proj-nostr").value.trim();
    const lang = document.getElementById("proj-lang").value;
    const free = document.getElementById("proj-free").checked;
    const oss = document.getElementById("proj-oss").checked;

    let valid = true;
    if (!name) {
      showError("proj-name", "El nombre es obligatorio.");
      valid = false;
    }
    if (!url) {
      showError("proj-url", "La URL es obligatoria.");
      valid = false;
    } else if (!isValidURL(url)) {
      showError("proj-url", "Introduce una URL válida (con https://).");
      valid = false;
    }
    if (!desc) {
      showError("proj-desc", "La descripción es obligatoria.");
      valid = false;
    }
    if (!cat) {
      showError("proj-cat", "Selecciona una categoría.");
      valid = false;
    }
    if (github && !isValidURL(github)) {
      showError("proj-github", "Introduce una URL de GitHub válida.");
      valid = false;
    }
    if (x && !isValidURL(x)) {
      showError("proj-x", "Introduce una URL de X válida.");
      valid = false;
    }
    if (nostr && !isValidURL(nostr)) {
      showError("proj-nostr", "Introduce una URL de Nostr válida.");
      valid = false;
    }
    if (!valid) return;

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.textContent = "Enviando...";
    submitBtn.disabled = true;

    try {
      const payload = {
        name,
        url,
        description: desc,
        category: cat,
        github,
        author,
        x,
        nostr,
        free,
        openSource: oss,
        language: lang
      };

      await submitProject(payload);
      form.reset();
      document.getElementById("desc-count").textContent = "0 / 300";
      document.getElementById("desc-count").classList.remove("warn");
      submitBtn.textContent = "¡Enviado! ✓";
      setFormNote("Proyecto enviado. Prepararemos una PR para revisión antes de publicarlo. Volviendo al inicio...");

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = DEFAULT_BUTTON_LABEL;
        setFormNote(DEFAULT_NOTE);
      }, 1200);

      setTimeout(openModal, 300);
      scheduleReturnHome();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = DEFAULT_BUTTON_LABEL;

      if (/404|failed to fetch|networkerror/i.test(err.message)) {
        setFormNote("El servicio de envío todavía no está activo en este despliegue.", "error");
        return;
      }

      setFormNote("Error al enviar: " + err.message + ". Inténtalo de nuevo.", "error");
    }
  });
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  initForm();
  setFormNote(DEFAULT_NOTE);
  initCharCounter();
  initCopyButtons();
  initHamburger();

  document.getElementById("modal-close")?.addEventListener("click", closeModal);
  document.getElementById("donate-modal")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
});
