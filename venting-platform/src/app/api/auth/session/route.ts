import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';

const ANONYMOUS_USER_COOKIE = 'anonymous_user_token';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface AnonymousUser {
  _id: string;
  createdAt: Date;
  // We can add pseudonym and avatar fields later
}

export async function GET(request: Request) {
  const { cookies } = request;
  const anonymousUserToken = cookies.get(ANONYMOUS_USER_COOKIE)?.value;

  try {
    const client = await clientPromise;
    const db = client.db(); // Uses the default DB specified in MONGODB_URI
    const anonymousUsersCollection = db.collection<AnonymousUser>('anonymousUsers');

    if (anonymousUserToken) {
      // Validate token if necessary, or just assume it's valid for now if it exists
      // Potentially fetch user data if needed
      console.log('Existing anonymous user token:', anonymousUserToken);
      // For now, just confirm the token exists
      const existingUser = await anonymousUsersCollection.findOne({ _id: anonymousUserToken });
      if (existingUser) {
        return NextResponse.json({ userId: anonymousUserToken, existing: true }, { status: 200 });
      }
    }

    // Create new anonymous user
    const newUserId = uuidv4();
    const newUser: AnonymousUser = {
      _id: newUserId,
      createdAt: new Date(),
    };

    await anonymousUsersCollection.insertOne(newUser);

    const cookie = serialize(ANONYMOUS_USER_COOKIE, newUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: MAX_AGE,
      path: '/',
      sameSite: 'lax',
    });

    console.log('New anonymous user created:', newUserId);
    const response = NextResponse.json({ userId: newUserId, created: true }, { status: 201 });
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Error in anonymous session handling:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
