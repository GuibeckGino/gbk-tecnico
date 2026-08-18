import AsyncStorage from "@react-native-async-storage/async-storage";
import { calcularValorPorTipo, type Installation, type PaymentMode } from "../types/installation";

export type PaymentModesByMonth = Record<string, PaymentMode>;

const PAYMENT_MODE_KEY_PREFIX = "@gbk_payment_mode";

export function getPaymentModeKey(mes: number, ano: number): string {
  const mesFormatado = String(mes + 1).padStart(2, "0");
  return `${PAYMENT_MODE_KEY_PREFIX}_${ano}_${mesFormatado}`;
}

export function getMonthKey(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export function resolverPaymentModeDoMes(
  mes: number,
  ano: number,
  paymentModes: PaymentModesByMonth,
  fallback: PaymentMode = "meta",
): PaymentMode {
  return paymentModes[getMonthKey(mes, ano)] || fallback;
}

export function calcularValorConfiguradoDoMes(
  instalacao: Installation,
  totalDoMes: number,
  mes: number,
  ano: number,
  paymentModes: PaymentModesByMonth,
  fallback: PaymentMode = "meta",
): number {
  return calcularValorPorTipo(
    instalacao.tipoServico,
    totalDoMes,
    resolverPaymentModeDoMes(mes, ano, paymentModes, fallback),
  );
}

export async function obterPaymentModeDoMes(mes: number, ano: number): Promise<PaymentMode> {
  try {
    const data = await AsyncStorage.getItem(getPaymentModeKey(mes, ano));
    if (data) {
      return JSON.parse(data) as PaymentMode;
    }
  } catch {}
  return "meta";
}
