import { NextResponse } from 'next/server';
import { University } from '@/models/University';
import { ImageUpload } from '@/lib/imageUpload';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const university = await University.findById(id);

    if (!university) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error('Get university error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch university' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const formData = await request.formData();
    const name = formData.get('name');
    const deadlinesJson = formData.get('deadlines');
    const locationJson = formData.get('location');
    const thumbnailFile = formData.get('thumbnail');

    const updates = {};
    if (name) updates.name = name;
    
    if (locationJson) {
      try {
        updates.location = JSON.parse(locationJson);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid location format' },
          { status: 400 }
        );
      }
    }
    
    if (deadlinesJson) {
      try {
        updates.deadlines = JSON.parse(deadlinesJson);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid deadlines format' },
          { status: 400 }
        );
      }
    }

    if (thumbnailFile && thumbnailFile.size > 0) {
      const base64Result = await ImageUpload.convertToBase64(thumbnailFile);
      updates.thumbnail = base64Result.data;
    }

    const university = await University.update(id, updates);

    if (!university) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      university
    });

  } catch (error) {
    console.error('Update university error:', error);
    return NextResponse.json(
      { error: 'Failed to update university' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await University.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'University deleted successfully'
    });

  } catch (error) {
    console.error('Delete university error:', error);
    return NextResponse.json(
      { error: 'Failed to delete university' },
      { status: 500 }
    );
  }
}
