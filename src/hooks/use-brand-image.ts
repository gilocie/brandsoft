
'use client';

import { useState, useEffect } from 'react';

const BRAND_IMAGE_DB_NAME = 'BrandImagesDB';
const BRAND_IMAGE_STORE_NAME = 'brand_images';

// Open IndexedDB
const openBrandImageDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
        reject(new Error('IndexedDB is not available server-side'));
        return;
    }
    const request = indexedDB.open(BRAND_IMAGE_DB_NAME, 1);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BRAND_IMAGE_STORE_NAME)) {
        db.createObjectStore(BRAND_IMAGE_STORE_NAME);
      }
    };
  });
};

// Get image from IndexedDB
// EXPORT ADDED HERE
export const getImageFromDB = async (key: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const db = await openBrandImageDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BRAND_IMAGE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(BRAND_IMAGE_STORE_NAME);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (err) {
    console.error("IndexedDB read error:", err);
    return null;
  }
};

// Save image to IndexedDB
// EXPORT ADDED HERE
export const saveImageToDB = async (key: string, imageData: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  const db = await openBrandImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BRAND_IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(BRAND_IMAGE_STORE_NAME);
    const request = store.put(imageData, key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Hook to manage a specific brand image
export function useBrandImage(imageType: 'logo' | 'cover' | 'affiliateProfilePic') {
  const [image, _setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      try {
        const storedImage = await getImageFromDB(imageType);
        _setImage(storedImage);
      } catch (error) {
        // console.error(`Failed to load ${imageType} image:`, error);
        _setImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [imageType]);

  const setImage = async (imageDataUrl: string) => {
    try {
      await saveImageToDB(imageType, imageDataUrl);
      _setImage(imageDataUrl);
    } catch (error) {
      console.error(`Failed to save ${imageType} image:`, error);
    }
  };

  return { image, isLoading, setImage };
}
