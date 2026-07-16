import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabelas para sincronização de dados do app GBK Técnico
export const installations = mysqlTable("installations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  cliente: text("cliente").notNull(),
  endereco: text("endereco").notNull(),
  bairro: varchar("bairro", { length: 255 }),
  tipoServico: mysqlEnum("tipoServico", ["Instalação", "Tipo 3", "Mudança", "Empresarial"]).notNull(),
  valor: int("valor").notNull(),
  data: varchar("data", { length: 10 }).notNull(),
  observacoes: text("observacoes"),
  isFavorito: int("isFavorito").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installation = typeof installations.$inferSelect;
export type InsertInstallation = typeof installations.$inferInsert;

export const syncLog = mysqlTable("syncLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", ["create", "update", "delete"]).notNull(),
  table: varchar("table", { length: 64 }).notNull(),
  recordId: varchar("recordId", { length: 64 }).notNull(),
  data: text("data"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export type SyncLog = typeof syncLog.$inferSelect;
export type InsertSyncLog = typeof syncLog.$inferInsert;
