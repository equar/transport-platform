import React from 'react';
import * as Native from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppearancePreferenceCard } from '../AppearancePreferenceCard';
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
// Paper imports the icon through its subpath; font loading is outside layout coverage.
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({ __esModule: true, default: 'Icon' }));
const mockSetPreference = jest.fn().mockResolvedValue(undefined);
jest.mock('@theme/ThemeProvider', () => ({
  ...jest.requireActual('@theme/ThemeProvider'),
  useAppearancePreference: () => ({ preference: 'system', isLoading: false, error: null, setPreference: mockSetPreference }),
}));
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });
it.each([
  { width: 320, height: 640, scale: 1, fontScale: 1 },
  { width: 430, height: 900, scale: 1, fontScale: 2 },
])('keeps every appearance choice selectable on a narrow screen or with large text (%j)', dimensions => {
  jest.spyOn(Native, 'useWindowDimensions').mockReturnValue(dimensions);
  render(<AppearancePreferenceCard />);
  expect(screen.getByRole('radio', { name: 'Light' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
  fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
  expect(mockSetPreference).toHaveBeenCalledWith('dark');
});
