export const fecha = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }).replace('.', '');

export const ESTADOS = {
  asentada: 'Asentada',
  creciendo: 'Creciendo',
  semilla: 'Semilla',
} as const;

const ORDEN_ESTADO = { asentada: 0, creciendo: 1, semilla: 2 } as const;
const ORDEN_AREA = ['Producto', 'Cómo trabajo y decido'];

export const ordenIdeas = <T extends { data: { estado: keyof typeof ORDEN_ESTADO; actualizado: Date } }>(a: T, b: T) =>
  ORDEN_ESTADO[a.data.estado] - ORDEN_ESTADO[b.data.estado] || b.data.actualizado.valueOf() - a.data.actualizado.valueOf();

export const ordenAreas = (a: string, b: string) => {
  const ia = ORDEN_AREA.indexOf(a), ib = ORDEN_AREA.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'es');
};

// Markdown en línea mínimo para referencias: [texto](url), *cursiva*, **negrita**. Escapa el resto.
export const enLinea = (s: string) =>
  s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
