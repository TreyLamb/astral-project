// Split out from StashMapApp.jsx so that file can stay a component-only
// export — this repo's eslint config enforces react-refresh/only-export-
// components, which flags a context+hook exported alongside a
// default-exported component (see pogoaccsContext.js for the same split).
import { createContext, useContext } from 'react';

export const StashMapContext = createContext(null);

export function useStashMap() {
  return useContext(StashMapContext);
}
