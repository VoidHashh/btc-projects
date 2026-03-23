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
      ? `<a href="${escapeHtml(p.github)}" target="_blank" rel="noopener" class="card-github" aria-label="Ver en GitHub">GH</a>` : "";

    card.innerHTML = `
      <div class="card-header">
        <span class="card-category">${escapeHtml(catLabel)}</span>
        <div class="card-badges">${freeBadge}${ossBadge}${langBadge}</div>
      </div>
      <h3 class="card-title">${escapeHtml(p.name)}</h3>
      <p class="card-description">${escapeHtml(p.description)}</p>
      <div class="card-footer">
        <span class="card-author">${escapeHtml(p.author || "")}</span>
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
