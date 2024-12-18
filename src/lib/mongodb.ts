import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnected = false;

async function connectToMongoDB() {
  if (isConnected) {
    return;
  }

  try {
    const opts = {
      bufferCommands: true,
    };

    await mongoose.connect(MONGODB_URI, opts);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export default connectToMongoDB;