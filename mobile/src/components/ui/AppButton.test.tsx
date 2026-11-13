import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BrandingColorsContext } from '@theme/BrandingContext';
import { DarkColors, LightColors } from '@theme/tokens';
import { AppButton } from './AppButton';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

const filledVariants = ['primary', 'secondary', 'destructive'] as const;

describe('AppButton filled variants', () => {
  it.each(filledVariants)('uses the dark surface foreground for %s content', variant => {
    const view = render(
      <BrandingColorsContext.Provider value={DarkColors}>
        <AppButton label="Continue" onPress={jest.fn()} variant={variant} leftIcon="check" rightIcon="arrow-right" />
      </BrandingColorsContext.Provider>,
    );

    expect(screen.getByText('Continue')).toHaveStyle({ color: DarkColors.surface });
    expect(view.UNSAFE_getAllByType(MaterialCommunityIcons).map(icon => icon.props.color)).toEqual([
      DarkColors.surface,
      DarkColors.surface,
    ]);
  });

  it.each(filledVariants)('uses the light surface foreground for %s content', variant => {
    const view = render(
      <BrandingColorsContext.Provider value={LightColors}>
        <AppButton label="Continue" onPress={jest.fn()} variant={variant} leftIcon="check" rightIcon="arrow-right" />
      </BrandingColorsContext.Provider>,
    );

    expect(screen.getByText('Continue')).toHaveStyle({ color: LightColors.surface });
    expect(view.UNSAFE_getAllByType(MaterialCommunityIcons).map(icon => icon.props.color)).toEqual([
      LightColors.surface,
      LightColors.surface,
    ]);
  });

  it.each(filledVariants)('uses the dark surface foreground for the %s loading indicator', variant => {
    const view = render(
      <BrandingColorsContext.Provider value={DarkColors}>
        <AppButton label="Continue" onPress={jest.fn()} variant={variant} loading />
      </BrandingColorsContext.Provider>,
    );

    expect(view.UNSAFE_getByType(ActivityIndicator).props.color).toBe(DarkColors.surface);
  });
});
