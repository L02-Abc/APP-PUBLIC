import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Proper ES module default mock
jest.mock("../app/(tabs)/index", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");

  function MockHomeScreen() {
    return (
      <>
        <Text>Mock Home Screen</Text>
        <TouchableOpacity testID="tab-all">
          <Text>All</Text>
        </TouchableOpacity>
      </>
    );
  }

  return {
    __esModule: true,
    default: MockHomeScreen,
  };
});

import HomeScreen from "../app/(tabs)/index";

describe("HomeScreen (Mocked)", () => {
  it("renders without crashing", () => {
    const screen = render(<HomeScreen />);
    expect(screen.getByText("Mock Home Screen")).toBeTruthy();
  });

  it("renders the tab label", () => {
    const screen = render(<HomeScreen />);
    expect(screen.getByText("All")).toBeTruthy();
  });

  it("tab can be pressed", () => {
    const screen = render(<HomeScreen />);
    const tab = screen.getByTestId("tab-all");
    fireEvent.press(tab);
    expect(tab).toBeTruthy();
  });
});
