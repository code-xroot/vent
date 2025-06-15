// src/lib/types/prompt.ts
import { ObjectId } from 'mongodb';

export interface Prompt {
  _id?: ObjectId;
  text: string;
  date: string; // Store date as YYYY-MM-DD string for easy querying
  isActive: boolean; // To easily enable/disable a prompt for a given day
  createdAt?: Date; // Standard timestamp
  updatedAt?: Date; // Standard timestamp
}
