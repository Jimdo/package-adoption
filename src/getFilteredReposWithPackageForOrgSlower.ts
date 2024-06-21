import path from 'path';
import { Endpoints } from '@octokit/types';
import { ErrorWithResponse, InputParameters, RelevantRepo } from './types';
import { readPackageJson } from './readPackageJson.js';
import { isStale } from './isRepoStale.js';
import { OctokitWithPlugins } from './octokitInit.js';

/**
 * It takes an organization name and a package name, and returns a list of all the repositories in that
 * organization that have that package in their package.json file
 * @param {InputParameters} config - InputParameters
 * @returns An array of objects with the installation info for the library
 */
export const getFilteredReposWithPackageForOrgSlower = async (
  config: InputParameters,
  octokit: OctokitWithPlugins
): Promise<RelevantRepo[] | undefined> => {
  const { org, daysUntilStale = 365, pkgName } = config;
  const repositoriesWithPackage: RelevantRepo[] = [];

  type ResponseItemDataType = Endpoints['GET /orgs/{org}/repos']['response'];

  try {
    /* The plain listForOrg API just returns 30 items (a page), we need paginate iterator to get the whole list */
    const allRepos = await octokit.paginate<ResponseItemDataType>(
      'GET /orgs/:org/repos',
      {
        org,
        type: 'all',
      }
    );

    for (const { data: repos } of allRepos) {
      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];

        if (
          repo.archived === false &&
          (repo.language === 'TypeScript' || repo.language === 'JavaScript') &&
          !isStale(repo.pushed_at, daysUntilStale)
        ) {
          try {
            const packageJsonResponse = await octokit.request(
              'GET /search/code',
              {
                q: `repo:${org}/${repo.name}+filename:package.json`,
              }
            );
            const foundFiles = packageJsonResponse.data.items;

            for (let i = 0; i < foundFiles.length; i++) {
              const packageJsonFile = foundFiles[i];

              const pathDirParts = packageJsonFile.path.split('/').slice(0, -1);

              const installationPath =
                pathDirParts?.length > 0 ? path.join(...pathDirParts) : 'root';

              if (
                // The search matches package-lock too
                packageJsonFile.name === 'package.json' &&
                // sometimes GitHub search returns multiple versions of the same file
                !repositoriesWithPackage.find(
                  (relevantRepo) =>
                    relevantRepo.name === repo.name &&
                    relevantRepo.installationPath === installationPath
                )
              ) {
                const packageJsonData = await readPackageJson({
                  org,
                  repoName: repo.name,
                  pkgName,
                  packageJsonPath: packageJsonFile.path,
                  installationPath,
                });
                if (packageJsonData) {
                  repositoriesWithPackage.push(packageJsonData);
                }
              }
            }
          } catch (error) {
            const typeSafeError = error as ErrorWithResponse;

            if (typeSafeError.response === null) {
              console.error(error);
            } else if (typeSafeError.response.status === 404) {
              console.error(
                `[package-adoption]: No package.json found.\n${typeSafeError?.response?.url}\n\n`
              );
            } else if (typeSafeError.response.status === 403) {
              // API rate limit exceeded for user ID
              console.error(
                `[package-adoption]: ${typeSafeError?.response?.data.message}\n${typeSafeError?.response?.url}\n\n`
              );
            } else {
              console.error(typeSafeError.response);
            }
          }
        }
      }
    }
    return repositoriesWithPackage;
  } catch (error) {
    console.error('[package-adoption]:', error);
  }
};
