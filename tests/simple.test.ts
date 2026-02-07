import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Simple Test', () => {
  it('should work with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        expect(typeof n).toBe('number');
        return true;
      })
    );
  });
});