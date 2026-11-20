import React from 'react';
import { Keyboard, Platform, ScrollView, View, type KeyboardEvent } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FormScrollView } from '../FormScrollView';
import { AppInput } from '../ui/AppInput';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
afterEach(() => jest.restoreAllMocks());
it.each(['ios', 'android'] as const)('keeps form actions tappable with a keyboard on %s', os => {
  jest.replaceProperty(Platform, 'OS', os);
  const view = render(<FormScrollView><AppInput label="Notes" value="" onChangeText={jest.fn()} /></FormScrollView>);
  const scroll = view.UNSAFE_getByType(ScrollView);
  expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  expect(scroll.props.keyboardDismissMode).toBe(os === 'ios' ? 'interactive' : 'on-drag');
  expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(os === 'ios');
});
it('supports keyboard submission and focus callbacks without losing the input value', () => {
  const submit = jest.fn(); const focus = jest.fn();
  render(<AppInput label="Code" value="123456" onChangeText={jest.fn()} returnKeyType="go" autoCorrect={false} onSubmitEditing={submit} onFocus={focus} />);
  const input = screen.getByLabelText('Code');
  fireEvent(input, 'focus', {});
  fireEvent(input, 'submitEditing', { nativeEvent: { text: '123456' } });
  expect(submit).toHaveBeenCalledTimes(1);
  expect(focus).toHaveBeenCalledTimes(1);
  expect(input).toHaveProp('value', '123456');
  expect(input).toHaveProp('autoCorrect', false);
});
it('lets multiline text grow instead of enforcing a fixed height', () => {
  render(<AppInput label="Trip notes" value="A long note" onChangeText={jest.fn()} multiline numberOfLines={4} />);
  expect(screen.getByLabelText('Trip notes')).toHaveStyle({ minHeight: 96, textAlignVertical: 'top' });
  expect(screen.getByLabelText('Trip notes')).not.toHaveStyle({ height: 80 });
});
it('reserves measured Android keyboard overlap and restores the form on dismissal', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const listeners: Record<string, (event: KeyboardEvent) => void> = {};
  const remove = jest.fn();
  const addListener = Keyboard.addListener.bind(Keyboard);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
    listeners[name] = callback;
    const subscription = addListener(name, callback);
    const removeSubscription = subscription.remove.bind(subscription);
    subscription.remove = () => { remove(); removeSubscription(); };
    return subscription;
  });
  const view = render(<FormScrollView><AppInput label="Notes" value="" onChangeText={jest.fn()} /></FormScrollView>);
  const frame = view.UNSAFE_getAllByType(View)[0];
  jest.spyOn(frame.instance as View, 'measureInWindow').mockImplementation(callback => callback(0, 100, 320, 500));
  // The form ends at 600; the keyboard begins at 350. Include a small clear gap.
  act(() => listeners.keyboardDidShow({ endCoordinates: { screenY: 350, screenX: 0, width: 320, height: 290 }, duration: 250, easing: 'keyboard' }));
  expect(frame.props.style).toMatchObject({ paddingBottom: 262 });
  act(() => listeners.keyboardDidHide({ endCoordinates: { screenY: 640, screenX: 0, width: 320, height: 0 }, duration: 250, easing: 'keyboard' }));
  expect(frame.props.style).toMatchObject({ paddingBottom: 0 });
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(2);
});
