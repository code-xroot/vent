// src/lib/types/user.ts
// This type can represent the user document stored in MongoDB by NextAuth adapter
import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null; // Or boolean depending on adapter version
  image?: string | null;
  hashedPassword?: string | null; // For credentials-based auth
  createdAt: Date;
  updatedAt: Date;
  // You might have other fields if you customize accounts, e.g. roles
}
