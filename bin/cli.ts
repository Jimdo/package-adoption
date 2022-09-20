#!/usr/bin/env node

import yargs from 'yargs/yargs';
import path from 'path';
import { cwd } from 'process';
import fs from 'fs';

import { getFilteredReposWithPackageForOrg } from '../src/getFilteredReposWithPackageForOrg';
import { Config } from '../src/types';

const argv = yargs(process.argv.slice(2)).options({
  config: { type: 'string', default: 'config.js' },
  output: { type: 'string' },
  'days-until-stale': { type: 'number', default: 360 },
  pkg: { type: 'string' },
  token: { type: 'string' },
  org: { type: 'string' },
}).argv;

const validateConfig = (config: Config) => {
  const errors: string[] = [];

  if (config.ORG === undefined || config.ORG === '') {
    errors.push('ORG argument is missing');
  } else if (typeof config.ORG !== 'string') {
    errors.push('ORG must be a string');
  }

  if (config.PKG_NAME === undefined || config.PKG_NAME === '') {
    errors.push('PKG NAME argument is missing');
  } else if (typeof config.PKG_NAME !== 'string') {
    errors.push('PKG_NAME must be a string');
  }

  if (config.GH_AUTHTOKEN === undefined || config.GH_AUTHTOKEN === '') {
    errors.push('GH_AUTHTOKEN argument is missing');
  } else if (typeof config.GH_AUTHTOKEN !== 'string') {
    errors.push('GH_AUTHTOKEN must be a string');
  }

  return errors;
};

(async () => {
  const configPath = path.resolve(cwd(), argv.config);
  let config: Config;

  try {
    config = require(configPath);
  } catch {
    config = {
      ORG: argv.org || '',
      PKG_NAME: argv.pkg || '',
      GH_AUTHTOKEN: argv.token || '',
      DAYS_UNTIL_STALE: argv['days-until-stale'],
    };
  }

  const { ORG, PKG_NAME, GH_AUTHTOKEN, DAYS_UNTIL_STALE } = config;

  const errors = validateConfig(config);
  if (errors.length === 0) {
    const repositories = await getFilteredReposWithPackageForOrg({
      org: ORG,
      daysUntilStale: DAYS_UNTIL_STALE,
      ghAuthToken: GH_AUTHTOKEN,
      pkgName: PKG_NAME,
    });

    if (argv.output) {
      const outputPath = path.resolve(cwd(), argv.output);
      fs.writeFileSync(outputPath, JSON.stringify(repositories));
    } else {
      console.log(`\n\n${PKG_NAME} found in the following repositories:`);
      console.log(repositories);
    }
  } else {
    console.error('Config errors:');

    errors.forEach((error) => {
      console.error(`- ${error}`);
    });
  }
})().catch((err) => {
  console.error(err);
});
