// Basic global fetch mock for tests that don't explicitly set it
if (typeof global.fetch !== 'function') {
  global.fetch = jest.fn();
}

// Extend Jest with DOM matchers for component tests
// Use require since this is a CommonJS setup file
require('@testing-library/jest-dom');
