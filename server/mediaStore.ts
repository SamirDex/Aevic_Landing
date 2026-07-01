import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type StoredMedia = {
  id: string;
  mime: string;
  buffer: Buffer;
};

const isNetlifyRuntime = () => Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

const extensionForMime = (mime: string) => {
  if (mime.includes('png')) {
    return 'png';
  }

  if (mime.includes('jpeg') || mime.includes('jpg')) {
    return 'jpg';
  }

  if (mime.includes('webp')) {
    return 'webp';
  }

  return 'bin';
};

export const mediaPublicPath = (id: string | null | undefined) => (id ? `/api/media/${id}` : null);

export const parseImageDataUrl = (imageDataUrl: string): StoredMedia | null => {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  return {
    id: randomUUID(),
    mime,
    buffer,
  };
};

const localPaths = (dataDir: string, id: string, mime: string) => {
  const imagesDir = path.join(dataDir, 'images');
  const ext = extensionForMime(mime);

  return {
    imagesDir,
    dataPath: path.join(imagesDir, `${id}.${ext}`),
    metaPath: path.join(imagesDir, `${id}.json`),
  };
};

export const saveMedia = async (dataDir: string, media: StoredMedia) => {
  if (isNetlifyRuntime()) {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('aevic-media');
    const bytes = Uint8Array.from(media.buffer);
    await store.set(media.id, new Blob([bytes], { type: media.mime }), {
      metadata: { contentType: media.mime },
    });
    return media.id;
  }

  const { imagesDir, dataPath, metaPath } = localPaths(dataDir, media.id, media.mime);
  await fs.mkdir(imagesDir, { recursive: true });
  await fs.writeFile(dataPath, media.buffer);
  await fs.writeFile(metaPath, JSON.stringify({ mime: media.mime }));
  return media.id;
};

export const readMedia = async (dataDir: string, id: string): Promise<StoredMedia | null> => {
  if (!id) {
    return null;
  }

  if (isNetlifyRuntime()) {
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('aevic-media');
      const blob = await store.get(id, { type: 'blob' });

      if (!blob) {
        return null;
      }

      const mime = blob.type || 'image/png';
      const buffer = Buffer.from(await blob.arrayBuffer());
      return { id, mime, buffer };
    } catch {
      return null;
    }
  }

  const imagesDir = path.join(dataDir, 'images');

  try {
    const metaPath = path.join(imagesDir, `${id}.json`);
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8')) as { mime?: string };
    const mime = meta.mime || 'image/png';
    const { dataPath } = localPaths(dataDir, id, mime);
    const buffer = await fs.readFile(dataPath);
    return { id, mime, buffer };
  } catch {
    return null;
  }
};

export const deleteMedia = async (dataDir: string, id: string | null | undefined) => {
  if (!id) {
    return;
  }

  if (isNetlifyRuntime()) {
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore('aevic-media');
      await store.delete(id);
    } catch {
      // ignore
    }
    return;
  }

  const imagesDir = path.join(dataDir, 'images');

  try {
    const files = await fs.readdir(imagesDir);
    await Promise.all(
      files
        .filter((file) => file.startsWith(`${id}.`))
        .map((file) => fs.unlink(path.join(imagesDir, file)).catch(() => undefined)),
    );
  } catch {
    // ignore
  }
};
