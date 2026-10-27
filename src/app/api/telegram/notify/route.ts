import { NextResponse } from 'next/server';

export async function POST() {
  // Telegram alerts are turned off for this store
  return NextResponse.json({
    success: false,
    disabled: true,
    message: 'Telegram alerts are disabled for this store.',
  });
}
