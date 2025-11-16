import { NextResponse } from 'next/server';
import { Extracurricular } from '@/models/Extracurricular';
import { ImageUpload } from '@/lib/imageUpload';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const extracurriculars = await Extracurricular.findAll();
    return NextResponse.json({ extracurriculars });
  } catch (error) {
    console.error('Get extracurriculars error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extracurriculars' },
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
    const date = formData.get('date');
    const description = formData.get('description');
    const thumbnailFile = formData.get('thumbnail');

    if (!name || !date || !description) {
      return NextResponse.json(
        { error: 'Name, date, and description are required' },
        { status: 400 }
      );
    }

    let thumbnailData = null;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const base64Result = await ImageUpload.convertToBase64(thumbnailFile);
      thumbnailData = base64Result.data;
    }

    const extracurricular = await Extracurricular.create({
      name,
      date,
      description,
      thumbnail: thumbnailData
    });

    return NextResponse.json({
      success: true,
      extracurricular
    });

  } catch (error) {
    console.error('Create extracurricular error:', error);
    return NextResponse.json(
      { error: 'Failed to create extracurricular' },
      { status: 500 }
    );
  }
}
