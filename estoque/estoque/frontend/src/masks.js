// Máscaras e formatadores dos campos.

export const somenteDigitos = (v) => String(v ?? '').replace(/\D/g, '');

// 00.000.000/0000-00
export function mascaraCnpj(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// (00) 0000-0000  ou  (00) 00000-0000
export function mascaraTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const formatarPreco = (n) =>
  n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
