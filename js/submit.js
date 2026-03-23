/* ===== DIRECTORIO BTC — submit.js ===== */

const REPO = "VoidHashh/btc-projects";

/* ===== GENERATE GITHUB ISSUE URL ===== */
function generateIssueURL(data) {
  const title = encodeURIComponent(`[Nuevo proyecto] ${data.name}`);
  const body = encodeURIComponent(
`## Datos del proyecto

- **Nombre:** ${data.name}
- **URL:** ${data.url}
- **Descripción:** ${data.description}
- **Categoría:** ${data.category}
- **GitHub:** ${data.github || 'N/A'}
- **Autor:** ${data.author || 'N/A'}
- **Gratuito:** ${data.free ? 'Sí' : 'No'}
- **Open Source:** ${data.openSource ? 'Sí' : 'No'}
- **Idioma:** ${data.language}
`);
  return `https://github.com/${REPO}/issues/new?title=${title}&body=${body}&labels=nuevo-proyecto`;
}

/* ===== VALIDATE URL ===== */
function isValidURL(str) {
  try { new URL(str); return true; } catch { return false; }
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

/* ===== COPY TO CLIPBOARD ===== */
function initCopyButtons() {
  document.querySelectorAll(".btn-copy[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback
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

  form.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById("proj-name").value.trim();
    const url = document.getElementById("proj-url").value.trim();
    const desc = document.getElementById("proj-desc").value.trim();
    const cat = document.getElementById("proj-cat").value;
    const github = document.getElementById("proj-github").value.trim();
    const author = document.getElementById("proj-author").value.trim();
    const lang = document.getElementById("proj-lang").value;
    const free = document.getElementById("proj-free").checked;
    const oss = document.getElementById("proj-oss").checked;

    let valid = true;

    if (!name) { showError("proj-name", "El nombre es obligatorio."); valid = false; }
    if (!url) { showError("proj-url", "La URL es obligatoria."); valid = false; }
    else if (!isValidURL(url)) { showError("proj-url", "Introduce una URL válida (con https://)."); valid = false; }
    if (!desc) { showError("proj-desc", "La descripción es obligatoria."); valid = false; }
    if (!cat) { showError("proj-cat", "Selecciona una categoría."); valid = false; }
    if (github && !isValidURL(github)) { showError("proj-github", "Introduce una URL de GitHub válida."); valid = false; }

    if (!valid) return;

    const issueURL = generateIssueURL({ name, url, description: desc, category: cat, github, author, free, openSource: oss, language: lang });
    window.open(issueURL, "_blank", "noopener");

    // Show donate modal after short delay
    setTimeout(openModal, 400);
  });
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  initForm();
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
