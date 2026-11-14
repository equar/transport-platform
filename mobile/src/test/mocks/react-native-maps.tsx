import React from 'react';
import { View, type ViewProps } from 'react-native';

interface MockMapViewProps extends ViewProps {
  children?: React.ReactNode;
  region?: unknown;
  mapType?: string;
}

interface MockMarkerProps {
  title: string;
}

export default function MockMapView({ children, testID, accessibilityLabel }: MockMapViewProps) {
  return (
    <View testID={testID} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

export function Marker({ title }: MockMarkerProps) {
  return <View accessibilityLabel={title} />;
}

export function UrlTile() {
  return null;
}
