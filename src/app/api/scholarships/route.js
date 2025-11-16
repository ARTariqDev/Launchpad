import { NextResponse } from 'next/server';
import { Scholarship } from '@/models/Scholarship';
import { ImageUpload } from '@/lib/imageUpload';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const scholarships = await Scholarship.findAll();
    return NextResponse.json({ scholarships });
  } catch (error) {
    console.error('Get scholarships error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scholarships' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check if user is admin
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const deadline = formData.get('deadline');
    const description = formData.get('description');
    const thumbnailFile = formData.get('thumbnail');

    // Validation
    if (!name || !deadline || !description) {
      return NextResponse.json(
        { error: 'Name, deadline, and description are required' },
        { status: 400 }
      );
    }

    let thumbnailData = null;

    // Handle thumbnail upload if provided
    if (thumbnailFile && thumbnailFile.size > 0) {
      const base64Result = await ImageUpload.convertToBase64(thumbnailFile);
      thumbnailData = base64Result.data;
    }

    // Create scholarship
    const scholarship = await Scholarship.create({
      name,
      deadline,
      description,
      thumbnail: thumbnailData
    });

    return NextResponse.json({
      success: true,
      scholarship
    });

  } catch (error) {
    console.error('Create scholarship error:', error);
    return NextResponse.json(
      { error: 'Failed to create scholarship' },
      { status: 500 }
    );
  }
}
