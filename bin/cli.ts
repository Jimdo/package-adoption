#!/usr/bin/env node

import yargs from 'yargs/yargs';
import path from 'path';
import { cwd } from 'process';
import fs from 'fs';

import { getFilteredReposWithPackageForOrg } from '../src/getFilteredReposWithPackageForOrg';

const argv = yargs(process.argv.slice(2)).options({
  config: { type: 'string', default: 'config.js' },
  output: { type: 'string' },
}).argv;

type Config = {
  ORG: string;
  PKG_NAME: string;
  GH_AUTHTOKEN: string;
  DAYS_UNTIL_STALE: number;
};

const validateConfig = (config: Config) => {
  const errors: string[] = [];

  if (config.ORG === undefined) {
    errors.push('ORG is missing in the config file');
  } else if (typeof config.ORG !== 'string') {
    errors.push('ORG must be a string');
  }

  if (config.PKG_NAME === undefined) {
    errors.push('PKG_NAME is missing in the config file');
  } else if (typeof config.PKG_NAME !== 'string') {
    errors.push('PKG_NAME must be a string');
  }

  if (config.GH_AUTHTOKEN === undefined) {
    errors.push('GH_AUTHTOKEN is missing in the config file');
  } else if (typeof config.GH_AUTHTOKEN !== 'string') {
    errors.push('GH_AUTHTOKEN must be a string');
  }

  if (config.DAYS_UNTIL_STALE === undefined) {
    errors.push('DAYS_UNTIL_STALE is missing in the config file');
  } else if (typeof config.DAYS_UNTIL_STALE !== 'number') {
    errors.push('DAYS_UNTIL_STALE must be a string');
  }

  return errors;
};

(async () => {
  const configPath = path.resolve(cwd(), argv.config);
  const config: Config = require(configPath);

  const { ORG, PKG_NAME, GH_AUTHTOKEN, DAYS_UNTIL_STALE } = config;

  const errors = validateConfig(config);
  if (errors.length === 0) {
    const repositories = await getFilteredReposWithPackageForOrg(
      ORG,
      DAYS_UNTIL_STALE,
      GH_AUTHTOKEN,
      PKG_NAME
    );

    if (argv.output) {
      const outputPath = path.resolve(cwd(), argv.output);
      fs.writeFileSync(outputPath, JSON.stringify(repositories));
    } else {
      console.log(`\n\n${PKG_NAME} found in the following repositories:`);
      console.log(repositories);
    }
  } else {
    console.error('Config errors:');

    errors.forEach(error => {
      console.error(`- ${error}`);
    });
  }
})().catch(err => {
  console.error(err);
});
