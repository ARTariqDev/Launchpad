import { NextResponse } from 'next/server';
import { Scholarship } from '@/models/Scholarship';
import { ImageUpload } from '@/lib/imageUpload';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const scholarship = await Scholarship.findById(id);

    if (!scholarship) {
      return NextResponse.json(
        { error: 'Scholarship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ scholarship });
  } catch (error) {
    console.error('Get scholarship error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scholarship' },
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
    const deadline = formData.get('deadline');
    const description = formData.get('description');
    const thumbnailFile = formData.get('thumbnail');

    const updates = {};
    if (name) updates.name = name;
    if (deadline) updates.deadline = deadline;
    if (description) updates.description = description;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const base64Result = await ImageUpload.convertToBase64(thumbnailFile);
      updates.thumbnail = base64Result.data;
    }

    const scholarship = await Scholarship.update(id, updates);

    if (!scholarship) {
      return NextResponse.json(
        { error: 'Scholarship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      scholarship
    });

  } catch (error) {
    console.error('Update scholarship error:', error);
    return NextResponse.json(
      { error: 'Failed to update scholarship' },
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
    const deleted = await Scholarship.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Scholarship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scholarship deleted successfully'
    });

  } catch (error) {
    console.error('Delete scholarship error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scholarship' },
      { status: 500 }
    );
  }
}
