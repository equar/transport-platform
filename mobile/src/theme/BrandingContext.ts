import { createContext, useContext } from 'react';
import { Colors } from './tokens';
import type { BrandColors } from './branding';
export const BrandingColorsContext = createContext<BrandColors>(Colors);
export const useBrandingColors = () => useContext(BrandingColorsContext);
