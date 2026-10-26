import { createContext, useContext } from 'react';

export const RotcContext = createContext(null);
export const useRotc = () => useContext(RotcContext);
