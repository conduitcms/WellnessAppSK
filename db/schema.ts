export interface User {
  id: string;
  email: string;
  name: string | null;
  // Add other user fields as needed
}

export interface Symptom {
  id: number;
  category: string;
  severity: number;
  description: string;
  date: string;
  mood: string;
  moodIntensity: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const users = {
  // Add your user-related database operations here
};
