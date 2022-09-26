import { InputParameters } from './types';
const validate = require('validate-npm-package-name');

export const validateConfig = (config: InputParameters, fromArgs: boolean) => {
  const errors: string[] = [];

  if (config.org === undefined || config.org === '') {
    errors.push('org argument is missing');
  } else if (typeof config.org !== 'string') {
    errors.push('org must be a string');
  }

  const pkgParamName = fromArgs ? 'pkg' : 'pkgName';
  if (config.pkgName === undefined || config.pkgName === '') {
    errors.push(`${pkgParamName} argument is missing`);
  } else if (typeof config.pkgName !== 'string') {
    errors.push(`${pkgParamName} must be a string`);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const isPackageNameValid = validate(config.pkgName);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!isPackageNameValid.validForOldPackages) {
      errors.push(`${pkgParamName} argument is invalid as npm package name`);
    }
  }

  const daysParamName = fromArgs ? 'days-until-stale' : 'daysUntilStale';
  if (
    config.daysUntilStale !== undefined &&
    typeof config.daysUntilStale !== 'number'
  ) {
    errors.push(`${daysParamName} must be a number`);
  }

  if (!config.ghAuthToken) {
    console.log(
      '[package-adoption]: 🔑 no authentication, scan public repositories'
    );
  }

  if (errors.length) {
    console.error('Config errors:');

    errors.forEach((error) => {
      console.error(`- ${error}`);
    });
  }

  return errors;
};
