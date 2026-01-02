import { NextResponse } from 'next/server';
import { University } from '@/models/University';
import { ImageUpload } from '@/lib/imageUpload';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const universities = await University.findAll();
    return NextResponse.json({ universities });
  } catch (error) {
    console.error('Get universities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const deadlinesJson = formData.get('deadlines');
    const locationJson = formData.get('location');
    const thumbnailFile = formData.get('thumbnail');
    const adminNotes = formData.get('adminNotes') || '';

    let deadlines = [];
    if (deadlinesJson) {
      try {
        deadlines = JSON.parse(deadlinesJson);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid deadlines format' },
          { status: 400 }
        );
      }
    }

    let location = { city: '', state: '', country: '' };
    if (locationJson) {
      try {
        location = JSON.parse(locationJson);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid location format' },
          { status: 400 }
        );
      }
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!location.city || !location.state || !location.country) {
      return NextResponse.json(
        { error: 'Complete location (city, state, country) is required' },
        { status: 400 }
      );
    }

    if (!deadlines || deadlines.length === 0) {
      return NextResponse.json(
        { error: 'At least one deadline is required' },
        { status: 400 }
      );
    }

    let thumbnailData = null;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const base64Result = await ImageUpload.convertToBase64(thumbnailFile);
      thumbnailData = base64Result.data;
    }

    const university = await University.create({
      name,
      deadlines,
      location,
      thumbnail: thumbnailData,
      adminNotes
    });

    return NextResponse.json({
      success: true,
      university
    });

  } catch (error) {
    console.error('Create university error:', error);
    return NextResponse.json(
      { error: 'Failed to create university' },
      { status: 500 }
    );
  }
}
