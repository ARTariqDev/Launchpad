import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { createToken, setSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { firstName, lastName, username, email, password } = await request.json();

    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      role: 'user'
    });

    const token = await createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      redirectTo: '/dashboard'
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
