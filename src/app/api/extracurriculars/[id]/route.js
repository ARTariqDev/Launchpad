import { NextResponse } from 'next/server';
import { Extracurricular } from '@/models/Extracurricular';
import { ImageUpload } from '@/lib/imageUpload';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const extracurricular = await Extracurricular.findById(id);

    if (!extracurricular) {
      return NextResponse.json(
        { error: 'Extracurricular not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ extracurricular });
  } catch (error) {
    console.error('Get extracurricular error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extracurricular' },
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
    const date = formData.get('date');
    const description = formData.get('description');
    const thumbnailFile = formData.get('thumbnail');

    const updates = {};
    if (name) updates.name = name;
    if (date) updates.date = date;
    if (description) updates.description = description;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const base64Result = await ImageUpload.convertToBase64(thumbnailFile);
      updates.thumbnail = base64Result.data;
    }

    const extracurricular = await Extracurricular.update(id, updates);

    if (!extracurricular) {
      return NextResponse.json(
        { error: 'Extracurricular not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      extracurricular
    });

  } catch (error) {
    console.error('Update extracurricular error:', error);
    return NextResponse.json(
      { error: 'Failed to update extracurricular' },
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
    const deleted = await Extracurricular.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Extracurricular not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Extracurricular deleted successfully'
    });

  } catch (error) {
    console.error('Delete extracurricular error:', error);
    return NextResponse.json(
      { error: 'Failed to delete extracurricular' },
      { status: 500 }
    );
  }
}
