export interface ImgBBUploadResponse {
  success: boolean;
  url?: string;
  display_url?: string;
  thumb_url?: string;
  error?: string;
  title?: string;
}

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024; // 16MB

/**
 * Upload an image file securely to ImgBB via the server-side API endpoint
 */
export async function uploadImageToImgBB(file: File): Promise<ImgBBUploadResponse> {
  try {
    if (!file) {
      return { success: false, error: 'No file selected' };
    }

    // Client-side quick validation
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext) || !file.type.startsWith('image/')) {
      return {
        success: false,
        error: `Only image files (.PNG, .JPG, .JPEG, .WEBP) are allowed. Selected file: ${file.name}`,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        success: false,
        error: `File size is ${mb}MB. Maximum allowed size is 16MB.`,
      };
    }

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data || data.success === false) {
      return {
        success: false,
        error: data?.error || `Upload failed with HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      url: data.url,
      display_url: data.display_url,
      thumb_url: data.thumb_url,
      title: data.title,
    };
  } catch (err: any) {
    console.error('Client upload error:', err);
    return {
      success: false,
      error: err.message || 'Network error while uploading image',
    };
  }
}
