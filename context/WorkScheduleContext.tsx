import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Dias da semana: 0 = segunda, 1 = terça, 2 = quarta, 3 = quinta, 4 = sexta, 5 = sábado, 6 = domingo
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface WorkScheduleContextType {
  workDays: DayOfWeek[];
  setWorkDays: (days: DayOfWeek[]) => Promise<void>;
  isWorkDay: (day: DayOfWeek) => boolean;
  workDayNames: string[];
}

const WorkScheduleContext = createContext<WorkScheduleContextType | undefined>(
  undefined
);

export function WorkScheduleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workDays, setWorkDaysState] = useState<DayOfWeek[]>([0, 1, 2, 3, 4]); // Padrão: seg-sex

  const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  // Carregar dias de trabalho ao iniciar
  useEffect(() => {
    loadWorkDays();
  }, []);

  async function loadWorkDays() {
    try {
      const stored = await AsyncStorage.getItem("@gbk_work_days");
      if (stored) {
        const parsed = JSON.parse(stored) as DayOfWeek[];
        setWorkDaysState(parsed);
      }
    } catch (error) {
      console.error("Erro ao carregar dias de trabalho:", error);
    }
  }

  async function setWorkDays(days: DayOfWeek[]) {
    try {
      setWorkDaysState(days);
      await AsyncStorage.setItem("@gbk_work_days", JSON.stringify(days));
    } catch (error) {
      console.error("Erro ao salvar dias de trabalho:", error);
    }
  }

  function isWorkDay(day: DayOfWeek): boolean {
    return workDays.includes(day);
  }

  const workDayNames = workDays.map((day) => dayNames[day]);

  return (
    <WorkScheduleContext.Provider
      value={{
        workDays,
        setWorkDays,
        isWorkDay,
        workDayNames,
      }}
    >
      {children}
    </WorkScheduleContext.Provider>
  );
}

export function useWorkSchedule(): WorkScheduleContextType {
  const context = useContext(WorkScheduleContext);
  if (!context) {
    throw new Error(
      "useWorkSchedule deve ser usado dentro de WorkScheduleProvider"
    );
  }
  return context;
}
