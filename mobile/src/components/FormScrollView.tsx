import React from 'react';
import { Keyboard, Platform, ScrollView, TextInput, View, type ScrollViewProps } from 'react-native';

/** iOS owns native keyboard insets. Android edge-to-edge windows need measured overlap. */
export const FormScrollView = React.forwardRef<ScrollView, ScrollViewProps>(function FormScrollView({ onLayout, onFocus, ...props }, ref) {
  const container = React.useRef<View>(null);
  const scroll = React.useRef<ScrollView>(null);
  const mounted = React.useRef(true);
  const revealFrame = React.useRef<number | null>(null);
  const keyboardTop = React.useRef<number | null>(null);
  const [overlap, setOverlap] = React.useState(0);
  React.useImperativeHandle(ref, () => scroll.current!, []);

  const cancelReveal = React.useCallback(() => {
    if (revealFrame.current != null) cancelAnimationFrame(revealFrame.current);
    revealFrame.current = null;
  }, []);
  const revealInput = React.useCallback(() => {
    if (!mounted.current || keyboardTop.current == null) return;
    cancelReveal();
    revealFrame.current = requestAnimationFrame(() => {
      revealFrame.current = null;
      if (!mounted.current || keyboardTop.current == null) return;
      const focused = TextInput.State.currentlyFocusedInput();
      if (focused) scroll.current?.scrollResponderScrollNativeHandleToKeyboard(focused, 24, true);
    });
  }, [cancelReveal]);
  const updateOverlap = React.useCallback(() => {
    if (!mounted.current || Platform.OS !== 'android' || keyboardTop.current == null) return;
    container.current?.measureInWindow((_x, y, _width, height) => {
      if (mounted.current && keyboardTop.current != null) setOverlap(Math.max(0, y + height - keyboardTop.current) + 12);
    });
  }, []);
  React.useEffect(() => {
    mounted.current = true;
    const metrics = Keyboard.metrics();
    if (metrics) { keyboardTop.current = metrics.screenY; updateOverlap(); revealInput(); }
    const shown = Keyboard.addListener('keyboardDidShow', event => {
      keyboardTop.current = event.endCoordinates.screenY;
      updateOverlap();
      revealInput();
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      cancelReveal();
      keyboardTop.current = null;
      setOverlap(0);
    });
    return () => { mounted.current = false; cancelReveal(); keyboardTop.current = null; shown.remove(); hidden.remove(); };
  }, [cancelReveal, revealInput, updateOverlap]);

  return <View ref={container} style={{ flex: 1, paddingBottom: overlap }} onLayout={updateOverlap}>
    <ScrollView
      ref={scroll}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      onLayout={event => { revealInput(); onLayout?.(event); }}
      onFocus={event => { revealInput(); onFocus?.(event); }}
      {...props}
    />
  </View>;
});
