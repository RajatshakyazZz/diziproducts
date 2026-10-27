import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Max 16MB file size limit for ImgBB uploads
const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export async function POST(request: Request) {
  try {
    const apiKey = process.env.IMGBB_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'IMGBB_API_KEY is not configured in environment variables. Please add IMGBB_API_KEY in your Vercel Project Settings (Environment Variables) or local .env.local file.',
        },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No image file uploaded. Please select a valid file from your gallery.',
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          success: false,
          error: `File size (${sizeMB}MB) exceeds the maximum allowed limit of 16MB. Please choose a smaller image.`,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate MIME Type & Extension
    const fileType = file.type.toLowerCase().trim();
    const fileName = file.name || 'upload.png';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    const isMimeValid = ALLOWED_MIME_TYPES.has(fileType) || fileType.startsWith('image/');
    const isExtValid = ALLOWED_EXTENSIONS.has(fileExtension);

    if (!isMimeValid || !isExtValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file format (${fileExtension || 'unknown'}). Only .PNG, .JPG, .JPEG, and .WEBP image files are allowed.`,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Convert file to base64 buffer for 100% reliable transport to ImgBB API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Prepare ImgBB Multipart Request
    const imgbbPayload = new FormData();
    imgbbPayload.append('image', base64Data);
    
    // Optional clean file name without extension
    const cleanName = fileName.replace(/\.[^/.]+$/, '').slice(0, 100);
    if (cleanName) {
      imgbbPayload.append('name', cleanName);
    }

    // Post to ImgBB API v1
    const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      body: imgbbPayload,
    });

    const result = await imgbbResponse.json();

    if (!imgbbResponse.ok || !result || result.success === false) {
      const errorMsg =
        result?.error?.message ||
        `ImgBB API returned status ${imgbbResponse.status}: ${imgbbResponse.statusText}`;
      console.error('[ImgBB Upload Error]:', errorMsg, result);
      return NextResponse.json(
        {
          success: false,
          error: errorMsg || 'Failed to upload image to ImgBB. Please verify your IMGBB_API_KEY.',
        },
        { status: imgbbResponse.status || 500, headers: CORS_HEADERS }
      );
    }

    // Extract direct and display URLs
    const data = result.data || {};
    const directUrl = data.url || data.display_url;
    const displayUrl = data.display_url || data.url;
    const thumbUrl = data.thumb?.url || directUrl;

    return NextResponse.json(
      {
        success: true,
        url: directUrl,
        display_url: displayUrl,
        thumb_url: thumbUrl,
        title: data.title || cleanName,
        size: data.size,
        mime: data.image?.mime || fileType,
        id: data.id,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[Upload Image Server Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An unexpected error occurred while processing image upload.',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
