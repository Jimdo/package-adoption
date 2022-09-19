import { PackageJson } from 'type-fest';
import { octokit } from './octokitInit';
import { ErrorWithResponse, RelevantRepo } from './types';

export interface ReadPackageJsonParams {
  org: string;
  repoName: string;
  pkgName: string;
  packageJsonPath: string;
  installationPath: string;
}

export const readPackageJson = async (
  params: ReadPackageJsonParams
): Promise<RelevantRepo | null> => {
  const { org, repoName, pkgName, packageJsonPath, installationPath } = params;
  if (!octokit) return null;

  try {
    const { data } = await octokit.repos.getContent({
      owner: org,
      repo: repoName,
      path: packageJsonPath,
    });

    if ('content' in data) {
      const pkg: PackageJson = JSON.parse(
        Buffer.from(data.content, data.encoding as BufferEncoding).toString()
      );

      const libVersionDep = pkg.dependencies?.[pkgName];
      const libVersionPeer = pkg.peerDependencies?.[pkgName];
      const libVersionDev = pkg.devDependencies?.[pkgName];

      const libVersion = libVersionDep || libVersionPeer || libVersionDev;
      if (libVersion) {
        console.log(
          `[package-adoption]: ${repoName} has ${pkgName}, version ${libVersion} at ${installationPath}`
        );

        return {
          name: repoName,
          installationPath,
          libVersion,
          ...(!!libVersionPeer && {
            isPeerDep: !!libVersionPeer,
          }),
          ...(!!libVersionDev && { isDevDep: !!libVersionDev }),
        };
      }
    }
    return null;
  } catch (error) {
    const typeSafeError = error as ErrorWithResponse;
    console.error(
      `[package-adoption]: Error reading package.json file\n${typeSafeError?.response?.url}`
    );
    return null;
  }
};
