// src/app/api/prompts/today/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Prompt } from '@/lib/types/prompt'; // Adjust path as needed

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const promptsCollection = db.collection<Prompt>('prompts');

    const todayStr = getTodayDateString();

    // Find an active prompt for today's date
    // If multiple are active for today, it will pick one (usually the first found by MongoDB)
    // You might want more specific logic if multiple prompts per day are possible
    const todaysActivePrompt = await promptsCollection.findOne({
      date: todayStr,
      isActive: true,
    });

    if (!todaysActivePrompt) {
      // Optionally, you could fetch a generic active prompt if no specific one for today
      // const genericActivePrompt = await promptsCollection.findOne({ isActive: true, date: { $exists: false } });
      // if (genericActivePrompt) return NextResponse.json(genericActivePrompt, { status: 200 });

      return NextResponse.json({ message: 'No active prompt for today.' }, { status: 404 });
    }

    return NextResponse.json(todaysActivePrompt, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch today\'s prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
