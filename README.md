# btc-projects

Directorio abierto de proyectos Bitcoin & Blockchain.

## Flujo de alta de proyectos

La web envía propuestas a un endpoint seguro, ese endpoint crea un Issue en GitHub y la Action del repositorio genera una PR automática para revisión.

## Despliegue recomendado

La opción más simple para que el formulario funcione en segundo plano sin exponer el token es desplegar la web en Cloudflare Pages con Functions.

### Variables necesarias

- `GITHUB_TOKEN`: token con permiso para crear issues en este repo.
- `GITHUB_REPO`: opcional. Por defecto `VoidHashh/btc-projects`.
- `ALLOWED_ORIGINS`: opcional. Lista separada por comas con los dominios permitidos.

### Estructura

- `functions/api/submit-project.js`: endpoint seguro para crear el Issue.
- `.github/workflows/project-submission-pr.yml`: convierte ese Issue en una PR automática para revisión.

### Desarrollo local

1. Crea `.dev.vars` a partir de `.dev.vars.example`.
2. Ejecuta `npx wrangler pages dev .`

### Si mantienes otra plataforma para el front

Puedes seguir usando el formulario si apuntas `window.DIRECTORIO_CONFIG.submitApiUrl` al endpoint desplegado.

```html
<script>
  window.DIRECTORIO_CONFIG = {
    submitApiUrl: "https://tu-endpoint-seguro.example.com/api/submit-project"
  };
</script>
```
