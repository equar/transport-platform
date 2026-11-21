import React, { useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DeliverySignature } from '@api/tripEvidenceApi';
import { useBrandingColors } from '@theme/BrandingContext';
import { AppButton } from './ui';

type Point = { x: number; y: number };
// A bounded native drawing surface. Signature data stays in memory until confirmation.
export function DeliverySignaturePad({ onSave, onClose }: { onSave: (signature: DeliverySignature) => void; onClose: () => void }) {
  const colors = useBrandingColors();
  const { height } = useWindowDimensions();
  const [drawingInk, setDrawingInk] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [limit, setLimit] = useState(false);
  const ink = useRef<Point[][]>([]);
  const size = useRef({ width: 1, height: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const drawing = useRef(false);
  const responder = useMemo(() => {
    const append = (x: number, y: number, start = false) => {
      const count = ink.current.reduce((n, s) => n + s.length, 0);
      if (count >= 1000 || (start && ink.current.length >= 32)) { drawing.current = false; setLimit(true); return; }
      const point = { x: Math.round(Math.max(0, Math.min(1, x / size.current.width)) * 1000) / 1000, y: Math.round(Math.max(0, Math.min(1, y / size.current.height)) * 1000) / 1000 };
      if (start) ink.current.push([point]);
      else {
        const stroke = ink.current[ink.current.length - 1];
        if (!stroke || stroke.length >= 500) { drawing.current = false; setLimit(true); return; }
        const last = stroke[stroke.length - 1];
        if (Math.abs(point.x - last.x) + Math.abs(point.y - last.y) < 0.004) return;
        stroke.push(point);
      }
      setStrokes(ink.current.map(s => [...s]));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: event => { setDrawingInk(true); drawing.current = true; append(event.nativeEvent.locationX, event.nativeEvent.locationY, true); },
      onPanResponderMove: event => { if (drawing.current) append(event.nativeEvent.locationX, event.nativeEvent.locationY); },
      onPanResponderRelease: () => { setDrawingInk(false); drawing.current = false; },
      onPanResponderTerminate: () => { setDrawingInk(false); drawing.current = false; },
    });
  }, []);
  const valid = strokes.filter(s => s.length > 1);
  const hasInk = valid.some(s => s.some(p => Math.abs(p.x - s[0].x) + Math.abs(p.y - s[0].y) > 0.01));
  return <Modal visible animationType="none" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView scrollEnabled={!drawingInk} contentContainerStyle={styles.screen}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Signature (optional)</Text>
      <Text style={{ color: colors.textSecondary }}>Sign below, or go back to confirm without a signature.</Text>
      <View accessibilityLabel="Draw your signature here" style={[styles.pad, { height: Math.min(260, Math.max(140, height * 0.28)), backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
        onLayout={e => { const { width, height } = e.nativeEvent.layout; size.current = { width, height }; setCanvasSize({ width, height }); }} {...responder.panHandlers}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {strokes.flatMap((stroke, si) => stroke.slice(1).map((p, pi) => {
            const previous = stroke[pi], dx = (p.x - previous.x) * canvasSize.width, dy = (p.y - previous.y) * canvasSize.height;
            return <View key={`${si}-${pi}`} style={{ position: 'absolute', left: (p.x + previous.x) / 2 * canvasSize.width - Math.hypot(dx, dy) / 2, top: (p.y + previous.y) / 2 * canvasSize.height, width: Math.hypot(dx, dy) + 1, height: 2, backgroundColor: colors.textPrimary, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] }} />;
          }))}
        </View>
      </View>
      {limit ? <Text accessibilityRole="alert" style={{ color: colors.textSecondary }}>Drawing limit reached. Use this signature or clear to start again.</Text> : null}
      <AppButton label="Clear signature" variant="ghost" onPress={() => { ink.current = []; setStrokes([]); setLimit(false); }} />
      <AppButton label="Use signature" disabled={!hasInk} onPress={() => onSave({ strokes: valid })} />
      <AppButton label="Go back" variant="ghost" onPress={onClose} />
    </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({ screen: { flexGrow: 1, padding: 20, gap: 16 }, title: { fontSize: 22, fontWeight: '700' }, pad: { minHeight: 140, borderWidth: 1, borderRadius: 8, overflow: 'hidden' } });
