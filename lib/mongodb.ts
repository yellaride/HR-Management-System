// lib/mongodb.ts
import mongoose from "mongoose";
import dns from "dns";

// Local development only: some ISPs fail MongoDB SRV lookups; use public DNS.
// Never override DNS in production runtimes (Vercel/containers manage their own).
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.mongoose ?? { conn: null, promise: null };
globalWithMongoose.mongoose = cached;

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Reset cache so subsequent tries can re-attempt
    throw error;
  }

  return cached.conn;
}

export default connectDB;
