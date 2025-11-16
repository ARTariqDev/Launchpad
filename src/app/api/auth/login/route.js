import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { createToken, setSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { usernameOrEmail, password } = await request.json();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await User.verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    });

    await setSessionCookie(token);

    const redirectTo = user.role === 'admin' ? '/admin' : '/dashboard';

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      redirectTo
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
