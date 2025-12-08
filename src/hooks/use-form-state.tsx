
'use client';

import { create } from 'zustand';
import { useCallback } from 'react';

type FormState = {
  formData: any;
  setFormData: (data: any) => void;
  getFormData: () => any;
};

const useFormStateStore = create<FormState>((set, get) => ({
  formData: null,
  setFormData: (data) => set({ formData: data }),
  getFormData: () => get().formData,
}));

export function useFormState() {
  const { setFormData: setStoreData, getFormData: getStoreData } = useFormStateStore();

  const handleFormChange = useCallback((data: any) => {
    sessionStorage.setItem('form-data', JSON.stringify(data));
    setStoreData(data);
  }, [setStoreData]);
  
  const getStoredFormData = useCallback(() => {
    if (typeof window !== 'undefined') {
        try {
            const storedData = sessionStorage.getItem('form-data');
            return storedData ? JSON.parse(storedData) : getStoreData();
        } catch (e) {
            console.error("Could not parse form data from session storage", e);
            return getStoreData();
        }
    }
    return getStoreData();
  }, [getStoreData]);

  // A bit of a hack to get around passing reactive data via router
  // In a real app, this would be handled by a proper state management solution like Redux or Jotai with a shared router instance.
  return { setFormData: handleFormChange, getFormData: getStoredFormData };
}
