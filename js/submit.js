/* ===== DIRECTORIO BTC - submit.js ===== */

const SUBMIT_API_URL =
  window.DIRECTORIO_CONFIG?.submitApiUrl?.trim() || "/api/submit-project";
const DEFAULT_BUTTON_LABEL = "Enviar proyecto →";
const DEFAULT_NOTE = "Enviaremos tu propuesta desde este formulario y se generará una PR para revisión.";
const DONATION_REDIRECT_PATH = "donar.html";
const MAX_CATEGORIES = 3;

async function submitProject(data) {
  const res = await fetch(SUBMIT_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
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

function normalizeUrlInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[^\s/]+\.[^\s]+/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isValidURL(str) {
  try {
    const parsed = new URL(normalizeUrlInput(str));
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

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
  document.querySelectorAll("input, textarea, select, .category-picker").forEach(el => {
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

function initHamburger() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

function getSelectedCategories() {
  return Array.from(document.querySelectorAll('input[name="proj-categories"]:checked'))
    .map(input => input.value);
}

function initUrlNormalization() {
  ["proj-url", "proj-github", "proj-x", "proj-nostr"].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.addEventListener("blur", () => {
      const normalized = normalizeUrlInput(field.value);
      if (normalized) {
        field.value = normalized;
      }
    });
  });
}

function initCategoryLimit() {
  document.querySelectorAll('input[name="proj-categories"]').forEach(input => {
    input.addEventListener("change", () => {
      const categories = getSelectedCategories();
      if (categories.length <= MAX_CATEGORIES) return;

      input.checked = false;
      setFormNote(`Puedes elegir como máximo ${MAX_CATEGORIES} categorías.`, "error");
    });
  });
}

function buildDonationRedirectUrl(projectName, issueNumber) {
  const params = new URLSearchParams({
    from: "submit",
    project: projectName
  });

  if (issueNumber) {
    params.set("issue", String(issueNumber));
  }

  return `${DONATION_REDIRECT_PATH}?${params.toString()}`;
}

function initForm() {
  const form = document.getElementById("submit-form");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();
    setFormNote(DEFAULT_NOTE);

    const name = document.getElementById("proj-name").value.trim();
    const urlField = document.getElementById("proj-url");
    const githubField = document.getElementById("proj-github");
    const xField = document.getElementById("proj-x");
    const nostrField = document.getElementById("proj-nostr");
    const url = normalizeUrlInput(urlField.value);
    const desc = document.getElementById("proj-desc").value.trim();
    const categories = getSelectedCategories();
    const github = normalizeUrlInput(githubField.value);
    const author = document.getElementById("proj-author").value.trim();
    const x = normalizeUrlInput(xField.value);
    const nostr = normalizeUrlInput(nostrField.value);
    const lang = document.getElementById("proj-lang").value;
    const free = document.getElementById("proj-free").checked;
    const oss = document.getElementById("proj-oss").checked;

    urlField.value = url;
    githubField.value = github;
    xField.value = x;
    nostrField.value = nostr;

    let valid = true;
    if (!name) {
      showError("proj-name", "El nombre es obligatorio.");
      valid = false;
    }
    if (!url) {
      showError("proj-url", "La URL es obligatoria.");
      valid = false;
    } else if (!isValidURL(url)) {
      showError("proj-url", "Introduce una URL válida.");
      valid = false;
    }
    if (!desc) {
      showError("proj-desc", "La descripción es obligatoria.");
      valid = false;
    }
    if (categories.length === 0) {
      showError("proj-cats", "Selecciona al menos una categoría.");
      valid = false;
    } else if (categories.length > MAX_CATEGORIES) {
      showError("proj-cats", `Puedes elegir como máximo ${MAX_CATEGORIES} categorías.`);
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
        categories,
        github,
        author,
        x,
        nostr,
        free,
        openSource: oss,
        language: lang
      };

      const result = await submitProject(payload);
      submitBtn.textContent = "Redirigiendo...";
      window.location.href = buildDonationRedirectUrl(name, result.issueNumber);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = DEFAULT_BUTTON_LABEL;

      if (/404|failed to fetch|networkerror/i.test(err.message)) {
        setFormNote("El servicio de envío todavía no está activo en este despliegue.", "error");
        return;
      }

      setFormNote(`Error al enviar: ${err.message}. Inténtalo de nuevo.`, "error");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initForm();
  setFormNote(DEFAULT_NOTE);
  initCharCounter();
  initHamburger();
  initUrlNormalization();
  initCategoryLimit();
});
