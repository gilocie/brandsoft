
'use client';

import type { BrandsoftConfig, Product } from '@/types/brandsoft';

export function useProducts(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {
  const addProduct = (product: Omit<Product, 'id'>): Product => {
      const newProduct = { ...product, id: `PROD-${Date.now()}` };
      if (config) {
          const newConfig = { ...config, products: [...(config.products || []), newProduct] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
      return newProduct;
  };
  
  const updateProduct = (productId: string, data: Partial<Omit<Product, 'id'>>) => {
      if (config) {
          const newProducts = (config.products || []).map(p => 
              p.id === productId ? { ...p, ...data } : p
          );
          saveConfig({ ...config, products: newProducts }, { redirect: false, revalidate: false });
      }
  };
  
  const deleteProduct = (productId: string) => {
      if (config) {
          const newProducts = (config.products || []).filter(p => p.id !== productId);
          saveConfig({ ...config, products: newProducts }, { redirect: false, revalidate: false });
      }
  };

  return {
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
