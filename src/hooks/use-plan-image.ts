'use client';

import { useState, useEffect } from 'react';

const IMAGE_DB_NAME = 'PlanImagesDB';
const IMAGE_STORE_NAME = 'images';

// Open IndexedDB
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

// Get image from IndexedDB
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

// Save image to IndexedDB
export const saveImageToDB = async (key: string, imageData: string): Promise<void> => {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.put(imageData, key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Delete image from IndexedDB
export const deleteImageFromDB = async (key: string): Promise<void> => {
  try {
    const db = await openImageDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(IMAGE_STORE_NAME);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Ignore errors on delete
  }
};

// Generate storage key for plan image
export const getImageStorageKey = (planName: string, imageType: string) => {
  return `plan-image-${planName}-${imageType}`;
};

// Hook to load plan header image
export function usePlanImage(planName: string, imageType: string = 'header') {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!planName) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const storageKey = getImageStorageKey(planName, imageType);
        const storedImage = await getImageFromDB(storageKey);
        setImage(storedImage);
      } catch (error) {
        console.error('Failed to load image:', error);
        setImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [planName, imageType]);

  return { image, isLoading };
}
