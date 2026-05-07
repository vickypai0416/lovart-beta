const DB_NAME = 'lovart_image_store';
const DB_VERSION = 1;

const STORES = {
  ECOMMERCE_IMAGES: 'ecommerce_images',
  CHAT_IMAGES: 'chat_images',
  IMAGE_BLOBS: 'image_blobs',
} as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.ECOMMERCE_IMAGES)) {
        db.createObjectStore(STORES.ECOMMERCE_IMAGES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.CHAT_IMAGES)) {
        db.createObjectStore(STORES.CHAT_IMAGES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.IMAGE_BLOBS)) {
        db.createObjectStore(STORES.IMAGE_BLOBS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function idbPut(storeName: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbClear(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbPutImageBlob(id: string, blob: Blob): Promise<void> {
  await idbPut(STORES.IMAGE_BLOBS, { id, blob });
}

export async function idbGetImageBlob(id: string): Promise<Blob | null> {
  const record = await idbGet<{ id: string; blob: Blob }>(STORES.IMAGE_BLOBS, id);
  return record?.blob ?? null;
}

export async function idbDeleteImageBlob(id: string): Promise<void> {
  await idbDelete(STORES.IMAGE_BLOBS, id);
}

async function urlToBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    const res = await fetch(url);
    return await res.blob();
  }

  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (res.ok) {
    const data = await res.json();
    if (data.dataUrl) {
      const blobRes = await fetch(data.dataUrl);
      return await blobRes.blob();
    }
  }

  const directRes = await fetch(url);
  return await directRes.blob();
}

export async function saveImageBlobFromUrl(imageId: string, url: string): Promise<string> {
  try {
    const blob = await urlToBlob(url);
    await idbPutImageBlob(imageId, blob);
    return imageId;
  } catch (e) {
    console.warn('[IDB] 保存图片 Blob 失败:', e);
    return url;
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function getImageUrl(imageId: string, fallbackUrl: string): Promise<string> {
  try {
    const blob = await idbGetImageBlob(imageId);
    if (blob) {
      return await blobToDataURL(blob);
    }
  } catch (e) {
    console.warn('[IDB] 读取图片 Blob 失败:', e);
  }
  return fallbackUrl;
}

export { STORES };
