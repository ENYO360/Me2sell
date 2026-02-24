import imageCompression from "browser-image-compression";

export const compressTo50KB = async (file) => {
  const options = {
    maxSizeMB: 0.05,          // 50KB
    maxWidthOrHeight: 800,    // good balance for product images
    useWebWorker: true,
    initialQuality: 0.7,
  };

  const compressedFile = await imageCompression(file, options);
  return compressedFile;
};
