import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectsPath = path.resolve(__dirname, "../data/projects.json");
const outputPath = process.env.GITHUB_OUTPUT;

const ALLOWED_CATEGORIES = new Set([
  "hardware-wallets",
  "privacidad",
  "metricas-analytics",
  "nodos",
  "educacion",
  "herramientas-dev",
  "wallets-software",
  "lightning",
  "mineria",
  "fiscalidad",
  "otro"
]);

const ALLOWED_LANGUAGES = new Set(["es", "en", "multi"]);
const MAX_CATEGORIES = 3;

function setOutput(name, value) {
  if (!outputPath) return;
  fs.appendFileSync(outputPath, `${name}<<__CODEx__\n${String(value)}\n__CODEx__\n`);
}

function finish(status, message, extra = {}) {
  setOutput("status", status);
  setOutput("message", message);
  for (const [key, value] of Object.entries(extra)) {
    setOutput(key, value);
  }
  process.exit(0);
}

function normalizeOptional(value) {
  if (!value) return "";
  if (/^(n\/a|na|no aplica|ninguno)$/i.test(value)) return "";
  return value.trim();
}

function parseBoolean(value) {
  const normalized = normalizeLabel(value);
  if (["si", "s", "true", "yes"].includes(normalized)) return true;
  if (["no", "false"].includes(normalized)) return false;
  return null;
}

function normalizeLabel(value) {
  return value
    .replaceAll("Ã¡", "a")
    .replaceAll("Ã©", "e")
    .replaceAll("Ã­", "i")
    .replaceAll("Ã³", "o")
    .replaceAll("Ãº", "u")
    .replaceAll("Ã±", "n")
    .replaceAll("á", "a")
    .replaceAll("é", "e")
    .replaceAll("í", "i")
    .replaceAll("ó", "o")
    .replaceAll("ú", "u")
    .replaceAll("ñ", "n")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mapLabel(rawLabel) {
  const label = normalizeLabel(rawLabel);

  if (label === "nombre") return "name";
  if (label === "url") return "url";
  if (label.startsWith("descripci")) return "description";
  if (label.startsWith("categor")) return "categories";
  if (label.startsWith("github")) return "github";
  if (label.startsWith("autor")) return "author";
  if (label === "x") return "x";
  if (label.startsWith("nostr")) return "nostr";
  if (label.startsWith("gratuito")) return "free";
  if (label.startsWith("open source")) return "openSource";
  if (label.startsWith("idioma")) return "language";
  if (label.startsWith("metodo")) return "submissionMethod";
  if (label.startsWith("m") && label.includes("env")) return "submissionMethod";
  return "";
}

function parseIssueBody(body) {
  const fields = {};
  const lines = body.replace(/\r/g, "").split("\n");
  let currentField = "";

  for (const line of lines) {
    const fieldMatch = line.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (fieldMatch) {
      currentField = mapLabel(fieldMatch[1]);
      if (currentField) {
        fields[currentField] = fieldMatch[2].trim();
      }
      continue;
    }

    if (currentField && line.trim()) {
      fields[currentField] = `${fields[currentField]} ${line.trim()}`.trim();
    }
  }

  return fields;
}

function normalizeCategories(value) {
  function normalizeCategory(item) {
    const normalized = normalizeLabel(item);
    if (!normalized) return "";

    const slug = normalized.replace(/\s+/g, "-");
    return slug;
  }

  return [...new Set(
    value
      .split(",")
      .map(normalizeCategory)
      .filter(Boolean)
  )];
}

function normalizeUrl(value) {
  const url = new URL(value);
  const pathname = url.pathname.replace(/\/+$/, "");
  return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${url.search}`;
}

function validateUrl(value, fieldName) {
  try {
    new URL(value);
  } catch {
    throw new Error(`El campo "${fieldName}" no contiene una URL válida.`);
  }
}

function nextId(projects) {
  const maxId = projects.reduce((max, project) => {
    const numeric = Number.parseInt(project.id, 10);
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);
  return String(maxId + 1).padStart(3, "0");
}

const body = process.env.ISSUE_BODY ?? "";
const issueNumber = process.env.ISSUE_NUMBER ?? "";
const issueCreatedAt = process.env.ISSUE_CREATED_AT ?? new Date().toISOString();

if (!body.trim()) {
  finish("invalid", "El issue está vacío. Edita el issue y vuelve a intentarlo.");
}

const parsed = parseIssueBody(body);
const name = parsed.name ?? "";
const url = parsed.url ?? "";
const description = parsed.description ?? "";
const categories = normalizeCategories(parsed.categories ?? parsed.category ?? "");
const github = normalizeOptional(parsed.github ?? "");
const author = normalizeOptional(parsed.author ?? "");
const x = normalizeOptional(parsed.x ?? "");
const nostr = normalizeOptional(parsed.nostr ?? "");
const free = parseBoolean(parsed.free ?? "");
const openSource = parseBoolean(parsed.openSource ?? "");
const language = normalizeLabel(parsed.language ?? "");
const submissionMethod = parsed.submissionMethod ?? "Desconocido";

const missingFields = [];
if (!name) missingFields.push("Nombre");
if (!url) missingFields.push("URL");
if (!description) missingFields.push("Descripción");
if (categories.length === 0) missingFields.push("Categorías");
if (!language) missingFields.push("Idioma");
if (free === null) missingFields.push("Gratuito");
if (openSource === null) missingFields.push("Open Source");

if (missingFields.length > 0) {
  finish(
    "invalid",
    `Faltan o no se entienden estos campos: ${missingFields.join(", ")}. Edita el issue y el sistema lo reintentará.`
  );
}

try {
  validateUrl(url, "URL");
  if (github) validateUrl(github, "GitHub");
  if (x) validateUrl(x, "X");
  if (nostr) validateUrl(nostr, "Nostr");
} catch (error) {
  finish("invalid", error.message);
}

const invalidCategories = categories.filter(category => !ALLOWED_CATEGORIES.has(category));

if (invalidCategories.length > 0) {
  finish(
    "invalid",
    `Estas categorías no son válidas: ${invalidCategories.join(", ")}. Usa solo categorías soportadas en el formulario.`
  );
}

if (categories.length > MAX_CATEGORIES) {
  finish(
    "invalid",
    `Puedes seleccionar como máximo ${MAX_CATEGORIES} categorías. Edita el issue y vuelve a intentarlo.`
  );
}

if (!ALLOWED_LANGUAGES.has(language)) {
  finish(
    "invalid",
    `El idioma "${language}" no es válido. Usa es, en o multi.`
  );
}

const projects = JSON.parse(fs.readFileSync(projectsPath, "utf8"));

const duplicate = projects.find(project => {
  if (normalizeUrl(project.url) === normalizeUrl(url)) return true;
  if (github && project.github && normalizeUrl(project.github) === normalizeUrl(github)) return true;
  return false;
});

if (duplicate) {
  finish(
    "duplicate",
    `Ya existe un proyecto con esa URL o GitHub en el directorio: "${duplicate.name}" (${duplicate.url}).`
  );
}

const newProject = {
  id: nextId(projects),
  name,
  description,
  url,
  categories,
  tags: [],
  author,
  x,
  nostr,
  language,
  free,
  open_source: openSource,
  github,
  date_added: issueCreatedAt.slice(0, 10)
};

projects.push(newProject);
fs.writeFileSync(projectsPath, `${JSON.stringify(projects, null, 2)}\n`);

finish("success", `Se ha preparado una PR automática para revisar "${name}".`, {
  project_name: name,
  submission_method: submissionMethod,
  issue_number: issueNumber
});
