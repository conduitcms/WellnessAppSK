import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type User } from "@db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  randomBytes,
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      name?: string | null;
      dateOfBirth?: Date | null;
      goals: any[] | null;
      resetToken?: string | null;
      resetTokenExpiry?: Date | null;
    }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "women-health-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax',
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie!.secure = true;
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Try to find user by email or username
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          // If not found by email, try username
          const [userByUsername] = await db
            .select()
            .from(users)
            .where(eq(users.username, email))
            .limit(1);

          if (!userByUsername) {
            return done(null, false, { message: "Invalid email/username or password." });
          }

          const isMatch = await crypto.compare(password, userByUsername.password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid email/username or password." });
          }
          return done(null, userByUsername);
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email/username or password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, { id: user.id, username: user.username });
  });

  passport.deserializeUser(async (serialized: { id: number, username: string }, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, serialized.id))
        .limit(1);
      
      if (!user) {
        return done(new Error('User not found'));
      }
      
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  return { passport, crypto };
}
