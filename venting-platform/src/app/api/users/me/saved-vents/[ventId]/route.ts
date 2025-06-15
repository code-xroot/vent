// src/app/api/users/me/saved-vents/[ventId]/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SavedVent } from '@/lib/types/savedVent';

// DELETE: Unsave a vent
export async function DELETE(
  request: Request,
  { params }: { params: { ventId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const userId = session.user.id;
  const { ventId } = params;

  if (!ObjectId.isValid(ventId)) {
    return NextResponse.json({ error: 'Invalid Vent ID format.' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const savedVentsCollection = db.collection<SavedVent>('savedVents');

    const result = await savedVentsCollection.deleteOne({
      userId: userId,
      ventId: new ObjectId(ventId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Saved vent not found or already unsaved.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Vent unsaved successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Failed to unsave vent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
