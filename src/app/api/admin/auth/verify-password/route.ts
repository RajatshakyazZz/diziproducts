import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body?.password || '').trim();

    if (!password) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const configuredPassword = (
      process.env.ADMIN_PASSWORD ||
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      process.env.VITE_ADMIN_PASSWORD ||
      ''
    ).trim();

    const allowedFallbackPasswords = [
      'diziproducts@2026',
      'vaultzet@2026',
      'vaultworld@2026',
    ];

    const isValid =
      (configuredPassword && password === configuredPassword) ||
      allowedFallbackPasswords.includes(password);

    if (!isValid) {
      return NextResponse.json(
        { success: true, valid: false, error: 'Incorrect admin password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: 'DiziProducts Administrator',
      role: 'SuperAdmin',
      token: 'diziproducts_admin_token',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, valid: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
