// Split out from MedalDexApp.jsx so that file can stay a component-only
// export -- this repo's eslint config enforces react-refresh/only-export-
// components, which flags a context+hook exported alongside a default-
// exported component (see the identical note in pogoaccsContext.js).
import { createContext, useContext } from 'react';

export const MedalDexContext = createContext(null);

export function useMedalDex() {
  return useContext(MedalDexContext);
}
