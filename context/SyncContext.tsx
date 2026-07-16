import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Installation } from "@/types/installation";

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncInstallations: () => Promise<void>;
  saveInstallationToCloud: (installation: Installation) => Promise<boolean>;
  deleteInstallationFromCloud: (id: string) => Promise<boolean>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sincronizar instalações do servidor
  const syncInstallations = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      // TODO: Chamar API de sincronização quando integrado com backend
      // Por enquanto, apenas carrega do AsyncStorage
      const stored = await AsyncStorage.getItem("@gbk_instalacoes");
      if (stored) {
        await AsyncStorage.setItem("@gbk_instalacoes_cloud", stored);
      }
      
      setLastSyncTime(new Date());
      await AsyncStorage.setItem("@gbk_last_sync", new Date().toISOString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao sincronizar";
      setSyncError(errorMessage);
      console.error("[Sync] Error syncing installations:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Salvar instalação na nuvem
  const saveInstallationToCloud = useCallback(
    async (installation: Installation): Promise<boolean> => {
      try {
        // TODO: Chamar API de sincronização quando integrado com backend
        // Por enquanto, apenas salva no AsyncStorage
        const stored = await AsyncStorage.getItem("@gbk_instalacoes_cloud");
        const installations = stored ? JSON.parse(stored) : [];
        
        const index = installations.findIndex((i: Installation) => i.id === installation.id);
        if (index >= 0) {
          installations[index] = installation;
        } else {
          installations.push(installation);
        }
        
        await AsyncStorage.setItem("@gbk_instalacoes_cloud", JSON.stringify(installations));
        setLastSyncTime(new Date());
        return true;
      } catch (error) {
        console.error("[Sync] Error saving installation to cloud:", error);
        return false;
      }
    },
    []
  );

  // Deletar instalação da nuvem
  const deleteInstallationFromCloud = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        // TODO: Chamar API de sincronização quando integrado com backend
        // Por enquanto, apenas deleta do AsyncStorage
        const stored = await AsyncStorage.getItem("@gbk_instalacoes_cloud");
        if (stored) {
          const installations = JSON.parse(stored).filter((i: Installation) => i.id !== id);
          await AsyncStorage.setItem("@gbk_instalacoes_cloud", JSON.stringify(installations));
        }
        
        setLastSyncTime(new Date());
        return true;
      } catch (error) {
        console.error("[Sync] Error deleting installation from cloud:", error);
        return false;
      }
    },
    []
  );

  // Carregar último tempo de sincronização ao montar
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const lastSync = await AsyncStorage.getItem("@gbk_last_sync");
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }
      } catch (error) {
        console.error("[Sync] Error loading last sync time:", error);
      }
    };

    loadLastSyncTime();
  }, []);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        lastSyncTime,
        syncError,
        syncInstallations,
        saveInstallationToCloud,
        deleteInstallationFromCloud,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
