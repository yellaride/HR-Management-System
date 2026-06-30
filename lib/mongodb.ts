// lib/mongodb.ts
import mongoose from 'mongoose';
import dns from 'dns';

// Forces Node.js to use Google and Cloudflare DNS to bypass local SRV lookup failure
dns.setServers(['1.1.1.1', '8.8.8.8']);

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
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