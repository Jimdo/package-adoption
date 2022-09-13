import { isStale } from './isRepoStale';
import { Octokit } from '@octokit/rest';
import { PackageJson } from 'type-fest';

export type RelevantRepo = {
  name: string;
  installationPath: string;
  libVersion: string;
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

type ErrorResponse = {
  status: number;
  url: string;
  data: Error;
};

export const getFilteredReposWithPackageForOrg = async (
  org: string,
  daysUntilStale: number,
  ghAuthToken: string,
  pkgName: string
): Promise<RelevantRepo[] | undefined> => {
  const octokit = new Octokit({
    auth: ghAuthToken,
  });

  console.log(
    `[getFilteredReposWithPackageForOrg]: 🔍 Finding Relevant FE repositories for ${org.toUpperCase()}...`
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

              // The search matches package-lock too
              if (packageJsonFile.name === 'package.json') {
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

                    // TODO check devDependencies and peerDependecies?
                    const libVersion = pkg.dependencies?.[pkgName];
                    if (libVersion) {
                      // console.log(`[getFilteredReposWithPackageForOrg]: ${repo.name} has ${PKG_NAME}, version ${libVersion}`);
                      repositoriesWithPackage.push({
                        name: repo.name,
                        installationPath: packageJsonFile.path,
                        libVersion,
                      });
                    }
                  }
                } catch (error) {
                  console.error(
                    '[getFilteredReposWithPackageForOrg]: Error reading package.json file'
                  );
                  console.log(error);
                }
              }
            }
          } catch (error) {
            const typeSafeError = error as ErrorWithResponse;

            if (typeSafeError.response === null) {
              console.error(error);
            } else if (typeSafeError.response.status === 404) {
              console.error(
                `[getFilteredReposWithPackageForOrg]: ${typeSafeError?.response?.url} -- No package.json found.`
              );
            } else if (typeSafeError.response.status === 403) {
              console.error(
                `[getFilteredReposWithPackageForOrg]: ${typeSafeError?.response?.url} -- ${typeSafeError?.response?.data.message}`
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
    console.error('[getFilteredReposWithPackageForOrg]:', error);
  }
};
