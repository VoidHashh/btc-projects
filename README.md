# btc-projects

Directorio abierto de proyectos Bitcoin y blockchain, mantenido como sitio estático con revisión manual antes de publicar cada alta.

## Qué es este proyecto

Este repositorio contiene:

- la web pública del directorio
- el fichero de datos `data/projects.json`
- el formulario para proponer nuevos proyectos
- la automatización que convierte cada propuesta en una PR para revisión

El objetivo es mantener un flujo simple para el usuario y seguro para el repositorio:

1. el usuario envía un proyecto desde la web
2. el envío crea un Issue en GitHub en segundo plano
3. una GitHub Action prepara una PR automática
4. el maintainer revisa y decide si hace merge

Nada se publica directamente en `main` sin revisión.

## Stack

- Frontend estático: HTML, CSS y JavaScript
- Datos: `data/projects.json`
- Endpoint seguro de envío: Cloudflare Pages Functions
- Automatización de revisión: GitHub Actions

## Estructura principal

- `index.html`: portada del directorio
- `submit.html`: formulario para proponer proyectos
- `about.html`: explicación pública del proyecto
- `js/app.js`: carga y pinta los proyectos del JSON
- `js/submit.js`: lógica del formulario de envío
- `data/projects.json`: fuente de verdad de los proyectos publicados
- `functions/api/submit-project.js`: endpoint seguro que crea el Issue en GitHub
- `.github/workflows/project-submission-pr.yml`: workflow que genera la PR automática
- `scripts/create-project-entry-from-issue.mjs`: parser y validador del Issue

## Cómo se añaden proyectos

### Flujo para el usuario

1. El usuario entra en `submit.html`.
2. Rellena el formulario y pulsa `Enviar proyecto`.
3. La web hace un `POST` al endpoint seguro `/api/submit-project`.
4. Ese endpoint valida los datos y crea un Issue con la etiqueta `nuevo-proyecto`.
5. Si todo va bien, la web muestra confirmación y puede ofrecer la pantalla de donación.

### Flujo interno de revisión

1. GitHub detecta el nuevo Issue etiquetado como `nuevo-proyecto`.
2. El workflow `project-submission-pr.yml` se ejecuta.
3. `scripts/create-project-entry-from-issue.mjs`:
   - parsea el body del Issue
   - valida campos obligatorios
   - valida categoría e idioma
   - comprueba duplicados por URL y GitHub
   - prepara una nueva entrada en `data/projects.json`
4. `peter-evans/create-pull-request` abre o actualiza una PR automática.
5. El maintainer revisa la PR.
6. Si hace merge, el proyecto queda publicado.

### Qué pasa si algo falla

- Si faltan datos o son inválidos, el bot comenta en el Issue y no crea PR.
- Si detecta duplicado, el bot lo indica y no crea una PR nueva.
- Si GitHub no permite crear PRs automáticas, el workflow lo comenta en el Issue.

## Revisión manual

El sistema está pensado para que siempre haya revisión humana antes de publicar:

- el formulario no escribe directamente en `data/projects.json`
- la automatización nunca hace merge por sí sola
- la publicación final depende de aceptar la PR

## Despliegue recomendado

La opción recomendada es Cloudflare Pages con Functions.

Motivo:

- el frontend sigue siendo estático
- el token de GitHub no se expone al navegador
- el formulario puede enviar propuestas en segundo plano

## Por qué no sirve GitHub Pages sola

GitHub Pages sirve archivos estáticos, pero no ejecuta el endpoint seguro que necesita el formulario para crear Issues sin exponer el token.

Si el token llega al navegador, deja de ser secreto.

Por eso:

- GitHub Pages sola sirve para mostrar la web
- Cloudflare Pages Functions sirve para procesar el formulario de forma segura

## Importante sobre el dominio

Si vas a usar dominio propio, debe apuntar a Cloudflare Pages, no a GitHub Pages.

Ese punto es importante porque el formulario usa el endpoint seguro que vive en Cloudflare. Si el dominio apunta a GitHub Pages:

- la web puede cargar
- pero el envío en segundo plano dejará de funcionar correctamente

En resumen:

- dominio final -> Cloudflare Pages
- no -> GitHub Pages

## Configuración en Cloudflare Pages

### Ajustes de build

Al crear el proyecto en Cloudflare Pages:

- `Production branch`: `main`
- `Framework preset`: `None`
- `Build command`: vacío
- `Build output directory`: `.`

### Variables y secretos

Configura estas variables en Cloudflare:

- `GITHUB_TOKEN`
  secreto con permisos para crear Issues en el repo
- `GITHUB_REPO`
  valor recomendado: `VoidHashh/btc-projects`
- `ALLOWED_ORIGINS`
  dominios permitidos separados por comas

Ejemplo:

```text
GITHUB_REPO=VoidHashh/btc-projects
ALLOWED_ORIGINS=https://btc-projects.pages.dev,https://tudominio.com
```

### Qué hace cada una

- `GITHUB_TOKEN`: autentica las llamadas a la API de GitHub
- `GITHUB_REPO`: permite reutilizar el endpoint sin hardcodear otro repo
- `ALLOWED_ORIGINS`: limita desde qué dominios se acepta el formulario

## Configuración en GitHub

Para que la automatización cree PRs correctamente, en el repositorio debes tener activado:

`Settings > Actions > General`

- `Read and write permissions`
- `Allow GitHub Actions to create and approve pull requests`

Sin eso, el workflow puede procesar el Issue pero no abrir la PR automática.

## Endpoint seguro

El endpoint está en:

- `functions/api/submit-project.js`

Responsabilidades:

- validar el payload recibido
- validar URLs, booleanos, categorías e idioma
- aplicar CORS
- crear el Issue en GitHub
- devolver una respuesta limpia al frontend

## Frontend y endpoint

El frontend usa por defecto:

- `/api/submit-project`

Eso funciona directamente cuando la web está servida desde Cloudflare Pages.

Si en algún momento mantienes el frontend en otra plataforma, puedes apuntarlo a otro endpoint con:

```html
<script>
  window.DIRECTORIO_CONFIG = {
    submitApiUrl: "https://tu-endpoint-seguro.example.com/api/submit-project"
  };
</script>
```

## Desarrollo local

1. Crea un archivo `.dev.vars` a partir de `.dev.vars.example`.
2. Añade tus valores locales.
3. Arranca el entorno local con:

```bash
npx wrangler pages dev .
```

## Publicación de proyectos

La fuente de verdad visible en la web es:

- `data/projects.json`

La página principal carga ese fichero y renderiza los proyectos desde ahí. Por eso el alta real se considera completada solo cuando la PR que modifica `data/projects.json` se fusiona en `main`.

## Flujo completo resumido

1. Usuario envía formulario.
2. Cloudflare Function crea Issue.
3. GitHub Action procesa el Issue.
4. Se crea PR automática.
5. Revisión manual.
6. Merge.
7. `data/projects.json` se actualiza.
8. La web muestra el nuevo proyecto.

## Troubleshooting

### Error `Falta configurar GITHUB_TOKEN en el entorno`

El secreto no está configurado en Cloudflare Pages o no está disponible en ese entorno.

### El formulario carga pero no envía

Revisa:

- que el dominio apunte a Cloudflare
- que `ALLOWED_ORIGINS` incluya el dominio real
- que la deployment activa sea la de Cloudflare Pages

### Se crea el Issue pero no aparece la PR

Revisa:

- permisos de GitHub Actions
- logs del workflow `Project Submission PR`
- comentario automático dejado por el bot en el Issue

### El proyecto no aparece en la web tras el merge

Revisa:

- que la PR realmente haya sido fusionada
- que `data/projects.json` tenga la nueva entrada
- que la deployment de producción se haya actualizado

## Notas de seguridad

- No embebas PATs de GitHub en `js/submit.js` ni en ningún archivo público.
- GitHub Push Protection bloqueará esos commits y, además, el token quedará expuesto al navegador.
- El token debe vivir solo en secretos del lado servidor, como Cloudflare Pages.
