import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import connectToMongoDB from '@/lib/mongodb';
import SecretSanta from '@/models/SecretSanta';

const NAMES_FILE_PATH = path.join(process.cwd(), 'data', 'names.json');

interface Person {
  name: string;
  email: string;
  drive_link: string;
  description: string;
}

interface NameData {
  unassigned: Person[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, action = 'check' } = body;

    // Basic validation
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToMongoDB();

    // Check if user exists
    const existingUser = await SecretSanta.findOne({
      'user.email': email.toLowerCase(),
      'user.password': password
    });

    // If checking existing assignment
    if (action === 'check') {
      if (!existingUser) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        name: existingUser.assignedPerson.name,
        description: existingUser.assignedPerson.description,
        driveLink: existingUser.assignedPerson.drive_link
      });
    }

    // If creating new assignment
    if (action === 'create') {
      // Validate name for new assignment
      if (!name?.trim()) {
        return NextResponse.json(
          { error: 'Name is required for new assignment' },
          { status: 400 }
        );
      }

      if (existingUser) {
        return NextResponse.json(
          { error: 'This email has already been assigned a person' },
          { status: 400 }
        );
      }

      // Read and parse names file
      let namesData: NameData;
      try {
        const fileContent = await fs.readFile(NAMES_FILE_PATH, 'utf-8');
        namesData = JSON.parse(fileContent);
        
        if (!namesData.unassigned) {
          throw new Error('Invalid file structure');
        }
        
        console.log('Available names before assignment:', namesData.unassigned.length);
      } catch (error) {
        console.error('Error reading names file:', error);
        return NextResponse.json(
          { error: 'Failed to read available names' },
          { status: 500 }
        );
      }

      // Get available names excluding user's own name
      const availableNames = namesData.unassigned.filter(person => 
        person.name.toLowerCase() !== name.toLowerCase()
      );

      if (availableNames.length === 0) {
        return NextResponse.json(
          { error: 'No suitable names available' },
          { status: 404 }
        );
      }

      // Select a random person
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      const selectedPerson = availableNames[randomIndex];

      // Create new assignment
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
        }
      });

      try {
        // Save to MongoDB
        await newAssignment.save();
        console.log('Assignment saved to MongoDB');

        // Update the available names
        namesData.unassigned = namesData.unassigned.filter(person => 
          person.name.toLowerCase() !== selectedPerson.name.toLowerCase()
        );
        
        console.log('Available names after filtering:', namesData.unassigned.length);
        
        // Write updated names back to file
        await fs.writeFile(
          NAMES_FILE_PATH, 
          JSON.stringify(namesData, null, 2),
          'utf-8'
        );
        
        console.log('Names file updated successfully');

        return NextResponse.json({
          name: selectedPerson.name,
          description: selectedPerson.description,
          driveLink: selectedPerson.drive_link
        });
      } catch (error) {
        console.error('Error saving assignment:', error);
        
        // If MongoDB save succeeds but file update fails, cleanup the MongoDB entry
        if (newAssignment._id) {
          try {
            await SecretSanta.findByIdAndDelete(newAssignment._id);
            console.log('Cleaned up MongoDB entry after file update failure');
          } catch (cleanupError) {
            console.error('Failed to cleanup MongoDB entry:', cleanupError);
          }
        }

        return NextResponse.json(
          { error: 'Failed to save assignment' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}