import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToMongoDB from '@/lib/mongodb';
import NamePool from '@/models/NamePool';
import SecretSanta from '@/models/SecretSanta';

// Type definitions
interface Person {
  name: string;
  email: string;
  drive_link: string;
  description: string;
}

interface RequestBody {
  action: 'create' | 'check';
  email: string;
  password: string;
  name?: string;
}

interface AssignmentResponse {
  name: string;
  description: string;
  driveLink: string;
}

interface ErrorResponse {
  error: string;
}

interface NamePoolDocument {
  _id: string;
  unassigned: Person[];
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { action, email, password, name } = body;

    // Connect to MongoDB
    const connection = await connectToMongoDB();
    console.log(connection);

    // Handle assignment creation
    if (action === 'create') {
      // Validate required fields
      if (!email?.trim() || !password?.trim() || !name?.trim()) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Email, password, and name are required' },
          { status: 400 }
        );
      }

      // Check for existing assignment
      const existingAssignment = await SecretSanta.findOne({
        'user.email': email.toLowerCase()
      });

      if (existingAssignment) {
        return NextResponse.json<ErrorResponse>(
          { error: 'This email has already been assigned a person' },
          { status: 400 }
        );
      }

      // Get the name pool
      const namePool = await NamePool.findById<NamePoolDocument>('pool');
      if (!namePool?.unassigned?.length) {
        return NextResponse.json<ErrorResponse>(
          { error: 'No names available for assignment' },
          { status: 404 }
        );
      }

      // Filter out the user's own name
      const availableNames = namePool.unassigned.filter(
        person => person.name.toLowerCase() !== name.toLowerCase()
      );

      if (!availableNames.length) {
        return NextResponse.json<ErrorResponse>(
          { error: 'No suitable names available' },
          { status: 404 }
        );
      }

      // Start a MongoDB session
      const session = await mongoose.startSession();
      
      try {
        let selectedPerson: Person;
        
        await session.withTransaction(async () => {
          // Select a random person
          const randomIndex = Math.floor(Math.random() * availableNames.length);
          selectedPerson = availableNames[randomIndex];

          // Create the new assignment
          const newAssignment = new SecretSanta({
            user: {
              name,
              email: email.toLowerCase(),
              password
            },
            assignedPerson: {
              name: selectedPerson.name,
              email: selectedPerson.email,
              drive_link: selectedPerson.drive_link,
              description: selectedPerson.description
            },
            assignmentDate: new Date()
          });

          // Save the assignment
          await newAssignment.save({ session });

          // Remove the assigned person from the pool
          await NamePool.updateOne(
            { _id: 'pool' },
            {
              $pull: {
                unassigned: { name: selectedPerson.name }
              }
            },
            { session }
          );
        });

        // Return the assignment details
        return NextResponse.json<AssignmentResponse>({
          name: selectedPerson!.name,
          description: selectedPerson!.description,
          driveLink: selectedPerson!.drive_link
        });
      } catch (error) {
        console.error('Transaction error:', error);
        return NextResponse.json<ErrorResponse>(
          { error: 'Failed to create assignment' },
          { status: 500 }
        );
      } finally {
        await session.endSession();
      }
    }

    // Handle assignment checking
    if (action === 'check') {
      // Validate required fields
      if (!email?.trim() || !password?.trim()) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      // Find the assignment
      const existingAssignment = await SecretSanta.findOne({
        'user.email': email.toLowerCase(),
        'user.password': password
      });

      if (!existingAssignment) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Return the assignment details
      return NextResponse.json<AssignmentResponse>({
        name: existingAssignment.assignedPerson.name,
        description: existingAssignment.assignedPerson.description,
        driveLink: existingAssignment.assignedPerson.drive_link
      });
    }

    // Handle invalid action
    return NextResponse.json<ErrorResponse>(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json<ErrorResponse>(
      { error: errorMessage },
      { status: 500 }
    );
  }
}