const vue = jest.requireActual("vue-demi");

module.exports = {
  ...vue,
  inject: jest.fn(),
  provide: jest.fn(),
  onScopeDispose: jest.fn(),
  getCurrentInstance: jest.fn(() => ({ proxy: {} })),
};
