import { type Express, type Request, type Response, type NextFunction } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { users, symptoms, supplements, healthMetrics, insertSymptomSchema, insertSupplementSchema } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const { passport, crypto } = setupAuth(app);

  // Auth routes
  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password, name } = req.body;
      
      // Check for existing username or email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const hashedPassword = await crypto.hash(password);
      const [user] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          name,
        })
        .returning();

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ message: "Registration successful" });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reset-password-request", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      await db
        .update(users)
        .set({
          resetToken,
          resetTokenExpiry,
        })
        .where(eq(users.id, user.id));

      // Send reset email using SendGrid (implement this)
      // TODO: Implement email sending

      res.json({ message: "Password reset email sent" });
    } catch (error) {
      res.status(500).send("Error processing password reset request");
    }
  });

  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, token))
        .limit(1);

      if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        return res.status(400).send("Invalid or expired reset token");
      }

      const hashedPassword = await crypto.hash(newPassword);
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Password reset successful" });
    } catch (error) {
      res.status(500).send("Error resetting password");
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req: Request, res: Response) => {
    res.json({ message: "Login successful" });
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) return res.status(500).send("Logout failed");
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not authenticated");
  });

  // Middleware to ensure user is authenticated
  const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send("Not authenticated");
  };

  // Symptoms routes
  app.get("/api/symptoms", ensureAuth, async (req: Request, res: Response) => {
    const userSymptoms = await db
      .select()
      .from(symptoms)
      .where(eq(symptoms.userId, req.user!.id))
      .orderBy(symptoms.date);
    res.json(userSymptoms);
  });

  app.post("/api/symptoms", ensureAuth, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertSymptomSchema.safeParse({ ...req.body, userId: req.user!.id });
      if (!result.success) {
        console.error('Symptom validation failed:', result.error);
        return res.status(400).json({
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      // Validate severity range
      if (result.data.severity < 1 || result.data.severity > 10) {
        return res.status(400).json({
          message: "Severity must be between 1 and 10",
        });
      }

      const [symptom] = await db.insert(symptoms).values(result.data).returning();
      console.log('Created symptom:', symptom);
      res.json(symptom);
    } catch (error) {
      console.error('Error creating symptom:', error);
      res.status(500).json({
        message: "Failed to create symptom",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Supplements routes
  app.get("/api/supplements", ensureAuth, async (req: Request, res: Response) => {
    try {
      const userSupplements = await db
        .select()
        .from(supplements)
        .where(eq(supplements.userId, req.user!.id));
      res.json(userSupplements);
    } catch (error) {
      console.error('Error fetching supplements:', error);
      res.status(500).json({
        message: "Failed to fetch supplements",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/supplements", ensureAuth, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertSupplementSchema.safeParse({ ...req.body, userId: req.user!.id });
      if (!result.success) {
        console.error('Supplement validation failed:', result.error);
        return res.status(400).json({
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      // Handle reminder time
      if (result.data.reminderEnabled && result.data.reminderTime) {
        result.data.reminderTime = new Date(result.data.reminderTime);
      }

      const [supplement] = await db.insert(supplements).values(result.data).returning();
      console.log('Created supplement:', supplement);
      res.json(supplement);
    } catch (error) {
      console.error('Error creating supplement:', error);
      res.status(500).json({
        message: "Failed to create supplement",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Health metrics routes
  app.get("/api/health-metrics", ensureAuth, async (req: Request, res: Response) => {
    const userMetrics = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, req.user!.id))
      .orderBy(healthMetrics.date);
    res.json(userMetrics);
  });

  app.post("/api/health-metrics", ensureAuth, async (req: Request, res: Response) => {
    const data = { ...req.body, userId: req.user!.id };
    const [metric] = await db.insert(healthMetrics).values(data).returning();
    res.json(metric);
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).send("Internal Server Error");
  });
}
