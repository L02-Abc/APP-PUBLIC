import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import StartPage from "../app/index";

// Mock expo-router Redirect (real one crashes)
jest.mock("expo-router", () => ({
  Redirect: () => null,
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => ({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(() => ({ data: "token" })),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => null), // no token
}));

jest.mock("../app/store/useUserStore", () => ({
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
  it("renders safely", async () => {
    const tree = render(<StartPage />);
    await waitFor(() => expect(tree).toBeTruthy());
  });

  it("does not crash", async () => {
    const tree = render(<StartPage />);
    await waitFor(() => tree);
  });

  it("matches snapshot", async () => {
    const tree = render(<StartPage />);
    await waitFor(() =>
      expect(tree.toJSON()).toMatchSnapshot()
    );
  });
});
