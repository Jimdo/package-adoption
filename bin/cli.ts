#!/usr/bin/env node

import yargs from 'yargs/yargs';
import path from 'path';
import { cwd } from 'process';
import fs from 'fs';

import { getFilteredReposWithPackageForOrg } from '../src/getFilteredReposWithPackageForOrg.js';
import { InputParameters } from '../src/types';

const argv = yargs(process.argv.slice(2))
  .options({
    config: { type: 'string', default: 'config.json' },
    output: { type: 'string' },
    'days-until-stale': { type: 'number', default: 365 },
    pkg: { type: 'string' },
    token: { type: 'string' },
    org: { type: 'string' },
  })
  .parseSync();

(async () => {
  const configPath = path.resolve(cwd(), argv.config);
  let config: InputParameters;

  let fromArgs = false;
  try {
    const file = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(file);
  } catch (err) {
    if (argv.pkg && argv.org && argv.token) {
      config = {
        org: argv.org,
        pkgName: argv.pkg,
        ghAuthToken: argv.token,
        daysUntilStale: argv['days-until-stale'],
      };
      fromArgs = true;
    } else {
      console.log('Error reading config file');
      throw err;
    }
  }

  const repositories = await getFilteredReposWithPackageForOrg(
    config,
    fromArgs
  );

  if (!repositories?.length) return;

  if (argv.output) {
    const outputPath = path.resolve(cwd(), argv.output);
    fs.writeFileSync(outputPath, JSON.stringify(repositories));
  } else {
    const { pkgName } = config;
    console.log(`\n\n${pkgName} found in the following repositories:`);
    console.log(repositories);
  }
})().catch((err) => {
  console.error(err);
});
