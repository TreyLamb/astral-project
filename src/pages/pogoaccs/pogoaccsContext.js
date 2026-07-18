// Split out from PogoAccsApp.jsx so that file can stay a component-only
// export — see the deviation note in the task report for why (this repo's
// eslint config enforces react-refresh/only-export-components, which flags
// a context+hook exported alongside a default-exported component).
import { createContext, useContext } from 'react';

export const PogoAccsContext = createContext(null);

export function usePogoAccs() {
  return useContext(PogoAccsContext);
}
