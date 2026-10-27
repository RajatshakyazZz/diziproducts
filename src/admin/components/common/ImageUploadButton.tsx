import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { uploadImageToImgBB } from '../../lib/uploadImage';
import { useToast } from '../../context/ToastContext';

interface ImageUploadButtonProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  variant?: 'button' | 'compact' | 'dropzone';
  className?: string;
  helperText?: string;
}

export default function ImageUploadButton({
  onUploadSuccess,
  label = 'Upload from Gallery / Device',
  variant = 'compact',
  className = '',
  helperText = 'Only .PNG, .JPG, .WEBP (Max 16MB)',
}: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const { success, error } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadImageToImgBB(file);
      if (res.success && res.url) {
        onUploadSuccess(res.url);
        success('Image uploaded to ImgBB successfully!');
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 2500);
      } else {
        error(res.error || 'Failed to upload image. Please verify your IMGBB_API_KEY.');
      }
    } catch (err: any) {
      error(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
      // Reset input value so user can upload the same or another file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerPicker = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={triggerPicker}
        disabled={isUploading}
        title="Upload from device gallery (PNG, JPG, WEBP - Max 16MB)"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          justUploaded
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : isUploading
            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
            : 'bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 hover:border-sky-500/50'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>Uploading to ImgBB...</span>
          </>
        ) : justUploaded ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Uploaded!</span>
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>{label}</span>
          </>
        )}
      </button>

      {helperText && (
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          {helperText}
        </span>
      )}
    </div>
  );
}
