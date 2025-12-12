
'use client';

import type { BrandsoftConfig } from '@/types/brandsoft';

export function useCurrencies(
  config: BrandsoftConfig | null,
  saveConfig: (newConfig: BrandsoftConfig, options?: { redirect?: boolean; revalidate?: boolean }) => void
) {
  const addCurrency = (currency: string) => {
      if (config && !config.currencies.includes(currency)) {
          const newConfig = { ...config, currencies: [...config.currencies, currency] };
          saveConfig(newConfig, { redirect: false, revalidate: false });
      }
  };

  return {
    addCurrency,
  };
}
