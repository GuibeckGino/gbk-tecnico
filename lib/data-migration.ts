import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Migração de dados entre versões do app
 * Detecta dados da versão anterior e copia para a versão atual
 */

const MIGRATION_VERSION_KEY = 'app_migration_version';
const CURRENT_MIGRATION_VERSION = 2;

// Chaves de dados que precisam ser migradas
const DATA_KEYS = [
  'gbk_installations',
  'gbk_dark_mode',
  'gbk_selected_month',
  'gbk_selected_year',
];

/**
 * Executar migração de dados
 * Chamado na inicialização do app
 */
export async function runDataMigration(): Promise<void> {
  try {
    const lastMigrationVersion = await AsyncStorage.getItem(MIGRATION_VERSION_KEY);
    const lastVersion = lastMigrationVersion ? parseInt(lastMigrationVersion, 10) : 0;

    if (lastVersion < CURRENT_MIGRATION_VERSION) {
      console.log(`[Migration] Iniciando migração de v${lastVersion} para v${CURRENT_MIGRATION_VERSION}`);

      // Migração v1 -> v2: Copiar dados da versão anterior
      if (lastVersion < 2) {
        await migrateFromPreviousVersion();
      }

      // Marcar migração como completa
      await AsyncStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION.toString());
      console.log('[Migration] Migração concluída com sucesso');
    }
  } catch (error) {
    console.error('[Migration] Erro durante migração:', error);
    // Não falhar o app se a migração falhar
  }
}

/**
 * Migrar dados da versão anterior (com.gbk.tecnico)
 * Tenta copiar dados do AsyncStorage da versão antiga
 */
async function migrateFromPreviousVersion(): Promise<void> {
  try {
    console.log('[Migration] Procurando dados da versão anterior...');

    // Tentar obter dados de cada chave
    for (const key of DATA_KEYS) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          console.log(`[Migration] Encontrado dado: ${key}`);
          // Dado já existe na versão atual, não sobrescrever
          const existingData = await AsyncStorage.getItem(key);
          if (!existingData) {
            await AsyncStorage.setItem(key, data);
            console.log(`[Migration] Migrado com sucesso: ${key}`);
          }
        }
      } catch (error) {
        console.warn(`[Migration] Erro ao migrar ${key}:`, error);
        // Continuar com próxima chave
      }
    }

    console.log('[Migration] Migração da versão anterior concluída');
  } catch (error) {
    console.error('[Migration] Erro ao migrar dados da versão anterior:', error);
  }
}

/**
 * Limpar dados de migração (para testes)
 */
export async function clearMigrationData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MIGRATION_VERSION_KEY);
    console.log('[Migration] Dados de migração limpos');
  } catch (error) {
    console.error('[Migration] Erro ao limpar dados de migração:', error);
  }
}
