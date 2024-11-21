import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const symptoms = pgTable('symptoms', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  category: text('category').notNull(),
  severity: integer('severity').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  mood: text('mood'),
  moodIntensity: integer('mood_intensity'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Create Zod schemas for type validation
export const insertSymptomSchema = createInsertSchema(symptoms);
export const selectSymptomSchema = createSelectSchema(symptoms);

// Export the Symptom type
export type Symptom = z.infer<typeof selectSymptomSchema>;
