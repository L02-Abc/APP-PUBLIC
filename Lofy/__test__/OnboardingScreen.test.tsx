import React from 'react';
import { render } from '@testing-library/react-native';
import StartPage from '../app/index';

// Mock expo-router Redirect (real one crashes)
jest.mock('expo-router', () => ({
  Redirect: () => null,
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => ({ data: 'token' })),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => null),
}));

jest.mock('../app/store/useUserStore', () => ({
  __esModule: true,
  default: () => ({
    getState: () => ({
      setID: jest.fn(),
      setAlias: jest.fn(),
      initFollowedThread: jest.fn(),
    }),
  }),
}));

describe("Onboarding screen", () => {
  it("renders", () => {
    const tree = render(<StartPage />);
    expect(tree).toBeTruthy();
  });

  it("does not crash", () => {
    render(<StartPage />);
  });

  it("matches snapshot", () => {
    expect(render(<StartPage />).toJSON()).toMatchSnapshot();
  });
});
