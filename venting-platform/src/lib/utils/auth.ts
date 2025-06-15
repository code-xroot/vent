import clientPromise from '../mongodb';

export async function getUserByEmail(email: string) {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection('users').findOne({ email });
  return user;
}
