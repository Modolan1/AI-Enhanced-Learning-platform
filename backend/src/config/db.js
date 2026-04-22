import mongoose from 'mongoose';
import { env } from './env.js';
import User from '../models/User.js';

async function ensureUserIndexes() {
  const indexes = await User.collection.indexes();
  const legacyGoogleIndex = indexes.find((index) => index.name === 'googleId_1');

  if (legacyGoogleIndex && !legacyGoogleIndex.partialFilterExpression) {
    await User.collection.dropIndex('googleId_1');
  }

  await User.syncIndexes();
}

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongoUri);
    await ensureUserIndexes();
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}
