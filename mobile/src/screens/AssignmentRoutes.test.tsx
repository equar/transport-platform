import React from 'react';
import { render } from '@testing-library/react-native';
import { Redirect } from 'expo-router';
import RiderSchedule from '../../app/(rider)/schedule';
import GuardianSchedule from '../../app/(guardian)/schedule';
jest.mock('expo-router', () => ({ Redirect: jest.fn(() => null) }));
beforeEach(() => jest.clearAllMocks());
it.each([
  ['rider', RiderSchedule, '/(rider)/rides'],
  ['guardian', GuardianSchedule, '/(guardian)/rides'],
])('redirects legacy %s request links to the trip list', (_role, Screen, href) => {
  render(<Screen />);
  expect(Redirect).toHaveBeenCalledWith(expect.objectContaining({ href }), undefined);
});
