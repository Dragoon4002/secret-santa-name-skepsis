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
    const { email, name, password } = await request.json();

    if (!email?.trim() || !name?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB and wait for connection
    await connectToMongoDB();

    // Check if user already exists in MongoDB
    const existingUser = await SecretSanta.findOne({ 'user.email': email.toLowerCase() });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email has already been assigned a person' },
        { status: 400 }
      );
    }

    // Read JSON file
    const fileContent = await fs.readFile(NAMES_FILE_PATH, 'utf-8');
    const namesData: NameData = JSON.parse(fileContent);

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

    // Create new assignment in MongoDB
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

    await newAssignment.save();
    console.log('Assignment saved to MongoDB');

    // Update the names.json file to remove the assigned person
    namesData.unassigned = namesData.unassigned.filter(person => 
      person.name !== selectedPerson.name
    );
    await fs.writeFile(NAMES_FILE_PATH, JSON.stringify(namesData, null, 2));

    return NextResponse.json({
      name: selectedPerson.name,
      description: selectedPerson.description,
      driveLink: selectedPerson.drive_link
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