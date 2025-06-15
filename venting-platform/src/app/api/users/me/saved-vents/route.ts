// src/app/api/users/me/saved-vents/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SavedVent } from '@/lib/types/savedVent';
import { Vent } from '@/lib/types/vent'; // To define the shape of populated vents

const SAVED_VENTS_PER_PAGE = 10;

// GET: Fetch saved vents for the current user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || `${SAVED_VENTS_PER_PAGE}`, 10);

  if (page < 1) return NextResponse.json({ error: 'Page number must be 1 or greater.' }, { status: 400 });
  if (limit < 1 || limit > 50) return NextResponse.json({ error: 'Limit must be between 1 and 50.' }, { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db();
    const savedVentsCollection = db.collection<SavedVent>('savedVents');

    const skip = (page - 1) * limit;

    // Fetch saved vent entries and populate vent details
    const savedVentEntries = await savedVentsCollection.aggregate([
      { $match: { userId: userId } },
      { $sort: { createdAt: -1 } }, // Show most recently saved first
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'vents', // The collection to join
          localField: 'ventId', // Field from the savedVents collection
          foreignField: '_id',  // Field from the vents collection
          as: 'ventDetails'     // Output array field
        }
      },
      { $unwind: '$ventDetails' }, // Deconstructs the array field from the $lookup stage
      {
        $project: { // Selects which fields to include in the output
          _id: '$ventDetails._id', // Use vent's _id
          userId: '$ventDetails.userId',
          isAnonymous: '$ventDetails.isAnonymous',
          pseudonym: '$ventDetails.pseudonym',
          avatarSeed: '$ventDetails.avatarSeed',
          content: '$ventDetails.content',
          emotionTag: '$ventDetails.emotionTag',
          topicCategory: '$ventDetails.topicCategory',
          createdAt: '$ventDetails.createdAt', // This is vent's createdAt
          savedAt: '$createdAt', // This is when it was saved by this user
          reactions: '$ventDetails.reactions',
          commentCount: '$ventDetails.commentCount',
          // Ensure all fields from Vent interface that VentPost expects are here
        }
      }
    ]).toArray();

    // The result of the aggregation is already an array of populated vent-like objects
    // However, they might not perfectly match the Vent interface if some fields are missing from ventDetails
    // For casting to work safely, ensure the projection includes all necessary fields of Vent
    const populatedVents = savedVentEntries as Vent[];

    const totalSavedVents = await savedVentsCollection.countDocuments({ userId: userId });
    const totalPages = Math.ceil(totalSavedVents / limit);

    return NextResponse.json({
      vents: populatedVents,
      currentPage: page,
      totalPages,
      totalVents: totalSavedVents
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch saved vents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save a vent
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { ventId } = await request.json();
    if (!ventId || !ObjectId.isValid(ventId)) {
      return NextResponse.json({ error: 'Valid Vent ID is required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if vent exists
    const vent = await db.collection('vents').findOne({ _id: new ObjectId(ventId) });
    if (!vent) {
      return NextResponse.json({ error: 'Vent not found.' }, { status: 404 });
    }

    const savedVentsCollection = db.collection<SavedVent>('savedVents');
    // Check if already saved
    const existingSave = await savedVentsCollection.findOne({ userId, ventId: new ObjectId(ventId) });
    if (existingSave) {
      // Return the populated vent detail for consistency if already saved
      const populatedExistingSave = await savedVentsCollection.aggregate([
        { $match: { _id: existingSave._id } },
        { $limit: 1 },
        { $lookup: { from: 'vents', localField: 'ventId', foreignField: '_id', as: 'ventDetails'}},
        { $unwind: '$ventDetails' },
        { $project: { /* same projection as GET */
            _id: '$ventDetails._id', userId: '$ventDetails.userId', isAnonymous: '$ventDetails.isAnonymous',
            pseudonym: '$ventDetails.pseudonym', avatarSeed: '$ventDetails.avatarSeed', content: '$ventDetails.content',
            emotionTag: '$ventDetails.emotionTag', topicCategory: '$ventDetails.topicCategory',
            createdAt: '$ventDetails.createdAt', savedAt: '$createdAt', reactions: '$ventDetails.reactions',
            commentCount: '$ventDetails.commentCount',
          }
        }
      ]).next(); // Get the first document or null
      return NextResponse.json(populatedExistingSave || existingSave, { status: 200 });
    }

    const newSave: SavedVent = {
      userId,
      ventId: new ObjectId(ventId),
      createdAt: new Date(),
    };
    const result = await savedVentsCollection.insertOne(newSave);

    // Return the populated new save
    const createdSavePopulated = await savedVentsCollection.aggregate([
        { $match: { _id: result.insertedId } },
        { $limit: 1 },
        { $lookup: { from: 'vents', localField: 'ventId', foreignField: '_id', as: 'ventDetails'}},
        { $unwind: '$ventDetails' },
        { $project: { /* same projection as GET */
            _id: '$ventDetails._id', userId: '$ventDetails.userId', isAnonymous: '$ventDetails.isAnonymous',
            pseudonym: '$ventDetails.pseudonym', avatarSeed: '$ventDetails.avatarSeed', content: '$ventDetails.content',
            emotionTag: '$ventDetails.emotionTag', topicCategory: '$ventDetails.topicCategory',
            createdAt: '$ventDetails.createdAt', savedAt: '$createdAt', reactions: '$ventDetails.reactions',
            commentCount: '$ventDetails.commentCount',
          }
        }
      ]).next();

    return NextResponse.json(createdSavePopulated, { status: 201 });

  } catch (error) {
    console.error('Failed to save vent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
