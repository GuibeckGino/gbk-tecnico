/**
 * Utilitários para máscaras de entrada
 */

export function formatarData(texto: string): string {
  // Remove tudo que não é número
  const numeros = texto.replace(/\D/g, "");

  // Limita a 8 dígitos
  const limitado = numeros.slice(0, 8);

  // Formata como dd/mm/aaaa
  if (limitado.length <= 2) {
    return limitado;
  } else if (limitado.length <= 4) {
    return `${limitado.slice(0, 2)}/${limitado.slice(2)}`;
  } else {
    return `${limitado.slice(0, 2)}/${limitado.slice(2, 4)}/${limitado.slice(4)}`;
  }
}

export function validarData(data: string): boolean {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = data.match(regex);

  if (!match) return false;

  const [, dia, mes, ano] = match;
  const d = parseInt(dia, 10);
  const m = parseInt(mes, 10);
  const a = parseInt(ano, 10);

  // Validar mês
  if (m < 1 || m > 12) return false;

  // Validar dia
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Verificar ano bissexto
  if ((a % 4 === 0 && a % 100 !== 0) || a % 400 === 0) {
    diasPorMes[1] = 29;
  }

  if (d < 1 || d > diasPorMes[m - 1]) return false;

  return true;
}

export function validarCliente(cliente: string): boolean {
  return cliente.trim().length > 0 && cliente.trim().length <= 100;
}

export function validarEndereco(endereco: string): boolean {
  return endereco.trim().length > 0 && endereco.trim().length <= 200;
}
