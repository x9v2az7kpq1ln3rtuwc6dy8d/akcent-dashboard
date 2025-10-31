import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { insertUserSchema, insertInviteCodeSchema, insertAuditLogSchema } from "@shared/schema";
import { z } from "zod";

const PgSession = connectPgSimple(session);

// Session user type
declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    role: string;
  }
}

// Helper to get client IP
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.socket.remoteAddress || 
         'unknown';
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Admin middleware
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session with PostgreSQL store
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "akcent-dashboard-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, inviteCode } = req.body;

      // Validate input
      const validatedData = z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6),
        inviteCode: z.string().min(1),
      }).parse({ username, password, inviteCode });

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Validate invite code
      const invite = await storage.getInviteCode(validatedData.inviteCode);
      if (!invite) {
        return res.status(400).json({ message: "Invalid invite code" });
      }
      if (invite.revoked) {
        return res.status(400).json({ message: "Invite code has been revoked" });
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invite code has expired" });
      }
      if (invite.usesRemaining <= 0) {
        return res.status(400).json({ message: "Invite code has no uses remaining" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        role: "user",
        active: true,
      });

      // Update invite code uses
      await storage.updateInviteCodeUses(invite.id, invite.usesRemaining - 1);

      // Log registration
      await storage.createAuditLog({
        userId: user.id,
        username: user.username,
        action: "USER_REGISTERED",
        ip: getClientIp(req),
      });

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Validate input
      const validatedData = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }).parse({ username, password });

      // Get user
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.active) {
        return res.status(403).json({ message: "Account has been deactivated" });
      }

      // Verify password
      const isValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      // Log login
      await storage.createAuditLog({
        userId: user.id,
        username: user.username,
        action: "USER_LOGIN",
        ip: getClientIp(req),
      });

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const username = req.session.username!;

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }

      // Log logout (without waiting)
      storage.createAuditLog({
        userId,
        username,
        action: "USER_LOGOUT",
        ip: getClientIp(req),
      }).catch(console.error);

      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      active: user.active,
    });
  });

  // Invite code routes
  app.get("/api/invite-codes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const inviteCodes = await storage.getAllInviteCodes();
      res.json(inviteCodes);
    } catch (error) {
      console.error("Get invite codes error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invite-codes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, uses, expiresAt } = req.body;

      // Generate random code if not provided
      const inviteCode = code || Math.random().toString(36).substring(2, 15).toUpperCase();

      // Validate input
      const validatedData = z.object({
        code: z.string().min(1),
        uses: z.number().min(1).default(1),
        expiresAt: z.string().optional(),
      }).parse({ code: inviteCode, uses: uses || 1, expiresAt });

      // Check if code already exists
      const existing = await storage.getInviteCode(validatedData.code);
      if (existing) {
        return res.status(400).json({ message: "Invite code already exists" });
      }

      // Create invite code
      const newInviteCode = await storage.createInviteCode({
        code: validatedData.code,
        uses: validatedData.uses,
        usesRemaining: validatedData.uses,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        revoked: false,
        createdBy: req.session.userId!,
      });

      // Log action
      await storage.createAuditLog({
        userId: req.session.userId!,
        username: req.session.username!,
        action: "INVITE_CODE_CREATED",
        ip: getClientIp(req),
      });

      res.json(newInviteCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      console.error("Create invite code error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invite-codes/:id/revoke", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invite code ID" });
      }

      const inviteCode = await storage.revokeInviteCode(id);
      if (!inviteCode) {
        return res.status(404).json({ message: "Invite code not found" });
      }

      // Log action
      await storage.createAuditLog({
        userId: req.session.userId!,
        username: req.session.username!,
        action: "INVITE_CODE_REVOKED",
        ip: getClientIp(req),
      });

      res.json(inviteCode);
    } catch (error) {
      console.error("Revoke invite code error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes
  app.get("/api/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/toggle", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admin from deactivating themselves
      if (user.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot deactivate your own account" });
      }

      const updatedUser = await storage.updateUserStatus(id, !user.active);

      // Log action
      await storage.createAuditLog({
        userId: req.session.userId!,
        username: req.session.username!,
        action: updatedUser?.active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        ip: getClientIp(req),
      });

      res.json({
        id: updatedUser!.id,
        username: updatedUser!.username,
        role: updatedUser!.role,
        active: updatedUser!.active,
      });
    } catch (error) {
      console.error("Toggle user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File download route
  app.get("/api/download/akcent-loader", requireAuth, async (req: Request, res: Response) => {
    try {
      // Log download
      await storage.createAuditLog({
        userId: req.session.userId!,
        username: req.session.username!,
        action: "FILE_DOWNLOADED",
        ip: getClientIp(req),
      });

      // Send the Akcent Loader file
      const filePath = process.cwd() + "/server/files/AkcentLoader.exe";
      res.download(filePath, "AkcentLoader.exe", (err) => {
        if (err) {
          console.error("Download error:", err);
          if (!res.headersSent) {
            res.status(404).json({ message: "File not found" });
          }
        }
      });
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
