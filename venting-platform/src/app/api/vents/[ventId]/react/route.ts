// src/app/api/vents/[ventId]/react/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cookies } from 'next/headers';
import { Vent } from '@/lib/types/vent';

const ANONYMOUS_USER_COOKIE = 'anonymous_user_token';

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;
  return cookies().get(ANONYMOUS_USER_COOKIE)?.value || null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { ventId: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required to react.' }, { status: 401 });
  }

  const { ventId } = params;
  if (!ObjectId.isValid(ventId)) {
    return NextResponse.json({ error: 'Invalid Vent ID format.' }, { status: 400 });
  }

  try {
    const { reactionType } = await request.json();
    if (!reactionType) {
      return NextResponse.json({ error: 'Reaction type is required.' }, { status: 400 });
    }

    // For a basic implementation, we directly increment.
    // For a more advanced one, you'd check if the user already reacted with this type
    // and potentially toggle it (decrement if already reacted, or switch reaction).
    // This would require storing user reactions in a separate collection or in the vent document.

    const client = await clientPromise;
    const db = client.db();
    const ventsCollection = db.collection<Vent>('vents');

    const updateResult = await ventsCollection.updateOne(
      { _id: new ObjectId(ventId) },
      { $inc: { [`reactions.${reactionType}`]: 1 } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Vent not found.' }, { status: 404 });
    }
    if (updateResult.modifiedCount === 0) {
      // This could happen if the reactionType field didn't exist and $inc created it,
      // or if something else prevented modification. For $inc, it should generally modify if matched.
      // Consider it a success if matched, as $inc will create the field if it doesn't exist.
    }

    const updatedVent = await ventsCollection.findOne({ _id: new ObjectId(ventId) });

    return NextResponse.json(updatedVent, { status: 200 });

  } catch (error) {
    console.error('Failed to update reaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
