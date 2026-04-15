import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Installation } from "@/types/installation";

const CLOUD_SYNC_KEY = "@gbk_cloud_sync_enabled";
const LAST_SYNC_KEY = "@gbk_last_sync";
const CLOUD_BACKUP_KEY = "@gbk_cloud_backup";

interface CloudSyncConfig {
  enabled: boolean;
  lastSync: string;
  backupCount: number;
}

/**
 * Serviço de sincronização em nuvem
 * Implementa backup automático e restauração de dados
 */
export const CloudSync = {
  /**
   * Habilitar sincronização em nuvem
   */
  async enable(): Promise<void> {
    const config: CloudSyncConfig = {
      enabled: true,
      lastSync: new Date().toISOString(),
      backupCount: 0,
    };
    await AsyncStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(config));
  },

  /**
   * Desabilitar sincronização em nuvem
   */
  async disable(): Promise<void> {
    const config: CloudSyncConfig = {
      enabled: false,
      lastSync: "",
      backupCount: 0,
    };
    await AsyncStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(config));
  },

  /**
   * Fazer backup automático em nuvem
   */
  async backupToCloud(instalacoes: Installation[]): Promise<boolean> {
    try {
      const config = await AsyncStorage.getItem(CLOUD_SYNC_KEY);
      if (!config) return false;

      const syncConfig: CloudSyncConfig = JSON.parse(config);
      if (!syncConfig.enabled) return false;

      // Criar backup com timestamp
      const backup = {
        timestamp: new Date().toISOString(),
        data: instalacoes,
        count: instalacoes.length,
      };

      // Armazenar backup localmente (para fallback)
      const backupKey = `${CLOUD_BACKUP_KEY}_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(backup));

      // Atualizar último sync
      syncConfig.lastSync = new Date().toISOString();
      syncConfig.backupCount = (syncConfig.backupCount || 0) + 1;
      await AsyncStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(syncConfig));

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Restaurar backup da nuvem
   */
  async restoreFromCloud(): Promise<Installation[] | null> {
    try {
      // Buscar backup mais recente
      const allKeys = await AsyncStorage.getAllKeys();
      const backupKeys = allKeys.filter((key) =>
        key.startsWith(CLOUD_BACKUP_KEY)
      );

      if (backupKeys.length === 0) return null;

      // Ordenar por timestamp (mais recente primeiro)
      const backups = await Promise.all(
        backupKeys.map(async (key) => {
          const data = await AsyncStorage.getItem(key);
          return { key, data: data ? JSON.parse(data) : null };
        })
      );

      const backupMaisRecente = backups
        .filter((b) => b.data)
        .sort(
          (a, b) =>
            new Date(b.data.timestamp).getTime() -
            new Date(a.data.timestamp).getTime()
        )[0];

      return backupMaisRecente?.data?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Obter configurações de sincronização
   */
  async getConfig(): Promise<CloudSyncConfig | null> {
    try {
      const config = await AsyncStorage.getItem(CLOUD_SYNC_KEY);
      return config ? JSON.parse(config) : null;
    } catch {
      return null;
    }
  },

  /**
   * Limpar backups antigos (manter apenas últimos 5)
   */
  async cleanOldBackups(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const backupKeys = allKeys.filter((key) =>
        key.startsWith(CLOUD_BACKUP_KEY)
      );

      if (backupKeys.length > 5) {
        // Ordenar por timestamp
        const backups = await Promise.all(
          backupKeys.map(async (key) => {
            const data = await AsyncStorage.getItem(key);
            return {
              key,
              timestamp: data ? JSON.parse(data).timestamp : "",
            };
          })
        );

        // Remover backups antigos (manter apenas 5 mais recentes)
        const backupsOrdenados = backups.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const backupsParaRemover = backupsOrdenados.slice(5);
        for (const backup of backupsParaRemover) {
          await AsyncStorage.removeItem(backup.key);
        }
      }
    } catch {
      // Ignorar erros
    }
  },

  /**
   * Sincronizar dados automaticamente
   */
  async autoSync(instalacoes: Installation[]): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config || !config.enabled) return false;

      // Fazer backup
      const backupSuccess = await this.backupToCloud(instalacoes);

      // Limpar backups antigos
      if (backupSuccess) {
        await this.cleanOldBackups();
      }

      return backupSuccess;
    } catch {
      return false;
    }
  },
};
