/* ===== DIRECTORIO BTC — app.js ===== */

const CATEGORIES = {
  "hardware-wallets": "🔐 Hardware Wallets",
  "privacidad": "🕵️ Privacidad",
  "metricas-analytics": "📊 Métricas & Analytics",
  "nodos": "🖥️ Nodos",
  "educacion": "📚 Educación",
  "herramientas-dev": "🛠️ Herramientas Dev",
  "wallets-software": "💼 Wallets Software",
  "lightning": "⚡ Lightning Network",
  "mineria": "⛏️ Minería",
  "fiscalidad": "🧾 Fiscalidad",
  "otro": "📦 Otro"
};

const LANGUAGES = { "es": "🇪🇸 ES", "en": "🇬🇧 EN", "multi": "🌐 Multi" };

let allProjects = [];
let activeCategories = new Set();
let activeLang = "all";
let filterFree = false;
let filterOSS = false;

/* ===== LOAD ===== */
async function loadProjects() {
  try {
    const res = await fetch("data/projects.json");
    allProjects = await res.json();
    // Sort by date_added descending
    allProjects.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
    buildFilters();
    renderProjects(allProjects);
    updateCounters(allProjects.length);
  } catch (e) {
    console.error("Error cargando proyectos:", e);
    document.getElementById("projects-grid").innerHTML =
      '<p style="color:var(--text-muted);padding:24px">Error cargando proyectos. Asegúrate de ejecutar en un servidor local.</p>';
  }
}

/* ===== FILTERS BUILD ===== */
function buildFilters() {
  const usedCategories = [...new Set(allProjects.map(p => p.category))];
  const usedLangs = [...new Set(allProjects.map(p => p.language))];

  // Build category buttons for both desktop and mobile
  ["category-filters-desktop", "category-filters"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    usedCategories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.cat = cat;
      btn.textContent = CATEGORIES[cat] || cat;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => toggleCategory(cat));
      el.appendChild(btn);
    });
  });

  // Language buttons
  ["language-filters-desktop", "language-filters"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "filter-btn active";
    allBtn.dataset.lang = "all";
    allBtn.textContent = "🌐 Todos";
    allBtn.addEventListener("click", () => setLang("all"));
    el.appendChild(allBtn);

    usedLangs.forEach(lang => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.lang = lang;
      btn.textContent = LANGUAGES[lang] || lang.toUpperCase();
      btn.addEventListener("click", () => setLang(lang));
      el.appendChild(btn);
    });
  });

  // Category count for stats
  document.getElementById("category-count").textContent = usedCategories.length;
}

/* ===== TOGGLE CATEGORY ===== */
function toggleCategory(cat) {
  if (activeCategories.has(cat)) {
    activeCategories.delete(cat);
  } else {
    activeCategories.add(cat);
  }
  updateCategoryButtons();
  applyFilters();
}

function updateCategoryButtons() {
  document.querySelectorAll(".filter-btn[data-cat]").forEach(btn => {
    const isActive = activeCategories.has(btn.dataset.cat);
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

/* ===== SET LANGUAGE ===== */
function setLang(lang) {
  activeLang = lang;
  document.querySelectorAll(".filter-btn[data-lang]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  applyFilters();
}

/* ===== APPLY ALL FILTERS ===== */
function applyFilters() {
  const query = document.getElementById("search").value.trim().toLowerCase();

  const filtered = allProjects.filter(p => {
    // Search
    if (query && !p.name.toLowerCase().includes(query) && !p.description.toLowerCase().includes(query)) return false;
    // Category
    if (activeCategories.size > 0 && !activeCategories.has(p.category)) return false;
    // Free
    if (filterFree && !p.free) return false;
    // OSS
    if (filterOSS && !p.open_source) return false;
    // Language
    if (activeLang !== "all" && p.language !== activeLang) return false;
    return true;
  });

  renderProjects(filtered);
  updateCounters(filtered.length);

  const emptyState = document.getElementById("empty-state");
  const grid = document.getElementById("projects-grid");
  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    grid.classList.add("hidden");
  } else {
    emptyState.classList.add("hidden");
    grid.classList.remove("hidden");
  }
}

/* ===== RENDER CARDS ===== */
function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  grid.innerHTML = "";

  projects.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.category = p.category;
    card.style.animationDelay = `${i * 50}ms`;

    const catLabel = CATEGORIES[p.category] || p.category;
    const langLabel = p.language ? p.language.toUpperCase() : "";

    const freeBadge = p.free
      ? `<span class="badge badge-free" title="Gratuito">Free</span>` : "";
    const ossBadge = p.open_source
      ? `<span class="badge badge-oss" title="Open Source">OSS</span>` : "";
    const langBadge = langLabel
      ? `<span class="badge badge-lang" title="Idioma">${langLabel}</span>` : "";

    const githubLink = p.github
      ? `<a href="${escapeHtml(p.github)}" target="_blank" rel="noopener" class="card-github" aria-label="Ver en GitHub">${getGitHubIcon()}</a>` : "";
    const socialLinks = buildSocialLinks(p);
    const authorBlock = (p.author || socialLinks)
      ? `
        <div class="card-meta">
          ${p.author ? `<span class="card-author">${escapeHtml(p.author)}</span>` : ""}
          ${socialLinks ? `<div class="card-socials">${socialLinks}</div>` : ""}
        </div>
      `
      : `<span class="card-author"></span>`;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-category">${escapeHtml(catLabel)}</span>
        <div class="card-badges">${freeBadge}${ossBadge}${langBadge}</div>
      </div>
      <h3 class="card-title">${escapeHtml(p.name)}</h3>
      <p class="card-description">${escapeHtml(p.description)}</p>
      <div class="card-footer">
        ${authorBlock}
        <div class="card-links">
          ${githubLink}
          <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="card-visit">Visitar →</a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ===== UPDATE COUNTERS ===== */
function updateCounters(visible) {
  document.getElementById("project-count").textContent = visible;
}

/* ===== ESCAPE HTML ===== */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSocialLinks(project) {
  const links = [];

  if (project.x) {
    links.push(
      `<a href="${escapeHtml(project.x)}" target="_blank" rel="noopener" class="card-social-link" aria-label="Perfil en X">` +
      getXIcon() +
      "</a>"
    );
  }

  if (project.nostr) {
    links.push(
      `<a href="${escapeHtml(project.nostr)}" target="_blank" rel="noopener" class="card-social-link" aria-label="Perfil en Nostr">` +
      getNostrIcon() +
      "</a>"
    );
  }

  return links.join("");
}

function getXIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2h3.064l-6.69 7.645L22.488 22h-6.164l-4.829-7.491L4.94 22H1.874l7.156-8.179L1.488 2h6.32l4.365 6.846L18.244 2Z"/>
    </svg>
  `;
}

function getGitHubIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.57.1.78-.25.78-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.14 1.18a10.9 10.9 0 0 1 5.72 0c2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.76.11 3.05.73.8 1.18 1.82 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.77 1.08.77 2.18v3.24c0 .31.21.67.79.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>
    </svg>
  `;
}

function getNostrIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="2.4"/>
      <circle cx="12" cy="4" r="1.6"/>
      <circle cx="17.66" cy="6.34" r="1.6"/>
      <circle cx="20" cy="12" r="1.6"/>
      <circle cx="17.66" cy="17.66" r="1.6"/>
      <circle cx="12" cy="20" r="1.6"/>
      <circle cx="6.34" cy="17.66" r="1.6"/>
      <circle cx="4" cy="12" r="1.6"/>
      <circle cx="6.34" cy="6.34" r="1.6"/>
    </svg>
  `;
}

/* ===== DEBOUNCE ===== */
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/* ===== CLEAR FILTERS ===== */
function clearFilters() {
  activeCategories.clear();
  activeLang = "all";
  filterFree = false;
  filterOSS = false;
  document.getElementById("search").value = "";
  document.querySelectorAll("#filter-free, #filter-free-desktop").forEach(el => el.checked = false);
  document.querySelectorAll("#filter-opensource, #filter-opensource-desktop").forEach(el => el.checked = false);
  document.querySelectorAll(".filter-btn[data-cat]").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed","false"); });
  document.querySelectorAll(".filter-btn[data-lang]").forEach(b => b.classList.toggle("active", b.dataset.lang === "all"));
  applyFilters();
}

/* ===== MOBILE HAMBURGER ===== */
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

/* ===== MOBILE FILTER ACCORDION ===== */
function initFilterAccordion() {
  const header = document.getElementById("filter-toggle");
  const body = document.getElementById("filter-body");
  if (!header || !body) return;
  header.addEventListener("click", () => {
    const isOpen = body.classList.toggle("open");
    header.classList.toggle("open", isOpen);
    header.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  header.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); header.click(); }
  });
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  initHamburger();
  initFilterAccordion();

  // Search with debounce
  document.getElementById("search").addEventListener("input", debounce(applyFilters, 300));

  // Free filter (both desktop and mobile)
  document.querySelectorAll("#filter-free, #filter-free-desktop").forEach(el => {
    el.addEventListener("change", e => {
      filterFree = e.target.checked;
      // Sync the other checkbox
      document.querySelectorAll("#filter-free, #filter-free-desktop").forEach(o => o.checked = filterFree);
      applyFilters();
    });
  });

  document.querySelectorAll("#filter-opensource, #filter-opensource-desktop").forEach(el => {
    el.addEventListener("change", e => {
      filterOSS = e.target.checked;
      document.querySelectorAll("#filter-opensource, #filter-opensource-desktop").forEach(o => o.checked = filterOSS);
      applyFilters();
    });
  });

  // Clear filters (both)
  document.querySelectorAll("#clear-filters, #clear-filters-desktop").forEach(el => {
    el.addEventListener("click", clearFilters);
  });
});
