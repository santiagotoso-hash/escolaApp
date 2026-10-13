/** Datas do financeiro: sempre "AAAA-MM-DD", no fuso de Brasília. */

const TZ = 'America/Sao_Paulo';

/** "2026-10-13": hoje no fuso de Brasília. */
export const hojeEmBrasilia = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: TZ });

/** Recusa datas que não existem, como 2026-02-31. */
export function dataExiste(data: string) {
  const [a, m, d] = data.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return (
    dt.getUTCFullYear() === a &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Mesmo dia, `meses` depois; dia 31 num mês de 30 vira o último dia. */
export function somarMeses(data: string, meses: number) {
  const [a, m, d] = data.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(a, m - 1 + meses + 1, 0)).getUTCDate();
  const dt = new Date(Date.UTC(a, m - 1 + meses, Math.min(d, ultimoDia)));
  return dt.toISOString().slice(0, 10);
}

/** "2026-03-10" → "março". */
export const nomeDoMes = (data: string) =>
  new Date(`${data}T12:00:00Z`).toLocaleDateString('pt-BR', {
    month: 'long',
    timeZone: 'UTC',
  });
