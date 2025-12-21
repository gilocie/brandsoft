
'use client';

// This hook is analogous to use-plan-image.ts but for purchase receipts.
// We can rename it to be more generic, e.g., use-image-storage.ts, since it's being used for multiple purposes.

const IMAGE_DB_NAME = 'BrandsoftImagesDB'; // Generic name
const IMAGE_STORE_NAME = 'images';

// Open IndexedDB for receipts
const openImageDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        db.createObjectStore(IMAGE_STORE_NAME);
      }
    };
  });
};

// Get receipt image from IndexedDB
export const getImageFromDB = async (key: string): Promise<string | null> => {
  try {
    const db = await openImageDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(IMAGE_STORE_NAME);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
};

// Save receipt image to IndexedDB
export const saveReceiptToDB = async (key: string, imageData: string): Promise<void> => {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.put(imageData, key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
