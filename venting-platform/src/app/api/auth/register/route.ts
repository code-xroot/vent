// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { User } from '@/lib/types/user'; // Assuming User type is defined in src/lib/types/user.ts

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required.' }, { status: 400 });
    }
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
        return NextResponse.json({ error: 'Invalid input types. Email, password, and name must be strings.' }, { status: 400 });
    }
    // Basic email format validation (consider a more robust library for production)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }
    if (password.length < 6) { // Example minimum password length
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }
    if (name.trim().length === 0 || name.length > 50) {
        return NextResponse.json({ error: 'Name must be between 1 and 50 characters.' }, { status: 400 });
    }


    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<User>('users'); // 'users' is the default collection for NextAuth MongoDBAdapter

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 }); // 409 Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10-12 is common

    // Create new user document
    // The MongoDBAdapter for NextAuth expects certain fields.
    // We must provide `email`, and `name`. `image` is optional.
    // `emailVerified` can be null if not doing email verification.
    // `createdAt` and `updatedAt` are typically handled by the adapter or MongoDB.
    const newUserDocument: Omit<User, '_id' | 'createdAt' | 'updatedAt'> = { // Adapter handles _id, createdAt, updatedAt
      name: name.trim(),
      email: email.toLowerCase(),
      hashedPassword: hashedPassword,
      image: null, // Or generate a default avatar link
      emailVerified: null, // Since email verification is not needed for this step
    };

    // The adapter would normally handle user creation.
    // If we are manually inserting into the 'users' collection, we need to ensure
    // the structure is compatible with what the adapter expects, especially if we
    // want NextAuth to seamlessly manage these users for sessions after login.
    // The MongoDBAdapter typically adds `createdAt` and `updatedAt` automatically.

    const result = await usersCollection.insertOne(newUserDocument as User); // Cast to User after omitting _id for insertion

    if (!result.insertedId) {
        return NextResponse.json({ error: 'Failed to register user.' }, { status: 500 });
    }

    // Don't return the hashedPassword
    const createdUserForResponse = {
        id: result.insertedId.toString(),
        name: newUserDocument.name,
        email: newUserDocument.email,
        image: newUserDocument.image
    };

    return NextResponse.json({ message: 'User registered successfully.', user: createdUserForResponse }, { status: 201 });

  } catch (error) {
    console.error('User registration failed:', error);
    // Check for duplicate key error for email if a unique index is on email field
    if ((error as any).code === 11000 && (error as any).keyPattern?.email) {
        return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
