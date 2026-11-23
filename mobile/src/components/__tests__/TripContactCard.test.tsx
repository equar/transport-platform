import React from 'react';
import { Alert, Linking } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TripContactCard } from '../TripContactCard';
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
afterEach(() => jest.restoreAllMocks());
it('shows the participant name and phone and opens only the phone dialer on request', () => {
  const open=jest.spyOn(Linking,'openURL').mockResolvedValue(undefined);
  render(<TripContactCard title="Driver" name="Taylor Reed" phone="+1 (202) 555-0100 ext 42" callLabel="Call driver" />);
  expect(screen.getByText('Taylor Reed')).toBeTruthy();
  expect(screen.getByText('+1 (202) 555-0100 ext 42')).toBeTruthy();
  expect(open).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button',{name:'Call driver Taylor Reed'}));
  expect(open).toHaveBeenCalledWith('tel:+12025550100');
});
it('shows a useful unassigned state without an empty or fabricated phone action', () => {
  render(<TripContactCard title="Driver" callLabel="Call driver" emptyLabel="Driver not assigned yet" />);
  expect(screen.getByText('Driver not assigned yet')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});
it('preserves the displayed number and explains when the dialer cannot open', async () => {
  jest.spyOn(Linking,'openURL').mockRejectedValue(new Error('Unavailable'));
  const alert=jest.spyOn(Alert,'alert');
  render(<TripContactCard title="Rider" name="Taylor" phone="2025550101" callLabel="Call rider" />);
  fireEvent.press(screen.getByRole('button',{name:'Call rider Taylor'}));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Couldn’t open the phone','Dial the contact number shown on this screen.'));
  expect(screen.getByText('2025550101')).toBeTruthy();
});
