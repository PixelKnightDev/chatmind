import mongoose, { Mongoose } from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// Extend the NodeJS global type to include `mongoose`
declare global {
  var mongoose: { conn: Mongoose | null; promise: Promise<Mongoose> | null } | undefined
}

// Ensure global cache is initialized
global.mongoose ||= { conn: null, promise: null }

const cached = global.mongoose // ✅ Now always defined

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
