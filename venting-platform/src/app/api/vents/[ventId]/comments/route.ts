// src/app/api/vents/[ventId]/comments/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cookies } from 'next/headers';
import { Comment } from '@/lib/types/comment'; // Adjust path
import { Vent } from '@/lib/types/vent'; // Adjust path

const ANONYMOUS_USER_COOKIE = 'anonymous_user_token';

async function getUserInfo() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, isAnonymous: false, name: session.user.name, image: session.user.image };
  }
  const anonymousUserToken = cookies().get(ANONYMOUS_USER_COOKIE)?.value;
  if (anonymousUserToken) {
    return { userId: anonymousUserToken, isAnonymous: true };
  }
  return null;
}

// POST: Add a new comment to a vent
export async function POST(
  request: Request,
  { params }: { params: { ventId: string } }
) {
  const userInfo = await getUserInfo();
  if (!userInfo) {
    return NextResponse.json({ error: 'Authentication required to comment.' }, { status: 401 });
  }

  const { ventId } = params;
  if (!ObjectId.isValid(ventId)) {
    return NextResponse.json({ error: 'Invalid Vent ID format.' }, { status: 400 });
  }

  try {
    const { content } = await request.json();
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content cannot be empty.' }, { status: 400 });
    }
    if (content.length > 1000) { // Example max length for comments
        return NextResponse.json({ error: 'Comment content exceeds maximum length of 1000 characters.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const ventsCollection = db.collection<Vent>('vents');
    const parentVent = await ventsCollection.findOne({ _id: new ObjectId(ventId) });
    if (!parentVent) {
        return NextResponse.json({ error: 'Vent not found.' }, { status: 404 });
    }

    let pseudonym = userInfo.isAnonymous ? `Anon-${userInfo.userId.substring(0, 6)}` : userInfo.name || 'User';
    let avatarSeed = userInfo.isAnonymous ? userInfo.userId : userInfo.image || userInfo.userId;

    const newComment: Comment = {
      ventId: new ObjectId(ventId),
      userId: userInfo.userId,
      isAnonymous: userInfo.isAnonymous,
      pseudonym,
      avatarSeed,
      content,
      createdAt: new Date(),
    };

    const commentsCollection = db.collection<Comment>('comments');
    const result = await commentsCollection.insertOne(newComment);

    if (!result.insertedId) {
        return NextResponse.json({ error: 'Failed to create comment.' }, { status: 500 });
    }

    // Increment commentCount on the parent vent
    await ventsCollection.updateOne(
      { _id: new ObjectId(ventId) },
      { $inc: { commentCount: 1 } }
    );

    const createdComment = await commentsCollection.findOne({ _id: result.insertedId });
    return NextResponse.json(createdComment, { status: 201 });

  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Fetch comments for a vent
export async function GET(
  request: Request,
  { params }: { params: { ventId: string } }
) {
  const { ventId } = params;
  if (!ObjectId.isValid(ventId)) {
    return NextResponse.json({ error: 'Invalid Vent ID format.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10); // Default 20 comments per page

  if (page < 1) return NextResponse.json({ error: 'Page number must be 1 or greater.' }, { status: 400 });
  if (limit < 1 || limit > 100) return NextResponse.json({ error: 'Limit must be between 1 and 100.' }, { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection<Comment>('comments');

    const skip = (page - 1) * limit;

    const comments = await commentsCollection
      .find({ ventId: new ObjectId(ventId) })
      .sort({ createdAt: 1 }) // Show oldest comments first for context, or -1 for newest
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalComments = await commentsCollection.countDocuments({ ventId: new ObjectId(ventId) });
    const totalPages = Math.ceil(totalComments / limit);

    return NextResponse.json({
      comments,
      currentPage: page,
      totalPages,
      totalComments
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
