import 'server-only';
import { MongoClient } from 'mongodb';

let client: Promise<MongoClient> | null = null;

/** The study-hub database, or null when MONGODB_URI is not configured. */
export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  client ??= new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
  try {
    return (await client).db(process.env.MONGODB_DB || 'studyhub');
  } catch (e) {
    client = null;
    throw e;
  }
}
