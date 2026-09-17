# rodrigoavilesarias.com

Landing mínima + artículos como subpáginas (`/articulos/[slug]`). Hecha con [Astro](https://astro.build), estática y tipográfica.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:4321

## Añadir un artículo

1. Crea un archivo Markdown en `src/content/articulos/`, por ejemplo `mi-titulo.md`.
2. Frontmatter:

```yaml
---
title: Título
description: Una línea para la lista de la home.
date: 2026-09-18
draft: false
---
```

3. El slug de la URL es el nombre del archivo (sin `.md`): `/articulos/mi-titulo/`.
4. Con `draft: true` no se publica.

## Build

```bash
npm run build
npm run preview
```

La salida queda en `dist/`.

## Desplegar

Cualquier hosting estático sirve:

- **Cloudflare Pages**: conecta este repo, build `npm run build`, output `dist`.
- **Vercel**: igual; framework preset Astro o static `dist`.

Luego apunta el dominio `rodrigoavilesarias.com` (DNS) al proyecto.

## Editar la bio / email

- Bio: `src/pages/index.astro`
- Email del pie: mismo archivo
