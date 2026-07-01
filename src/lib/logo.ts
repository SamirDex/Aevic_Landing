const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_LOGO_SIDE = 320;

export const assertPngLogo = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (file.type !== 'image/png' || extension !== 'png') {
    throw new Error('Komanda logosu yalnız PNG formatında olmalıdır.');
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Komanda logosu ən çox 2 MB ola bilər.');
  }
};

export const preparePngLogoDataUrl = async (file: File): Promise<string> => {
  assertPngLogo(file);

  const bitmap = await createImageBitmap(file);
  const largestSide = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, MAX_LOGO_SIDE / largestSide);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new Error('Komanda logosu emal olunmadı.');
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/png');
};
