
'use client';

import { create } from 'zustand';
import { useCallback } from 'react';

type FormStateStore = {
  forms: { [key: string]: any };
  setFormData: (key: string, data: any) => void;
  getFormData: (key: string) => any;
};

const useFormStateStore = create<FormStateStore>((set, get) => ({
  forms: {},
  setFormData: (key, data) => set(state => ({
    forms: { ...state.forms, [key]: data }
  })),
  getFormData: (key) => get().forms[key],
}));

export function useFormState(formKey: string = 'default') {
  const { setFormData: setStoreData, getFormData: getStoreData } = useFormStateStore();

  const handleFormChange = useCallback((data: any) => {
    try {
      if (typeof window !== 'undefined') {
        if(data === null) {
          sessionStorage.removeItem(formKey);
        } else {
          const sessionData = JSON.stringify(data);
          sessionStorage.setItem(formKey, sessionData);
        }
      }
      setStoreData(formKey, data);
    } catch (e) {
      console.error("Could not stringify or set form data in session storage", e);
    }
  }, [setStoreData, formKey]);
  
  const getStoredFormData = useCallback(() => {
    if (typeof window !== 'undefined') {
        try {
            const storedData = sessionStorage.getItem(formKey);
            if (storedData) {
              return JSON.parse(storedData);
            }
        } catch (e) {
            console.error("Could not parse form data from session storage", e);
        }
    }
    return getStoreData(formKey);
  }, [getStoreData, formKey]);

  return { setFormData: handleFormChange, getFormData: getStoredFormData };
}
