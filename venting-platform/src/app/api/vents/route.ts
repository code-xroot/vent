// src/app/api/vents/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // For POST
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { Vent } from '@/lib/types/vent';
// Remove cookies import if no longer used by POST, GET might still use it for anon sessions if not fully deprecated
// import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb'; // Keep for GET if it uses it

// ANONYMOUS_USER_COOKIE is no longer needed for POST
// const ANONYMOUS_USER_COOKIE = 'anonymous_user_token';


// GET function remains here (ensure it's the version from "Top Vents Sorting" step)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  let sortBy = searchParams.get('sortBy') || 'latest';
  const keyword = searchParams.get('keyword')?.trim() || null;
  const ventId = searchParams.get('id')?.trim() || null;

  if (page < 1) return NextResponse.json({ error: 'Page number must be 1 or greater.' }, { status: 400 });
  if (limit < 1 || limit > 50) return NextResponse.json({ error: 'Limit must be between 1 and 50.' }, { status: 400 });
  if (ventId && !ObjectId.isValid(ventId)) {
    return NextResponse.json({ error: 'Invalid Vent ID format.' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const ventsCollection = db.collection<Vent>('vents');

    let matchQuery: any = {};
    if (ventId) {
        matchQuery = { _id: new ObjectId(ventId) };
        const vent = await ventsCollection.findOne(matchQuery);
        if (!vent) return NextResponse.json({ error: 'Vent not found.' }, { status: 404 });
        return NextResponse.json({
            vents: [vent], currentPage: 1, totalPages: 1, totalVents: 1,
        }, { status: 200 });
    }
    if (keyword) {
        matchQuery.$text = { $search: keyword };
    }

    let aggregationPipeline: any[] = [];

    if (Object.keys(matchQuery).length > 0) {
        aggregationPipeline.push({ $match: matchQuery });
    }

    if (keyword) {
        aggregationPipeline.push({
            $addFields: {
                score: { $meta: "textScore" }
            }
        });
    }
    if (sortBy === 'top') {
        aggregationPipeline.push({
            $addFields: {
                totalReactions: { $sum: { $map: { input: { $objectToArray: "$reactions" }, as: "r", in: "$$r.v" } } }
            }
        });
    }

    let sortOptions: any = {};
    if (sortBy === 'top') {
        sortOptions = keyword ? { totalReactions: -1, score: -1, createdAt: -1 } : { totalReactions: -1, createdAt: -1 };
    } else if (keyword) {
        sortOptions = { score: -1, createdAt: -1 };
    } else {
        sortOptions = { createdAt: -1 };
    }
    aggregationPipeline.push({ $sort: sortOptions });

    const skip = (page - 1) * limit;
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    const vents = await ventsCollection.aggregate(aggregationPipeline).toArray();

    let countQuery = {}; // Re-define countQuery for clarity based on initial match conditions
    if (keyword) countQuery = { $text: { $search: keyword } };
    // Note: if ventId was used, we'd have returned already. If other filters were in matchQuery, they should be here.
    // For simplicity, if it's not a keyword search, count all documents (or apply other non-text filters if they existed in matchQuery)
    else if (Object.keys(matchQuery).length > 0 && !keyword) countQuery = matchQuery;


    const totalVents = await ventsCollection.countDocuments(countQuery);
    const totalPages = Math.ceil(totalVents / limit);

    return NextResponse.json({
      vents, currentPage: page, totalPages, totalVents,
    }, { status: 200 });

  } catch (error: any) {
    if (error.message && error.message.includes('text index required for $text query')) {
        console.error('Text index missing for $text query on vents collection.'); // Log for server admin
        return NextResponse.json({ error: 'Search functionality is temporarily unavailable due to a configuration issue.'}, { status: 500 });
    }
    console.error('Failed to fetch vents:', error); // Log other errors
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}


// POST: Create a new vent (Updated for mandatory sign-in)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions); // Use NextAuth.js session

  if (!session || !session.user || !session.user.id) {
    // If no session, or session doesn't have user or user.id, user is not authenticated
    return NextResponse.json({ error: 'Not authenticated. Please sign in to create a vent.' }, { status: 401 });
  }

  const userId = session.user.id;
  const userName = session.user.name || 'User'; // Default to 'User' if name is not set
  const userImage = session.user.image || null; // Use user image if available

  try {
    const { content, emotionTag, topicCategory } = await request.json();

    if (!content || !emotionTag || !topicCategory) {
      return NextResponse.json({ error: 'Missing required fields (content, emotionTag, topicCategory).' }, { status: 400 });
    }
    if (typeof content !== 'string' || content.trim().length === 0 || content.length > 2000) {
         return NextResponse.json({ error: 'Vent content must be a non-empty string up to 2000 characters.' }, { status: 400 });
    }
    if (typeof emotionTag !== 'string' || emotionTag.trim().length === 0) {
        return NextResponse.json({ error: 'Emotion tag must be a non-empty string.' }, { status: 400 });
    }
    if (typeof topicCategory !== 'string' || topicCategory.trim().length === 0) {
        return NextResponse.json({ error: 'Topic category must be a non-empty string.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Omit fields that are auto-generated or have defaults in the Vent interface for creation
    const newVentData: Omit<Vent, '_id' | 'createdAt' | 'reactions' | 'commentCount'> & Partial<Pick<Vent, 'reactions' | 'commentCount'>> = {
      userId: userId, // From authenticated session
      isAnonymous: false, // Explicitly set to false
      pseudonym: userName, // Use user's name from session
      avatarSeed: userImage || userName, // Use user's image or fallback to name for seed
      content: content.trim(),
      emotionTag,
      topicCategory,
    };

    const newVent: Vent = {
        ...newVentData,
        reactions: {},
        commentCount: 0,
        createdAt: new Date(),
    };


    const result = await db.collection<Vent>('vents').insertOne(newVent);
    if (!result.insertedId) {
        return NextResponse.json({ error: 'Failed to create vent.' }, { status: 500 });
    }

    const createdVent = await db.collection<Vent>('vents').findOne({ _id: result.insertedId });
    return NextResponse.json(createdVent, { status: 201 });

  } catch (error) {
    console.error('Failed to create vent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
