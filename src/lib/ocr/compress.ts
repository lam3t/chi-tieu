/**
 * Compresses an image file client-side to max 1600px (width or height)
 * and JPEG quality ~0.7 to optimize speed and bandwidth before uploading.
 */
export async function compressReceiptImage(file: File): Promise<{
  compressedBlob: Blob;
  previewUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("File không phải định dạng ảnh hợp lệ"));
      img.onload = () => {
        const MAX_DIMENSION = 1600;
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể khởi tạo Canvas 2D context"));
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Lỗi nén ảnh"));
              return;
            }
            const previewUrl = URL.createObjectURL(blob);
            resolve({ compressedBlob: blob, previewUrl });
          },
          "image/jpeg",
          0.7
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
