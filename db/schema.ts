import { pgTable, text, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name"),
  dateOfBirth: timestamp("date_of_birth"),
  goals: json("goals").$type<any[] | null>().default([]).notNull(),
  resetToken: text("reset_token").unique(),
  resetTokenExpiry: timestamp("reset_token_expiry")
});

export const symptoms = pgTable("symptoms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  severity: integer("severity").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull()
});

export const supplements = pgTable("supplements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  reminderEnabled: boolean("reminder_enabled").default(false),
  reminderTime: timestamp("reminder_time"),
  notes: text("notes"),
  imageUrl: text("image_url")
});

export const healthMetrics = pgTable("health_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // heart_rate, sleep, steps
  value: json("value").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  source: text("source") // apple_health, google_fit, manual
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email("Invalid email format")
});
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  name: string | null;
  dateOfBirth: Date | null;
  goals: any[] | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
}
export type SelectUser = z.infer<typeof selectUserSchema>;

export const insertSymptomSchema = createInsertSchema(symptoms);
export const selectSymptomSchema = createSelectSchema(symptoms);
export type InsertSymptom = z.infer<typeof insertSymptomSchema>;
export type Symptom = z.infer<typeof selectSymptomSchema>;

export const insertSupplementSchema = createInsertSchema(supplements);
export const selectSupplementSchema = createSelectSchema(supplements);
export type InsertSupplement = z.infer<typeof insertSupplementSchema>;
export type Supplement = z.infer<typeof selectSupplementSchema>;

export const insertHealthMetricSchema = createInsertSchema(healthMetrics);
export const selectHealthMetricSchema = createSelectSchema(healthMetrics);
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type HealthMetric = z.infer<typeof selectHealthMetricSchema>;
