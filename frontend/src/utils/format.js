export function currentMonth() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// Accepts 'YYYY-MM' or 'YYYY-MM-DD'
export function monthLabel(m) {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}
