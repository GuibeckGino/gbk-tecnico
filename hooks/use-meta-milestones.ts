import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MetaMilestone {
  percentage: number;
  reached: boolean;
  message: string;
}

/**
 * Hook para detectar quando o usuário atinge 50%, 75% e 90% da meta
 * Armazena em AsyncStorage para não mostrar notificação duplicada
 */
export function useMetaMilestones(currentValue: number, targetValue: number, monthKey: string) {
  const [milestones, setMilestones] = useState<MetaMilestone[]>([
    { percentage: 50, reached: false, message: '🎯 Você atingiu 50% da meta!' },
    { percentage: 75, reached: false, message: '🔥 Você atingiu 75% da meta!' },
    { percentage: 90, reached: false, message: '⚡ Você atingiu 90% da meta!' },
  ]);

  const [newMilestoneReached, setNewMilestoneReached] = useState<MetaMilestone | null>(null);
  const processedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const checkMilestones = async () => {
      if (targetValue === 0) return;

      const currentPercentage = (currentValue / targetValue) * 100;
      const storageKey = `milestone_${monthKey}`;

      try {
        // Carregar milestones já notificados
        const storedMilestones = await AsyncStorage.getItem(storageKey);
        const notifiedPercentages = storedMilestones ? JSON.parse(storedMilestones) : [];

        // Verificar cada milestone
        const newMilestones = milestones.map((milestone) => {
          const isReached = currentPercentage >= milestone.percentage;
          const wasNotified = notifiedPercentages.includes(milestone.percentage);

          // Se atingiu e ainda não foi notificado
          if (isReached && !wasNotified && !processedRef.current.has(milestone.percentage)) {
            processedRef.current.add(milestone.percentage);
            setNewMilestoneReached(milestone);

            // Salvar que este milestone foi notificado
            const updated = [...notifiedPercentages, milestone.percentage];
            AsyncStorage.setItem(storageKey, JSON.stringify(updated));

            return { ...milestone, reached: true };
          }

          return { ...milestone, reached: isReached };
        });

        setMilestones(newMilestones);
      } catch (error) {
        console.error('Erro ao verificar milestones:', error);
      }
    };

    checkMilestones();
  }, [currentValue, targetValue, monthKey]);

  // Limpar milestone após mostrar
  const dismissMilestone = () => {
    setNewMilestoneReached(null);
  };

  // Resetar milestones para novo mês
  const resetMilestones = async () => {
    processedRef.current.clear();
    setMilestones([
      { percentage: 50, reached: false, message: '🎯 Você atingiu 50% da meta!' },
      { percentage: 75, reached: false, message: '🔥 Você atingiu 75% da meta!' },
      { percentage: 90, reached: false, message: '⚡ Você atingiu 90% da meta!' },
    ]);
    const storageKey = `milestone_${monthKey}`;
    await AsyncStorage.removeItem(storageKey);
  };

  return {
    milestones,
    newMilestoneReached,
    dismissMilestone,
    resetMilestones,
  };
}
