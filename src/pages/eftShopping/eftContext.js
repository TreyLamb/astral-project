import { createContext, useContext } from 'react';

export const EftContext = createContext(null);

export function useEft() {
  const ctx = useContext(EftContext);
  if (!ctx) throw new Error('useEft must be used inside EftShoppingApp');
  return ctx;
}
