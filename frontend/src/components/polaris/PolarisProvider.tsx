import React from 'react';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';

interface PolarisProviderProps {
  children: React.ReactNode;
}

export const PolarisProvider: React.FC<PolarisProviderProps> = ({ children }) => {
  return (
    <AppProvider i18n={enTranslations}>
      {children}
    </AppProvider>
  );
};
