import React from 'react';
import { Keyboard, Platform, ScrollView, TextInput, View, type ScrollViewProps } from 'react-native';

/** iOS owns native keyboard insets. Android edge-to-edge windows need measured overlap. */
export const FormScrollView = React.forwardRef<ScrollView, ScrollViewProps>(function FormScrollView({ onLayout, onFocus, ...props }, ref) {
  const container = React.useRef<View>(null);
  const scroll = React.useRef<ScrollView>(null);
  const keyboardTop = React.useRef<number | null>(null);
  const [overlap, setOverlap] = React.useState(0);
  React.useImperativeHandle(ref, () => scroll.current!, []);

  const revealInput = React.useCallback(() => {
    if (keyboardTop.current == null) return;
    requestAnimationFrame(() => {
      const focused = TextInput.State.currentlyFocusedInput();
      if (focused) scroll.current?.scrollResponderScrollNativeHandleToKeyboard(focused, 24, true);
    });
  }, []);
  const updateOverlap = React.useCallback(() => {
    if (Platform.OS !== 'android' || keyboardTop.current == null) return;
    container.current?.measureInWindow((_x, y, _width, height) => {
      if (keyboardTop.current != null) setOverlap(Math.max(0, y + height - keyboardTop.current) + 12);
    });
  }, []);
  React.useEffect(() => {
    const metrics = Keyboard.metrics();
    if (metrics) { keyboardTop.current = metrics.screenY; updateOverlap(); revealInput(); }
    const shown = Keyboard.addListener('keyboardDidShow', event => {
      keyboardTop.current = event.endCoordinates.screenY;
      updateOverlap();
      revealInput();
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setOverlap(0);
    });
    return () => { keyboardTop.current = null; shown.remove(); hidden.remove(); };
  }, [revealInput, updateOverlap]);

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
