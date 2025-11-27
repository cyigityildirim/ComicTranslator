/**
 * Resizes an image (base64) to a maximum dimension while maintaining aspect ratio.
 * This significantly speeds up API transmission and inference time.
 */
export const resizeImage = (base64Str: string, maxDimension: number = 1536): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      } else {
        // No resize needed
        resolve(base64Str);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Compress slightly to JPEG for speed, quality 0.85 is usually sufficient for text
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      resolve(base64Str); // Fallback to original if fail
    };
  });
};
