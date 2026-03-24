const DEFAULT_REPO = "VoidHashh/btc-projects";

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

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const rawAllowedOrigins = env.ALLOWED_ORIGINS || "";
  const allowedOrigins = rawAllowedOrigins
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  let allowOrigin = "*";

  if (allowedOrigins.length > 0) {
    allowOrigin = allowedOrigins.includes(origin) ? origin : "";
  } else if (origin) {
    allowOrigin = origin;
  }

  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin"
  };
}

function isOriginAllowed(request, env) {
  const origin = request.headers.get("Origin");
  const rawAllowedOrigins = env.ALLOWED_ORIGINS || "";
  const allowedOrigins = rawAllowedOrigins
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  if (!origin || allowedOrigins.length === 0) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function ensureString(value, fieldName, maxLength) {
  if (typeof value !== "string") {
    throw new Error(`El campo "${fieldName}" no es válido.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`El campo "${fieldName}" es obligatorio.`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`El campo "${fieldName}" supera el máximo permitido.`);
  }

  return trimmed;
}

function optionalString(value, maxLength = 200) {
  if (value == null || value === "") return "";
  if (typeof value !== "string") {
    throw new Error("Uno de los campos opcionales no es válido.");
  }

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > maxLength) {
    throw new Error("Uno de los campos opcionales supera el máximo permitido.");
  }

  return trimmed;
}

function ensureBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new Error(`El campo "${fieldName}" no es válido.`);
  }
  return value;
}

function ensureUrl(value, fieldName) {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`El campo "${fieldName}" debe usar http o https.`);
  }
  return parsed.toString();
}

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

async function createIssue(data, env) {
  if (!env.GITHUB_TOKEN) {
    throw new Error("Falta configurar GITHUB_TOKEN en el entorno.");
  }

  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const { title, body } = buildIssuePayload(data);

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "btc-projects-submit-service",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["nuevo-proyecto"]
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `GitHub respondió con ${response.status}.`);
  }

  return payload;
}

function validatePayload(payload) {
  const name = ensureString(payload.name, "Nombre", 100);
  const url = ensureUrl(ensureString(payload.url, "URL", 300), "URL");
  const description = ensureString(payload.description, "Descripción", 300);
  const category = ensureString(payload.category, "Categoría", 80);
  const github = optionalString(payload.github, 300);
  const author = optionalString(payload.author, 80);
  const language = ensureString(payload.language, "Idioma", 20);
  const free = ensureBoolean(payload.free, "Gratuito");
  const openSource = ensureBoolean(payload.openSource, "Open Source");

  if (!ALLOWED_CATEGORIES.has(category)) {
    throw new Error("La categoría no es válida.");
  }

  if (!ALLOWED_LANGUAGES.has(language)) {
    throw new Error("El idioma no es válido.");
  }

  return {
    name,
    url,
    description,
    category,
    github: github ? ensureUrl(github, "GitHub") : "",
    author,
    language,
    free,
    openSource
  };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request, context.env)
  });
}

export async function onRequestPost(context) {
  const corsHeaders = getCorsHeaders(context.request, context.env);

  if (!isOriginAllowed(context.request, context.env)) {
    return json({ error: "Origen no permitido." }, 403, corsHeaders);
  }

  let payload;

  try {
    payload = await context.request.json();
  } catch {
    return json({ error: "El cuerpo de la solicitud no es JSON válido." }, 400, corsHeaders);
  }

  try {
    const data = validatePayload(payload);
    const issue = await createIssue(data, context.env);

    return json({
      ok: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url
    }, 201, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el envío.";
    const status = /Falta configurar GITHUB_TOKEN|GitHub respondió con 401|Bad credentials/i.test(message)
      ? 500
      : 400;

    return json({ error: message }, status, corsHeaders);
  }
}
