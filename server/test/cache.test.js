// ============================================================
// ELIMUPLUS - CACHE UTILITY TESTS
// ============================================================

const cache = require('../utils/cache');

describe('Cache utility', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns undefined for a missing key', () => {
    expect(cache.get('missing-key')).toBeUndefined();
  });

  test('stores and retrieves a value', () => {
    cache.set('test-value', { cycleName: 'Test Cycle' });

    expect(cache.get('test-value')).toEqual({
      cycleName: 'Test Cycle'
    });
  });

  test('expires a value after its TTL', () => {
    jest.useFakeTimers();

    cache.set('expiry-test', 'temporary value', 1000);

    expect(cache.get('expiry-test')).toBe('temporary value');

    jest.advanceTimersByTime(1001);

    expect(cache.get('expiry-test')).toBeUndefined();
  });

  test('deletes a cached value', () => {
    cache.set('delete-test', 'some value');

    cache.del('delete-test');

    expect(cache.get('delete-test')).toBeUndefined();
  });

  test('distinguishes cached null from a cache miss', () => {
    cache.set('null-test', null);

    expect(cache.get('null-test')).toBeNull();
  });
});
