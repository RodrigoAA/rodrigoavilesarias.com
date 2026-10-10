// Genera las ideas públicas de la web a partir de la bóveda privada (fuera de este repo público).
// Solo copia las notas con `publicar: true`. Antes, para si encuentra nombres privados, cifras internas,
// borradores sin reescribir o marcas pendientes. La lista privada también vive fuera del repo.
// Uso: node scripts/publicar-jardin.mjs            (comprueba y genera src/content/ideas)
//      node scripts/publicar-jardin.mjs --comprobar (solo comprueba)
import { readFileSync, readdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const NOTAS = process.env.JARDIN_NOTAS || '/workspace/jardin/notas';
const LISTA = process.env.JARDIN_PRIVADO || join(homedir(), '.jardin-privado.json');
const DESTINO = 'src/content/ideas';
const soloComprobar = process.argv.includes('--comprobar');

if (!existsSync(LISTA)) { console.error(`✗ Falta la lista privada ${LISTA}. No publico sin comprobar.`); process.exit(1); }
const lista = JSON.parse(readFileSync(LISTA, 'utf8'));
let cifras = [], terminos = [];
if (lista.incluir_lista && existsSync(lista.incluir_lista)) {
  const extra = JSON.parse(readFileSync(lista.incluir_lista, 'utf8'));
  cifras = extra.cifras || []; terminos = extra.terminos || [];
}
const palabras = [...lista.palabras, ...terminos];

const normaliza = (t) => t.replace(/(\d)[.\u00a0\u202f ](?=\d{3}\b)/g, '$1').replace(/\s+(%|€)/g, '$1');
const escapa = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const quitaComillas = (v) => v.trim().replace(/^["']|["']$/g, '');

const parse = (archivo) => {
  const txt = readFileSync(join(NOTAS, archivo), 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm = {};
  if (m) for (const l of m[1].split('\n')) { const k = l.match(/^(\w+):\s*(.*)$/); if (k) fm[k[1]] = quitaComillas(k[2]); }
  const cuerpo = m ? txt.slice(m[0].length) : txt;
  const secciones = {}; let actual = '_';
  for (const l of cuerpo.split('\n')) {
    const h = l.match(/^##\s+(.+?)\s*$/);
    if (h) { actual = h[1].toLowerCase(); secciones[actual] = []; continue; }
    (secciones[actual] ||= []).push(l);
  }
  return { archivo, fm, cuerpo, secciones, titulo: fm.titulo || archivo.replace(/\.md$/, '') };
};

const notas = readdirSync(NOTAS).filter((f) => f.endsWith('.md')).map(parse);
const publicas = notas.filter((n) => n.fm.publicar === 'true');
const slugDe = (n) => n.fm.slug || n.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const porTitulo = new Map(notas.map((n) => [n.titulo.toLowerCase(), n]));

// --- Comprobación ---
let fallos = 0;
for (const n of publicas) {
  const lineas = (n.titulo + '\n' + (n.fm.postura || '') + '\n' + (n.fm.area || '') + '\n' + n.cuerpo).split('\n');
  const avisa = (i, motivo) => { fallos++; console.error(`✗ ${n.archivo}:${i}  ${motivo}\n    ${lineas[i].trim().slice(0, 140)}`); };
  for (const campo of []) if (!n.fm[campo]) { fallos++; console.error(`✗ ${n.archivo}: falta "${campo}" en la cabecera`); }
  lineas.forEach((linea, i) => {
    const l = normaliza(linea);
    for (const p of palabras) if (new RegExp(`(^|[^\\p{L}])${escapa(p)}(?![\\p{L}])`, 'iu').test(l)) avisa(i, `nombre privado o interno "${p}"`);
    for (const c of cifras) if (new RegExp(`(^|[^\\d,.])${escapa(normaliza(c))}(?![\\d])`).test(l)) avisa(i, `cifra interna "${c}"`);
    if (/borrador de (emil|nico|mariano|mehdi|elon)|reescr[ií]belo/i.test(l)) avisa(i, 'texto de borrador sin reescribir');
    if (/\[(PENDIENTE|VALIDAR)/i.test(l)) avisa(i, 'marca pendiente sin resolver');
  });
}
if (fallos) { console.error(`\n${fallos} problema(s). No se copia nada a la web.`); process.exit(1); }
console.log(`✓ ${publicas.length} de ${notas.length} notas marcadas para publicar, sin problemas.`);
if (soloComprobar) process.exit(0);

// --- Generación ---
const esPublica = (t) => { const d = porTitulo.get(t.trim().toLowerCase()); return d && d.fm.publicar === 'true' ? d : null; };
// [[Idea]] → enlace solo si es pública; si no, texto plano sin corchetes.
const enlaza = (s) => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, alias) => {
  const d = esPublica(t); return d ? `[${alias || t}](../${slugDe(d)}/)` : (alias || t);
});
const items = (ls = []) => ls.filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, '').trim()).filter((l) => !/^_.*_$/.test(l));
const yaml = (v) => JSON.stringify(v);

const generados = new Set();
for (const n of publicas) {
  const s = n.secciones;
  const prosa = (s['lo que pienso'] || []).join('\n').replace(/^>.*$/gm, '').trim();
  const cambios = items(s['cómo ha cambiado']).map((l) => { const k = l.indexOf(':'); return k > 0 ? { fecha: l.slice(0, k).trim(), texto: l.slice(k + 1).trim() } : { fecha: '', texto: l }; });
  if (cambios.length === 1 && /^primera postura\.?$/i.test(cambios[0].texto)) cambios[0].texto = n.fm.postura;
  const relacionadas = items(s['ideas relacionadas'] || s['temas relacionados'])
    .map((l) => l.match(/\[\[([^\]|]+)/)?.[1]).filter(Boolean)
    .map((t) => esPublica(t)).filter(Boolean)          // las privadas ni se mencionan
    .map((d) => ({ titulo: d.titulo, slug: slugDe(d) }));
  const fm = [
    '---',
    `titulo: ${yaml(n.titulo)}`,
    `actualizado: ${n.fm.actualizado || n.fm.creado}`,
    `preguntas: ${yaml(items(s['preguntas abiertas']).map(enlaza))}`,
    `cambios: ${yaml(cambios.map((c) => ({ ...c, texto: enlaza(c.texto) })))}`,
    `referencias: ${yaml(items(s['referencias']).map(enlaza))}`,
    `relacionadas: ${yaml(relacionadas)}`,
    '---', '',
  ].join('\n');
  const archivo = `${slugDe(n)}.md`; generados.add(archivo);
  writeFileSync(join(DESTINO, archivo), fm + enlaza(prosa) + '\n');
}
for (const f of readdirSync(DESTINO)) if (f.endsWith('.md') && !generados.has(f)) { unlinkSync(join(DESTINO, f)); console.log(`− retirada de la web: ${f}`); }
console.log(`✓ Generadas ${publicas.length} ideas en ${DESTINO}.`);
