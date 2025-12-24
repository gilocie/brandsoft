'use client';

import { useState, useEffect } from 'react';

const BRAND_IMAGE_DB_NAME = 'BrandImagesDB';
const BRAND_IMAGE_STORE_NAME = 'brand_images';
const DB_VERSION = 1; // Reset to 1 with fresh start

// Singleton promise to prevent multiple simultaneous opens
let dbPromise: Promise<IDBDatabase> | null = null;

const openBrandImageDB = (): Promise<IDBDatabase> => {
  // Return existing promise if already opening/opened
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available server-side'));
      return;
    }

    const request = indexedDB.open(BRAND_IMAGE_DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null; // Reset on error
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onupgradeneeded = (event) => {
      console.log('Creating object store...');
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Delete old store if exists (clean slate)
      if (db.objectStoreNames.contains(BRAND_IMAGE_STORE_NAME)) {
        db.deleteObjectStore(BRAND_IMAGE_STORE_NAME);
      }
      
      db.createObjectStore(BRAND_IMAGE_STORE_NAME);
      console.log('Object store created');
    };

    request.onsuccess = () => {
      const db = request.result;
      
      // Verify store exists
      if (!db.objectStoreNames.contains(BRAND_IMAGE_STORE_NAME)) {
        console.error('Store missing after open, resetting...');
        db.close();
        dbPromise = null;
        
        // Delete and retry
        const deleteReq = indexedDB.deleteDatabase(BRAND_IMAGE_DB_NAME);
        deleteReq.onsuccess = () => {
          openBrandImageDB().then(resolve).catch(reject);
        };
        deleteReq.onerror = () => reject(new Error('Failed to reset DB'));
        return;
      }
      
      console.log('DB ready with stores:', Array.from(db.objectStoreNames));
      resolve(db);
    };
  });

  return dbPromise;
};

// Save image to IndexedDB
export const saveImageToDB = async (key: string, imageData: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    const db = await openBrandImageDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BRAND_IMAGE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BRAND_IMAGE_STORE_NAME);
      const request = store.put(imageData, key);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('saveImageToDB error:', error);
    throw error;
  }
};

// Get image from IndexedDB
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
  } catch (error) {
    console.error('getImageFromDB error:', error);
    return null;
  }
};

// Rest of your hook stays the same...
type BrandImageType = 'logo' | 'cover' | 'affiliateProfilePic' | 'adminProfilePic';

export function useBrandImage(imageType: BrandImageType) {
  const [image, _setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      try {
        const storedImage = await getImageFromDB(imageType);
        _setImage(storedImage);
      } catch (error) {
        _setImage(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadImage();
  }, [imageType]);

  const setImage = async (imageDataUrl: string) => {
    try {
      if (imageDataUrl) {
        await saveImageToDB(imageType, imageDataUrl);
      } else {
        const db = await openBrandImageDB();
        const transaction = db.transaction([BRAND_IMAGE_STORE_NAME], 'readwrite');
        transaction.objectStore(BRAND_IMAGE_STORE_NAME).delete(imageType);
      }
      _setImage(imageDataUrl || null);
    } catch (error) {
      console.error(`Failed to save ${imageType} image:`, error);
    }
  };

  return { image, isLoading, setImage };
}