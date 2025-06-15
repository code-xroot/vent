// src/app/api/vents/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { Vent } from '@/lib/types/vent'; // ReactionCounts is part of Vent
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

const ANONYMOUS_USER_COOKIE = 'anonymous_user_token';

// GET: Fetch vents (with pagination, sorting including 'top', and search)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  let sortBy = searchParams.get('sortBy') || 'latest'; // 'latest', 'top', 'trending' (todo)
  const keyword = searchParams.get('keyword')?.trim() || null;
  const ventId = searchParams.get('id')?.trim() || null;

  if (page < 1) return NextResponse.json({ error: 'Page number must be 1 or greater.' }, { status: 400 });
  if (limit < 1 || limit > 50) return NextResponse.json({ error: 'Limit must be between 1 and 50.' }, { status: 400 });
  if (ventId && !ObjectId.isValid(ventId)) {
    return NextResponse.json({ error: 'Invalid Vent ID format for single fetch.' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const ventsCollection = db.collection<Vent>('vents');

    // Initial query for matching documents (used for count and potentially $match stage)
    let matchQuery: any = {};
    if (ventId) { // If fetching a single vent by ID
        matchQuery = { _id: new ObjectId(ventId) };
        const vent = await ventsCollection.findOne(matchQuery);
        if (!vent) return NextResponse.json({ error: 'Vent not found.' }, { status: 404 });
        // For single vent fetch, return in the same structure as list for consistency
        return NextResponse.json({
            vents: [vent], currentPage: 1, totalPages: 1, totalVents: 1,
        }, { status: 200 });
    }
    if (keyword) {
        matchQuery.$text = { $search: keyword };
    }

    let aggregationPipeline: any[] = [];

    // Add $match stage if there's any query criteria (keyword or other filters if added later)
    if (Object.keys(matchQuery).length > 0) {
        aggregationPipeline.push({ $match: matchQuery });
    }

    // Add fields for sorting or projection
    if (keyword) { // If keyword search, project text score to be used in sorting
        aggregationPipeline.push({
            $addFields: { // Use $addFields to keep existing fields and add score
                score: { $meta: "textScore" }
            }
        });
    }
    if (sortBy === 'top') { // If sorting by top, calculate totalReactions
        aggregationPipeline.push({
            $addFields: {
                totalReactions: { $sum: { $map: { input: { $objectToArray: "$reactions" }, as: "r", in: "$$r.v" } } }
            }
        });
    }

    // Determine sort options
    let sortOptions: any = {};
    if (sortBy === 'top') {
        // If also keyword searching, sort by totalReactions first, then text score for 'top' results within search
        sortOptions = keyword ? { totalReactions: -1, score: -1, createdAt: -1 } : { totalReactions: -1, createdAt: -1 };
    } else if (keyword) { // Keyword search, not 'top'
        sortOptions = { score: -1, createdAt: -1 };
    } else { // Default, no keyword, not 'top' (i.e., 'latest')
        sortOptions = { createdAt: -1 };
    }
    aggregationPipeline.push({ $sort: sortOptions });

    // Pagination
    const skip = (page - 1) * limit;
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    // If sorting by 'top', we might not want to project away totalReactions if it's not part of Vent type
    // However, VentPost can calculate it. If score was added, it's not part of Vent type.
    // We can add a final $project stage to clean up fields if necessary, e.g., remove 'score' if not needed by client for 'top' sort.
    if (keyword && sortBy !== 'top') { // If keyword search and not sorting by top, client might want score
        // No specific projection needed here if $addFields for score was used, it will be passed.
    } else if (keyword && sortBy === 'top'){ // If keyword and top, score was added but might not be primary interest
        // Could project out score if not needed: aggregationPipeline.push({ $project: { score: 0 } });
    }


    const vents = await ventsCollection.aggregate(aggregationPipeline).toArray();

    const totalVents = await ventsCollection.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalVents / limit);

    return NextResponse.json({
      vents,
      currentPage: page,
      totalPages,
      totalVents,
    }, { status: 200 });

  } catch (error: any) {
    if (error.message && error.message.includes('text index required for $text query')) {
        console.error('Text index missing for $text query on vents collection.');
        return NextResponse.json({
            error: 'Search functionality is temporarily unavailable due to a configuration issue.',
            details: 'A text index needs to be created on the vents collection for search (e.g., on "content").'
        }, { status: 500 });
    }
    console.error('Failed to fetch vents:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// POST: Create a new vent
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userIdInfo = session?.user?.id ?
                     { userId: session.user.id, isAnonymous: false, name: session.user.name, image: session.user.image } :
                     cookies().get(ANONYMOUS_USER_COOKIE)?.value ?
                     { userId: cookies().get(ANONYMOUS_USER_COOKIE)!.value, isAnonymous: true } : null;

  if (!userIdInfo) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  try {
    const { content, emotionTag, topicCategory } = await request.json();
    if (!content || !emotionTag || !topicCategory) return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: 'Vent content too long.' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    let pseudonym = userIdInfo.isAnonymous ? `Anon-${userIdInfo.userId.substring(0, 6)}` : userIdInfo.name || 'User';
    let avatarSeed = userIdInfo.isAnonymous ? userIdInfo.userId : userIdInfo.image || userIdInfo.userId;
    const newVent: Vent = {
      userId: userIdInfo.userId, isAnonymous: userIdInfo.isAnonymous, pseudonym, avatarSeed,
      content, emotionTag, topicCategory, createdAt: new Date(), reactions: {}, commentCount: 0,
    };
    const result = await db.collection<Vent>('vents').insertOne(newVent);
    if (!result.insertedId) return NextResponse.json({ error: 'Failed to create vent.' }, { status: 500 });
    const createdVent = await db.collection<Vent>('vents').findOne({ _id: result.insertedId });
    return NextResponse.json(createdVent, { status: 201 });
  } catch (error) {
    console.error('Failed to create vent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
