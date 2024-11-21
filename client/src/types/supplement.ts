import { z } from "zod";

export interface Supplement {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  reminderEnabled: boolean;
  reminderTime: string | null;
  lastTaken?: string | null;
  notes?: string;
}

export const supplementFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().nullable(),
  notes: z.string().optional()
});

export type SupplementFormData = z.infer<typeof supplementFormSchema>; 