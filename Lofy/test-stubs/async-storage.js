module.exports = {
  getItem: jest.fn(async (key) => null),
  setItem: jest.fn(async (key, value) => undefined),
  removeItem: jest.fn(async (key) => undefined),
};