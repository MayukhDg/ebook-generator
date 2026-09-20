import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    const adminSecret = process.env.ADMIN_SECRET?.trim();

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Admin access is not configured on this server.' },
        { status: 503 }
      );
    }

    const cleanSecret = (typeof secret === 'string' ? secret : '').trim();

    if (!cleanSecret || cleanSecret !== adminSecret) {
      return NextResponse.json(
        { error: 'Invalid admin secret.' },
        { status: 401 }
      );
    }

    // Generate a hashed token from the secret + a static salt
    const token = createHash('sha256')
      .update(`foliocraft_admin_${adminSecret}_salt_v1`)
      .digest('hex');

    const response = NextResponse.json({ success: true });

    // Set session cookie (no expiry = browser session only)
    response.cookies.set('foliocraft_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
