import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/bibles');
await mkdir(outDir, { recursive: true });

// Mapping from USFM 3-letter codes to Open Bible IDs (matching src/data/books.ts)
const USFM_MAP = {
  GEN: 'gn', EXO: 'ex', LEV: 'lv', NUM: 'nm', DEU: 'dt', JOS: 'js',
  JDG: 'jz', RUT: 'rt', '1SA': '1sm', '2SA': '2sm', '1KI': '1rs', '2KI': '2rs',
  '1CH': '1cr', '2CH': '2cr', EZR: 'ed', NEH: 'ne', EST: 'et', JOB: 'jó',
  PSA: 'sl', PRO: 'pv', ECC: 'ec', SNG: 'ct', ISA: 'is', JER: 'jr',
  LAM: 'lm', EZK: 'ez', DAN: 'dn', HOS: 'os', JOL: 'jl', AMO: 'am',
  OBA: 'ob', JON: 'jn', MIC: 'mq', NAM: 'na', HAB: 'hc', ZEP: 'sf',
  HAG: 'ag', ZEC: 'zc', MAL: 'ml', MAT: 'mt', MRK: 'mc', LUK: 'lc',
  JHN: 'jo', ACT: 'atos', ROM: 'rm', '1CO': '1co', '2CO': '2co', GAL: 'gl',
  EPH: 'ef', PHP: 'fp', COL: 'cl', '1TH': '1ts', '2TH': '2ts', '1TI': '1tm',
  '2TI': '2tm', TIT: 'tt', PHM: 'fm', HEB: 'hb', JAS: 'tg', '1PE': '1pe',
  '2PE': '2pe', '1JN': '1jo', '2JN': '2jo', '3JN': '3jo', JUD: 'jd', REV: 'ap',
};

const BIBLES = [
  {
    id: 'es_ntv',
    name: 'Nueva Traducción Viviente',
    url: 'https://raw.githubusercontent.com/mrk214/bible-data-es-spa/refs/heads/main/data/es___spa___spa/NTV_vid_127.json',
  },
  {
    id: 'es_nvi',
    name: 'Nueva Versión Internacional',
    url: 'https://raw.githubusercontent.com/mrk214/bible-data-es-spa/refs/heads/main/data/es___spa___spa/NVI_vid_128.json',
  },
];

async function convertBible({ id, name, url }) {
  console.log(`\n⏳ Descargando ${name} (${id})...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  const data = await res.json();

  console.log(`🔨 Procesando ${data.books?.length ?? 0} libros...`);
  const output = [];

  for (const b of data.books) {
    const abbrev = USFM_MAP[b.usfm];
    if (!abbrev) {
      console.warn(`⚠️ Libro no reconocido: ${b.usfm} (${b.human})`);
      continue;
    }

    const chapters = [];
    for (const c of b.chapters) {
      const versesMap = new Map();
      let maxVerse = 0;

      for (const item of c.items ?? []) {
        if (!item.lines || item.lines.length === 0) continue;
        const lineText = item.lines.join(' ').replace(/\s+/g, ' ').trim();
        if (!lineText) continue;

        const vNums = item.verse_numbers ?? [];
        if (vNums.length > 0) {
          for (const v of vNums) {
            maxVerse = Math.max(maxVerse, v);
            const current = versesMap.get(v) || '';
            // If already set and lineText differs, append
            if (current && !current.includes(lineText)) {
              versesMap.set(v, `${current} ${lineText}`);
            } else if (!current) {
              versesMap.set(v, lineText);
            }
          }
        }
      }

      // Build 1-based array of verses
      const chapVerses = [];
      for (let v = 1; v <= maxVerse; v++) {
        chapVerses.push(versesMap.get(v) ?? '');
      }
      chapters.push(chapVerses);
    }

    output.push({
      abbrev,
      name: b.human || abbrev,
      chapters,
    });
  }

  const jsonContent = JSON.stringify(output);
  const sizeMb = (Buffer.byteLength(jsonContent, 'utf8') / 1048576).toFixed(1);
  const targetPath = join(outDir, `${id}.json`);
  await writeFile(targetPath, jsonContent);

  console.log(`✅ ${name} convertida con éxito en ${targetPath}`);
  console.log(`   Libros: ${output.length}, Tamaño: ${sizeMb} MB`);
  return { id, name, sizeMb: Number(sizeMb), books: output.length };
}

for (const b of BIBLES) {
  await convertBible(b);
}
console.log('\n🎉 ¡Conversión completada con éxito!');
