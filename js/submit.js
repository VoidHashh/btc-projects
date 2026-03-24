/* ===== DIRECTORIO BTC - submit.js ===== */

const REPO = "VoidHashh/btc-projects";
const DEFAULT_BUTTON_LABEL = "Abrir en GitHub →";
const DEFAULT_NOTE = "Se abrirá GitHub en una nueva pestaña con el issue listo. Después se generará una PR para revisión.";

function buildIssuePayload(data) {
  const title = `[Nuevo proyecto] ${data.name}`;
  const body =
`## Datos del proyecto

- **Nombre:** ${data.name}
- **URL:** ${data.url}
- **Descripción:** ${data.description}
- **Categoría:** ${data.category}
- **GitHub:** ${data.github || "N/A"}
- **Autor:** ${data.author || "N/A"}
- **Gratuito:** ${data.free ? "Sí" : "No"}
- **Open Source:** ${data.openSource ? "Sí" : "No"}
- **Idioma:** ${data.language}
- **Método de envío:** Formulario web
`;

  return { title, body };
}

function buildGitHubIssueURL(data) {
  const { title, body } = buildIssuePayload(data);
  const params = new URLSearchParams({
    title,
    body,
    labels: "nuevo-proyecto"
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

function openGitHubIssue(data) {
  const issueURL = buildGitHubIssueURL(data);
  const popup = window.open(issueURL, "_blank");

  if (!popup) {
    return false;
  }

  try {
    popup.opener = null;
  } catch {}

  return true;
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
    if (!valid) return;

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.textContent = "Abriendo GitHub...";
    submitBtn.disabled = true;

    const payload = {
      name,
      url,
      description: desc,
      category: cat,
      github,
      author,
      free,
      openSource: oss,
      language: lang
    };

    const opened = openGitHubIssue(payload);
    if (!opened) {
      submitBtn.disabled = false;
      submitBtn.textContent = DEFAULT_BUTTON_LABEL;
      setFormNote("Tu navegador ha bloqueado la nueva pestaña. Permite pop-ups para GitHub y vuelve a intentarlo.", "error");
      return;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = DEFAULT_BUTTON_LABEL;
    setFormNote("GitHub ya está abierto en una nueva pestaña. Cuando publiques el issue, se generará una PR para revisión.");
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
