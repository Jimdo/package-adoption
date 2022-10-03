import { readPackageJson } from '../src/readPackageJson';
import {
  contentResponseMockDeps,
  contentResponseMockPeerAndDev,
  getMockedFileResponse,
} from './fixtures';
jest.mock('../src/octokitInit');
import { octokit } from '../src/octokitInit';

const input = {
  org: 'myOrg',
  repoName: 'repoX',
  pkgName: 'myPkg',
  packageJsonPath: 'path/to/package.json',
  installationPath: 'path/to',
};

describe('readPackageJson', () => {
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

  it('should parse package version from dependencies in package.json file', async () => {
    (octokit?.repos.getContent as unknown as jest.Mock).mockResolvedValueOnce({
      data: getMockedFileResponse(contentResponseMockDeps),
    });

    const result = await readPackageJson(input);

    expect(console.log).toHaveBeenCalledWith(
      '[package-adoption]: repoX has myPkg, version 1.0.0 at path/to'
    );

    expect(result).toEqual({
      name: 'repoX',
      installationPath: 'path/to',
      libVersion: '1.0.0',
    });
  });

  it('should parse package version from devDependencies and peerDependencies in package.json file', async () => {
    (octokit?.repos.getContent as unknown as jest.Mock).mockResolvedValueOnce({
      data: getMockedFileResponse(contentResponseMockPeerAndDev),
    });

    const result = await readPackageJson(input);

    expect(console.log).toHaveBeenCalledWith(
      '[package-adoption]: repoX has myPkg, version 1.0.1 at path/to'
    );

    expect(result).toEqual({
      name: 'repoX',
      installationPath: 'path/to',
      libVersion: '1.0.1',
      isPeerDep: true,
      isDevDep: true,
    });
  });

  it('should print error if file content invalid', async () => {
    const errorUrl =
      'https://api.github.com/repos/myOrg/repoX/contents/packages%2Fsubmodule%2Fpackage.json';
    (octokit?.repos.getContent as unknown as jest.Mock).mockRejectedValueOnce({
      response: {
        url: errorUrl,
      },
    });

    await readPackageJson(input);

    expect(console.error).toHaveBeenCalledWith(
      `[package-adoption]: Error reading package.json file\n${errorUrl}`
    );
  });
});
