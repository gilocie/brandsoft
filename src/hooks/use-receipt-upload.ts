
'use client';

// This hook is analogous to use-plan-image.ts but for purchase receipts.

const RECEIPT_DB_NAME = 'ReceiptImagesDB';
const RECEIPT_STORE_NAME = 'receipts';

// Open IndexedDB for receipts
const openReceiptDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECEIPT_DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(RECEIPT_STORE_NAME)) {
        db.createObjectStore(RECEIPT_STORE_NAME);
      }
    };
  });
};

// Get receipt image from IndexedDB
export const getReceiptFromDB = async (orderId: string): Promise<string | null> => {
  try {
    const db = await openReceiptDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECEIPT_STORE_NAME], 'readonly');
      const store = transaction.objectStore(RECEIPT_STORE_NAME);
      const request = store.get(orderId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
};

// Save receipt image to IndexedDB
export const saveReceiptToDB = async (orderId: string, imageData: string): Promise<void> => {
  const db = await openReceiptDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECEIPT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(RECEIPT_STORE_NAME);
    const request = store.put(imageData, orderId);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
