import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Ideas del jardín. NO se editan aquí: las genera scripts/publicar-jardin.mjs
// desde la bóveda privada (fuera del repo), solo las marcadas con publicar: true.
const ideas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ideas' }),
  schema: z.object({
    titulo: z.string(),
    area: z.string(),
    postura: z.string(),
    estado: z.enum(['semilla', 'creciendo', 'asentada']),
    actualizado: z.coerce.date(),
    preguntas: z.array(z.string()).default([]),
    cambios: z.array(z.object({ fecha: z.string(), texto: z.string() })).default([]),
    referencias: z.array(z.string()).default([]),
    relacionadas: z.array(z.object({ titulo: z.string(), slug: z.string().nullable() })).default([]),
  }),
});

export const collections = { ideas };
