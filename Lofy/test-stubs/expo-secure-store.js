module.exports = {
  getItemAsync: jest.fn(async (key) => null),
  setItemAsync: jest.fn(async (key, value) => undefined),
  deleteItemAsync: jest.fn(async (key) => undefined),
};