import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useInstallations } from "./InstallationsContext";

// Configurar notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_STORAGE_KEY = "@gbk_reminder_settings";

interface ReminderSettings {
  enabled: boolean;
  diasSemRegistro: number;
}

interface ReminderContextValue {
  settings: ReminderSettings;
  updateSettings: (settings: ReminderSettings) => Promise<void>;
  diasDesdeUltimaInstalacao: number;
}

const ReminderContext = createContext<ReminderContextValue | null>(null);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { instalacoes } = useInstallations();
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    diasSemRegistro: 7,
  });
  const [diasDesdeUltimaInstalacao, setDiasDesdeUltimaInstalacao] = useState(0);

  // Carregar configurações ao iniciar
  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const dados = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
        if (dados) {
          setSettings(JSON.parse(dados));
        }
        // Solicitar permissão de notificação
        await Notifications.requestPermissionsAsync();
      } catch {
        // Usar padrão
      }
    }
    carregarConfiguracoes();
  }, []);

  // Calcular dias desde última instalação
  useEffect(() => {
    if (instalacoes.length === 0) {
      setDiasDesdeUltimaInstalacao(999);
      return;
    }

    const instalacaoMaisRecente = instalacoes.reduce((prev, current) => {
      const prevDate = new Date(prev.createdAt).getTime();
      const currentDate = new Date(current.createdAt).getTime();
      return currentDate > prevDate ? current : prev;
    });

    const hoje = new Date();
    const ultimaData = new Date(instalacaoMaisRecente.createdAt);
    const diferenca = Math.floor(
      (hoje.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24)
    );

    setDiasDesdeUltimaInstalacao(diferenca);
  }, [instalacoes]);

  const updateSettings = useCallback(async (novasConfigs: ReminderSettings) => {
    setSettings(novasConfigs);
    await AsyncStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify(novasConfigs)
    ).catch(() => {});
  }, []);

  // Verificar lembrete quando dias mudam
  useEffect(() => {
    if (
      settings.enabled &&
      diasDesdeUltimaInstalacao >= settings.diasSemRegistro
    ) {
      // Notificação será mostrada automaticamente
    }
  }, [settings, diasDesdeUltimaInstalacao]);

  return (
    <ReminderContext.Provider
      value={{
        settings,
        updateSettings,
        diasDesdeUltimaInstalacao,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminder(): ReminderContextValue {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error("useReminder deve ser usado dentro de ReminderProvider");
  }
  return context;
}
