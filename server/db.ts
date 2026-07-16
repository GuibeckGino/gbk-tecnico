import { eq, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, installations, InsertInstallation, Installation, syncLog, InsertSyncLog } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Funções de sincronização para GBK Técnico
export async function saveInstallation(userId: number, installation: InsertInstallation): Promise<Installation | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save installation: database not available");
    return null;
  }

  try {
    const data = { ...installation, userId };
    await db.insert(installations).values(data).onDuplicateKeyUpdate({
      set: data,
    });
    
    // Log da sincronização
    await db.insert(syncLog).values({
      userId,
      action: "create",
      table: "installations",
      recordId: installation.id,
      data: JSON.stringify(data),
    });
    
    return data as Installation;
  } catch (error) {
    console.error("[Database] Failed to save installation:", error);
    return null;
  }
}

export async function getInstallationsByUser(userId: number): Promise<Installation[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get installations: database not available");
    return [];
  }

  try {
    return await db.select().from(installations).where(eq(installations.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get installations:", error);
    return [];
  }
}

export async function deleteInstallation(userId: number, installationId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete installation: database not available");
    return false;
  }

  try {
    await db.delete(installations).where(eq(installations.id, installationId));
    
    // Log da sincronização
    await db.insert(syncLog).values({
      userId,
      action: "delete",
      table: "installations",
      recordId: installationId,
    });
    
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete installation:", error);
    return false;
  }
}

export async function getSyncLog(userId: number, since?: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sync log: database not available");
    return [];
  }

  try {
    let query: any = db.select().from(syncLog).where(eq(syncLog.userId, userId));
    
    if (since) {
      query = query.where(gte(syncLog.syncedAt, since));
    }
    
    return await query.orderBy(desc(syncLog.syncedAt));
  } catch (error) {
    console.error("[Database] Failed to get sync log:", error);
    return [];
  }
}
