// src/app/api/reports/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Report, ReportItemType } from '@/lib/types/report'; // Adjust path as needed

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated. Please sign in to report content.' }, { status: 401 });
  }
  const reporterUserId = session.user.id;

  try {
    const { reportedItemId, itemType, reason } = await request.json();

    // Validate inputs
    if (!reportedItemId || !ObjectId.isValid(reportedItemId)) {
      return NextResponse.json({ error: 'Valid reportedItemId is required.' }, { status: 400 });
    }
    if (!itemType || !['vent', 'comment'].includes(itemType)) {
      return NextResponse.json({ error: 'Valid itemType ("vent" or "comment") is required.' }, { status: 400 });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0 || reason.length > 500) {
      return NextResponse.json({ error: 'A valid reason (string, 1-500 characters) is required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify the reported item exists (optional but good practice)
    const collectionName = itemType === 'vent' ? 'vents' : 'comments';
    const itemExists = await db.collection(collectionName).findOne({ _id: new ObjectId(reportedItemId) });
    if (!itemExists) {
      return NextResponse.json({ error: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found.` }, { status: 404 });
    }

    // Prevent duplicate reports by the same user for the same item (optional, based on policy)
    // For simplicity, we'll allow multiple reports by the same user on the same item for now,
    // as they might be reporting for different reasons over time or emphasizing urgency.
    // If you want to prevent duplicates:
    // const existingReport = await db.collection<Report>('reports').findOne({ reporterUserId, reportedItemId: new ObjectId(reportedItemId), itemType });
    // if (existingReport) {
    //   return NextResponse.json({ message: 'You have already reported this item.', report: existingReport }, { status: 200 });
    // }


    const newReport: Report = {
      reportedItemId: new ObjectId(reportedItemId),
      itemType: itemType as ReportItemType,
      reason: reason.trim(),
      reporterUserId,
      status: 'pending', // Initial status
      createdAt: new Date(),
    };

    const reportsCollection = db.collection<Report>('reports');
    const result = await reportsCollection.insertOne(newReport);

    const createdReport = await reportsCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(createdReport, { status: 201 });

  } catch (error) {
    console.error('Failed to submit report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
