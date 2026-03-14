import { config } from '../tests/__mocks__/config.js';

// Test that config exports an object
// This ensures the config module is present and usable

describe('config', () => {
  it('should be an object', () => {
    expect(typeof config).toBe('object');
  });
});
