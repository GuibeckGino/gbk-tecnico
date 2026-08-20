import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { startOAuthLogin } from "@/constants/oauth";
import { useInstallations } from "@/context/InstallationsContext";
import { useAuth } from "@/hooks/use-auth";
import { cloudRecordToInstallation, mergeCloudAndLocal, removedCloudIds, type CloudInstallationRecord } from "@/lib/cloud-sync";
import { trpc } from "@/lib/trpc";
import type { Installation } from "@/types/installation";

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  accountName: string | null;
  syncInstallations: () => Promise<boolean>;
  saveInstallationToCloud: (installation: Installation) => Promise<boolean>;
  deleteInstallationFromCloud: (id: string) => Promise<boolean>;
  connectCloudAccount: () => Promise<void>;
  disconnectCloudAccount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

function fingerprint(installations: Installation[]) {
  return JSON.stringify([...installations].sort((a, b) => a.id.localeCompare(b.id)));
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { instalacoes, setInstallations } = useInstallations();
  const { user, loading: isAuthLoading, isAuthenticated, refresh, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncedFingerprint = useRef<string | null>(null);
  const syncedIds = useRef<Set<string>>(new Set());

  const listQuery = trpc.sync.getInstallations.useQuery(undefined, { enabled: false, retry: 1 });
  const saveMutation = trpc.sync.saveInstallation.useMutation();
  const deleteMutation = trpc.sync.deleteInstallation.useMutation();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const saveInstallationToCloud = useCallback(async (installation: Installation) => {
    if (!isAuthenticated) {
      setSyncError("Conecte sua conta para salvar na nuvem.");
      return false;
    }
    try {
      await saveMutation.mutateAsync({
        id: installation.id,
        cliente: installation.cliente,
        endereco: installation.endereco,
        tipoServico: installation.tipoServico,
        valor: 0,
        data: installation.data,
        observacoes: installation.observacoes,
        isFavorito: installation.isFavorito ? 1 : 0,
      });
      return true;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Não foi possível salvar na nuvem.");
      return false;
    }
  }, [isAuthenticated, saveMutation]);

  const deleteInstallationFromCloud = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      setSyncError("Conecte sua conta para excluir dados da nuvem.");
      return false;
    }
    try {
      await deleteMutation.mutateAsync({ id });
      return true;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Não foi possível excluir na nuvem.");
      return false;
    }
  }, [deleteMutation, isAuthenticated]);

  const syncInstallations = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      setSyncError("Conecte sua conta para sincronizar seus dados.");
      return false;
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await listQuery.refetch();
      if (response.error) throw response.error;

      const cloud = ((response.data?.data ?? []) as CloudInstallationRecord[]).map(cloudRecordToInstallation);
      const { merged, localOnly } = mergeCloudAndLocal(cloud, instalacoes);

      for (const installation of localOnly) {
        const saved = await saveInstallationToCloud(installation);
        if (!saved) throw new Error("Não foi possível enviar todos os dados para a nuvem.");
      }

      if (fingerprint(merged) !== fingerprint(instalacoes)) {
        await setInstallations(merged);
      }
      syncedFingerprint.current = fingerprint(merged);
      syncedIds.current = new Set(merged.map((installation) => installation.id));
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Erro ao sincronizar dados.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [instalacoes, isAuthenticated, listQuery, saveInstallationToCloud, setInstallations]);

  useEffect(() => {
    if (!isAuthenticated || isSyncing) return;
    const currentFingerprint = fingerprint(instalacoes);
    if (currentFingerprint === syncedFingerprint.current) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const currentIds = new Set(instalacoes.map((installation) => installation.id));
        for (const id of removedCloudIds(syncedIds.current, instalacoes)) {
          const removed = await deleteInstallationFromCloud(id);
          if (!removed) throw new Error("Uma exclusão não pôde ser enviada para a nuvem.");
        }
        for (const installation of instalacoes) {
          const saved = await saveInstallationToCloud(installation);
          if (!saved) throw new Error("Uma alteração não pôde ser enviada para a nuvem.");
        }
        syncedFingerprint.current = currentFingerprint;
        syncedIds.current = currentIds;
        setLastSyncTime(new Date());
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : "Erro ao atualizar a nuvem.");
      } finally {
        setIsSyncing(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [deleteInstallationFromCloud, instalacoes, isAuthenticated, isSyncing, saveInstallationToCloud]);

  const connectCloudAccount = useCallback(async () => {
    await startOAuthLogin();
    await refresh();
  }, [refresh]);

  const value = useMemo(() => ({
    isSyncing,
    lastSyncTime,
    syncError,
    isAuthenticated,
    isAuthLoading,
    accountName: user?.name ?? user?.email ?? null,
    syncInstallations,
    saveInstallationToCloud,
    deleteInstallationFromCloud,
    connectCloudAccount,
    disconnectCloudAccount: logout,
  }), [connectCloudAccount, deleteInstallationFromCloud, isAuthenticated, isAuthLoading, isSyncing, lastSyncTime, logout, saveInstallationToCloud, syncError, syncInstallations, user?.email, user?.name]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used inside SyncProvider");
  return context;
}
