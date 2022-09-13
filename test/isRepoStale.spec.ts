import { isStale } from '../src/isRepoStale';

describe('isStale', () => {
  it('should return true if last push was before stale limit', () => {
    const result = isStale('Fri Sep 08 2021 17:46:50 GMT+0200', 90);

    expect(result).toBeTruthy();
  });

  it('should return false if last push was after stale limit', () => {
    const result = isStale(new Date().toString(), 90);

    expect(result).toBeFalsy();
  });
});
