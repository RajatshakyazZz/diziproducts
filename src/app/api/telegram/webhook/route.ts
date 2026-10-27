import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: true,
    disabled: true,
    message: 'Telegram alerts and bot webhook are disabled for this store.',
  });
}

export async function GET() {
  return NextResponse.json({
    success: false,
    disabled: true,
    message: 'Telegram alerts and bot webhook are disabled for this store.',
  });
}
