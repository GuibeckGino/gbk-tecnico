import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, FuelSupply, ReceiptStatus, FinancialAlert } from '@/types/finance';

interface FinanceState {
  expenses: Expense[];
  fuelSupplies: FuelSupply[];
  receipts: ReceiptStatus[];
  alerts: FinancialAlert[];
  metaFaturamento: number;
  metaLucro: number;
  metaDespesasMax: number;
  precoMedioCombustivel: number;
  consumoMedioVeiculo: number; // km/litro
}

type FinanceAction =
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'REMOVE_EXPENSE'; payload: string }
  | { type: 'ADD_FUEL'; payload: FuelSupply }
  | { type: 'UPDATE_FUEL'; payload: FuelSupply }
  | { type: 'REMOVE_FUEL'; payload: string }
  | { type: 'UPDATE_RECEIPT'; payload: ReceiptStatus }
  | { type: 'ADD_ALERT'; payload: FinancialAlert }
  | { type: 'REMOVE_ALERT'; payload: string }
  | { type: 'SET_META_FATURAMENTO'; payload: number }
  | { type: 'SET_META_LUCRO'; payload: number }
  | { type: 'SET_META_DESPESAS'; payload: number }
  | { type: 'SET_PRECO_COMBUSTIVEL'; payload: number }
  | { type: 'SET_CONSUMO_VEICULO'; payload: number }
  | { type: 'LOAD_STATE'; payload: FinanceState };

const initialState: FinanceState = {
  expenses: [],
  fuelSupplies: [],
  receipts: [],
  alerts: [],
  metaFaturamento: 3000,
  metaLucro: 2000,
  metaDespesasMax: 1000,
  precoMedioCombustivel: 5.5,
  consumoMedioVeiculo: 8, // km/litro
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e),
      };
    case 'REMOVE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload),
      };
    case 'ADD_FUEL':
      return { ...state, fuelSupplies: [...state.fuelSupplies, action.payload] };
    case 'UPDATE_FUEL':
      return {
        ...state,
        fuelSupplies: state.fuelSupplies.map(f => f.id === action.payload.id ? action.payload : f),
      };
    case 'REMOVE_FUEL':
      return {
        ...state,
        fuelSupplies: state.fuelSupplies.filter(f => f.id !== action.payload),
      };
    case 'UPDATE_RECEIPT':
      return {
        ...state,
        receipts: state.receipts.some(r => r.id === action.payload.id)
          ? state.receipts.map(r => r.id === action.payload.id ? action.payload : r)
          : [...state.receipts, action.payload],
      };
    case 'ADD_ALERT':
      return { ...state, alerts: [...state.alerts, action.payload] };
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(a => a.id !== action.payload),
      };
    case 'SET_META_FATURAMENTO':
      return { ...state, metaFaturamento: action.payload };
    case 'SET_META_LUCRO':
      return { ...state, metaLucro: action.payload };
    case 'SET_META_DESPESAS':
      return { ...state, metaDespesasMax: action.payload };
    case 'SET_PRECO_COMBUSTIVEL':
      return { ...state, precoMedioCombustivel: action.payload };
    case 'SET_CONSUMO_VEICULO':
      return { ...state, consumoMedioVeiculo: action.payload };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

interface FinanceContextValue {
  state: FinanceState;
  adicionarDespesa: (expense: Expense) => void;
  atualizarDespesa: (expense: Expense) => void;
  removerDespesa: (id: string) => void;
  adicionarCombustivel: (fuel: FuelSupply) => void;
  atualizarCombustivel: (fuel: FuelSupply) => void;
  removerCombustivel: (id: string) => void;
  atualizarRecebimento: (receipt: ReceiptStatus) => void;
  adicionarAlerta: (alert: FinancialAlert) => void;
  removerAlerta: (id: string) => void;
  setMetaFaturamento: (valor: number) => void;
  setMetaLucro: (valor: number) => void;
  setMetaDespesas: (valor: number) => void;
  setPrecoMedioCombustivel: (valor: number) => void;
  setConsumoMedioVeiculo: (valor: number) => void;
  salvarEstado: () => Promise<void>;
  carregarEstado: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  const salvarEstado = useCallback(async () => {
    try {
      await AsyncStorage.setItem('financeState', JSON.stringify(state));
    } catch (error) {
      console.error('Erro ao salvar estado financeiro:', error);
    }
  }, [state]);

  const carregarEstado = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('financeState');
      if (saved) {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Erro ao carregar estado financeiro:', error);
    }
  }, []);

  const value: FinanceContextValue = useMemo(
    () => ({
      state,
      adicionarDespesa: (expense) => dispatch({ type: 'ADD_EXPENSE', payload: expense }),
      atualizarDespesa: (expense) => dispatch({ type: 'UPDATE_EXPENSE', payload: expense }),
      removerDespesa: (id) => dispatch({ type: 'REMOVE_EXPENSE', payload: id }),
      adicionarCombustivel: (fuel) => dispatch({ type: 'ADD_FUEL', payload: fuel }),
      atualizarCombustivel: (fuel) => dispatch({ type: 'UPDATE_FUEL', payload: fuel }),
      removerCombustivel: (id) => dispatch({ type: 'REMOVE_FUEL', payload: id }),
      atualizarRecebimento: (receipt) => dispatch({ type: 'UPDATE_RECEIPT', payload: receipt }),
      adicionarAlerta: (alert) => dispatch({ type: 'ADD_ALERT', payload: alert }),
      removerAlerta: (id) => dispatch({ type: 'REMOVE_ALERT', payload: id }),
      setMetaFaturamento: (valor) => dispatch({ type: 'SET_META_FATURAMENTO', payload: valor }),
      setMetaLucro: (valor) => dispatch({ type: 'SET_META_LUCRO', payload: valor }),
      setMetaDespesas: (valor) => dispatch({ type: 'SET_META_DESPESAS', payload: valor }),
      setPrecoMedioCombustivel: (valor) => dispatch({ type: 'SET_PRECO_COMBUSTIVEL', payload: valor }),
      setConsumoMedioVeiculo: (valor) => dispatch({ type: 'SET_CONSUMO_VEICULO', payload: valor }),
      salvarEstado,
      carregarEstado,
    }),
    [salvarEstado, carregarEstado]
  );

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de FinanceProvider');
  }
  return context;
}
