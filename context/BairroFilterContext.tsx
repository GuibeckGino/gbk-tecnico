import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BAIRROS_LEM } from '@/lib/bairros-lem';

interface BairroFilterContextType {
  bairroSelecionado: string | null;
  setBairroSelecionado: (bairro: string | null) => void;
  limparFiltro: () => void;
}

const BairroFilterContext = createContext<BairroFilterContextType | undefined>(undefined);

export function BairroFilterProvider({ children }: { children: React.ReactNode }) {
  const [bairroSelecionado, setBairroSelecionadoState] = useState<string | null>(null);
  const [carregado, setCarregado] = useState(false);

  // Carregar filtro salvo ao iniciar
  useEffect(() => {
    const carregarFiltro = async () => {
      try {
        const filtroSalvo = await AsyncStorage.getItem('bairroFiltro');
        if (filtroSalvo && BAIRROS_LEM.includes(filtroSalvo)) {
          setBairroSelecionadoState(filtroSalvo);
        }
      } catch (error) {
        console.error('Erro ao carregar filtro de bairro:', error);
      } finally {
        setCarregado(true);
      }
    };

    carregarFiltro();
  }, []);

  // Salvar filtro quando mudar
  const setBairroSelecionado = async (bairro: string | null) => {
    setBairroSelecionadoState(bairro);
    try {
      if (bairro) {
        await AsyncStorage.setItem('bairroFiltro', bairro);
      } else {
        await AsyncStorage.removeItem('bairroFiltro');
      }
    } catch (error) {
      console.error('Erro ao salvar filtro de bairro:', error);
    }
  };

  const limparFiltro = async () => {
    setBairroSelecionadoState(null);
    try {
      await AsyncStorage.removeItem('bairroFiltro');
    } catch (error) {
      console.error('Erro ao limpar filtro de bairro:', error);
    }
  };

  if (!carregado) {
    return null; // Ou um loading spinner
  }

  return (
    <BairroFilterContext.Provider value={{ bairroSelecionado, setBairroSelecionado, limparFiltro }}>
      {children}
    </BairroFilterContext.Provider>
  );
}

export function useBairroFilter() {
  const context = useContext(BairroFilterContext);
  if (!context) {
    throw new Error('useBairroFilter deve ser usado dentro de BairroFilterProvider');
  }
  return context;
}
