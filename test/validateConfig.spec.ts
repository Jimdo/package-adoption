import { validateConfig } from '../src/validateConfig';

describe('isValid', () => {
  const log = console.log; // save original console.log function
  const error = console.error; // save original console.error function
  beforeEach(() => {
    // create 2 new mock functions for each test
    console.log = jest.fn();
    console.error = jest.fn();
  });
  afterAll(() => {
    console.log = log; // restore original console.log after all tests
    console.error = error; // restore original console.error after all tests
  });

  it('should return empty array if no error found', async () => {
    const errors = await validateConfig(
      {
        org: 'orgName',
        pkgName: 'pkgName',
        ghAuthToken: 'x',
        daysUntilStale: 90,
      },
      false
    );

    expect(errors).toEqual([]);
  });

  it('should return empty array and log something if empty ghAuthToken', async () => {
    const errors = await validateConfig(
      {
        org: 'orgName',
        pkgName: 'pkgName',
        ghAuthToken: '',
        daysUntilStale: 90,
      },
      false
    );

    expect(errors).toEqual([]);
    expect(console.log).toHaveBeenCalledWith(
      '[package-adoption]: 🔑 no authentication, scan public repositories'
    );
  });

  it('should return one error if org missing', async () => {
    const errors = await validateConfig(
      {
        org: '',
        pkgName: 'pkgName',
        ghAuthToken: '',
        daysUntilStale: 90,
      },
      false
    );

    expect(errors).toEqual(['org argument is missing']);
  });

  it('should return errors if org and pkgName missing', async () => {
    const errors = await validateConfig(
      {
        org: '',
        pkgName: '',
        ghAuthToken: '',
        daysUntilStale: 90,
      },
      false
    );

    expect(errors).toEqual([
      'org argument is missing',
      'pkgName argument is missing',
    ]);
  });

  it('should return errors on argument type mismatch', async () => {
    const errors = await validateConfig(
      {
        // @ts-ignore
        org: 12,
        // @ts-ignore
        pkgName: 5,
        ghAuthToken: '',
        daysUntilStale: 90,
      },
      false
    );

    expect(errors).toEqual([
      'org must be a string',
      'pkgName must be a string',
    ]);
  });

  it('should report invalid package name', async () => {
    const errors = await validateConfig(
      {
        org: 'myOrg',
        pkgName: 'invalid package name',
        ghAuthToken: '',
        daysUntilStale: 90,
      },
      false
    );

    expect(errors).toEqual([
      'pkgName argument is invalid as npm package name. Errors: name can only contain URL-friendly characters',
    ]);
  });

  it('should report invalid package name with correct param name for CLI argument', async () => {
    const errors = await validateConfig(
      {
        org: 'myOrg',
        pkgName: 'invalid package name',
        ghAuthToken: '',
        daysUntilStale: 90,
      },
      true
    );

    expect(errors).toEqual([
      'pkg argument is invalid as npm package name. Errors: name can only contain URL-friendly characters',
    ]);
  });

  it('should report invalid type for daysUntilStale', async () => {
    const errors = await validateConfig(
      {
        org: 'myOrg',
        pkgName: 'myPkg',
        ghAuthToken: '',
        // @ts-ignore
        daysUntilStale: '90',
      },
      false
    );

    expect(errors).toEqual(['daysUntilStale must be a number']);
  });

  it('should report invalid type for daysUntilStale with correct param name', async () => {
    const errors = await validateConfig(
      {
        org: 'myOrg',
        pkgName: 'myPkg',
        ghAuthToken: '',
        // @ts-ignore
        daysUntilStale: '90',
      },
      true
    );

    expect(errors).toEqual(['days-until-stale must be a number']);
  });
});
