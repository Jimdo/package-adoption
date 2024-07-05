import path from 'path';
import { Endpoints } from '@octokit/types';
import { InputParameters, RelevantRepo } from './types';
import { readPackageJson } from './readPackageJson.js';
import { init, octokit } from './octokitInit.js';
import { isStale } from './isRepoStale.js';
import { validateConfig } from './validateConfig.js';

/**
 * It takes an organization name and a package name, and returns a list of all the repositories in that
 * organization that have that package in their package.json file
 * @param {InputParameters} config - InputParameters
 * @returns An array of objects with the installation info for the library
 */
export const getFilteredReposWithPackageForOrg = async (
  config: InputParameters,
  fromArgs = false
): Promise<RelevantRepo[] | undefined> => {
  const { org, daysUntilStale = 365, ghAuthToken, pkgName } = config;
  const repositoriesWithPackage: RelevantRepo[] = [];

  const errors = await validateConfig(config, fromArgs);

  if (errors.length) {
    return;
  }

  init(ghAuthToken);
  if (!octokit) return;

  type SearchResultItemType =
    Endpoints['GET /search/code']['response']['data']['items'][0];

  console.log(
    `[package-adoption]: 🔍 Scan ${org.toUpperCase()} repositories in search of ${pkgName} ...`
  );

  try {
    /* The plain GET search API just returns a page (30 items, maximum 100), we need paginate iterator to get the whole list */
    const foundPackageJsonFiles = await octokit.paginate<SearchResultItemType>(
      'GET /search/code',
      {
        q: `"${pkgName}" in:file org:${org} filename:package.json`,
      }
    );

    if (foundPackageJsonFiles.length === 0) {
      console.log(`[package-adoption]: No results for ${pkgName}`);
      return repositoriesWithPackage;
    }

    for (let i = 0; i < foundPackageJsonFiles.length; i++) {
      const packageJsonFile = foundPackageJsonFiles[i];
      const repoName = packageJsonFile.repository.name;

      const pathDirParts = packageJsonFile.path.split('/').slice(0, -1);
      const installationPath =
        pathDirParts?.length > 0 ? path.join(...pathDirParts) : 'root';

      let repo = undefined;

      try {
        ({ data: repo } = await octokit.request('GET /repos/{owner}/{repo}', {
          owner: org,
          repo: repoName,
        }));
      } catch (error) {
        console.error('[package-adoption]:', error);
        continue;
      }

      if (
        repo &&
        // The search matches package-lock too
        packageJsonFile.name === 'package.json' &&
        // sometimes GitHub search returns multiple versions of the same file
        !repositoriesWithPackage.find(
          (relevantRepo) =>
            relevantRepo.name === repoName &&
            relevantRepo.installationPath === installationPath
        ) &&
        repo.archived === false &&
        !isStale(repo.pushed_at, daysUntilStale)
      ) {
        const packageJsonData = await readPackageJson({
          org,
          repoName: repoName,
          pkgName,
          packageJsonPath: packageJsonFile.path,
          installationPath,
        });
        if (packageJsonData) {
          repositoriesWithPackage.push(packageJsonData);
        }
      }
    }

    return repositoriesWithPackage;
  } catch (error) {
    console.error('[package-adoption]:', error);
  }
};
