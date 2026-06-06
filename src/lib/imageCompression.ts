// Image compression utility using Canvas API

interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  maxSizeKB: number;
  quality?: number;
}

const COMPRESSION_PRESETS = {
  avatar: { maxWidth: 400, maxHeight: 400, maxSizeKB: 100, quality: 0.8 },
  chatImage: { maxWidth: 1200, maxHeight: 1200, maxSizeKB: 500, quality: 0.85 },
  bookingPhoto: { maxWidth: 1920, maxHeight: 1920, maxSizeKB: 800, quality: 0.85 },
  cnicDocument: { maxWidth: 1920, maxHeight: 1920, maxSizeKB: 1000, quality: 0.9 },
  localAd: { maxWidth: 800, maxHeight: 600, maxSizeKB: 300, quality: 0.85 },
};

export type PresetType = keyof typeof COMPRESSION_PRESETS;

// Convert file to base64 data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Load image from data URL
const loadImage = (dataURL: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
};

// Data URL to Blob
const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Main compression function
export const compressImage = async (
  file: File,
  options: CompressionOptions
): Promise<File> => {
  const { maxWidth, maxHeight, maxSizeKB, quality = 0.8 } = options;

  // Skip if already small enough
  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  try {
    const dataURL = await fileToDataURL(file);
    const img = await loadImage(dataURL);

    // Calculate new dimensions
    let { width, height } = img;
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Use better quality settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob with quality adjustment
    let currentQuality = quality;
    let blob: Blob;
    
    do {
      const compressedDataURL = canvas.toDataURL('image/jpeg', currentQuality);
      blob = dataURLToBlob(compressedDataURL);
      
      // Reduce quality if still too large
      if (blob.size > maxSizeKB * 1024 && currentQuality > 0.3) {
        currentQuality -= 0.1;
      } else {
        break;
      }
    } while (blob.size > maxSizeKB * 1024);

    // Create new File object
    const compressedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '.jpg'),
      { type: 'image/jpeg' }
    );

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
};

// Convenience function using presets
export const compressWithPreset = async (
  file: File,
  preset: PresetType
): Promise<File> => {
  const options = COMPRESSION_PRESETS[preset];
  return compressImage(file, options);
};

// Generate thumbnail
export const generateThumbnail = async (
  file: File,
  size: number = 150
): Promise<string> => {
  try {
    const dataURL = await fileToDataURL(file);
    const img = await loadImage(dataURL);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Calculate crop dimensions for square thumbnail
    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return '';
  }
};

// Validate image file
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
    };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};
