import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@gbk_mes_selecionado";

interface MonthContextType {
  mes: number; // 0-11
  ano: number;
  mesAnoFormatado: string; // "Abril de 2026"
  proximoMes: () => void;
  mesPrevio: () => void;
  irParaMes: (mes: number, ano: number) => void;
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [mes, setMes] = useState<number>(new Date().getMonth());
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [carregado, setCarregado] = useState(false);

  // Carregar mês selecionado do AsyncStorage
  useEffect(() => {
    async function carregarMes() {
      try {
        const salvo = await AsyncStorage.getItem(STORAGE_KEY);
        if (salvo) {
          const { mes: m, ano: a } = JSON.parse(salvo);
          setMes(m);
          setAno(a);
        }
      } catch {
        // Usar padrão se houver erro
      } finally {
        setCarregado(true);
      }
    }
    carregarMes();
  }, []);

  // Salvar mês selecionado no AsyncStorage
  useEffect(() => {
    if (carregado) {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mes, ano })
      ).catch(() => {});
    }
  }, [mes, ano, carregado]);

  function proximoMes() {
    if (mes === 11) {
      setMes(0);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  }

  function mesPrevio() {
    if (mes === 0) {
      setMes(11);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  }

  function irParaMes(novoMes: number, novoAno: number) {
    setMes(novoMes);
    setAno(novoAno);
  }

  const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const mesAnoFormatado = `${nomesMeses[mes]} de ${ano}`;

  const value: MonthContextType = {
    mes,
    ano,
    mesAnoFormatado,
    proximoMes,
    mesPrevio,
    irParaMes,
  };

  if (!carregado) {
    return null; // Aguardar carregamento
  }

  return (
    <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
  );
}

export function useMonth(): MonthContextType {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error("useMonth deve ser usado dentro de MonthProvider");
  }
  return context;
}

/**
 * Filtra instalações pelo mês/ano selecionado
 * Espera data no formato "dd/mm/aaaa"
 */
export function filtrarPorMes(
  instalacoes: any[],
  mes: number,
  ano: number
): any[] {
  return instalacoes.filter((inst) => {
    const partes = inst.data.split("/");
    if (partes.length !== 3) return false;
    const instMes = parseInt(partes[1], 10) - 1; // Converter para 0-11
    const instAno = parseInt(partes[2], 10);
    return instMes === mes && instAno === ano;
  });
}
