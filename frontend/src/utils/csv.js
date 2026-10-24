function esc(v) {
  let s = v === null || v === undefined ? '' : String(v);
  // Stops spreadsheet programs from running text that starts like a formula
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCsv(headers, data) {
  return [headers, ...data].map((row) => row.map(esc).join(',')).join('\r\n');
}

export function downloadCsv(filename, headers, data) {
  // The leading BOM makes Excel read the file as UTF-8
  const blob = new Blob(['\uFEFF' + toCsv(headers, data)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
