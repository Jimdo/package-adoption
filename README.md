# package-adoption

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

Find out where a ts/js package is used across a GitHub organization, version and position of the package for each repository.

## Install

```bash
npm install package-adoption
```

## Usage

```ts
import { getFilteredReposWithPackageForOrg } from 'package-adoption';

const result = getFilteredReposWithPackageForOrg(
  'my-org',
  90,
  'my-gh-auth-token',
  'my-pkg'
);
/* => [
  {
    name: 'repo-1',
    installationPath: 'src/package.json',
    libVersion: '55.0.0-beta.13',
  },
  {
    name: 'repo-2',
    installationPath: 'package.json',
    libVersion: '65.2.0',
  },
]; */
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
