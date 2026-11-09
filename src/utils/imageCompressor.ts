/**
 * Client-Side Image Compression & Optimization Utility
 * Compresses uploaded images, camera captures, and shop logos using HTML5 Canvas.
 * Supports WebP and JPEG output with configurable quality and max dimensions.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.82)
  outputType?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  dataUrl: string;
  blob: Blob;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
}

/**
 * Formats byte values into human-readable strings (e.g., "45.2 KB", "1.4 MB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Compresses an image File or Blob with high efficiency
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.82,
    outputType = 'image/webp',
  } = options;

  const originalSizeBytes = fileOrBlob.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // Apply smoothing for high-quality downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // White background for transparent PNGs converted to JPEG
        if (outputType === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try preferred format (webp), fallback to jpeg if unsupported
        let targetFormat = outputType;
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL(targetFormat, quality);
          // If browser doesn't support webp, it returns image/png
          if (targetFormat === 'image/webp' && !dataUrl.startsWith('data:image/webp')) {
            targetFormat = 'image/jpeg';
            dataUrl = canvas.toDataURL(targetFormat, quality);
          }
        } catch {
          targetFormat = 'image/jpeg';
          dataUrl = canvas.toDataURL(targetFormat, quality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas blob generation failed'));
              return;
            }

            const compressedSizeBytes = blob.size;
            const savingsPercent =
              originalSizeBytes > 0
                ? Math.max(
                    0,
                    Math.round(
                      ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) *
                        100
                    )
                  )
                : 0;

            resolve({
              dataUrl,
              blob,
              originalSizeBytes,
              compressedSizeBytes,
              savingsPercent,
              width,
              height,
            });
          },
          targetFormat,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}
