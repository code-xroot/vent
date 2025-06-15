// src/lib/types/comment.ts
import { ObjectId } from 'mongodb';

export interface Comment {
  _id?: ObjectId;
  ventId: ObjectId;
  userId: string; // Anonymous session ID or NextAuth user ID
  isAnonymous: boolean;
  pseudonym?: string; // For anonymous users
  avatarSeed?: string; // For generating avatar for anonymous users
  content: string;
  createdAt: Date;
  // Potentially add reactions or replies to comments later
}
