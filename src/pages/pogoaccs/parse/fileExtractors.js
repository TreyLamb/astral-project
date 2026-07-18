// Turns uploaded files (xlsx/xls/docx/csv/md/txt) into raw text lines ready
// to feed into parsePokemonLine / parseFreeform (see lineParser.js). xlsx and
// mammoth are both dynamically imported — this repo has no other code
// splitting, and both deps are large enough that they shouldn't bloat the
// eager main bundle for users who never touch bulk import.

const HEADER_WORDS = ['species', 'name', 'pokemon', 'pokémon', 'cp', 'level', 'lvl', 'iv', 'ivs', 'count', 'qty'];

function looksLikeHeaderRow(row) {
  return row.some((cell) => HEADER_WORDS.includes(String(cell ?? '').trim().toLowerCase()));
}

async function extractXlsxLines(file) {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const dataRows = rows.length && looksLikeHeaderRow(rows[0]) ? rows.slice(1) : rows;

  return dataRows
    .map((row) => row.filter((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '').join(' '))
    .filter(Boolean);
}

async function extractDocxLines(file) {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function stripMdMarkers(line) {
  let cleaned = line.replace(/^\s*(?:[-*>]\s+|#{1,6}\s+)/, '').trim();
  if (cleaned.includes('|')) {
    const cells = cleaned.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length) cleaned = cells.join(', ');
  }
  return cleaned;
}

async function extractMdLines(file) {
  const text = await file.text();
  return text.split('\n').map(stripMdMarkers).filter(Boolean);
}

async function extractCsvLines(file) {
  const text = await file.text();
  return text
    .split('\n')
    .map((line) => line.replace(/,/g, ' ').trim())
    .filter(Boolean);
}

async function extractTxtLines(file) {
  const text = await file.text();
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

export async function extractLines(file) {
  const name = (file.name || '').toLowerCase();
  const ext = name.slice(name.lastIndexOf('.'));

  switch (ext) {
    case '.xlsx':
    case '.xls':
      return extractXlsxLines(file);
    case '.docx':
      return extractDocxLines(file);
    case '.md':
      return extractMdLines(file);
    case '.csv':
      return extractCsvLines(file);
    case '.txt':
      return extractTxtLines(file);
    default:
      throw new Error(`Unsupported file type "${ext || name}" — use .xlsx, .xls, .docx, .csv, .md, or .txt`);
  }
}
