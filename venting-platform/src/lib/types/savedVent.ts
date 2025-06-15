// src/lib/types/savedVent.ts
import { ObjectId } from 'mongodb';

export interface SavedVent {
  _id?: ObjectId;
  userId: string; // ID of the user who saved the vent
  ventId: ObjectId; // ID of the vent that was saved
  createdAt: Date; // Timestamp when the vent was saved
}
