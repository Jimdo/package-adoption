import { isStale } from './isRepoStale';
import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { PackageJson } from 'type-fest';
import path from 'path';

export type RelevantRepo = {
  name: string;
  installationPath: string;
  libVersion: string;
  isPeerDep?: boolean;
  isDevDep?: boolean;
};

type OctokitRepo = {
  name: string;
  archived: boolean;
  language: string;
  pushed_at: string;
};

type ErrorWithResponse = {
  response: ErrorResponse;
};

type ErrorRetryRequest = {
  retryCount: number;
};

type ErrorResponse = {
  status: number;
  url: string;
  data: Error;
  method: string;
  request: ErrorRetryRequest;
};

export const getFilteredReposWithPackageForOrg = async (
  org: string,
  daysUntilStale: number,
  ghAuthToken: string,
  pkgName: string
): Promise<RelevantRepo[] | undefined> => {
  const OctokitWithRetry = Octokit.plugin(retry, throttling);
  const octokit = new OctokitWithRetry({
    auth: ghAuthToken,
    throttle: {
      onRateLimit: (retryAfter: number, options: ErrorResponse) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        if (options.request.retryCount === 0) {
          // only retries once
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter: number, options: ErrorResponse) => {
        // does not retry, only logs a warning
        octokit.log.warn(
          `Abuse detected for request ${options.method} ${options.url}`
        );
      },
    },
    retry: {
      doNotRetry: ['429', '404'],
    },
  });

  console.log(
    `[package-adoption]: 🔍 Scan ${org.toUpperCase()} repositories in search of ${pkgName} ...`
  );

  const repositoriesWithPackage: RelevantRepo[] = [];
  try {
    const allRepos = octokit.paginate.iterator('GET /orgs/:org/repos', {
      org,
      type: 'all',
    });

    for await (const { data: repos } of allRepos) {
      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i] as OctokitRepo;
        if (
          repo.archived === false &&
          (repo.language === 'TypeScript' || repo.language === 'JavaScript') &&
          !isStale(repo.pushed_at, daysUntilStale)
        ) {
          try {
            const packageJsonResponse = await octokit.search.code({
              q: `repo:${org}/${repo.name}+filename:package.json`,
            });
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
                  relevantRepo =>
                    relevantRepo.name === repo.name &&
                    relevantRepo.installationPath === installationPath
                )
              ) {
                try {
                  const { data } = await octokit.repos.getContent({
                    owner: org,
                    repo: repo.name,
                    path: packageJsonFile.path,
                  });

                  if ('content' in data) {
                    const pkg: PackageJson = JSON.parse(
                      Buffer.from(
                        data.content,
                        data.encoding as BufferEncoding
                      ).toString()
                    );

                    const libVersionDep = pkg.dependencies?.[pkgName];
                    const libVersionPeer = pkg.peerDependencies?.[pkgName];
                    const libVersionDev = pkg.devDependencies?.[pkgName];

                    const libVersion =
                      libVersionDep || libVersionPeer || libVersionDev;
                    if (libVersion) {
                      console.log(
                        `[package-adoption]: ${repo.name} has ${pkgName}, version ${libVersion} at ${installationPath}`
                      );

                      repositoriesWithPackage.push({
                        name: repo.name,
                        installationPath,
                        libVersion,
                        ...(!!libVersionPeer && {
                          isPeerDep: !!libVersionPeer,
                        }),
                        ...(!!libVersionDev && { isDevDep: !!libVersionDev }),
                      });
                    }
                  }
                } catch (error) {
                  const typeSafeError = error as ErrorWithResponse;
                  console.error(
                    `[package-adoption]: Error reading package.json file\n${typeSafeError?.response?.url}`
                  );
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
