# package-adoption

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

[Find out where a ts/js package is used](https://medium.com/p/caabc3a7544c) across a GitHub organization, version and position of the package for each repository.

Usage for `pkgName` will be analyzed across `org`, excluding repositories that did not receive any commit in the last `daysUntilStale` days. A GitHub [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with scope `repo` is required, to access the `org` **private repositories** through GitHub APIs. It can be omitted to search across public repositories.
Archived repositories are filtered out.

> :warning: GitHub API are rate limited, and search API in particular has the additional [secondary rate limit](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#secondary-rate-limits). _package-adoption_ implements the [best practices guidelines](https://docs.github.com/en/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits) to deal with it, but you should know that limitations could happen in any case.

> :warning: GitHub search API are not 100% reliable and sometimes return deleted / outdated files or multiple versions of the same file. The library version in the output could be inaccurate for this reason.

## Install

```bash
npm install package-adoption
```

## Usage

```ts
import { getFilteredReposWithPackageForOrg } from 'package-adoption';

const result = getFilteredReposWithPackageForOrg({
  org: 'my-org',
  daysUntilStale: 90,
  ghAuthToken: 'my-gh-auth-token',
  pkgName: 'my-pkg',
});
/* => [
  {
    name: 'repo-1',
    installationPath: 'root',
    libVersion: '55.0.0-beta.13',
  },
  {
    name: 'repo-2',
    installationPath: 'packages/package-name1',
    libVersion: '65.2.0',
    "isPeerDep": true,
    "isDevDep": true
  },
  {
    name: 'repo-2',
    installationPath: 'packages/package-name2',
    libVersion: '65.2.1',
    "isDevDep": true
  }
]; */
```

## Run CLI

```bash
npx package-adoption

package-adoption --config /path/to/config.json --output /path/to/output.json
```

If output file path omitted, `package-adoption` outputs to stdout.
When config option omitted, default for config file will be local `config.json`. The file must export an object like this:

```json
{
  "org": "myOrg",
  "daysUntilStale": 90, // If omitted, 365 will be used as default
  "ghAuthToken": "my-GH-auth-token",
  "pkgName": "myPkg"
}
```

### With inline arguments

```bash
package-adoption --org=myOrg --token=my-GH-auth-token --pkg=myPkg --output /path/to/output.json
```

### Run locally

```bash
npm run dev
```

[build-img]: https://github.com/jimdo/package-adoption/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/jimdo/package-adoption/actions/workflows/release.yml
[downloads-img]: https://img.shields.io/npm/dt/package-adoption
[downloads-url]: https://www.npmtrends.com/package-adoption
[npm-img]: https://img.shields.io/npm/v/package-adoption
[npm-url]: https://www.npmjs.com/package/package-adoption
[issues-img]: https://img.shields.io/github/issues/jimdo/package-adoption
[issues-url]: https://github.com/jimdo/package-adoption/issues
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
