import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: false,
    disabled: true,
    message: 'Telegram alerts and daily summaries are disabled for this store.',
  });
}

export async function POST() {
  return GET();
}
