import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  InviteCode,
  InsertInviteCode,
  AuditLog,
  InsertAuditLog,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, active: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Invite code operations
  getInviteCode(code: string): Promise<InviteCode | undefined>;
  getInviteCodeById(id: number): Promise<InviteCode | undefined>;
  createInviteCode(inviteCode: InsertInviteCode): Promise<InviteCode>;
  updateInviteCodeUses(id: number, usesRemaining: number): Promise<InviteCode | undefined>;
  revokeInviteCode(id: number): Promise<InviteCode | undefined>;
  getAllInviteCodes(): Promise<InviteCode[]>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStatus(id: number, active: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ active })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  // Invite code operations
  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const [inviteCode] = await db
      .select()
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, code))
      .limit(1);
    return inviteCode;
  }

  async getInviteCodeById(id: number): Promise<InviteCode | undefined> {
    const [inviteCode] = await db
      .select()
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.id, id))
      .limit(1);
    return inviteCode;
  }

  async createInviteCode(insertInviteCode: InsertInviteCode): Promise<InviteCode> {
    const [inviteCode] = await db
      .insert(schema.inviteCodes)
      .values(insertInviteCode)
      .returning();
    return inviteCode;
  }

  async updateInviteCodeUses(id: number, usesRemaining: number): Promise<InviteCode | undefined> {
    const [inviteCode] = await db
      .update(schema.inviteCodes)
      .set({ usesRemaining })
      .where(eq(schema.inviteCodes.id, id))
      .returning();
    return inviteCode;
  }

  async revokeInviteCode(id: number): Promise<InviteCode | undefined> {
    const [inviteCode] = await db
      .update(schema.inviteCodes)
      .set({ revoked: true })
      .where(eq(schema.inviteCodes.id, id))
      .returning();
    return inviteCode;
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    return db.select().from(schema.inviteCodes).orderBy(desc(schema.inviteCodes.createdAt));
  }

  // Audit log operations
  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(schema.auditLogs)
      .values(insertAuditLog)
      .returning();
    return log;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit);
  }
}

export const storage = new DbStorage();
