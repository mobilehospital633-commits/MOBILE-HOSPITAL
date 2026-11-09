/**
 * Client-Side Image Compression & Optimization Utility
 * 
 * Provides fast, lossless-feel canvas-based image downscaling and compression.
 * Automatically selects WebP when supported with JPEG fallback.
 * Keeps memory usage minimal and protects localStorage/Firestore from exceeding limits.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.8)
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
  maxSizeKB?: number; // Target max size in KB (will auto-adjust quality if exceeded)
}

export interface CompressedImageResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  width: number;
  height: number;
  mimeType: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Checks whether the browser environment supports WebP export in HTMLCanvasElement
 */
function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Compresses an image File or Blob using HTML5 Canvas.
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  const originalSize = fileOrBlob.size;
  const filename = fileOrBlob instanceof File ? fileOrBlob.name : 'image.webp';

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = supportsWebP() ? 'image/webp' : 'image/jpeg',
    maxSizeKB,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        return reject(new Error('Empty image file'));
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data'));
      img.onload = () => {
        try {
          // Calculate target dimensions while keeping aspect ratio
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Render onto offscreen canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not get 2D canvas context'));
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // White background for transparent PNG converted to JPEG
          if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Progressive compression helper
          let currentQuality = quality;
          let dataUrl = canvas.toDataURL(format, currentQuality);

          // If maxSizeKB is requested and output exceeds it, iteratively decrease quality
          if (maxSizeKB && maxSizeKB > 0) {
            let iterations = 0;
            // Approximate size from base64 string length: length * (3/4)
            while (
              (dataUrl.length * 0.75) / 1024 > maxSizeKB &&
              currentQuality > 0.3 &&
              iterations < 4
            ) {
              currentQuality -= 0.15;
              dataUrl = canvas.toDataURL(format, currentQuality);
              iterations++;
            }
          }

          // Convert dataURL to Blob and File
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Failed to create image blob'));
              }

              const compressedSize = blob.size;
              const savedPercentage = Math.max(
                0,
                Math.round(((originalSize - compressedSize) / originalSize) * 100)
              );

              const cleanExt = format === 'image/webp' ? '.webp' : format === 'image/png' ? '.png' : '.jpg';
              const baseName = filename.replace(/\.[^/.]+$/, '');
              const newFile = new File([blob], `${baseName}-optimized${cleanExt}`, {
                type: format,
                lastModified: Date.now(),
              });

              // Clean up canvas
              canvas.width = 0;
              canvas.height = 0;

              resolve({
                dataUrl,
                blob,
                file: newFile,
                originalSize,
                compressedSize,
                savedPercentage,
                width,
                height,
                mimeType: format,
              });
            },
            format,
            currentQuality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Compresses an existing base64 data URL string
 */
export async function compressDataUrl(
  dataUrl: string,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  // Convert Data URL to Blob first to accurately track original size
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return compressImage(blob, options);
}

/**
 * Compresses multiple image files with batch memory management
 */
export async function compressMultipleImages(
  files: File[] | FileList,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult[]> {
  const fileArray = Array.from(files);
  const results: CompressedImageResult[] = [];
  for (const file of fileArray) {
    try {
      const res = await compressImage(file, options);
      results.push(res);
    } catch (e) {
      console.warn('Skipping uncompressible file', file.name, e);
    }
  }
  return results;
}
