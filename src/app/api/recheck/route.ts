import { NextResponse } from 'next/server';
import connectToMongoDB from '@/lib/mongodb';
import SecretSanta from '@/models/SecretSanta';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB and wait for connection
    await connectToMongoDB();

    // Find assignment
    const assignment = await SecretSanta.findOne({
      'user.email': email.toLowerCase(),
      'user.password': password
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      name: assignment.assignedPerson.name,
      description: assignment.assignedPerson.description,
      driveLink: assignment.assignedPerson.drive_link
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}