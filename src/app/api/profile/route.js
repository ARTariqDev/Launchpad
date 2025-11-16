import { NextResponse } from 'next/server';
import { UserProfile } from '@/models/UserProfile';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await UserProfile.findByUserId(session.userId);
    
    return NextResponse.json({ 
      success: true,
      profile: profile || {
        userId: session.userId,
        major: '',
        essays: [],
        extracurriculars: [],
        awards: [],
        testScores: {
          sat: { total: null, math: null, verbal: null },
          act: { composite: null },
          tmua: { score: null },
          esat: { score: null }
        },
        academics: {
          type: '',
          gpa: null,
          subjects: []
        },
        savedColleges: [],
        savedScholarships: [],
        savedExtracurriculars: [],
        completedColleges: [],
        completedScholarships: [],
        completedExtracurriculars: []
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { field, value, profileData } = body;

    console.log('PUT /api/profile - field:', field);
    if (field && (field.startsWith('completed') || field.startsWith('saved'))) {
      console.log('Updating list field:', field);
      console.log('New value length:', Array.isArray(value) ? value.length : 'not an array');
    }

    let result;
    
    if (profileData) {
      result = await UserProfile.createOrUpdate(session.userId, profileData);
    } else if (field) {
      result = await UserProfile.updateField(session.userId, field, value);
    } else {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    console.log('Update successful, result has field?', result && field ? result[field] !== undefined : 'N/A');

    return NextResponse.json({
      success: true,
      profile: result
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
