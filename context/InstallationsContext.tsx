import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Installation,
  InstallationStats,
  calcularStats,
  gerarId,
  type PaymentMode,
} from "@/types/installation";
import type { ServiceType } from "@/types/installation";

const STORAGE_KEY = "@gbk_instalacoes";
const PAYMENT_MODE_KEY = "@gbk_payment_mode";
const MONTHLY_GOAL_KEY = "@gbk_monthly_goal";

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  instalacoes: Installation[];
  stats: InstallationStats;
  carregando: boolean;
  paymentMode: PaymentMode;
  monthlyGoal: number;
}

const estadoInicial: State = {
  instalacoes: [],
  stats: calcularStats([], "meta"),
  carregando: true,
  paymentMode: "meta",
  monthlyGoal: 104,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "CARREGAR"; payload: Installation[] }
  | { type: "ADICIONAR"; payload: Installation }
  | { type: "ATUALIZAR"; payload: Installation }
  | { type: "REMOVER"; payload: string }
  | { type: "LIMPAR" }
  | { type: "SET_PAYMENT_MODE"; payload: PaymentMode }
  | { type: "SET_MONTHLY_GOAL"; payload: number };

function reducer(state: State, action: Action): State {
  let novasInstalacoes: Installation[];

  switch (action.type) {
    case "CARREGAR":
      novasInstalacoes = action.payload;
      return {
        ...state,
        instalacoes: novasInstalacoes,
        stats: calcularStats(novasInstalacoes, state.paymentMode),
        carregando: false,
      };

    case "ADICIONAR":
      novasInstalacoes = [...state.instalacoes, action.payload];
      return {
        ...state,
        instalacoes: novasInstalacoes,
        stats: calcularStats(novasInstalacoes, state.paymentMode),
      };

    case "ATUALIZAR":
      novasInstalacoes = state.instalacoes.map((inst) =>
        inst.id === action.payload.id ? action.payload : inst
      );
      return {
        ...state,
        instalacoes: novasInstalacoes,
        stats: calcularStats(novasInstalacoes, state.paymentMode),
      };

    case "REMOVER":
      novasInstalacoes = state.instalacoes.filter(
        (inst) => inst.id !== action.payload
      );
      return {
        ...state,
        instalacoes: novasInstalacoes,
        stats: calcularStats(novasInstalacoes, state.paymentMode),
      };

    case "LIMPAR":
      return {
        instalacoes: [],
        stats: calcularStats([], state.paymentMode),
        carregando: false,
        paymentMode: state.paymentMode,
        monthlyGoal: state.monthlyGoal,
      };

    case "SET_PAYMENT_MODE":
      return {
        ...state,
        paymentMode: action.payload,
        stats: calcularStats(state.instalacoes, action.payload),
      };

    case "SET_MONTHLY_GOAL":
      return {
        ...state,
        monthlyGoal: action.payload,
      };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────────

interface InstallationsContextValue {
  instalacoes: Installation[];
  stats: InstallationStats;
  carregando: boolean;
  paymentMode: PaymentMode;
  monthlyGoal: number;
  setPaymentMode: (mode: PaymentMode) => Promise<void>;
  setMonthlyGoal: (goal: number) => Promise<void>;
  adicionarInstalacao: (dados: {
    cliente: string;
    endereco: string;
    tipoServico: ServiceType;
    data: string;
    observacoes: string;
  }) => Promise<void>;
  atualizarInstalacao: (instalacao: Installation) => Promise<void>;
  removerInstalacao: (id: string) => Promise<void>;
  limparDados: () => Promise<void>;
  exportarJSON: () => string;
  importarJSON: (json: string) => Promise<boolean>;
  setInstallations: (instalacoes: Installation[]) => Promise<void>;
  toggleFavorito: (id: string) => Promise<void>;
}

const InstallationsContext = createContext<InstallationsContextValue | null>(
  null
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InstallationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, estadoInicial);

  // Carregar dados do AsyncStorage ao iniciar
  useEffect(() => {
    async function carregarDados() {
      try {
        const [dados, paymentModeData, monthlyGoalData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(PAYMENT_MODE_KEY),
          AsyncStorage.getItem(MONTHLY_GOAL_KEY),
        ]);

        const instalacoes: Installation[] = dados ? JSON.parse(dados) : [];
        const paymentMode: PaymentMode = paymentModeData
          ? (JSON.parse(paymentModeData) as PaymentMode)
          : "meta";
        const monthlyGoal: number = monthlyGoalData
          ? JSON.parse(monthlyGoalData)
          : 104;

        dispatch({ type: "CARREGAR", payload: instalacoes });
        dispatch({ type: "SET_PAYMENT_MODE", payload: paymentMode });
        dispatch({ type: "SET_MONTHLY_GOAL", payload: monthlyGoal });
      } catch {
        dispatch({ type: "CARREGAR", payload: [] });
      }
    }
    carregarDados();
  }, []);

  // Salvar dados no AsyncStorage sempre que mudarem
  useEffect(() => {
    if (!state.carregando) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.instalacoes)).catch(
        () => {}
      );
    }
  }, [state.instalacoes, state.carregando]);

  // Salvar paymentMode no AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem(PAYMENT_MODE_KEY, JSON.stringify(state.paymentMode)).catch(
      () => {}
    );
  }, [state.paymentMode]);

  const adicionarInstalacao = useCallback(
    async (dados: {
      cliente: string;
      endereco: string;
      tipoServico: ServiceType;
      data: string;
      observacoes: string;
    }) => {
      const novaInstalacao: Installation = {
        id: gerarId(),
        createdAt: new Date().toISOString(),
        ...dados,
      };
      dispatch({ type: "ADICIONAR", payload: novaInstalacao });
    },
    []
  );

  const atualizarInstalacao = useCallback(
    async (instalacao: Installation) => {
      dispatch({ type: "ATUALIZAR", payload: instalacao });
    },
    []
  );

  const removerInstalacao = useCallback(async (id: string) => {
    dispatch({ type: "REMOVER", payload: id });
  }, []);

  const setInstallations = useCallback(
    async (novasInstalacoes: Installation[]) => {
      const instalacoesComCreatedAt = novasInstalacoes.map((inst) => ({
        ...inst,
        createdAt: inst.createdAt || new Date().toISOString(),
      }));
      dispatch({ type: "CARREGAR", payload: instalacoesComCreatedAt });
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(instalacoesComCreatedAt)
      ).catch(() => {});
    },
    []
  );

  const limparDados = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    dispatch({ type: "LIMPAR" });
  }, []);

  const exportarJSON = useCallback(() => {
    return JSON.stringify(state.instalacoes, null, 2);
  }, [state.instalacoes]);

  const importarJSON = useCallback(async (json: string): Promise<boolean> => {
    try {
      const dados: Installation[] = JSON.parse(json);
      if (!Array.isArray(dados)) return false;
      // Adicionar createdAt em instalações que não têm
      const instalacoesComCreatedAt = dados.map((inst) => ({
        ...inst,
        createdAt: inst.createdAt || new Date().toISOString(),
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(instalacoesComCreatedAt));
      dispatch({ type: "CARREGAR", payload: instalacoesComCreatedAt });
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggleFavorito = useCallback(async (id: string) => {
    const instalacao = state.instalacoes.find((inst) => inst.id === id);
    if (!instalacao) return;
    const atualizada = { ...instalacao, isFavorito: !instalacao.isFavorito };
    await atualizarInstalacao(atualizada);
  }, [state.instalacoes, atualizarInstalacao]);

  const setPaymentMode = useCallback(async (mode: PaymentMode) => {
    dispatch({ type: "SET_PAYMENT_MODE", payload: mode });
    await AsyncStorage.setItem(PAYMENT_MODE_KEY, JSON.stringify(mode)).catch(() => {});
  }, []);

  const setMonthlyGoal = useCallback(async (goal: number) => {
    dispatch({ type: "SET_MONTHLY_GOAL", payload: goal });
    await AsyncStorage.setItem(MONTHLY_GOAL_KEY, JSON.stringify(goal)).catch(() => {});
  }, []);

  return (
    <InstallationsContext.Provider
      value={{
        instalacoes: state.instalacoes,
        stats: state.stats,
        carregando: state.carregando,
        paymentMode: state.paymentMode,
        monthlyGoal: state.monthlyGoal,
        setPaymentMode,
        setMonthlyGoal,
        adicionarInstalacao,
        atualizarInstalacao,
        removerInstalacao,
        limparDados,
        exportarJSON,
        importarJSON,
        setInstallations,
        toggleFavorito,
      }}
    >
      {children}
    </InstallationsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInstallations(): InstallationsContextValue {
  const context = useContext(InstallationsContext);
  if (!context) {
    throw new Error("useInstallations deve ser usado dentro de InstallationsProvider");
  }
  return context;
}
