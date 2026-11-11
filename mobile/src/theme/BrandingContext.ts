import { createContext, useContext } from 'react';
import { LightColors } from './tokens';
import type { BrandColors } from './branding';
export const BrandingColorsContext = createContext<BrandColors>(LightColors);
export const useBrandingColors = () => useContext(BrandingColorsContext);
