
'use client';

import { create } from 'zustand';

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
  const { setFormData, getFormData } = useFormStateStore();

  const handleFormChange = (data: any) => {
    sessionStorage.setItem('form-data', JSON.stringify(data));
  };
  
  const getStoredFormData = () => {
    if (typeof window !== 'undefined') {
        const storedData = sessionStorage.getItem('form-data');
        return storedData ? JSON.parse(storedData) : null;
    }
    return null;
  }

  // A bit of a hack to get around passing reactive data via router
  // In a real app, this would be handled by a proper state management solution like Redux or Jotai with a shared router instance.
  return { setFormData: handleFormChange, getFormData: getStoredFormData };
}
