import AsyncStorage from "@react-native-async-storage/async-storage";
import { calcularValorPorTipo, type Installation, type PaymentMode, type CustomPrices } from "../types/installation";

export type PaymentModesByMonth = Record<string, PaymentMode>;
export type CustomPricesByMonth = Record<string, CustomPrices>;

const PAYMENT_MODE_KEY_PREFIX = "@gbk_payment_mode";
const CUSTOM_PRICES_KEY_PREFIX = "@gbk_custom_prices";

export function getPaymentModeKey(mes: number, ano: number): string {
  const mesFormatado = String(mes + 1).padStart(2, "0");
  return `${PAYMENT_MODE_KEY_PREFIX}_${ano}_${mesFormatado}`;
}

export function getCustomPricesKey(mes: number, ano: number): string {
  const mesFormatado = String(mes + 1).padStart(2, "0");
  return `${CUSTOM_PRICES_KEY_PREFIX}_${ano}_${mesFormatado}`;
}

export function getMonthKey(mes: number, ano: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

export function resolverPaymentModeDoMes(
  mes: number,
  ano: number,
  paymentModes: PaymentModesByMonth,
  fallback: PaymentMode = "meta",
): PaymentMode {
  return paymentModes[getMonthKey(mes, ano)] || fallback;
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

export async function salvarPaymentModeDoMes(mes: number, ano: number, mode: PaymentMode): Promise<void> {
  try {
    await AsyncStorage.setItem(getPaymentModeKey(mes, ano), JSON.stringify(mode));
  } catch {}
}

export async function obterPrecosCustomizadosDoMes(mes: number, ano: number): Promise<CustomPrices | undefined> {
  try {
    const data = await AsyncStorage.getItem(getCustomPricesKey(mes, ano));
    if (data) {
      return JSON.parse(data) as CustomPrices;
    }
  } catch {}
  return undefined;
}

export async function salvarPrecosCustomizadosDoMes(mes: number, ano: number, prices: CustomPrices): Promise<void> {
  try {
    await AsyncStorage.setItem(getCustomPricesKey(mes, ano), JSON.stringify(prices));
  } catch {}
}

export function extrairMesEAnoDaData(dataStr: string): { mes: number; ano: number } {
  if (!dataStr || typeof dataStr !== "string") {
    const now = new Date();
    return { mes: now.getMonth(), ano: now.getFullYear() };
  }
  const parts = dataStr.split("/");
  if (parts.length === 3) {
    const dia = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10) - 1;
    const ano = parseInt(parts[2], 10);
    if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
      return { mes, ano };
    }
  }
  const now = new Date();
  return { mes: now.getMonth(), ano: now.getFullYear() };
}

export function calcularValorConfiguradoDoMes(
  instalacao: Installation,
  totalDoMes: number,
  mes: number,
  ano: number,
  paymentModes: PaymentModesByMonth,
  fallback: PaymentMode = "meta",
  customPricesByMonth?: Record<string, CustomPrices>,
): number {
  const monthKey = getMonthKey(mes, ano);
  const customPrices = customPricesByMonth ? customPricesByMonth[monthKey] : undefined;
  const mode = resolverPaymentModeDoMes(mes, ano, paymentModes, fallback);
  return calcularValorPorTipo(
    instalacao.tipoServico,
    totalDoMes,
    mode,
    customPrices,
    instalacao.data,
  );
}
